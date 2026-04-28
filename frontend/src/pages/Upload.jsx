import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import Tesseract from 'tesseract.js';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progressStatus, setProgressStatus] = useState('Processing Document Arrays...'); // Dynamic Progress string
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

  const compressImage = (file) => {
    return new Promise((resolve) => {
      // Avoid compressing PDFs
      if (!file.type.startsWith('image/')) {
        resolve(file); 
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 1000px + 70% quality keeps images under 1MB for the free OCR API
          const MAX_SIZE = 1000;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // STAGE 1: OCR PRE-PROCESSING — Adaptive Contrast Enhancement
          // Do NOT use hard binary thresholding — it destroys gray stamps, watermarks and light text.
          // Instead: convert to grayscale with proper luminance weights, then apply gentle contrast stretch.
          const imageData = ctx.getImageData(0, 0, width, height);
          const px = imageData.data;

          // Pass 1: Convert to grayscale using ITU-R BT.709 luminance coefficients
          let minL = 255, maxL = 0;
          const lum = new Uint8ClampedArray(px.length / 4);
          for (let i = 0; i < px.length; i += 4) {
            const l = Math.round(0.2126 * px[i] + 0.7152 * px[i+1] + 0.0722 * px[i+2]);
            lum[i / 4] = l;
            if (l < minL) minL = l;
            if (l > maxL) maxL = l;
          }

          // Pass 2: Adaptive contrast stretch — expands dynamic range without clipping valid content
          const range = maxL - minL || 1;
          for (let i = 0; i < px.length; i += 4) {
            const stretched = Math.round(((lum[i / 4] - minL) / range) * 255);
            // Sharpen: push mid-tones toward white (background) to increase text contrast
            const sharpened = stretched > 160 ? Math.min(255, stretched + 30) : Math.max(0, stretched - 20);
            px[i]     = sharpened;
            px[i + 1] = sharpened;
            px[i + 2] = sharpened;
          }
          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          }, 'image/jpeg', 0.70); // 70% quality — keeps file under 1MB for free OCR API
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgressStatus('Pre-processing Image Arrays...');

    try {
      // 1. Pristine HTML5 AI Compression to dramatically slash API queueing latency 
      const optimizedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('document', optimizedFile);
      
      // 2. CLIENT-SIDE TESSERACT OCR EXECUTION (Bypassing Vercel Timeout Restrictions entirely!)
      if (optimizedFile.type.startsWith('image/')) {
        setProgressStatus('Running Client-Side OCR Engine locally...');
        // Instantiating Tesseract in the User's Browser natively
        const worker = await Tesseract.createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgressStatus(`Extracting Data Layer: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        
        const { data: { text, confidence } } = await worker.recognize(optimizedFile);
        await worker.terminate();
        
        // Feed the extracted data securely into the backend so Vercel doesn't have to process the image mathematically
        formData.append('extractedText', text);
        formData.append('ocrConfidence', confidence);
        setProgressStatus('Finalizing Cloud Verification Math...');
      }

      // 3. Construct Secure Package Delivery (Sent to Vercel strictly for High-Performance Backend AI Validation)
      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000 // 15s max — prevents infinite hang
      });
      setProgress(100);
      
      // Save locally to prevent Vercel Serverless container memory loss between routes
      if (response.data?.document?._id.startsWith('demo-doc')) {
        localStorage.setItem(response.data.document._id, JSON.stringify(response.data.document));
      }
      
      setTimeout(() => {
        navigate(`/results/${response.data.document._id}`);
      }, 500);
      
    } catch (error) {
      console.error('Upload Process failed', error);
      const serverMsg = error.response?.data?.message || 'Network Timeout Reached Check Logic Matrices.';
      const detailedErr = error.response?.data?.error || error.message || '';
      alert(`System fault detected during verification pipeline.\n\n${serverMsg}\n${detailedErr}`);
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
              <div className="space-y-4 py-3">
                <div className="flex justify-center items-center text-sm font-medium">
                  <span className="text-blue-600 flex items-center gap-3">
                    <Loader2 size={24} className="animate-spin text-blue-600" />
                    <span className="text-lg">{progressStatus}</span>
                  </span>
                </div>
                <p className="text-sm border-t border-slate-100 pt-3 text-slate-500 text-center animate-pulse">Running advanced format validation and mathematical checks natively. The system uses your local device CPU to securely bypass slow API rate limits.</p>
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
