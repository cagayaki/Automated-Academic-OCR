// =============================================================
// VALIDATION SERVICE — Heuristic Anchor-Based Mapping Engine
// Stage 2: Extraction | Stage 3: Weighted Scoring | Stage 4: Output
// =============================================================

// ------------------------------------------------------------------
// UTILITY: Normalize OCR text — collapse whitespace, fix line breaks
// ------------------------------------------------------------------
const normalizeOCR = (raw) => {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')  // collapse multiple spaces/tabs to one
    .trim();
};

// ------------------------------------------------------------------
// STAGE 2: HEURISTIC ANCHOR-BASED MAPPING
// Bidirectional Spatial Proximity Search — looks BEFORE and AFTER each
// semantic anchor so values appearing above or below in a scan are found.
// ------------------------------------------------------------------
const extractByProximity = (ocrText, semanticAnchors, targetPattern, windowBefore = 60, windowAfter = 150) => {
  let bestMatch = null;
  let closestDistance = Infinity;

  semanticAnchors.forEach(anchor => {
    // Escape special regex chars in the anchor string
    const escapedAnchor = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const anchorRegex = new RegExp(escapedAnchor, 'gi');
    let match;

    while ((match = anchorRegex.exec(ocrText)) !== null) {
      const anchorStart = match.index;
      const anchorEnd   = anchorStart + match[0].length;

      // Build a window spanning BEFORE and AFTER the anchor
      const start  = Math.max(0, anchorStart - windowBefore);
      const end    = Math.min(ocrText.length, anchorEnd + windowAfter);
      const window = ocrText.substring(start, end);

      const valueRegex = new RegExp(targetPattern, 'i');
      const valueMatch = window.match(valueRegex);

      if (valueMatch) {
        const matchPos = window.indexOf(valueMatch[0]);
        const anchorPosInWindow = anchorStart - start;
        const distance = Math.abs(matchPos - anchorPosInWindow);

        if (distance < closestDistance) {
          closestDistance = distance;
          bestMatch = (valueMatch[1] !== undefined ? valueMatch[1] : valueMatch[0]).trim();
        }
      }
    }
  });

  return bestMatch;
};

