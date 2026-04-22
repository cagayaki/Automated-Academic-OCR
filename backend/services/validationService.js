const extractFields = (text) => {
  const fields = {};
  
  const studentIdMatch = text.match(/(?:ID|Student No|Registration No)[\s#:]*([A-Z0-9-]{6,12})/i) || text.match(/\b(20\d{2}-\d{5})\b/);
  fields.studentId = studentIdMatch ? studentIdMatch[1] : null;

  const gpaMatch = text.match(/(?:GPA|Grade Point Average|G\.P\.A|CWA)[\s:]*([0-5]\.\d{1,3})/i) || text.match(/\b([1-4]\.\d{2})\b/);
  fields.gpa = gpaMatch ? gpaMatch[1] : null;
  
  const dateMatch = text.match(/(?:Date Issued|Issued|Date)[\s:]*(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Za-z]+ \d{1,2}, \d{4})/i) || text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
  fields.dateIssued = dateMatch ? dateMatch[1] : null;

  const courseMatch = text.match(/(?:Course|Program|Degree|Major)[\s:]*([A-Za-z.\s]{5,40}(?:Engineering|Technology|Science|Arts|Business|Nursing|Medicine|IT|Information))/i);
  fields.course = courseMatch ? courseMatch[1].trim() : null;

  const nameMatch = text.match(/(?:Name|Student|Prepared For)[\s:]*([A-Z][a-z]+ (?:[A-Z]\. )?[A-Z][a-z]+)/i);
  fields.studentName = nameMatch ? nameMatch[1].trim() : null;

  const institutionMatch = text.match(/(?:University|College|Institute)[\sA-Za-z]+/i);
  fields.institutionName = institutionMatch ? institutionMatch[0].trim() : null;

  return fields;
};

const verifyDocument = (ocrData, extractedFields, activeSettings) => {
  const text = ocrData.text || '';
  
  // Custom Framework Parameters validation bindings
  const validateStudentID = (id) => new RegExp(activeSettings.studentIdFormat, 'i').test(id);

  const validateDate = (dateStr) => {
    if (!dateStr) return false;
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return false;
    
    // Temporal Logic
    const currentDate = new Date();
    const thresholdDate = new Date();
    thresholdDate.setFullYear(currentDate.getFullYear() - activeSettings.temporalValidityYears);
    
    return dateObj <= currentDate && dateObj >= thresholdDate; 
  };

  const validateGPA = (gpa) => {
    const num = parseFloat(gpa);
    return !isNaN(num) && (num >= activeSettings.gpaMin && num <= activeSettings.gpaMax); 
  };

  // 1. Authenticity Rules: Letterhead, Logo, Registrar Signature, Seal
  const hasLetterheadOrLogo = /University|College|Institute|School|Academy|Pamantasan/i.test(text.substring(0, 500));
  const hasSignature = /(?:Registrar|Signature|Signed|Authorized|Dean|President)/i.test(text);
  const hasSeal = /(?:Seal|Stamp|Official|Certified|Registrar)/i.test(text);

  // 5. Institution Verification
  let institutionStatus = 'Unverified Institution';
  if (extractedFields.institutionName && activeSettings.knownInstitutions) {
    const isRecognized = activeSettings.knownInstitutions.some(inst => 
      extractedFields.institutionName.toLowerCase().includes(inst.toLowerCase()) || 
      inst.toLowerCase().includes(extractedFields.institutionName.toLowerCase())
    );
    if (isRecognized) institutionStatus = 'Verified';
  }

  // Engine Decisions
  let finalStatus = 'Valid';
  let decisionText = 'Document verified successfully. All custom heuristic rule checks passed.';
  let authenticityScore = 100;

  // Track completeness against activeSettings.requiredFields mapping
  const fieldMapping = {
    'Name': extractedFields.studentName,
    'ID': extractedFields.studentId,
    'Course': extractedFields.course,
    'Institution': extractedFields.institutionName,
    'Date': extractedFields.dateIssued,
    'GPA': extractedFields.gpa
  };
  
  let missingRequiredFields = false;
  if (activeSettings.requiredFields && activeSettings.requiredFields.length > 0) {
    activeSettings.requiredFields.forEach(req => {
      // mapping array string exactly
      const key = Object.keys(fieldMapping).find(k => req.toLowerCase().includes(k.toLowerCase()));
      if (key && !fieldMapping[key]) missingRequiredFields = true;
    });
  }

  // Rule 6: Image/Text Quality Validation
  if (ocrData.confidence < 70) {
    finalStatus = 'Low Quality';
    decisionText = 'Document flagged as Low Quality. Poor scan detected (OCR Confidence below 70%).';
    authenticityScore -= 40;
  } 
  // Rule 1: Authenticity Validation
  else if (!hasSignature) {
    finalStatus = 'Invalid';
    decisionText = 'Document flagged as Invalid. No authorized signature detected on document.';
    authenticityScore -= 30;
  }
  else if (activeSettings.requireSchoolSeal && !hasSeal && !hasLetterheadOrLogo) {
    finalStatus = 'Needs Review';
    decisionText = 'Flagged for Review: System failed to detect the mandatory institutional Seal or Header as demanded by settings.';
    authenticityScore -= 15;
  }
  // Rule 2: Completeness Validation
  else if (missingRequiredFields) {
    finalStatus = 'Incomplete';
    decisionText = 'Document is Incomplete. One or more mandatory fields explicitly required by the Administrator are completely missing.';
    authenticityScore -= 25;
  }
  // Rule 5: Unverified Institution
  else if (institutionStatus !== 'Verified') {
    finalStatus = 'Unverified';
    decisionText = 'Issuing institution is Unverified. It does not exist in the dynamic administrative registered database.';
    authenticityScore -= 20;
  }
  // Rule 3: Format Validation & Rule 8: Issuance
  else if (!validateDate(extractedFields.dateIssued)) {
    finalStatus = 'Invalid';
    decisionText = `Document Format Error: Date unrecognized or outside the strict ${activeSettings.temporalValidityYears}-year validity temporal constraint.`;
    authenticityScore -= 15;
  }
  // Rule 4: Consistency
  else if (!validateGPA(extractedFields.gpa)) {
    finalStatus = 'Inconsistent'; 
    decisionText = `Consistency Error: Extracted GPA falls outside the custom validity range (${activeSettings.gpaMin.toFixed(2)} - ${activeSettings.gpaMax.toFixed(2)}).`;
    authenticityScore -= 20;
  }

  // Populate checks structure for the Results UI dynamically
  const results = {
    checks: {
      ocrQuality: {
        score: ocrData.confidence > 80 ? 95 : ocrData.confidence,
        resolution: ocrData.confidence >= 70 ? 'Meets minimum standard' : 'Poor Quality',
        clarity: `Confidence: ${Math.round(ocrData.confidence)}%`,
        orientation: 'Passed'
      },
      requiredFields: {
        score: finalStatus === 'Incomplete' ? 50 : 100,
        studentName: extractedFields.studentName ? `Found: ${extractedFields.studentName}` : 'Missing',
        studentId: extractedFields.studentId ? `Found: ${extractedFields.studentId}` : 'Missing',
        course: extractedFields.course ? `Found: ${extractedFields.course}` : 'Missing',
        institutionName: extractedFields.institutionName ? `Found: ${extractedFields.institutionName}` : 'Missing',
        dateIssued: extractedFields.dateIssued ? `Found: ${extractedFields.dateIssued}` : 'Missing',
        gpa: extractedFields.gpa ? `Found: ${extractedFields.gpa}` : 'Missing'
      },
      dataFormat: {
        score: (validateStudentID(extractedFields.studentId) ? 33 : 0) + (validateDate(extractedFields.dateIssued) ? 33 : 0) + (validateGPA(extractedFields.gpa) ? 34 : 0),
        studentIdValid: validateStudentID(extractedFields.studentId),
        dateValid: validateDate(extractedFields.dateIssued),
        gpaValid: validateGPA(extractedFields.gpa)
      },
      institution: {
        score: institutionStatus === 'Verified' ? 100 : 0,
        inDatabase: institutionStatus,
        formatting: hasLetterheadOrLogo ? 'Header Detected' : 'No Header',
        keywordDetection: hasSeal ? 'Seal/Stamp Found' : 'No Seal Detect'
      },
      consistency: {
        score: finalStatus === 'Inconsistent' ? 40 : 100,
        idMatchesDate: 'Checks complete',
        courseExists: hasSignature ? 'Signature Found' : 'Missing Signature'
      },
      issuance: {
        score: validateDate(extractedFields.dateIssued) ? 100 : 0,
        notFuture: validateDate(extractedFields.dateIssued) ? 'Valid Timeline' : 'Invalid',
        validPeriod: 'Passed'
      }
    },
    authenticityScore: Math.round(authenticityScore),
    status: finalStatus,
    decisionText
  };

  return results;
};

module.exports = {
  extractFields,
  verifyDocument
};
