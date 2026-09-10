import React, { useEffect, useState } from 'react';
import API from '../lib/api.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Preloader } from '../components/ui/Preloader.js';
import {
  Sliders,
  Cpu,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const AdminAISettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [aiData, setAiData] = useState<any | null>(null);

  useEffect(() => {
    const fetchAiAnalytics = async () => {
      try {
        const res = await API.get('/admin/ai-analytics');
        if (res.data.success) {
          setAiData(res.data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAiAnalytics();
  }, []);

  if (loading) {
    return <Preloader message="Loading AI engine settings..." subMessage="Fetching token consumption metrics & model configs" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-5 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <Sliders className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  AI Engine & Token Telemetry
                </h1>
              </div>
              <p className="text-sm text-slate-600">
                Monitor Google Gemini 2.5 Flash token utilization, AI model parameters, and safety moderation filters.
              </p>
            </div>

            <Badge variant="success" className="px-3 py-1.5 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Gemini 2.5 Flash Active
            </Badge>
          </div>

          {/* Model Config Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Total Tokens Used</span>
              <div className="text-3xl font-black text-purple-600">
                {aiData?.totalTokensUsed || 0}
              </div>
              <p className="text-xs text-slate-500">Cumulative prompt & completion tokens</p>
            </Card>

            <Card className="p-5 space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Active Foundation Model</span>
              <div className="text-2xl font-black text-slate-900">
                {aiData?.modelConfig?.activeModel || 'gemini-2.5-flash'}
              </div>
              <p className="text-xs text-slate-500">Fast reasoning & multi-modal tutor support</p>
            </Card>

            <Card className="p-5 space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Safety & Filtering</span>
              <div className="text-base font-bold text-emerald-600">
                {aiData?.modelConfig?.safetyLevel || 'Standard Educational Filtering'}
              </div>
              <p className="text-xs text-slate-500">Automatic student safety guardrails enabled</p>
            </Card>
          </div>

          {/* Feature Breakdown Table */}
          <Card className="p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Token Consumption by Feature Area</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {(Array.isArray(aiData?.featureBreakdown) ? aiData.featureBreakdown : []).map((fb: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 capitalize">{(fb.actionType || '').replace('_', ' ')}</span>
                    <span className="text-slate-400 block text-[11px]">{fb._count?.id || 1} API calls</span>
                  </div>
                  <span className="font-extrabold text-purple-600">{fb._sum?.tokensUsed || 0} tokens</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent AI Query Telemetry */}
          <Card className="p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Recent AI Execution Logs</h3>
            {!aiData?.recentAiLogs || aiData.recentAiLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No recent AI logs.</p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">User</th>
                      <th className="px-3 py-2">Feature</th>
                      <th className="px-3 py-2">Tokens</th>
                      <th className="px-3 py-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(Array.isArray(aiData?.recentAiLogs) ? aiData.recentAiLogs : []).map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{log.user?.name || 'Student'}</td>
                        <td className="px-3 py-2.5 font-medium text-blue-600 capitalize">{log.actionType}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">{log.tokensUsed}</td>
                        <td className="px-3 py-2.5 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};
