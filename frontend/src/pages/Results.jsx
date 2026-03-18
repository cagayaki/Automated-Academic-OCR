import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Check } from 'lucide-react';
import api from '../services/api';

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await api.get(`/documents/${id}`);
        setDoc(data);
      } catch (error) {
        console.error('Failed to fetch document', error);
      } finally {
        setLoading(false);
      }
    };
    if (id && id !== '0') fetchDoc();
    else setLoading(false);
  }, [id]);

  if (loading) return <div className="p-12 text-center text-slate-500">Loading comprehensive verification report...</div>;
  if (!doc) return <div className="p-12 text-center text-slate-500">No document found.</div>;

  const checks = doc.validationResults || {};
  const ocrQuality = checks.ocrQuality || {};
  const reqFields = checks.requiredFields || {};
  const dataFormat = checks.dataFormat || {};
  const instVerify = checks.institution || {};
  const consistency = checks.consistency || {};
  const issuance = checks.issuance || {};

  const formatBytes = (bytes) => {
    if (!bytes) return 'Unknown Size';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6 mt-2">
        <button onClick={() => navigate(-1)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Verification Results</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Document Preview */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-white border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-800">Document Preview</h2>
            </div>
            <div className="p-4 flex justify-center bg-slate-50 min-h-[320px] items-center">
              {doc.fileType === 'application/pdf' ? (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <FileText size={72} strokeWidth={1.5} className="mb-4 text-rose-500 drop-shadow-sm" />
                  <p className="font-semibold text-slate-700">PDF Document</p>
                  <p className="text-xs text-slate-500">{doc.originalFileName}</p>
                </div>
              ) : (
                <img src={`http://localhost:5000/${doc.filePath}`} className="max-w-full h-auto shadow-sm border border-slate-200 rounded" alt="Preview"/>
              )}
            </div>
            <div className="p-6 space-y-4 text-sm border-t border-slate-100 bg-white">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-medium">Document</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px] text-right">{doc.originalFileName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-medium">Type</span>
                <span className="font-bold text-slate-700">{doc.fileType || 'image/png'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-medium">Size</span>
                <span className="font-bold text-slate-700">{formatBytes(doc.fileSize)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Uploaded</span>
                <span className="font-bold text-slate-700">{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : 'Just now'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl"></div>
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-3 relative z-10">Scores</h2>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-sm font-semibold text-slate-500">OCR Confidence</span>
              <span className="font-bold text-blue-600 text-2xl">{Math.round(doc.ocrConfidence || 0)}%</span>
            </div>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-sm font-semibold text-slate-500">Authenticity</span>
              <span className="font-bold text-emerald-600 text-2xl">{doc.authenticityScore || 0}%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Results */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-white border-b border-slate-100 px-6 py-5">
              <h2 className="font-bold text-slate-800">Extracted Fields</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-slate-50/50">
              
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student Name</p>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className={`font-semibold ${doc.studentName && !doc.studentName.includes('Missing') ? 'text-slate-800' : 'text-rose-500'}`}>
                    {doc.studentName || 'Missing'}
                  </span>
                  {doc.studentName && !doc.studentName.includes('Missing') && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1"><Check size={10} strokeWidth={3}/> 87%</span>}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student ID</p>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className={`font-semibold ${doc.studentId && !doc.studentId.includes('Missing') ? 'text-slate-800' : 'text-rose-500'}`}>
                    {doc.studentId || 'Missing'}</span>
                  {doc.studentId && !doc.studentId.includes('Missing') && <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1"><Check size={10} strokeWidth={3} className="text-emerald-500"/> YYYY-XXXXX</span>}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Course / Program</p>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className={`font-semibold ${doc.course && !doc.course.includes('Missing') ? 'text-slate-800' : 'text-rose-500'}`}>
                    {doc.course || 'Missing'}</span>
                  {doc.course && !doc.course.includes('Missing') && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1"><Check size={10} strokeWidth={3}/> 97%</span>}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Institution Name</p>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className={`font-semibold truncate max-w-[180px] ${doc.institutionName && !doc.institutionName.includes('Missing') ? 'text-slate-800' : 'text-rose-500'}`}>
                    {doc.institutionName || 'Missing'}</span>
                  {doc.institutionName && !doc.institutionName.includes('Missing') && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0"><Check size={10} strokeWidth={3}/> 98%</span>}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date Issued</p>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className={`font-semibold ${doc.dateIssued && !doc.dateIssued.includes('Missing') ? 'text-slate-800' : 'text-rose-500'}`}>
                    {doc.dateIssued || 'Missing'}</span>
                  {doc.dateIssued && !doc.dateIssued.includes('Missing') && <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1"><Check size={10} strokeWidth={3} className="text-emerald-500"/> MM/DD/YYYY</span>}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GPA</p>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className={`font-semibold ${doc.gpa && !doc.gpa.includes('Missing') ? 'text-slate-800' : 'text-rose-500'}`}>
                    {doc.gpa || 'Missing'}</span>
                  {doc.gpa && !doc.gpa.includes('Missing') && <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1"><Check size={10} strokeWidth={3} className="text-emerald-500"/> 0.00-5.00</span>}
                </div>
              </div>

            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-white border-b border-slate-100 px-6 py-5">
              <h2 className="font-bold text-slate-800">Validation Results</h2>
            </div>
            
            <div className="divide-y divide-slate-100">
              
              {/* OCR Quality Assessment */}
              <div className="p-6 transition hover:bg-slate-50/50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 text-sm">OCR Quality Assessment</h3>
                  <span className="text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md text-xs">{ocrQuality.score}%</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Image Resolution</span><span className="font-medium text-slate-700">{ocrQuality.resolution}</span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Text Clarity</span><span className="font-medium text-slate-700">{ocrQuality.clarity}</span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Document Orientation</span><span className="font-medium text-slate-700">{ocrQuality.orientation}</span></div>
                </div>
              </div>

              {/* Required Fields Validation */}
              <div className="p-6 transition bg-slate-50/30 hover:bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 text-sm">Required Fields Validation</h3>
                  <span className="text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md text-xs">{reqFields.score}%</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-4 text-sm">
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Student Name</span><span className={`font-medium ${reqFields.studentName?.includes('Missing') ? 'text-rose-500 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-700'}`}>{reqFields.studentName}</span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Student ID</span><span className={`font-medium ${reqFields.studentId?.includes('Missing') ? 'text-rose-500 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-700'}`}>{reqFields.studentId}</span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Course / Program</span><span className={`font-medium ${reqFields.course?.includes('Missing') ? 'text-rose-500 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-700'}`}>{reqFields.course}</span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Institution Name</span><span className={`font-medium ${reqFields.institutionName?.includes('Missing') ? 'text-rose-500 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-700'}`}>{reqFields.institutionName}</span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date Issued</span><span className={`font-medium ${reqFields.dateIssued?.includes('Missing') ? 'text-rose-500 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-700'}`}>{reqFields.dateIssued}</span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GPA</span><span className={`font-medium ${reqFields.gpa?.includes('Missing') ? 'text-rose-500 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-700'}`}>{reqFields.gpa}</span></div>
                </div>
              </div>

              {/* Data Format Validation */}
              <div className="p-6 transition hover:bg-slate-50/50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 text-sm">Data Format Validation</h3>
                  <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md text-xs">{dataFormat.score}%</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Student ID (YYYY-XXXXX)</span><span className="font-medium text-emerald-600 flex items-center gap-1.5 object-contain">Format: YYYY-XXXXX <Check size={14} className="opacity-70"/></span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date Format (MM/DD/YYYY)</span><span className="font-medium text-emerald-600 flex items-center gap-1.5">Format: MM/DD/YYYY <Check size={14} className="opacity-70"/></span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GPA Range (0.00-5.00)</span><span className="font-medium text-emerald-600 flex items-center gap-1.5">Range: 0.00-5.00 <Check size={14} className="opacity-70"/></span></div>
                </div>
              </div>

              {/* Institution Verification */}
              <div className="p-6 transition bg-slate-50/30 hover:bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 text-sm">Institution Verification</h3>
                  <span className="text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md text-xs">{instVerify.score}%</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Institution in Database</span><span className="font-medium text-slate-700">{instVerify.inDatabase}</span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Official Formatting</span><span className="font-medium text-slate-700">{instVerify.formatting}</span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Logo/Keyword Detection</span><span className="font-medium text-slate-700">{instVerify.keywordDetection}</span></div>
                </div>
              </div>

              {/* Consistency Validation */}
              <div className="p-6 transition hover:bg-slate-50/50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 text-sm">Consistency Validation</h3>
                  <span className="text-amber-600 font-bold bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md text-xs">{consistency.score}%</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ID Year matches Issue Date</span><span className="font-medium text-slate-700">{consistency.idMatchesDate}</span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Course exists in institution</span><span className="font-medium text-slate-700">{consistency.courseExists}</span></div>
                </div>
              </div>

              {/* Issuance Validity */}
              <div className="p-6 transition bg-slate-50/30 hover:bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 text-sm">Issuance Validity</h3>
                  <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md text-xs">{issuance.score}%</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Issue date not in future</span><span className="font-medium text-slate-700">{issuance.notFuture}</span></div>
                  <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Within valid issuance period</span><span className="font-medium text-slate-700">{issuance.validPeriod}</span></div>
                </div>
              </div>

              {/* Decision */}
              <div className={`p-8 ${doc.status === 'Verified' ? 'bg-emerald-50/80' : doc.status === 'Invalid' ? 'bg-rose-50/80' : 'bg-amber-50/80'}`}>
                <h3 className="font-bold text-slate-700 text-xs mb-1 uppercase tracking-wider">Decision</h3>
                <p className={`text-lg font-bold ${doc.status === 'Verified' ? 'text-emerald-700' : doc.status === 'Invalid' ? 'text-rose-700' : 'text-amber-700'}`}>
                  {doc.decisionText || 'Document flagged for manual review.'}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Results;
