import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(10); // Start progress indicating preparing
    
    // Fake progress animation for UX while OCR runs
    const progInterval = setInterval(() => {
      setProgress(p => (p < 90 ? p + 5 : p));
    }, 500);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      clearInterval(progInterval);
      setProgress(100);
      
      setTimeout(() => {
        navigate(`/results/${response.data.document._id}`);
      }, 500);
      
    } catch (error) {
      clearInterval(progInterval);
      console.error('Upload failed', error);
      alert('Failed to process document. ' + (error.response?.data?.message || ''));
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Verify a Document</h1>
        <p className="text-slate-500 mt-1">Upload an academic transcript or certificate to verify its authenticity.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        {!file ? (
          <div 
            {...getRootProps()} 
            className={`cursor-pointer border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className={`p-4 rounded-full mb-4 ${isDragActive ? 'bg-blue-100 text-blue-600 scale-110' : 'bg-slate-100 text-slate-500'} transition-transform`}>
              <UploadCloud size={32} />
            </div>
            <p className="text-lg font-medium text-slate-700 mb-1">
              {isDragActive ? 'Drop file here' : 'Drag & drop your document'}
            </p>
            <p className="text-sm text-slate-400">PDF, JPG, or PNG (max. 10MB)</p>
            <button className="mt-8 px-5 py-2.5 bg-white border border-slate-200 hover:border-blue-300 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-600 shadow-sm transition-all">
              Browse Files
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
              <div className="p-3 bg-white border border-blue-100 rounded-lg text-blue-600 shadow-sm mr-4">
                <File size={24} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium text-slate-800 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!uploading && (
                <button 
                  onClick={() => setFile(null)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {uploading ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-blue-600 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Processing with OCR Engine...
                  </span>
                  <span className="text-slate-600">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 text-center animate-pulse">Running format validation and consistency checks...</p>
              </div>
            ) : (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setFile(null)}
                  className="px-5 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Start Verification
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 items-start">
        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-800 text-sm">Best Practices</h4>
          <p className="text-sm text-amber-700 mt-1">
            Ensure the scanned document is clear, well-lit, and not blurred. Low-confidence optical character recognition (OCR) scans will automatically flag the document for additional manual review and trigger fraud heuristics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Upload;
