import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../lib/api.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Preloader } from '../components/ui/Preloader.js';
import {
  Dna,
  Zap,
  Target,
  Clock,
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { LearningDNA as LearningDNAType, SkillGap } from '../types/index.js';

export const LearningDNA: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dna, setDna] = useState<LearningDNAType | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dnaRes, gapsRes] = await Promise.allSettled([
          API.get('/progress/dna'),
          API.get('/progress/skill-gap'),
        ]);

        if (dnaRes.status === 'fulfilled' && dnaRes.value.data.success) {
          setDna(dnaRes.value.data.data);
        }

        if (gapsRes.status === 'fulfilled' && gapsRes.value.data.success) {
          setSkillGaps(gapsRes.value.data.data.skillGaps || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <Preloader message="Decoding your Learning DNA..." subMessage="Calculating retention curves, cognitive pacing, and skill gaps" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-5 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <Dna className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  AI Learning DNA & Skill Gap Analyzer
                </h1>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Calculated dynamically from your actual quiz response times, question accuracies, and revision frequency.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 text-xs">
              <span className="font-bold block mb-0.5">Primary Learning Modality</span>
              <span className="text-base font-extrabold text-indigo-700">
                {dna?.primaryLearningStyle || 'Active Visual-Analytical'}
              </span>
            </div>
          </div>

          {/* DNA Trait Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Comprehension Speed</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 capitalize">
                {dna?.comprehensionSpeed || 'Adaptive'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Based on avg solve time per question</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Retention Curve</span>
                <Brain className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-600">
                {dna?.retentionScore || 82}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Memory decay estimation score</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Active Recall Strength</span>
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-600">
                {dna?.activeRecallStrength || 88}%
              </div>
              <p className="text-xs text-slate-500 mt-1">First-attempt accuracy rate</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase">Optimal Pacing</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600">
                {dna?.recommendedPacing || 'High Pacing'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Suggested session frequency</p>
            </Card>
          </div>

          {/* Mastery Dimensions & Radar Breakdown */}
          {dna?.masteryDimensions && dna.masteryDimensions.length > 0 && (
            <Card className="p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" /> Cognitive Mastery Dimensions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dna.masteryDimensions.map((dim, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{dim.dimension}</span>
                      <span className="text-sm font-extrabold text-indigo-600">{dim.score}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{dim.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Skill Gap Analysis Matrix */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-rose-600" /> Skill & Knowledge Gap Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Targeted diagnostics highlighting topics requiring active intervention
                </p>
              </div>
              <Badge variant="primary">Real-time telemetry</Badge>
            </div>

            {skillGaps.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900">No Critical Knowledge Gaps Detected!</p>
                <p className="text-xs text-slate-500 mt-1">Take more quizzes across different subjects to maintain your mastery map.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Subject & Topic</th>
                      <th className="pb-3">Attempts</th>
                      <th className="pb-3">Accuracy</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Recommended Intervention</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {skillGaps.map((gap, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 pr-3">
                          <span className="font-bold text-slate-900 block">{gap.topic}</span>
                          <span className="text-[11px] text-slate-500">{gap.subject}</span>
                        </td>
                        <td className="py-3.5 text-slate-700 font-semibold">{gap.totalAttempts}</td>
                        <td className="py-3.5">
                          <span
                            className={`font-bold ${
                              gap.accuracy >= 80
                                ? 'text-emerald-600'
                                : gap.accuracy >= 60
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {gap.accuracy}%
                          </span>
                        </td>
                        <td className="py-3.5">
                          <Badge
                            variant={
                              gap.status === 'mastered'
                                ? 'success'
                                : gap.status === 'proficient'
                                ? 'primary'
                                : gap.status === 'needs_practice'
                                ? 'warning'
                                : 'danger'
                            }
                            className="capitalize text-[10px]"
                          >
                            {gap.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-slate-600 max-w-xs">{gap.recommendedAction}</td>
                        <td className="py-3.5 text-right">
                          <Link to={`/quiz-generator?topic=${encodeURIComponent(gap.topic)}`}>
                            <Button size="sm" variant="outline" className="text-xs h-7 px-3">
                              Fix Gap <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        </td>
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
