const Document = require('./models/Document');

const seedData = async () => {
  try {
    const count = await Document.countDocuments();
    if (count > 0) return; // Already seeded

    console.log('Seeding initial testing dataset...');

    const mockDocuments = [
      { originalFileName: 'Harvard_Transcript.pdf', filePath: 'uploads/sample1.pdf', fileSize: 1024000, fileType: 'application/pdf', status: 'Verified', extractedText: 'Harvard University GPA 3.8', ocrConfidence: 98, authenticityScore: 99, studentName: 'Alice Johnson', studentId: '2023-10001', course: 'BS Computer Science', institutionName: 'Harvard University', dateIssued: '05/20/2023', gpa: '3.8', decisionText: 'Document verified successfully. All checks passed.' },
      { originalFileName: 'Stanford_Record.png', filePath: 'uploads/sample2.png', fileSize: 500000, fileType: 'image/png', status: 'Verified', ocrConfidence: 95, authenticityScore: 94, studentName: 'Bob Smith', studentId: '2022-55021', course: 'BS Mathematics', institutionName: 'Stanford University', dateIssued: '06/15/2022', gpa: '3.9', decisionText: 'Document verified successfully. All checks passed.' },
      { originalFileName: 'Fake_Diploma.jpg', filePath: 'uploads/sample3.jpg', fileSize: 300000, fileType: 'image/jpeg', status: 'Invalid', ocrConfidence: 65, authenticityScore: 23, studentName: 'Missing', studentId: 'invalid-id', course: 'Missing', institutionName: 'Unknown', dateIssued: 'Future', gpa: '6.0', decisionText: 'Document flagged as Invalid due to severe formatting errors and impossible metrics.' },
      { originalFileName: 'MIT_Transcript_Blurry.pdf', filePath: 'uploads/sample4.pdf', fileSize: 1800000, fileType: 'application/pdf', status: 'Needs Review', ocrConfidence: 55, authenticityScore: 70, studentName: 'Missing', studentId: '2021-99882', course: 'BS Physics', institutionName: 'MIT', dateIssued: 'Missing', gpa: '3.5', decisionText: 'Document flagged for manual review due to missing continuous fields and low OCR clarity.' },
      { originalFileName: 'UCLA_Transcript.png', filePath: 'uploads/sample5.png', fileSize: 600000, fileType: 'image/png', status: 'Verified', ocrConfidence: 92, authenticityScore: 95, studentName: 'Emma Davis', studentId: '2020-11223', course: 'BS Engineering', institutionName: 'UCLA', dateIssued: '04/10/2021', gpa: '3.7', decisionText: 'Document verified successfully. All checks passed.' },
      { originalFileName: 'Oxford_Certificate.pdf', filePath: 'uploads/sample6.pdf', fileSize: 1200000, fileType: 'application/pdf', status: 'Verified', ocrConfidence: 96, authenticityScore: 98, studentName: 'James Carter', studentId: '2019-44556', course: 'BA Economics', institutionName: 'Oxford University', dateIssued: '09/01/2019', gpa: '4.0', decisionText: 'Document verified successfully. All checks passed.' },
      { originalFileName: 'Corrupt_File_Backup.png', filePath: 'uploads/sample7.png', fileSize: 50000, fileType: 'image/png', status: 'Invalid', ocrConfidence: 30, authenticityScore: 12, studentName: 'Missing', studentId: 'Missing', course: 'Missing', institutionName: 'Missing', dateIssued: 'Missing', gpa: 'Missing', decisionText: 'Document flagged as Invalid due to unintelligible textual layers.' }
    ];

    await Document.insertMany(mockDocuments);
    console.log('Dataset successfully populated with rich testing history records!');
  } catch(err) {
    console.error('Error seeding dataset:', err);
  }
};

module.exports = seedData;
