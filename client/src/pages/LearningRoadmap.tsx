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
  Map,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { RoadmapNode } from '../types/index.js';

export const LearningRoadmap: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('Computer Science & Tech');
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const fetchRoadmap = async (selectedSubject: string) => {
    setLoading(true);
    try {
      const res = await API.get(`/progress/roadmap?subject=${encodeURIComponent(selectedSubject)}`);
      if (res.data?.success) {
        const raw = res.data.data?.nodes || res.data.data || [];
        setNodes(Array.isArray(raw) ? raw : []);
        setOverallProgress(res.data.data?.overallProgress || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap(subject);
  }, [subject]);

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
                  <Map className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Adaptive Learning Roadmap
                </h1>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Prerequisite knowledge trees designed by pedagogical AI. Complete quizzes to unlock higher-tier nodes.
              </p>
            </div>

            {/* Subject Selector */}
            <div className="w-full md:w-auto">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Select Curriculum
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Computer Science & Tech">Computer Science & Tech</option>
                <option value="Mathematics & Logic">Mathematics & Logic</option>
                <option value="Physics & Engineering">Physics & Engineering</option>
                <option value="Business & Finance">Business & Finance</option>
              </select>
            </div>
          </div>

          {/* Overall Progress Banner */}
          <Card className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-100 block mb-1">
                  Curriculum Mastery
                </span>
                <h3 className="text-2xl font-extrabold">{subject}</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black">{overallProgress}%</span>
                <span className="block text-xs text-blue-100">Tree Completion</span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-white/20 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, overallProgress)}%` }}
              />
            </div>
          </Card>

          {/* Interactive Knowledge Nodes Tree */}
          {loading ? (
            <Preloader message="Generating knowledge nodes..." subMessage="Checking concept dependencies & quiz attempts" />
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Concept Milestones</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Array.isArray(nodes) ? nodes : []).map((node, index) => {
                  const isLocked = node.status === 'locked';
                  const isMastered = node.status === 'mastered';
                  const isInProgress = node.status === 'in_progress';

                  return (
                    <Card
                      key={node.id}
                      className={`p-6 transition-all flex flex-col justify-between ${
                        isLocked
                          ? 'bg-slate-100/60 border-slate-200 opacity-60'
                          : isMastered
                          ? 'bg-emerald-50/40 border-emerald-300 shadow-sm'
                          : 'bg-white border-blue-200 shadow-sm hover:border-blue-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-400">Step {index + 1}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
                              +{node.xpReward} XP
                            </span>
                            {isLocked ? (
                              <Badge variant="outline" className="text-xs">
                                <Lock className="w-3 h-3 mr-1 text-slate-400" /> Locked
                              </Badge>
                            ) : isMastered ? (
                              <Badge variant="success" className="text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Mastered
                              </Badge>
                            ) : (
                              <Badge variant="primary" className="text-xs">
                                <Unlock className="w-3 h-3 mr-1" /> Available
                              </Badge>
                            )}
                          </div>
                        </div>

                        <h4 className="font-extrabold text-base text-slate-900 mb-1">{node.title}</h4>
                        <span className="text-xs font-semibold text-blue-600 block mb-2">{node.topic}</span>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">{node.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        {node.score !== undefined && (
                          <span className="text-xs font-bold text-slate-700">
                            Score: <span className="text-indigo-600">{node.score}%</span>
                          </span>
                        )}

                        {isLocked ? (
                          <span className="text-xs text-slate-400 italic">Complete previous step</span>
                        ) : (
                          <Link
                            to={`/quiz-generator?topic=${encodeURIComponent(node.topic)}&subject=${encodeURIComponent(
                              subject
                            )}`}
                          >
                            <Button size="sm" variant={isMastered ? 'outline' : 'primary'}>
                              {isMastered ? 'Practice Again' : 'Take Challenge Quiz'} &rarr;
                            </Button>
                          </Link>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
