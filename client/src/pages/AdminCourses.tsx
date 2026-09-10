import React, { useEffect, useState } from 'react';
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
  Plus,
  BookOpen,
  Award,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Search,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Course, CourseStudentItem } from '../types/index.js';

export const AdminCourses: React.FC = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // New / Edit Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('Computer Science & Tech');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [xpReward, setXpReward] = useState(250);
  const [hasCertificate, setHasCertificate] = useState(true);
  const [certificateTitle, setCertificateTitle] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Module & Lesson Modals
  const [selectedCourseForModule, setSelectedCourseForModule] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');

  const [selectedModuleForLesson, setSelectedModuleForLesson] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonDuration, setLessonDuration] = useState(15);

  // View Students Modal
  const [viewingCourseStudents, setViewingCourseStudents] = useState<string | null>(null);
  const [courseStudentsData, setCourseStudentsData] = useState<{
    course: any;
    students: CourseStudentItem[];
    totalEnrolled: number;
    totalCompleted: number;
  } | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const fetchCourses = async () => {
    try {
      const res = await API.get('/admin/courses');
      if (res.data?.success) {
        const raw = res.data.data?.courses || res.data.data || [];
        setCourses(Array.isArray(raw) ? raw : []);
      }
    } catch (e) {
      toast('error', 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenCreate = () => {
    setEditingCourseId(null);
    setTitle('');
    setDescription('');
    setSubjectName('Computer Science & Tech');
    setDifficulty('intermediate');
    setXpReward(250);
    setHasCertificate(true);
    setCertificateTitle('');
    setIsPublished(true);
    setShowCourseModal(true);
  };

  const handleOpenEdit = (c: Course) => {
    setEditingCourseId(c.id);
    setTitle(c.title);
    setDescription(c.description);
    setSubjectName(c.subjectName);
    setDifficulty(c.difficulty);
    setXpReward(c.xpReward ?? 250);
    setHasCertificate(c.hasCertificate ?? true);
    setCertificateTitle(c.certificateTitle || `Certificate of Mastery: ${c.title}`);
    setIsPublished(c.isPublished);
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      if (editingCourseId) {
        const res = await API.put(`/admin/courses/${editingCourseId}`, {
          title,
          subjectName,
          description,
          difficulty,
          xpReward: Number(xpReward),
          hasCertificate,
          certificateTitle: certificateTitle || `Certificate of Mastery: ${title}`,
          isPublished,
        });
        if (res.data.success) {
          toast('success', 'Course updated successfully!');
        }
      } else {
        const res = await API.post('/admin/courses', {
          title,
          subjectName,
          description,
          difficulty,
          xpReward: Number(xpReward),
          hasCertificate,
          certificateTitle: certificateTitle || `Certificate of Mastery: ${title}`,
          isPublished,
        });
        if (res.data.success) {
          toast('success', 'Course published with XP reward and Certificate!');
        }
      }
      setShowCourseModal(false);
      fetchCourses();
    } catch (e: any) {
      toast('error', e.response?.data?.message || 'Failed to save course');
    }
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete course "${title}"? This will also remove student enrollment progress.`)) return;

    try {
      await API.delete(`/admin/courses/${id}`);
      toast('success', 'Course deleted successfully');
      fetchCourses();
    } catch (e) {
      toast('error', 'Failed to delete course');
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForModule || !moduleTitle.trim()) return;

    try {
      const res = await API.post(`/admin/courses/${selectedCourseForModule}/modules`, {
        title: moduleTitle,
        description: moduleDescription,
      });
      if (res.data.success) {
        toast('success', 'Module added!');
        setSelectedCourseForModule(null);
        setModuleTitle('');
        setModuleDescription('');
        fetchCourses();
      }
    } catch (e) {
      toast('error', 'Failed to add module');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleForLesson || !lessonTitle.trim()) return;

    try {
      const res = await API.post(`/admin/modules/${selectedModuleForLesson}/lessons`, {
        title: lessonTitle,
        content: lessonContent || 'Interactive lesson notes and concept overview.',
        durationMinutes: Number(lessonDuration) || 15,
      });
      if (res.data.success) {
        toast('success', 'Lesson added to module!');
        setSelectedModuleForLesson(null);
        setLessonTitle('');
        setLessonContent('');
        fetchCourses();
      }
    } catch (e) {
      toast('error', 'Failed to add lesson');
    }
  };

  const handleViewStudents = async (courseId: string) => {
    setViewingCourseStudents(courseId);
    setLoadingStudents(true);
    setStudentSearch('');
    try {
      const res = await API.get(`/admin/courses/${courseId}/students`);
      if (res.data?.success) {
        setCourseStudentsData(res.data.data);
      }
    } catch (e) {
      toast('error', 'Failed to fetch enrolled students');
    } finally {
      setLoadingStudents(false);
    }
  };

  if (loading) {
    return <Preloader message="Loading course curriculum..." subMessage="Fetching syllabus trees, XP rewards and certificates" />;
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
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Layers className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Course & Curriculum Academy
                </h1>
              </div>
              <p className="text-sm text-slate-600">
                Publish interactive courses with guaranteed XP rewards and verified graduation certificates. Monitor enrolled students and completion rates.
              </p>
            </div>

            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> Publish New Course
            </Button>
          </div>

          {/* Courses List */}
          {courses.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No courses created yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Build your institution's course catalog with interactive lessons, XP rewards, and automatic certificate issuance.
              </p>
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-1.5" /> Publish First Course
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {(Array.isArray(courses) ? courses : []).map((course) => {
                const enrolledCount = course.enrollments?.length ?? course._count?.enrollments ?? 0;
                const certsCount = course._count?.certificates ?? 0;

                return (
                  <Card key={course.id} className="p-6 space-y-5">
                    {/* Course Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-extrabold text-slate-900">{course.title}</h2>
                          <Badge variant="primary" className="capitalize text-[10px]">
                            {course.difficulty}
                          </Badge>
                          <Badge variant={course.isPublished ? 'success' : 'secondary'} className="text-[10px]">
                            {course.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                          <span className="text-blue-600 font-bold">{course.subjectName}</span>
                          <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            +{course.xpReward ?? 250} Completion XP
                          </span>
                          {course.hasCertificate && (
                            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Award className="w-3.5 h-3.5 text-emerald-600" />
                              Verified Certificate Included
                            </span>
                          )}
                        </div>
                        {course.description && (
                          <p className="text-xs text-slate-600 max-w-3xl pt-1 leading-relaxed">
                            {course.description}
                          </p>
                        )}
                      </div>

                      {/* Admin Controls */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleViewStudents(course.id)}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                        >
                          <Users className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          Enrolled Students ({enrolledCount})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCourseForModule(course.id);
                            setModuleTitle('');
                            setModuleDescription('');
                          }}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Module
                        </Button>
                        <button
                          onClick={() => handleOpenEdit(course)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Edit course"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id, course.title)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Modules & Lessons Curriculum */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Curriculum Syllabus ({course.modules?.length || 0} Modules)
                        </h4>
                      </div>

                      {!course.modules || course.modules.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                          <p className="text-xs text-slate-400 italic">No modules added to this course yet.</p>
                          <button
                            onClick={() => setSelectedCourseForModule(course.id)}
                            className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add First Module
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(Array.isArray(course.modules) ? course.modules : []).map((m) => (
                            <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-slate-900 text-xs">
                                    Module {m.order}: {m.title}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                    {m.lessons?.length || 0} lessons
                                  </span>
                                </div>
                                {m.description && (
                                  <p className="text-[11px] text-slate-500 line-clamp-2">{m.description}</p>
                                )}

                                <div className="space-y-1.5 pt-1">
                                  {(Array.isArray(m.lessons) ? m.lessons : []).map((les) => (
                                    <div
                                      key={les.id}
                                      className="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs"
                                    >
                                      <div className="flex items-center gap-1.5 overflow-hidden">
                                        <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <span className="truncate font-medium">{les.title}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5" /> {les.durationMinutes}m
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedModuleForLesson(m.id);
                                  setLessonTitle('');
                                  setLessonContent('');
                                }}
                                className="w-full py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-[11px] font-semibold text-slate-600 transition-colors flex items-center justify-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add Lesson
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* New / Edit Course Modal */}
          {showCourseModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {editingCourseId ? 'Edit Course Settings' : 'Publish New Course'}
                    </h3>
                  </div>
                  <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Course Title *</label>
                    <input
                      placeholder="e.g. Full Stack Web Development & System Design"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Subject</label>
                      <select
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      >
                        <option value="Computer Science & Tech">Computer Science & Tech</option>
                        <option value="Mathematics & Logic">Mathematics & Logic</option>
                        <option value="Physics & Engineering">Physics & Engineering</option>
                        <option value="Business & Finance">Business & Finance</option>
                        <option value="Data Science & AI">Data Science & AI</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  {/* XP & Certificate Integration Settings */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                    <h4 className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" /> Course XP & Verified Certificate Rewards
                    </h4>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Completion XP Reward</label>
                      <input
                        type="number"
                        min="50"
                        max="2000"
                        step="50"
                        value={xpReward}
                        onChange={(e) => setXpReward(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-bold text-amber-900"
                        required
                      />
                      <p className="text-[11px] text-amber-800 mt-1">
                        Awarded automatically to the student's profile & gamification rank when they complete 100% of lessons.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-200/80 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={hasCertificate}
                          onChange={(e) => setHasCertificate(e.target.checked)}
                          className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4"
                        />
                        <span>Award Verified Certificate Upon Completion</span>
                      </label>

                      {hasCertificate && (
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                            Certificate Diploma Title (Optional)
                          </label>
                          <input
                            placeholder={`Certificate of Mastery: ${title || 'Course'}`}
                            value={certificateTitle}
                            onChange={(e) => setCertificateTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Course summary, prerequisites, and learning objectives..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100">
                    <span className="font-bold text-slate-800">Publish Immediately</span>
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setShowCourseModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingCourseId ? 'Save Changes' : 'Publish Course'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Module Modal */}
          {selectedCourseForModule && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Add Curriculum Module</h3>
                  <button onClick={() => setSelectedCourseForModule(null)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddModule} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Module Title *</label>
                    <input
                      placeholder="e.g. Chapter 1: Core Fundamentals & Principles"
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Module Summary</label>
                    <textarea
                      rows={2}
                      placeholder="Short summary of topics covered in this module..."
                      value={moduleDescription}
                      onChange={(e) => setModuleDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedCourseForModule(null)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Module</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Lesson Modal */}
          {selectedModuleForLesson && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Add Lesson to Module</h3>
                  <button onClick={() => setSelectedModuleForLesson(null)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddLesson} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Lesson Title *</label>
                    <input
                      placeholder="e.g. 1.1 Understanding Binary Search Trees"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Estimated Reading / Practice Duration (Minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Lesson Content & Notes</label>
                    <textarea
                      rows={5}
                      placeholder="Detailed educational notes, code examples, or reference text for students..."
                      value={lessonContent}
                      onChange={(e) => setLessonContent(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedModuleForLesson(null)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Lesson</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Enrolled Students Modal (Admin Access to Students) */}
          {viewingCourseStudents && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        Enrolled Students & Completion Tracker
                      </h3>
                    </div>
                    {courseStudentsData?.course && (
                      <p className="text-xs text-slate-500 mt-1">
                        Course: <strong className="text-slate-800">{courseStudentsData.course.title}</strong> • Total Enrolled: {courseStudentsData.totalEnrolled} • Graduated: {courseStudentsData.totalCompleted}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setViewingCourseStudents(null)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                {loadingStudents ? (
                  <div className="p-12 text-center text-slate-400">Loading student progress and certificate records...</div>
                ) : !courseStudentsData || courseStudentsData.students.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Users className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">No students enrolled in this course yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        placeholder="Search student by name or email..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                      {courseStudentsData.students
                        .filter((s) =>
                          s.user?.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.user?.email?.toLowerCase().includes(studentSearch.toLowerCase())
                        )
                        .map((s) => (
                          <div
                            key={s.enrollmentId}
                            className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm border border-blue-200">
                                {s.user?.name?.[0]?.toUpperCase() || 'S'}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm">{s.user?.name}</h4>
                                <p className="text-xs text-slate-500">{s.user?.email}</p>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                  <span>Enrolled: {new Date(s.enrolledAt).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>Level: {s.user?.level || 'intermediate'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:items-end gap-1.5 min-w-[200px]">
                              <div className="flex items-center justify-between sm:justify-end gap-2 w-full">
                                <span className="text-xs font-bold text-slate-700">
                                  {s.completedLessonsCount}/{s.totalLessons} Lessons ({s.progressPercent}%)
                                </span>
                                {s.isCompleted ? (
                                  <Badge variant="success" className="text-[10px] flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Completed
                                  </Badge>
                                ) : (
                                  <Badge variant="primary" className="text-[10px]">
                                    In Progress
                                  </Badge>
                                )}
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    s.isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${s.progressPercent}%` }}
                                />
                              </div>

                              {/* Certificate & XP Tag */}
                              <div className="flex items-center gap-2 pt-0.5">
                                {s.xpAwarded > 0 && (
                                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                    +{s.xpAwarded} XP Earned
                                  </span>
                                )}
                                {s.certificate && (
                                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Award className="w-3 h-3" /> Cert: {s.certificate.certificateId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setViewingCourseStudents(null)}>
                    Close
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
