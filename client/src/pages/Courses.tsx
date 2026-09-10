import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  Play,
  Search,
  Filter,
  GraduationCap,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Course } from '../types/index.js';

export const Courses: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      const res = await API.get('/courses');
      if (res.data?.success) {
        const raw = res.data.data?.courses || res.data.data || [];
        setCourses(Array.isArray(raw) ? raw : []);
      }
    } catch (err: any) {
      toast('error', 'Failed to load courses catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnrollAndStart = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      const res = await API.post(`/courses/${courseId}/enroll`);
      if (res.data.success) {
        toast('success', 'Enrolled successfully!');
        navigate(`/courses/${courseId}`);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrollingId(null);
    }
  };

  const filteredCourses = (Array.isArray(courses) ? courses : []).filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subjectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || c.subjectName === selectedSubject;
    const matchesDiff = selectedDifficulty === 'all' || c.difficulty === selectedDifficulty;
    return matchesSearch && matchesSubject && matchesDiff;
  });

  const enrolledCount = (Array.isArray(courses) ? courses : []).filter((c) => c.enrollment?.isEnrolled).length;
  const completedCount = (Array.isArray(courses) ? courses : []).filter((c) => c.enrollment?.isCompleted).length;
  const totalEarnedXP = (Array.isArray(courses) ? courses : []).reduce(
    (acc, c) => acc + (c.enrollment?.xpAwarded || 0),
    0
  );

  if (loading) {
    return <Preloader message="Loading Academy Courses..." subMessage="Fetching syllabus and certified curricula" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-5 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Academy Header */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-bold border border-white/10">
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span>EduMentor Academy & Certified Curricula</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Master Complete Courses & Earn Verified Diplomas
              </h1>
              <p className="text-blue-100 text-sm leading-relaxed">
                Step through interactive chapters, earn massive XP boosts, and receive cryptographically verified certificates of completion directly upon graduation.
              </p>

              {/* Quick Academy Stats */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-md">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
                  <div className="text-lg font-black text-white">{enrolledCount}</div>
                  <div className="text-[10px] text-blue-200 font-semibold">Enrolled Courses</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
                  <div className="text-lg font-black text-amber-300">+{totalEarnedXP} XP</div>
                  <div className="text-[10px] text-blue-200 font-semibold">Academy XP</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
                  <div className="text-lg font-black text-emerald-300">{completedCount}</div>
                  <div className="text-[10px] text-blue-200 font-semibold">Certificates Earned</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search Bar */}
          <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                placeholder="Search courses by topic, title, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">All Subjects</option>
                <option value="Computer Science & Tech">Computer Science & Tech</option>
                <option value="Mathematics & Logic">Mathematics & Logic</option>
                <option value="Physics & Engineering">Physics & Engineering</option>
                <option value="Business & Finance">Business & Finance</option>
                <option value="Data Science & AI">Data Science & AI</option>
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </Card>

          {/* Courses Catalog Grid */}
          {filteredCourses.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No courses match your search</h3>
              <p className="text-xs text-slate-500 mt-1">Try resetting filters or adjusting keywords.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const enrollment = course.enrollment;
                const isEnrolled = enrollment?.isEnrolled;
                const isCompleted = enrollment?.isCompleted;
                const progress = enrollment?.progressPercent || 0;

                return (
                  <Card
                    key={course.id}
                    className="flex flex-col justify-between overflow-hidden hover:shadow-md transition-all border-slate-200/90 group"
                  >
                    <div className="p-5 space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="primary" className="text-[10px] uppercase font-bold">
                          {course.difficulty}
                        </Badge>
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                          {course.subjectName}
                        </span>
                      </div>

                      {/* Course Title & Description */}
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {course.description || 'Comprehensive curriculum with hands-on practice, lessons, and verified diploma.'}
                        </p>
                      </div>

                      {/* Syllabus Info & Highlights */}
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {course.moduleCount || course.modules?.length || 0} Modules
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          {course.lessonCount || 0} Lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {course.totalDurationMinutes || 60}m
                        </span>
                      </div>

                      {/* Rewards Banner: XP + Certificate */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/70 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-amber-900 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            +{course.xpReward ?? 250} XP
                          </span>
                          {course.hasCertificate && (
                            <span className="font-extrabold text-emerald-800 flex items-center gap-1 text-[11px]">
                              <Award className="w-3.5 h-3.5 text-emerald-600" />
                              Diploma Included
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar if enrolled */}
                      {isEnrolled && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                            <span>Your Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Button */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                      {isCompleted ? (
                        <div className="w-full flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Graduated
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate('/certificates')}
                            className="text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                          >
                            <Award className="w-3.5 h-3.5 mr-1" /> View Certificate
                          </Button>
                        </div>
                      ) : isEnrolled ? (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Continue Learning
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          isLoading={enrollingId === course.id}
                          onClick={() => handleEnrollAndStart(course.id)}
                        >
                          <GraduationCap className="w-4 h-4 mr-1.5" /> Enroll & Start
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
