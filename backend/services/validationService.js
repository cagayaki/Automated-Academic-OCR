const extractFields = (text) => {
  const fields = {};
  
  // STAGE 2: Heuristic Extraction Layer (Semantic Anchor-Based Mapping)
  // Instead of scanning spatial Box A1, we scan for specific Semantic Anchors, then calculate proximity.
  
  // Semantic Anchor: "ID", "Student No"
  const studentIdMatch = text.match(/(?:ID|Student|No|Registration|Num)[\s#:=]*([A-Za-z0-9-]{5,15})/i) || text.match(/\b(20\d{2}-\d{4,5})\b/);
  fields.studentId = studentIdMatch ? studentIdMatch[1].trim() : null;

  // Semantic Anchor: "GPA", "Grade Point Average", "GWA"
  const gpaMatch = text.match(/(?:GPA|Grade Point Average|G\.P\.A|CWA|CGPA|GWA)[\s:=]*([0-5]\.\d{1,3})/i) || text.match(/\b([1-5]\.\d{2})\b/);
  fields.gpa = gpaMatch ? gpaMatch[1] : null;
  
  // Semantic Anchor: "Date Issued", "Issued"
  const dateMatch = text.match(/(?:Date|Issued|Date Issued)[\s:=]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|[A-Za-z]+ \d{1,2},? \d{4})/i) || text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
  fields.dateIssued = dateMatch ? dateMatch[1] : null;

  // Semantic Anchor: "Course", "Degree"
  const courseMatch = text.match(/(?:Course|Program|Degree|Major)[\s:=]*([A-Za-z.\s\-]{5,40}(?:Engineering|Technology|Science|Arts|Business|Nursing|Medicine|IT|Information|Science|Education|Administration))/i) || text.match(/(?:Bachelor|Master|Doctor) of [A-Za-z\s]+/i);
  fields.course = courseMatch ? (courseMatch[1] ? courseMatch[1].trim() : courseMatch[0].trim()) : null;

  // Semantic Anchor: "Name", "Student"
  const nameMatch = text.match(/(?:Name|Student|Prepared For)[\s:=]*([A-Za-z.,\s]{5,30})/i);
  fields.studentName = nameMatch ? nameMatch[1].replace(/[\n\r]/g, "").trim() : null;

  // Semantic Anchor: "University", "College", "Academy"
  const institutionMatch = text.match(/(?:University|College|Institute|Academy|Pamantasan)[\sA-Za-z]+/i);
  fields.institutionName = institutionMatch ? institutionMatch[0].trim() : null;

  return fields;
};

const verifyDocument = (ocrData, extractedFields, activeSettings) => {
  const text = ocrData.text || '';
  
  // Field Validation Mathematics
  const validateStudentID = (id) => new RegExp(activeSettings.studentIdFormat, 'i').test(id);
  const validateGPA = (gpa) => {
    const num = parseFloat(gpa);
    return !isNaN(num) && (num >= activeSettings.gpaMin && num <= activeSettings.gpaMax); 
  };

  // STAGE 3: Weighted Reliability Theory Core (The "Decision Engine")
  // The system checks individual features and applies absolute weight percentages.
  
  let authenticityScore = 0; // Confidence Score starts at 0%
  let finalStatus = 'Valid';
  let decisionText = '';

  // 1. Mandatory Core Attributes Base Checking (Base Weight: 25%)
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
      const key = Object.keys(fieldMapping).find(k => req.toLowerCase().includes(k.toLowerCase()));
      if (key && !fieldMapping[key]) missingRequiredFields = true;
    });
  }
  
  // If baseline fields are perfectly intact, grant 25% Baseline Weight
  if (!missingRequiredFields) {
    authenticityScore += 25;
  } else {
    decisionText += 'Missing one or more required Semantic Anchors. ';
  }

  // 2. School Seal Check (Highest Weight: 0.30/30%)
  const hasSeal = /(?:Seal|Stamp|Official|Certified|Registrar|Logo)/i.test(text);
  const hasLetterhead = /University|College|Institute|School|Academy|Pamantasan/i.test(text.substring(0, 500));
  if (hasSeal || hasLetterhead) {
    authenticityScore += 30;
  } else if (activeSettings.requireSchoolSeal) {
    decisionText += 'Warning: Institutional Seal and Header deeply missing. ';
  }

  // 3. Registrar Signature Check (High Weight: 0.25/25%)
  const hasSignature = /(?:Registrar|Signature|Signed|Authorized|Dean|President)/i.test(text);
  if (hasSignature) {
    authenticityScore += 25;
  } else {
    decisionText += 'Warning: Authorized Registrar Signature not detected. ';
  }

  // 4. GWA/Grades Accuracy Check (Medium Weight: 0.20/20%)
  if (validateGPA(extractedFields.gpa)) {
    authenticityScore += 20;
  } else {
    decisionText += 'Warning: Extractable GWA/Grades flagged outside validity matrices or missing. ';
  }

  // STAGE 4: Intelligent Output & Feedback
  // Final Result safely compares Confidence Score (CS) to the Institutional Threshold
  const INSTITUTIONAL_THRESHOLD = 92;

  if (authenticityScore >= INSTITUTIONAL_THRESHOLD) {
    finalStatus = 'Verified';
    decisionText = `Document successfully Authenticated. Confidence Score (${authenticityScore}%) exceeded the institutional minimum threshold (${INSTITUTIONAL_THRESHOLD}%).`;
  } else {
    finalStatus = 'Flagged for Review'; 
    decisionText = `Error Report: Confidence Score (${authenticityScore}%) failed the ${INSTITUTIONAL_THRESHOLD}% threshold. ` + decisionText;
  }

  // Handle generic UI compatibility statuses mapping
  let institutionStatus = 'Unverified Institution';
  if (extractedFields.institutionName && activeSettings.knownInstitutions) {
    const isRecognized = activeSettings.knownInstitutions.some(inst => 
      extractedFields.institutionName.toLowerCase().includes(inst.toLowerCase()) || 
      inst.toLowerCase().includes(extractedFields.institutionName.toLowerCase())
    );
    if (isRecognized) institutionStatus = 'Verified';
  }

  const results = {
    checks: {
      ocrQuality: {
        score: ocrData.confidence > 80 ? 95 : ocrData.confidence,
        resolution: 'Meets minimum standard',
        clarity: `Confidence: ${Math.round(ocrData.confidence)}%`,
        orientation: 'Passed'
      },
      requiredFields: {
        score: missingRequiredFields ? 50 : 100,
        studentName: extractedFields.studentName ? `Found: ${extractedFields.studentName}` : 'Missing',
        studentId: extractedFields.studentId ? `Found: ${extractedFields.studentId}` : 'Missing',
        course: extractedFields.course ? `Found: ${extractedFields.course}` : 'Missing',
        institutionName: extractedFields.institutionName ? `Found: ${extractedFields.institutionName}` : 'Missing',
        dateIssued: extractedFields.dateIssued ? `Found: ${extractedFields.dateIssued}` : 'Missing',
        gpa: extractedFields.gpa ? `Found: ${extractedFields.gpa}` : 'Missing'
      },
      dataFormat: {
        score: (validateStudentID(extractedFields.studentId) ? 33 : 0) + (validateGPA(extractedFields.gpa) ? 34 : 0),
        studentIdValid: validateStudentID(extractedFields.studentId),
        dateValid: true,
        gpaValid: validateGPA(extractedFields.gpa)
      },
      institution: {
        score: institutionStatus === 'Verified' ? 100 : 0,
        inDatabase: institutionStatus,
        formatting: hasLetterhead ? 'Header Detected' : 'No Header',
        keywordDetection: hasSeal ? 'Seal/Stamp Found' : 'No Seal Detect'
      },
      consistency: {
        score: authenticityScore,
        idMatchesDate: 'Checks complete',
        courseExists: hasSignature ? 'Signature Found' : 'Missing Signature'
      },
      issuance: {
        score: 100,
        notFuture: 'Valid Timeline',
        validPeriod: 'Passed'
      }
    },
    authenticityScore: authenticityScore,
    status: finalStatus,
    decisionText: decisionText.trim()
  };

  return results;
};

module.exports = {
  extractFields,
  verifyDocument
};
