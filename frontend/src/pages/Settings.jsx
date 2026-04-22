import { useState, useEffect } from 'react';
import { ShieldCheck, Settings as SettingsIcon, Save } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    studentIdFormat: '^[A-Z0-9-]{5,15}$',
    gpaMin: 0.0,
    gpaMax: 5.0,
    dateFormat: 'MM/DD/YYYY',
    temporalValidityYears: 5,
    requiredFields: ['studentName', 'studentId', 'course', 'institutionName', 'dateIssued', 'gpa'],
    requireSchoolSeal: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data) {
          setConfig({
            studentIdFormat: data.studentIdFormat || '^[A-Z0-9-]{5,15}$',
            gpaMin: data.gpaMin ?? 0.0,
            gpaMax: data.gpaMax ?? 5.0,
            dateFormat: data.dateFormat || 'MM/DD/YYYY',
            temporalValidityYears: data.temporalValidityYears ?? 5,
            requiredFields: data.requiredFields || [],
            requireSchoolSeal: data.requireSchoolSeal ?? true
          });
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleRequiredFieldsChange = (e) => {
    const arr = e.target.value.split(',').map(s => s.trim()).filter(s => s);
    setConfig(prev => ({ ...prev, requiredFields: arr }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/settings', config);
      alert('Validation Rules Settings updated successfully!');
    } catch (err) {
      alert('Error updating settings.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Configuration Framework...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administrative Framework</h1>
          <p className="text-slate-500 mt-1">Configure global rule-based verification parameters dynamcially</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            Validation Engine Parameters
          </h2>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 text-white shadow-sm rounded-lg text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-50">
            <Save size={16} /> {saving ? 'Applying...' : 'Save Configuration'}
          </button>
        </div>
        
        <div className="divide-y divide-slate-100">
          
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-700 text-sm">Student ID Match Regex</h3>
              <p className="text-xs text-slate-500 mt-0.5">Define Strict Pattern string for institutional ID format</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input type="text" name="studentIdFormat" value={config.studentIdFormat} onChange={handleChange} className="w-full md:w-64 px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-slate-800 shadow-sm" />
            </div>
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-700 text-sm">GPA Range Boundaries</h3>
              <p className="text-xs text-slate-500 mt-0.5">Min/Max limits for valid Grade Point Average thresholds</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input type="number" step="0.1" name="gpaMin" value={config.gpaMin} onChange={handleChange} className="w-24 px-4 py-2 border bg-white border-slate-200 rounded-lg outline-none text-sm font-mono shadow-sm" />
              <span className="text-slate-400 font-bold">-</span>
              <input type="number" step="0.1" name="gpaMax" value={config.gpaMax} onChange={handleChange} className="w-24 px-4 py-2 border bg-white border-slate-200 rounded-lg outline-none text-sm font-mono shadow-sm" />
            </div>
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-700 text-sm">Temporal Validity Threshold (Years)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Maximum document age logically accepted</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input type="number" name="temporalValidityYears" value={config.temporalValidityYears} onChange={handleChange} className="w-full md:w-64 px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-slate-800 shadow-sm" />
            </div>
          </div>

          <div className="p-6 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-700 text-sm">Strict Required Fields Check</h3>
              <p className="text-xs text-slate-500 mt-0.5">Comma-separated field identifiers that cannot be empty</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <textarea value={config.requiredFields.join(', ')} onChange={handleRequiredFieldsChange} className="w-full md:w-80 px-4 py-3 border bg-white border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-600 shadow-sm" rows="3" />
            </div>
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-700 text-sm">Mandatory Institutional Signifier</h3>
              <p className="text-xs text-slate-500 mt-0.5">Toggles failure if proper seal/stamps are completely missing.</p>
            </div>
            <div className="flex items-center justify-end w-full md:w-auto w-64 pr-2">
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="requireSchoolSeal" checked={config.requireSchoolSeal} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Settings;
