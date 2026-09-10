import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../lib/api.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Preloader } from '../components/ui/Preloader.js';
import { useToast } from '../context/ToastContext.js';
import {
  Layers,
  BookOpen,
  CheckCircle2,
  Circle,
  Play,
  ArrowLeft,
  ChevronRight,
  Clock,
  Award,
  Sparkles,
  MessageSquare,
  PartyPopper,
  ExternalLink,
} from 'lucide-react';
import { Course } from '../types/index.js';

export const CoursePlayer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [completingLesson, setCompletingLesson] = useState(false);

  // Completion Celebration Modal State
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    xpAwarded: number;
    certificate: any;
  } | null>(null);

  const fetchCourse = async () => {
    try {
      const res = await API.get(`/courses/${courseId}`);
      if (res.data?.success) {
        const courseData = res.data.data;
        setCourse(courseData);

        // Set default active lesson if not set
        if (!activeLessonId && courseData.modules?.length > 0) {
          const firstModule = courseData.modules[0];
          if (firstModule.lessons?.length > 0) {
            // Find first incomplete lesson or default to first lesson
            const completedIds = new Set(courseData.enrollment?.completedLessons || []);
            let targetLesson = firstModule.lessons[0];
            for (const m of courseData.modules) {
              const incomplete = m.lessons.find((l: any) => !completedIds.has(l.id));
              if (incomplete) {
                targetLesson = incomplete;
                break;
              }
            }
            setActiveLessonId(targetLesson.id);
          }
        }
      }
    } catch (err) {
      toast('error', 'Failed to load course contents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const handleCompleteLesson = async (lessonId: string) => {
    if (!course) return;
    setCompletingLesson(true);
    try {
      const res = await API.post(`/courses/${course.id}/lessons/${lessonId}/complete`);
      if (res.data.success) {
        if (res.data.data?.isNewlyCompleted) {
          setCelebrationData({
            xpAwarded: res.data.data.xpAwarded,
            certificate: res.data.data.certificate,
          });
          setShowCelebrationModal(true);
        } else {
          toast('success', 'Lesson marked complete! Keep going.');
        }
        fetchCourse();
      }
    } catch (err: any) {
      toast('error', 'Failed to complete lesson');
    } finally {
      setCompletingLesson(false);
    }
  };

  if (loading) {
    return <Preloader message="Loading course curriculum..." subMessage="Preparing interactive lesson viewer" />;
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Layers className="w-12 h-12 text-slate-400 mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Course not found</h2>
        <Button onClick={() => navigate('/courses')} className="mt-4">
          Back to Courses Catalogue
        </Button>
      </div>
    );
  }

  // Find active lesson & active module
  let activeLesson: any = null;
  let activeModule: any = null;
  let allLessons: any[] = [];

  course.modules?.forEach((m) => {
    m.lessons?.forEach((l) => {
      allLessons.push({ ...l, moduleTitle: m.title });
      if (l.id === activeLessonId) {
        activeLesson = l;
        activeModule = m;
      }
    });
  });

  const completedSet = new Set(course.enrollment?.completedLessons || []);
  const isCurrentCompleted = activeLesson ? completedSet.has(activeLesson.id) : false;
  const progressPercent = course.enrollment?.progressPercent || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Back & Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/courses')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Back to courses"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-blue-600">{course.subjectName}</span>
                  <Badge variant="primary" className="text-[10px] capitalize">
                    {course.difficulty}
                  </Badge>
                  {course.enrollment?.isCompleted && (
                    <Badge variant="success" className="text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Graduated
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl font-extrabold text-slate-900">{course.title}</h1>
              </div>
            </div>

            {/* Overall Course Progress Bar */}
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Course Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      course.enrollment?.isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {course.hasCertificate && course.enrollment?.isCompleted && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate('/certificates')}
                  className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs shrink-0"
                >
                  <Award className="w-3.5 h-3.5 mr-1" /> Diploma
                </Button>
              )}
            </div>
          </div>

          {/* Main Learning Viewer Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left/Main: Active Lesson Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 sm:p-8 space-y-6 shadow-sm">
                {activeLesson ? (
                  <>
                    <div className="space-y-2 pb-4 border-b border-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span className="text-blue-600 font-bold uppercase tracking-wider text-[11px]">
                          {activeModule?.title || 'Course Module'}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5" /> {activeLesson.durationMinutes || 15} minutes
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {activeLesson.title}
                      </h2>
                    </div>

                    {/* Lesson Notes & Text Content */}
                    <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
                      {activeLesson.content || (
                        <p className="text-slate-500 italic">
                          Welcome to this lesson! Review the core principles, conceptual mechanisms, and take detailed study notes.
                        </p>
                      )}
                    </div>

                    {/* Bottom Lesson Action Bar */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        {isCurrentCompleted ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Lesson Completed
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <Circle className="w-4 h-4 text-slate-400" />
                            Incomplete
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/tutor')}
                          className="text-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1 text-blue-600" /> Ask AI Tutor
                        </Button>

                        {!isCurrentCompleted && (
                          <Button
                            size="sm"
                            isLoading={completingLesson}
                            onClick={() => handleCompleteLesson(activeLesson.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Complete & Earn XP
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p>Select a lesson from the curriculum sidebar to begin reading.</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Course Syllabus Sidebar */}
            <div className="space-y-4">
              <Card className="p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" /> Course Syllabus
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">
                    {completedSet.size}/{allLessons.length} Done
                  </span>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {(Array.isArray(course.modules) ? course.modules : []).map((m, mIdx) => (
                    <div key={m.id} className="space-y-2">
                      <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>Module {m.order || mIdx + 1}: {m.title}</span>
                      </div>

                      <div className="space-y-1">
                        {(Array.isArray(m.lessons) ? m.lessons : []).map((les) => {
                          const isDone = completedSet.has(les.id);
                          const isActive = les.id === activeLessonId;

                          return (
                            <button
                              key={les.id}
                              onClick={() => setActiveLessonId(les.id)}
                              className={`w-full text-left p-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                                isActive
                                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                                  : isDone
                                  ? 'bg-emerald-50/60 text-emerald-950 hover:bg-emerald-100/70 border border-emerald-200/50'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                {isDone ? (
                                  <CheckCircle2
                                    className={`w-4 h-4 shrink-0 ${
                                      isActive ? 'text-white' : 'text-emerald-600'
                                    }`}
                                  />
                                ) : (
                                  <Circle
                                    className={`w-4 h-4 shrink-0 ${
                                      isActive ? 'text-white' : 'text-slate-300'
                                    }`}
                                  />
                                )}
                                <span className="truncate">{les.title}</span>
                              </div>

                              <span
                                className={`text-[10px] shrink-0 ${
                                  isActive ? 'text-blue-100' : 'text-slate-400'
                                }`}
                              >
                                {les.durationMinutes}m
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Rewards Summary Card */}
              <Card className="p-5 bg-gradient-to-r from-amber-50 to-indigo-50 border-amber-200/80 space-y-3">
                <h4 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Graduation Rewards
                </h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between font-bold">
                    <span>XP Bounty:</span>
                    <span className="text-amber-700 font-extrabold">+{course.xpReward ?? 250} XP</span>
                  </div>
                  {course.hasCertificate && (
                    <div className="flex items-center justify-between font-bold">
                      <span>Official Certificate:</span>
                      <span className="text-emerald-700 font-extrabold">Verifiable Diploma</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Celebration Graduation Modal */}
          {showCelebrationModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-amber-200 text-center space-y-5 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-200">
                  <PartyPopper className="w-10 h-10 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
                    🎉 COURSE COMPLETED!
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">
                    Congratulations Graduate!
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    You have mastered all modules in <strong className="text-slate-900">{course.title}</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs font-extrabold text-amber-950">
                    <span>XP Earned</span>
                    <span className="text-amber-700 font-black text-sm">+{celebrationData?.xpAwarded || course.xpReward || 250} XP</span>
                  </div>
                  {celebrationData?.certificate && (
                    <div className="flex items-center justify-between text-xs font-extrabold text-emerald-950 pt-2 border-t border-amber-200/80">
                      <span>Certificate ID</span>
                      <span className="text-emerald-700 font-mono text-[11px]">{celebrationData.certificate.certificateId}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={() => navigate('/certificates')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    <Award className="w-4 h-4 mr-2" /> View & Print Verified Certificate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCelebrationModal(false)}
                    className="w-full text-xs"
                  >
                    Continue Exploring
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
