import { ShieldCheck, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
          <p className="text-slate-500 mt-1">Configure validation rules and system settings</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            Validation Rules
          </h2>
          <button className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-white shadow-sm rounded-lg text-sm font-semibold hover:bg-slate-800 transition">Save Changes</button>
        </div>
        
        <div className="divide-y divide-slate-100">
          
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">Student ID Format</h3>
              <p className="text-xs text-slate-500 mt-0.5">Regex pattern for student ID matching</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input type="text" className="w-full md:w-64 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-slate-800 shadow-sm" defaultValue="YYYY-XXXXX" />
              <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-1 rounded">Default</span>
            </div>
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">GPA Range</h3>
              <p className="text-xs text-slate-500 mt-0.5">Acceptable bounds for grade point average</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input type="text" className="w-full md:w-64 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-slate-800 shadow-sm" defaultValue="0.00 – 5.00" />
              <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-1 rounded">Default</span>
            </div>
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">Date Format</h3>
              <p className="text-xs text-slate-500 mt-0.5">Expected issuance date pattern</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input type="text" className="w-full md:w-64 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-slate-800 shadow-sm" defaultValue="MM/DD/YYYY" />
              <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-1 rounded">Default</span>
            </div>
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">Required Fields</h3>
              <p className="text-xs text-slate-500 mt-0.5">Must-have details for authenticity</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input type="text" className="w-full md:w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-600 shadow-sm" defaultValue="Name, ID, Course, Institution, Date, GPA" />
              <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-1 rounded shrink-0">6 fields</span>
            </div>
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
            <div>
              <h3 className="font-semibold text-slate-700 text-sm">Known Institutions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Database reference map</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input type="text" className="w-full md:w-64 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg outline-none text-sm font-medium text-slate-500" defaultValue="Pre-loaded institution database" readOnly />
              <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-50 border border-amber-200 px-2 py-1 rounded shrink-0">13 entries</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
