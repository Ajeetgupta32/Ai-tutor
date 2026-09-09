export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'super_admin' | 'teacher' | 'content_manager' | 'support';
  avatar?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  xp?: number;
  status?: string;
  preferredLanguage?: string;
  learningSpeed?: string;
  riskLevel?: string;
  riskReason?: string;
  studyStreak: number;
  totalQuizCount: number;
  averageScore: number;
  accuracyRate: number;
  totalStudyTimeMinutes: number;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: 'user' | 'assistant';
  content: string;
  language: 'en' | 'hi';
  mode?: string;
  metadata?: any;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  type: 'mcq' | 'true_false' | 'fill_in_blank' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic?: string;
}

export interface Quiz {
  _id: string;
  id?: string;
  title: string;
  subjectName: string;
  topicName: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionType: 'mcq' | 'true_false' | 'fill_in_blank' | 'short_answer' | 'mixed';
  questionCount: number;
  questions: QuizQuestion[];
  createdBy?: string;
  isAiGenerated: boolean;
  language: 'en' | 'hi';
  createdAt: string;
}

export interface UserAnswer {
  questionId: string;
  userResponse: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  topic?: string;
}

export interface QuizAttempt {
  _id: string;
  id?: string;
  userId: string;
  quizId: Quiz | string;
  quiz?: Quiz;
  answers: UserAnswer[];
  score: number;
  totalQuestions: number;
  percentage: number;
  accuracy: number;
  timeTakenSeconds: number;
  weakTopics: string[];
  strongTopics: string[];
  completedAt: string;
}

export interface StudyMaterial {
  _id: string;
  id?: string;
  userId: string;
  title: string;
  fileType: 'pdf' | 'text';
  fileSize: number;
  extractedText: string;
  summary: string;
  keyTopics: string[];
  uploadedAt: string;
}

export interface Subject {
  _id: string;
  id?: string;
  name: string;
  code: string;
  description: string;
  icon: string;
}

export interface Achievement {
  _id: string;
  badgeName: string;
  badgeIcon: string;
  description: string;
  unlockedAt: string;
}

export interface Goal {
  id: string;
  _id?: string;
  userId: string;
  title: string;
  type: string;
  targetValue: number;
  currentValue: number;
  targetDate?: string;
  isCompleted: boolean;
  xpReward: number;
  createdAt: string;
}

export interface StudyPlanDay {
  dayNumber: number;
  dateStr: string;
  subject: string;
  topic: string;
  tasks: string[];
  estimatedMinutes: number;
  isMockDay?: boolean;
}

export interface StudyPlan {
  id: string;
  _id?: string;
  userId: string;
  title: string;
  targetExam: string;
  examDate: string;
  dailyHours: number;
  targetScore: number;
  scheduleJson: StudyPlanDay[];
  createdAt: string;
}

export interface Certificate {
  id: string;
  _id?: string;
  certificateId: string;
  userId: string;
  title: string;
  subjectName: string;
  score: number;
  issuedAt: string;
  verificationCode: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface SupportTicket {
  id: string;
  _id?: string;
  ticketId: string;
  userId: string;
  category: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminReply?: string;
  assignedTo?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface Announcement {
  id: string;
  _id?: string;
  title: string;
  content: string;
  targetRole: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface LearningDNA {
  userId: string;
  userName: string;
  primaryLearningStyle: string;
  comprehensionSpeed: string;
  retentionScore: number;
  activeRecallStrength: number;
  analyticalVsConceptual: {
    analytical: number;
    conceptual: number;
  };
  recommendedPacing: string;
  preferredStudyTime: string;
  masteryDimensions: Array<{
    dimension: string;
    score: number;
    description: string;
  }>;
}

export interface SkillGap {
  topic: string;
  subject: string;
  accuracy: number;
  totalAttempts: number;
  status: 'critical' | 'needs_practice' | 'proficient' | 'mastered';
  recommendedAction: string;
}

export interface RoadmapNode {
  id: string;
  title: string;
  topic: string;
  description: string;
  prerequisites: string[];
  status: 'locked' | 'available' | 'in_progress' | 'mastered';
  score?: number;
  xpReward: number;
  quizConfig?: {
    subjectName: string;
    topicName: string;
    difficulty: string;
  };
}

export interface Course {
  id: string;
  title: string;
  description: string;
  subjectName: string;
  difficulty: string;
  isPublished: boolean;
  modules?: Array<{
    id: string;
    title: string;
    description: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      content: string;
      durationMinutes: number;
      order: number;
      isCompleted: boolean;
    }>;
  }>;
}

export interface QuestionBankItem {
  id: string;
  subjectName: string;
  topicName: string;
  questionText: string;
  type: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  marks: number;
  status: 'pending_review' | 'approved' | 'rejected' | 'flagged';
  isAiGenerated: boolean;
  createdAt: string;
}

export interface DashboardMetrics {
  totalQuizzes: number;
  averageScore: number;
  accuracy: number;
  studyTimeMinutes: number;
  currentStreak: number;
  xp?: number;
  learningDNA?: LearningDNA;
}
