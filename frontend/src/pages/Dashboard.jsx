import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, verified: 0, needsReview: 0, invalid: 0 });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/documents');
        const docs = data || [];
        
        setStats({
          total: docs.length,
          verified: docs.filter(d => d.status === 'Verified').length,
          needsReview: docs.filter(d => d.status === 'Needs Review').length,
          invalid: docs.filter(d => d.status === 'Invalid').length,
          pending: docs.filter(d => d.status === 'Pending').length,
        });
        
        setRecentDocs(docs.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon, bg, text }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-4 rounded-xl ${bg} ${text}`}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Overview</h1>
          <p className="text-slate-500">Welcome back. Here's what's happening today.</p>
        </div>
        <Link 
          to="/upload" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 hover:-translate-y-0.5"
        >
          <FileText size={18} />
          Verify New Document
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Docs" value={stats.total} icon={<FileText size={24}/>} bg="bg-blue-50" text="text-blue-600" />
        <StatCard title="Verified" value={stats.verified} icon={<CheckCircle size={24}/>} bg="bg-emerald-50" text="text-emerald-600" />
        <StatCard title="Needs Review" value={stats.needsReview} icon={<AlertTriangle size={24}/>} bg="bg-amber-50" text="text-amber-600" />
        <StatCard title="Invalid" value={stats.invalid} icon={<XCircle size={24}/>} bg="bg-rose-50" text="text-rose-600" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Recent Verifications</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : recentDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Clock size={48} className="text-slate-300 mb-4" />
            <p className="text-lg">No documents verified yet.</p>
            <Link to="/upload" className="text-blue-600 mt-2 hover:underline">Upload your first document</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-sm border-b border-slate-100">
                  <th className="p-4 font-medium pl-6">Document ID</th>
                  <th className="p-4 font-medium">Student Name</th>
                  <th className="p-4 font-medium">Auth Score</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentDocs.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 text-sm font-mono text-slate-500">{doc._id.substring(0,8)}...</td>
                    <td className="p-4 font-medium text-slate-800">{doc.studentId || 'Unknown'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-100 rounded-full h-2 max-w-[80px]">
                          <div 
                            className={`h-2 rounded-full ${doc.authenticityScore >= 80 ? 'bg-emerald-500' : doc.authenticityScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                            style={{ width: `${doc.authenticityScore || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-slate-600">{doc.authenticityScore || 0}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        doc.status === 'Needs Review' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        doc.status === 'Invalid' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      <Link to={`/results/${doc._id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">
                        Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
