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
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
} from 'lucide-react';
import { Course } from '../types/index.js';

export const AdminCourses: React.FC = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // New Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('Computer Science & Tech');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');

  // New Module Modal
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');

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

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await API.post('/admin/courses', {
        title,
        subjectName,
        description,
        difficulty,
      });
      if (res.data.success) {
        toast('success', 'Course created!');
        setShowCourseModal(false);
        setTitle('');
        setDescription('');
        fetchCourses();
      }
    } catch (e) {
      toast('error', 'Failed to create course');
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !moduleTitle.trim()) return;

    try {
      const res = await API.post(`/admin/courses/${selectedCourseId}/modules`, {
        title: moduleTitle,
      });
      if (res.data.success) {
        toast('success', 'Module added!');
        setSelectedCourseId(null);
        setModuleTitle('');
        fetchCourses();
      }
    } catch (e) {
      toast('error', 'Failed to add module');
    }
  };

  if (loading) {
    return <Preloader message="Loading course curriculum..." subMessage="Fetching syllabus trees and modules" />;
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
                  Course & Curriculum Builder
                </h1>
              </div>
              <p className="text-sm text-slate-600">
                Design comprehensive courses, organize chapters into sequential modules, and publish lessons.
              </p>
            </div>

            <Button onClick={() => setShowCourseModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Create Course
            </Button>
          </div>

          {/* Courses List */}
          {courses.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No courses created yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Build your institution's course catalog with modules and interactive quizzes.
              </p>
              <Button onClick={() => setShowCourseModal(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Create First Course
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {(Array.isArray(courses) ? courses : []).map((course) => (
                <Card key={course.id} className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-extrabold text-slate-900">{course.title}</h2>
                        <Badge variant="primary" className="capitalize text-[10px]">
                          {course.difficulty}
                        </Badge>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 mt-0.5 block">{course.subjectName}</span>
                      <p className="text-xs text-slate-600 mt-1">{course.description}</p>
                    </div>

                    <Button size="sm" variant="outline" onClick={() => setSelectedCourseId(course.id)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Module
                    </Button>
                  </div>

                  {/* Modules List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Curriculum Modules</h4>
                    {!course.modules || course.modules.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No modules in this course yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(Array.isArray(course.modules) ? course.modules : []).map((m) => (
                          <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 text-xs">Module {m.order}: {m.title}</span>
                              <span className="text-[10px] text-slate-400">{m.lessons?.length || 0} lessons</span>
                            </div>
                            <div className="space-y-1">
                              {(Array.isArray(m.lessons) ? m.lessons : []).map((les) => (
                                <div key={les.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="truncate">{les.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* New Course Modal */}
          {showCourseModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Create New Course</h3>
                  <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Course Title</label>
                    <input
                      placeholder="e.g. Master Data Structures & Algorithms"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      required
                    />
                  </div>

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

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Overview of the course goals and target outcomes..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowCourseModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Publish Course</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Module Modal */}
          {selectedCourseId && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Add Module</h3>
                  <button onClick={() => setSelectedCourseId(null)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddModule} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Module Title</label>
                    <input
                      placeholder="e.g. Chapter 1: Arrays & Pointers"
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedCourseId(null)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Module</Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