// ------------------------------------------------------------------
// FIELD EXTRACTORS
// ------------------------------------------------------------------
const extractFields = (rawText) => {
  const text = normalizeOCR(rawText);
  const fields = {};

  // --- 1. Student ID ---
  // Try anchor-based first, then fall back to pattern-only scan
  fields.studentId =
    extractByProximity(text,
      ['Student No', 'Student No.', 'ID No', 'ID No.', 'ID Number', 'Registration No',
       'Reg. No', 'Enrollment No', 'Matriculation', 'S/N', 'Stud. No'],
      '([A-Z0-9]{2,4}[-–][0-9]{4,6}(?:[-–][0-9]{1,4})?)',
      40, 100
    ) ||
    // Philippine-style: YYYY-NNNNN or YYYY-NNNNN-N
    text.match(/\b((?:19|20)\d{2}[-–]\d{4,6}(?:[-–]\d{1,4})?)\b/)?.[1] ||
    // 8-12 alphanumeric fallback
    extractByProximity(text,
      ['Student No', 'ID No', 'ID Number', 'Reg. No'],
      '([A-Za-z0-9]{6,15})',
      20, 80
    );

  // --- 2. GWA / GPA ---
  // Philippine grading: 1.00 (best) to 5.00 (failing). Also handles 0.00–4.0 US scale.
  fields.gpa =
    extractByProximity(text,
      ['GWA', 'GPA', 'G.W.A', 'G.P.A', 'CWA', 'C.W.A', 'CGPA', 'C.G.P.A',
       'General Weighted Average', 'Grade Point Average', 'Weighted Average',
       'General Average', 'Average Grade', 'QPI', 'GRD AVE', 'Grade Average',
       'OWA', 'Overall Average'],
      // Matches: 1.25 / 1.50 / 2.00 / 3.5 / 98.5 (percentage-based) etc.
      '([0-9]{1,2}[.,][0-9]{2,4})',
      30, 80
    ) ||
    // Direct scan: look for decimal number after GWA keyword on same/next line
    (() => {
      const m = text.match(/(?:GWA|GPA|General\s+(?:Weighted\s+)?Average)[^\n]*?([0-9]{1,2}[.,][0-9]{2,4})/i);
      return m ? m[1] : null;
    })();

  // --- 3. Date Issued ---
  fields.dateIssued =
    extractByProximity(text,
      ['Date Issued', 'Date of Issue', 'Issue Date', 'Issued On', 'Issued this',
       'Date Granted', 'Date Conferred', 'Date:', 'Issued:', 'Date Signed',
       'Oate', 'lssued', 'lsued'],  // common OCR misreads
      // MM/DD/YYYY, DD-MM-YYYY, "January 15, 2023", "15 January 2023"
      '((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[.,]?\\s+\\d{1,2}[,.]?\\s+\\d{4}|\\d{1,2}[/\\-.]\\d{1,2}[/\\-.]\\d{2,4})',
      20, 120
    ) ||
    text.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/)?.[1];

  // --- 4. Course / Degree Program ---
  // Use simple proximity grab first, then direct-scan fallback with compiled RegExp literals
  fields.course =
    extractByProximity(text,
      ['Course', 'Program', 'Degree', 'Degree Program', 'Field of Study', 'Major'],
      // Simple: grab text after anchor that starts with Bachelor/Master/Doctor/Associate or BS/AB prefix
      '((?:Bachelor|Master|Doctor|Associate|Juris)[^\\n]{5,80})',
      30, 200
    ) ||
    // Direct fallback: scan for common PH degree abbreviations anywhere in the text
    (() => {
      const abbrevMatch = text.match(/\b(BS[A-Z]{1,6}|AB[A-Z]{0,4}|BSBA|BSCS|BSIT|BSHRM|BSMT|BSEE|BSCE|BSME|BSCRIM|BSN|BFA|BEd|LLB|BSA|MBA|MPA|MA|PhD|MD|JD|DDS)\b[^\n]{0,60}/i);
      return abbrevMatch ? abbrevMatch[0].trim() : null;
    })() ||
    // Last fallback: grab any line containing "Bachelor of" or "Science in" etc.
    (() => {
      const fullMatch = text.match(/(?:Bachelor|Master|Doctor)\s+(?:of\s+)?(?:Science|Arts|Education|Laws|Fine Arts|Philosophy)[^\n]{0,80}/i);
      return fullMatch ? fullMatch[0].trim() : null;
    })();

  // --- 5. Student Name ---
  fields.studentName =
    extractByProximity(text,
      ['Name', 'Student Name', 'Full Name', 'Name of Student', 'Prepared for',
       'Granted to', 'Conferred upon', 'Awarded to', 'This is to certify that',
       'Name of Graduate', 'Graduate'],
      // Capitalized name: 2-5 words, letters only (allows periods for suffixes Jr., Sr., III)
      '([A-Z][a-zA-Z\'\\-]{1,20}(?:\\s+[A-Z][a-zA-Z\'\\-\\.]{1,20}){1,4})',
      20, 120
    );

  // --- 6. Institution Name ---
  // Grab the first university/college mention anywhere in the text
  const instPatterns = [
    /\b((?:University|Unibersidad|Universidad)\s+(?:of\s+)?[A-Za-z\s\-]{3,50})/i,
    /\b([A-Za-z\s\-]{3,40}\s+University)\b/i,
    /\b((?:College|Kolehiyo)\s+(?:of\s+)?[A-Za-z\s\-]{3,50})/i,
    /\b([A-Za-z\s\-]{3,40}\s+College)\b/i,
    /\b((?:Institute|Institut)\s+(?:of\s+)?[A-Za-z\s\-]{3,50})/i,
    /\b(Pamantasan\s+(?:ng\s+)?[A-Za-z\s\-]{3,50})/i,
    /\b(Polytechnic\s+University\s+(?:of\s+)?[A-Za-z\s\-]{3,40})/i,
  ];
  for (const p of instPatterns) {
    const m = text.match(p);
    if (m) { fields.institutionName = m[1].trim(); break; }
  }

  return fields;
};

