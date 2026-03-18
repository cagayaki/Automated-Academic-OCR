import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User as UserIcon, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!privacyAgreed) {
      setError('You must agree to the Data Privacy Compliance Policy.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/register', formData);
      localStorage.setItem('ocr_token', data.token);
      localStorage.setItem('ocr_user', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="bg-slate-900 p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600 rounded-full blur-3xl opacity-20 -ml-16 -mb-16"></div>

            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">OCR VerifyApp</h1>
          </div>

          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Create a Registrar Account</h2>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium text-center animate-in shake">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="text" name="fullName"
                    value={formData.fullName} onChange={handleChange} required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-sm font-medium outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="email" name="email"
                    value={formData.email} onChange={handleChange} required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-sm font-medium outline-none"
                    placeholder="registrar@university.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="password" name="password" minLength={6}
                    value={formData.password} onChange={handleChange} required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-sm font-medium outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500"
                  />
                </div>
                <label htmlFor="privacy" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
                  I acknowledge and agree to the <strong>Data Privacy Compliance Policy</strong>. I understand that academic records processed by this system are strictly confidential and subject to data protection laws.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center mt-4 group"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <span>Create Account</span>}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-slate-100 pt-6">
              <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                Already have an account? Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
