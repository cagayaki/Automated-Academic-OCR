import { useState, useEffect } from 'react';
import { ShieldCheck, Settings as SettingsIcon, Save, AlertTriangle, Clock, Hash, BarChart3, Building2, FileCheck } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    studentIdFormat: '^[A-Z0-9-]{5,15}$',
    gpaMin: 1.0,
    gpaMax: 5.0,
    dateFormat: 'MM/DD/YYYY',
    temporalValidityYears: 5,
    confidenceThreshold: 75,
    requiredFields: ['studentName', 'studentId', 'course', 'institutionName', 'dateIssued', 'gpa'],
    requireSchoolSeal: true,
    knownInstitutions: []
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data) {
          setConfig({
            studentIdFormat: data.studentIdFormat || '^[A-Z0-9-]{5,15}$',
            gpaMin: data.gpaMin ?? 1.0,
            gpaMax: data.gpaMax ?? 5.0,
            dateFormat: data.dateFormat || 'MM/DD/YYYY',
            temporalValidityYears: data.temporalValidityYears ?? 5,
            confidenceThreshold: data.confidenceThreshold ?? 75,
            requiredFields: data.requiredFields || [],
            requireSchoolSeal: data.requireSchoolSeal ?? true,
            knownInstitutions: data.knownInstitutions || []
          });
        }
      } catch (err) {
        console.error('Failed to load settings', err);
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

  const handleRequiredFieldsChange = (field) => {
    setConfig(prev => {
      const fields = [...prev.requiredFields];
      if (fields.includes(field)) {
        return { ...prev, requiredFields: fields.filter(f => f !== field) };
      } else {
        return { ...prev, requiredFields: [...fields, field] };
      }
    });
  };

  const handleInstitutionsChange = (e) => {
    const arr = e.target.value.split('\n').map(s => s.trim()).filter(s => s);
    setConfig(prev => ({ ...prev, knownInstitutions: arr }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/settings', config);
      alert('Rule-Based Configuration saved successfully!');
    } catch (err) {
      alert('Error updating settings.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const allFields = [
    { key: 'studentName', label: 'Student Name' },
    { key: 'studentId', label: 'Student ID' },
    { key: 'course', label: 'Course / Program' },
    { key: 'institutionName', label: 'Institution Name' },
    { key: 'dateIssued', label: 'Date Issued' },
    { key: 'gpa', label: 'GPA / GWA' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administrative Configuration Module</h1>
          <p className="text-slate-500 mt-1">Configure rule-based verification parameters dynamically without modifying source code.</p>
        </div>
      </div>

      {/* Section A: Mandatory Field Requirements */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-white px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <FileCheck size={18} className="text-emerald-500" />
            A. Mandatory Field Requirements
          </h2>
          <p className="text-xs text-slate-500 mt-1">Define which data points must be present for a document to pass validation. Missing mandatory fields will trigger a specific error report in Stage 4.</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allFields.map(({ key, label }) => (
              <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${config.requiredFields.includes(key)
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={config.requiredFields.includes(key)}
                  onChange={() => handleRequiredFieldsChange(key)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
              <ShieldCheck size={15} className="text-amber-500" />
              Mandatory School Seal Detection
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">When enabled, the absence of an institutional seal/stamp triggers an "Inconsistent" flag.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" name="requireSchoolSeal" checked={config.requireSchoolSeal} onChange={handleChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>

      {/* Section B: Temporal Validity Logic */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-white px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Clock size={18} className="text-blue-500" />
            B. Temporal Validity Logic
          </h2>
          <p className="text-xs text-slate-500 mt-1">Configure expiration thresholds. Documents issued outside the permitted window will be flagged with a specific temporal error.</p>
        </div>

        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-700 text-sm">Document Age Threshold (Years)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Maximum accepted age. Example: "5" means documents issued over 5 years ago will be flagged as expired.</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" min="1" max="50" name="temporalValidityYears" value={config.temporalValidityYears} onChange={handleChange} className="w-24 px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-slate-800 shadow-sm text-center" />
            <span className="text-sm text-slate-500 font-medium">years</span>
          </div>
        </div>
      </div>

      {/* Section C: Pattern & Format Consistency */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-white px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Hash size={18} className="text-violet-500" />
            C. Pattern & Format Consistency
          </h2>
          <p className="text-xs text-slate-500 mt-1">Enforce syntax rules for extracted identifiers. Non-matching patterns will generate a format violation error report.</p>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-700 text-sm">Student ID Format (Regex Pattern)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Example: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">^2024-\d{"{4,5}"}$</code> enforces a "2024-" prefix.</p>
            </div>
            <input type="text" name="studentIdFormat" value={config.studentIdFormat} onChange={handleChange} className="w-full md:w-72 px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-slate-800 shadow-sm" />
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-700 text-sm">GPA / GWA Valid Range</h3>
              <p className="text-xs text-slate-500 mt-0.5">Philippine standard: 1.00 (highest) to 5.00 (failing). Adjust for other scales.</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" step="0.1" name="gpaMin" value={config.gpaMin} onChange={handleChange} className="w-24 px-4 py-2 border bg-white border-slate-200 rounded-lg outline-none text-sm font-mono shadow-sm text-center" />
              <span className="text-slate-400 font-bold">–</span>
              <input type="number" step="0.1" name="gpaMax" value={config.gpaMax} onChange={handleChange} className="w-24 px-4 py-2 border bg-white border-slate-200 rounded-lg outline-none text-sm font-mono shadow-sm text-center" />
            </div>
          </div>
        </div>
      </div>

      {/* Section D: Confidence Threshold & Institution Database */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-white px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 size={18} className="text-amber-500" />
            D. Institutional Threshold & Verification Database
          </h2>
          <p className="text-xs text-slate-500 mt-1">Set the minimum Confidence Score (CS) required for auto-verification. Documents scoring below this are flagged for manual review.</p>
        </div>

        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-700 text-sm">Confidence Score Threshold (%)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Score range: 0–100. Default: 75%. Documents scoring below this are flagged as "Inconsistent."</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" min="0" max="100" name="confidenceThreshold" value={config.confidenceThreshold} onChange={handleChange} className="w-24 px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-slate-800 shadow-sm text-center" />
            <span className="text-sm text-slate-500 font-medium">%</span>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
          <div className="mb-3">
            <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
              <Building2 size={15} className="text-blue-500" />
              Known Institutions Database
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">One institution per line. Extracted institution names are cross-referenced against this list for verification status.</p>
          </div>
          <textarea
            value={config.knownInstitutions.join('\n')}
            onChange={handleInstitutionsChange}
            className="w-full px-4 py-3 border bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-600 shadow-sm"
            rows="6"
            placeholder="University of the Philippines&#10;De La Salle University&#10;Ateneo de Manila University"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white shadow-lg rounded-xl text-sm font-bold hover:bg-slate-800 transition disabled:opacity-50"
        >
          <Save size={16} /> {saving ? 'Applying Rule Set...' : 'Save Configuration'}
        </button>
      </div>

      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 items-start">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-800 text-sm">Rule-Based Verification Process</h4>
          <p className="text-sm text-amber-700 mt-1">
            All configuration changes take effect immediately on the next document upload. The validation engine fetches the active Rule Set from the database before every verification — no code changes required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