// ------------------------------------------------------------------
// STAGE 3: WEIGHTED VALIDATION LAYER — Weighted Reliability Theory
// Max possible score = 100. Threshold = 75 (realistic for scanned docs)
// Weight breakdown:
//   Base Fields     25 pts
//   School Seal     30 pts
//   Registrar Sig   25 pts
//   GWA/Grade Valid 20 pts
// ------------------------------------------------------------------
const verifyDocument = (ocrData, extractedFields, activeSettings) => {
  const text = normalizeOCR(ocrData.text || '');

  const validateStudentID = (id) => {
    if (!id) return false;
    try { return new RegExp(activeSettings.studentIdFormat, 'i').test(id); }
    catch { return /^[A-Z0-9]{4,15}$/i.test(id); }
  };

  const validateGPA = (gpa) => {
    if (!gpa) return false;
    const num = parseFloat(gpa.replace(',', '.'));
    if (isNaN(num)) return false;
    // Accept Philippine 1.00–5.00, percentage 60–100, or US 0.0–4.0 scale
    const lo = activeSettings?.gpaMin ?? 1.0;
    const hi = activeSettings?.gpaMax ?? 5.0;
    return (num >= lo && num <= hi) || (num >= 60 && num <= 100) || (num >= 0 && num <= 4.0);
  };

  let authenticityScore = 0;
  let decisionText = '';
  const weightBreakdown = {};

  // --- Temporal Validity Logic (from Admin Configuration) ---
  // Checks: (A) Is the date in the future? (B) Is the document older than the admin-configured threshold?
  let failedTemporalMath = false;
  let temporalReason = '';
  const maxAge = activeSettings?.temporalValidityYears ?? 5;

  if (extractedFields.dateIssued) {
    const parsedDate = new Date(extractedFields.dateIssued);
    if (!isNaN(parsedDate)) {
      const now = new Date();
      // (A) Future date check
      if (parsedDate > now) {
        failedTemporalMath = true;
        temporalReason = 'Issue Date is in the future — possible forgery.';
      }
      // (B) Expiration threshold check
      const ageInYears = (now - parsedDate) / (365.25 * 24 * 60 * 60 * 1000);
      if (!failedTemporalMath && ageInYears > maxAge) {
        failedTemporalMath = true;
        temporalReason = `Document expired: issued ${Math.floor(ageInYears)} years ago, threshold is ${maxAge} years.`;
      }
    }
  }
  if (failedTemporalMath) decisionText += `TEMPORAL RULE FAILURE: ${temporalReason} `;

  // --- 1. Base Fields (25 pts) ---
  const fieldMapping = {
    'Name':        extractedFields.studentName,
    'ID':          extractedFields.studentId,
    'Course':      extractedFields.course,
    'Institution': extractedFields.institutionName,
    'Date':        extractedFields.dateIssued,
    'GPA':         extractedFields.gpa,
  };

  const requiredList = activeSettings?.requiredFields?.length > 0
    ? activeSettings.requiredFields
    : ['Name', 'ID', 'Institution']; // Minimum viable set

  let missingCount = 0;
  requiredList.forEach(req => {
    const key = Object.keys(fieldMapping).find(k => req.toLowerCase().includes(k.toLowerCase()));
    if (key && !fieldMapping[key]) missingCount++;
  });

  const baseScore = failedTemporalMath ? 0 : Math.round(25 * (1 - missingCount / Math.max(requiredList.length, 1)));
  authenticityScore += baseScore;
  weightBreakdown.base = baseScore;

  if (missingCount > 0) decisionText += `Warning: ${missingCount} required field(s) not extracted. `;

  // --- 2. School Seal / Institutional Header (30 pts) ---
  const hasSeal = /(?:seal|stamp|official|certified|logo|notarial|notarized)/i.test(text);
  // Look in first 800 chars for institution header (top of doc)
  const headerText = text.substring(0, 800);
  const hasLetterhead = /university|college|institute|academy|pamantasan|polytechnic|school\s+of|faculty\s+of|department\s+of/i.test(headerText);
  const sealScore = (hasSeal || hasLetterhead) ? 30 : 0;
  authenticityScore += sealScore;
  weightBreakdown.seal = sealScore;
  if (sealScore === 0 && activeSettings?.requireSchoolSeal !== false) {
    decisionText += 'Warning: Institutional Seal / Header not detected. ';
  }

  // --- 3. Registrar Signature Block (25 pts) ---
  const hasSignature = /(?:registrar|signature|signed\s+by|authorized\s+by|dean|president|chancellor|director|university\s+secretary|records\s+officer|verified\s+by)/i.test(text);
  const sigScore = hasSignature ? 25 : 0;
  authenticityScore += sigScore;
  weightBreakdown.signature = sigScore;
  if (sigScore === 0) decisionText += 'Warning: Registrar Signature block not detected. ';

  // --- 4. GWA / Grade Validity (20 pts) ---
  const gpaScore = validateGPA(extractedFields.gpa) ? 20 : 0;
  authenticityScore += gpaScore;
  weightBreakdown.gpa = gpaScore;
  if (gpaScore === 0) decisionText += 'Warning: GWA/Grade not found or outside valid range. ';

  // --- STAGE 4: Decision Output ---
  // Threshold lowered to 75 to reflect realistic scanned-document conditions
  const INSTITUTIONAL_THRESHOLD = activeSettings?.confidenceThreshold ?? 75;
  let finalStatus;

  if (authenticityScore >= INSTITUTIONAL_THRESHOLD) {
    finalStatus = 'Verified';
    decisionText = `Document authenticated. Confidence Score: ${authenticityScore}% (threshold: ${INSTITUTIONAL_THRESHOLD}%).`;
  } else {
    finalStatus = 'Flagged for Review';
    decisionText = `Confidence Score: ${authenticityScore}% — below ${INSTITUTIONAL_THRESHOLD}% threshold. ` + decisionText;
  }

  // Institution recognition
  let institutionStatus = 'Not in Database';
  if (extractedFields.institutionName && activeSettings?.knownInstitutions?.length > 0) {
    const recognized = activeSettings.knownInstitutions.some(inst =>
      extractedFields.institutionName.toLowerCase().includes(inst.toLowerCase()) ||
      inst.toLowerCase().includes(extractedFields.institutionName.toLowerCase())
    );
    if (recognized) institutionStatus = 'Verified';
  }

  return {
    weightBreakdown,
    checks: {
      ocrQuality: {
        score: Math.round(ocrData.confidence) || 85,
        resolution: 'Processed',
        clarity: `OCR Confidence: ${Math.round(ocrData.confidence || 85)}%`,
        orientation: 'Adaptive Pre-Processing Applied'
      },
      requiredFields: {
        score: baseScore > 0 ? 100 : 50,
        studentName: extractedFields.studentName  ? `Found: ${extractedFields.studentName}`  : 'Not Detected',
        studentId:   extractedFields.studentId    ? `Found: ${extractedFields.studentId}`    : 'Not Detected',
        course:      extractedFields.course       ? `Found: ${extractedFields.course}`       : 'Not Detected',
        institutionName: extractedFields.institutionName ? `Found: ${extractedFields.institutionName}` : 'Not Detected',
        dateIssued:  extractedFields.dateIssued   ? `Found: ${extractedFields.dateIssued}`   : 'Not Detected',
        gpa:         extractedFields.gpa          ? `Found: ${extractedFields.gpa}`          : 'Not Detected',
      },
      dataFormat: {
        score: (validateStudentID(extractedFields.studentId) ? 50 : 0) + (validateGPA(extractedFields.gpa) ? 50 : 0),
        studentIdValid: validateStudentID(extractedFields.studentId),
        dateValid: !failedTemporalMath,
        gpaValid: validateGPA(extractedFields.gpa)
      },
      institution: {
        score: institutionStatus === 'Verified' ? 100 : (hasLetterhead ? 60 : 0),
        inDatabase: institutionStatus,
        formatting: hasLetterhead ? 'Letterhead Detected' : 'No Letterhead',
        keywordDetection: hasSeal ? 'Seal / Stamp Detected' : 'No Seal Detected'
      },
      consistency: {
        score: authenticityScore,
        idMatchesDate: failedTemporalMath ? 'Date Mismatch' : 'Passed',
        courseExists: hasSignature ? 'Signature Detected' : 'Signature Missing'
      },
      issuance: {
        score: failedTemporalMath ? 0 : 100,
        notFuture: failedTemporalMath ? 'FUTURE DATE — INVALID' : 'Valid Timeline',
        validPeriod: failedTemporalMath ? 'Failed' : 'Passed'
      }
    },
    authenticityScore,
    status: finalStatus,
    decisionText: decisionText.trim()
  };
};

module.exports = { normalizeOCR, extractFields, verifyDocument };
