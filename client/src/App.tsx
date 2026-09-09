import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';

// Pages
import { Landing } from './pages/Landing.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { Dashboard } from './pages/Dashboard.js';
import { AITutor } from './pages/AITutor.js';
import { QuizGenerator } from './pages/QuizGenerator.js';
import { QuizPlayer } from './pages/QuizPlayer.js';
import { QuizResults } from './pages/QuizResults.js';
import { MyQuizzes } from './pages/MyQuizzes.js';
import { ProgressAnalytics } from './pages/ProgressAnalytics.js';
import { StudyMaterials } from './pages/StudyMaterials.js';
import { Profile } from './pages/Profile.js';
import { LearningDNA } from './pages/LearningDNA.js';
import { LearningRoadmap } from './pages/LearningRoadmap.js';
import { StudyPlanner } from './pages/StudyPlanner.js';
import { Goals } from './pages/Goals.js';
import { Certificates } from './pages/Certificates.js';
import { Support } from './pages/Support.js';

// Admin Pages
import { AdminDashboard } from './pages/AdminDashboard.js';
import { AdminAtRisk } from './pages/AdminAtRisk.js';
import { AdminUsers } from './pages/AdminUsers.js';
import { AdminCourses } from './pages/AdminCourses.js';
import { AdminQuestionBank } from './pages/AdminQuestionBank.js';
import { AdminAISettings } from './pages/AdminAISettings.js';
import { AdminSupport } from './pages/AdminSupport.js';
import { AdminAnnouncements } from './pages/AdminAnnouncements.js';
import { AdminAuditLogs } from './pages/AdminAuditLogs.js';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutor"
            element={
              <ProtectedRoute>
                <AITutor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dna"
            element={
              <ProtectedRoute>
                <LearningDNA />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <LearningRoadmap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study-planner"
            element={
              <ProtectedRoute>
                <StudyPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <Goals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificates"
            element={
              <ProtectedRoute>
                <Certificates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz-generator"
            element={
              <ProtectedRoute>
                <QuizGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz-player/:id"
            element={
              <ProtectedRoute>
                <QuizPlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz-results/:id"
            element={
              <ProtectedRoute>
                <QuizResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-quizzes"
            element={
              <ProtectedRoute>
                <MyQuizzes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materials"
            element={
              <ProtectedRoute>
                <StudyMaterials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/at-risk"
            element={
              <ProtectedRoute requireAdmin>
                <AdminAtRisk />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/question-bank"
            element={
              <ProtectedRoute requireAdmin>
                <AdminQuestionBank />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ai-settings"
            element={
              <ProtectedRoute requireAdmin>
                <AdminAISettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/support"
            element={
              <ProtectedRoute requireAdmin>
                <AdminSupport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute requireAdmin>
                <AdminAnnouncements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute requireAdmin>
                <AdminAuditLogs />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
};
