export type GroupType = string;

export interface GroupConfig {
  id: string; // e.g. "group7_mkpp", "group8_akpp", "group9_mkpp"
  number: string; // e.g. "7", "8", "9"
  name: string; // e.g. "Группа №7"
  transmission: 'МКПП' | 'АКПП' | string;
  transmissionLabel: string; // e.g. "Механика (МКПП)"
  description?: string;
}

export interface StudentAccount {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  login: string;
  password: string;
  group: string;
  status: 'active' | 'blocked';
  allowedTabs: {
    rules: boolean;
    materials: boolean;
    lessons: boolean;
    schedule: boolean;
  };
  canTakeTests: boolean;
  canTakeExam: boolean;
  notes?: string;
  createdAt: number;
  lastLoginAt?: number;
}

export interface AdminCredentials {
  login: string;
  passwordHash: string;
  recoveryEmails: string[];
  lastChangedAt?: number;
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  login?: string;
  group: string;
  isAdmin: boolean;
  studentId?: string;
  allowedTabs?: {
    rules?: boolean;
    materials?: boolean;
    lessons?: boolean;
    schedule?: boolean;
  };
  canTakeTests?: boolean;
  canTakeExam?: boolean;
}

export type SignCategory =
  | 'warning' // Предупреждающие
  | 'priority' // Знаки приоритета
  | 'prohibitory' // Запрещающие
  | 'mandatory' // Предписывающие
  | 'special' // Знаки особых предписаний
  | 'information' // Информационные
  | 'service' // Знаки сервиса
  | 'additional'; // Знаки дополнительной информации (таблички)

export interface RoadSign {
  id: string;
  number: string;
  name: string;
  category: SignCategory;
  description: string;
  meaning: string;
  svgType?: string; // Predefined SVG template
  imageUrl?: string;
}

export interface RoadRule {
  id: string;
  sectionNumber: string;
  title: string;
  summary: string;
  content: string;
  keyPoints: string[];
  groupFocus?: 'all' | 'mkpp' | 'akpp';
  imageUrl?: string;
}

export interface QuestionCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  questionCount?: number;
}

export interface Question {
  id: string;
  categoryId: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  imageUrl?: string;
  signId?: string;
  groupTarget?: string; // 'all' or any group id
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface TestAttempt {
  id: string;
  userId: string;
  userName: string;
  userGroup: string;
  categoryId: string;
  categoryTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  passed: boolean;
  timeSpentSeconds: number;
  timestamp: number;
  dateStr: string;
  wrongQuestionIds: string[];
  isExam?: boolean;
  abandoned?: boolean; // true if student started and closed/exited without completing
  answeredCount?: number;
}

export interface CompletedLesson {
  id: string;
  date: string; // e.g. "09.09.2026"
  topic: string;
  group: GroupType;
  instructor: string;
  description: string;
  fullLectureNotes?: string; // Detailed text for absent students
  keyPoints: string[];
  homework?: string;
  materials?: { title: string; url?: string }[];
  createdAt: number;
}

export interface ScheduleItem {
  id: string;
  type: 'theory' | 'driving';
  group: GroupType;
  title: string;
  dayTime: string;
  location: string;
  instructor: string;
  carModel?: string; // e.g. "Lada Vesta (МКПП)" or "Hyundai Solaris (АКПП)"
  notes?: string;
  contactPhone?: string;
}

export type MaterialType = 'video' | 'article' | 'handout';

export interface LearningMaterial {
  id: string;
  title: string;
  type: MaterialType;
  url: string;
  sourceName?: string;
  description: string;
  category: string;
  groupTarget: GroupType;
  imageUrl?: string;
  dateAdded: string;
}

export interface ExamSettings {
  isOpen: boolean; // open for students or closed by instructor
  questionCount: number; // e.g. 20 questions
  timeLimitMinutes: number; // e.g. 20 min (0 = unlimited)
  testTimeLimitMinutes: number; // for category tests (e.g. 15 min, 0 = unlimited)
  passingPercent: number; // e.g. 90%
}

export type PageThemeColor =
  | 'blue' // Классический синий ДОСААФ
  | 'indigo' // Индиго
  | 'emerald' // Изумрудный автодром
  | 'crimson' // Рубиновый автоспорт
  | 'amber' // Янтарный предупреждающий
  | 'slate' // Графитовый премиум
  | 'teal'; // Морской бирюзовый

export type PageHeroStyle =
  | 'gradient_banner' // Градиентный баннер с эмблемой
  | 'clean_minimal' // Чистый лаконичный заголовок с цветной полосой
  | 'card_badge' // Парящая карточка с бейджами
  | 'dosaaf_classic'; // Официальный классический стиль ДОСААФ

export interface PageDesignConfig {
  themeColor: PageThemeColor;
  heroStyle: PageHeroStyle;
  fontFamily: 'sans' | 'serif' | 'mono';
  fontSize: 'compact' | 'standard' | 'large';
  lineSpacing: 'normal' | 'relaxed';
  borderRadius: 'sharp' | 'modern' | 'soft'; // 6px, 14px, 22px
  cardStyle: 'bordered' | 'shadowed' | 'flat';
  pageBg: 'white' | 'gray' | 'warm' | 'cool';
  showAuthorBadge: boolean;
  showLastUpdated: boolean;
  showTargetGroup: boolean;
}

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string; // e.g. "Памятка", "Инструкция", "Автодром", "Регламент", "О школе"
  targetGroup: GroupType; // 'all' or specific group ID
  isPublished: boolean;
  lastUpdated: string;
  author: string;
  iconName?: string;
  contentMarkdown: string;
  design: PageDesignConfig;
}

// Live WYSIWYG Page & Element Designer Types
export type DesignBgTheme =
  | 'default'
  | 'white'
  | 'slate_light'
  | 'blue_light'
  | 'indigo_light'
  | 'emerald_light'
  | 'amber_light'
  | 'rose_light'
  | 'dark_slate'
  | 'gradient_blue'
  | 'gradient_indigo'
  | 'gradient_emerald'
  | 'gradient_dark';

export type DesignTextColor = 'default' | 'neutral_dark' | 'neutral_muted' | 'blue' | 'indigo' | 'emerald' | 'amber' | 'white';

export type DesignBorderRadius = 'default' | 'sharp' | 'medium' | 'rounded' | 'full';

export type DesignPadding = 'default' | 'compact' | 'normal' | 'spacious';

export type DesignBorder = 'default' | 'none' | 'subtle' | 'blue' | 'emerald' | 'amber' | 'dark';

export type DesignShadow = 'default' | 'none' | 'subtle' | 'card' | 'elevated';

export interface LiveElementStyle {
  bgTheme?: DesignBgTheme;
  textColor?: DesignTextColor;
  borderRadius?: DesignBorderRadius;
  padding?: DesignPadding;
  border?: DesignBorder;
  shadow?: DesignShadow;
  isHidden?: boolean;
}

export interface LiveElementContent {
  title?: string;
  subtitle?: string;
  badge?: string;
}

export interface LiveContainerOrder {
  itemIds: string[];
}

export interface LiveAppDesignState {
  styles: Record<string, LiveElementStyle>;
  contents: Record<string, LiveElementContent>;
  containerOrders: Record<string, string[]>;
}

export interface LivePageDesign {
  styles: Record<string, LiveElementStyle>;
  contents: Record<string, LiveElementContent>;
  containerOrders: Record<string, string[]>;
}

// Activity Audit Log
export interface ActivityLog {
  id: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  userId: string;
  userName: string;
  userGroup: string;
  userRole: 'student' | 'admin' | 'system';
  actionType:
    | 'password_change'
    | 'login'
    | 'logout'
    | 'test_completed'
    | 'exam_completed'
    | 'access_changed'
    | 'settings_updated';
  message: string;
  details?: string;
}

// Footer Configuration
export interface FooterSettings {
  schoolName: string;
  creatorName: string;
  email: string;
  phone: string;
  address: string;
  workHours: string;
  categoryNotice: string;
  licenseNotice?: string;
}

// Dynamic Navigation Tab Configuration
export interface NavTabConfig {
  id: string; // 'rules' | 'tests' | 'materials' | 'lessons' | 'schedule' | 'about' | 'profile' | 'stats' | 'logs'
  label: string;
  isVisible: boolean;
  order: number;
}

// Site Information & Changelog
export interface SiteInfoSettings {
  version: string;
  releaseDate: string;
  developer: string;
  schoolName: string;
  description: string;
  features: { title: string; desc: string }[];
  changelog: { version: string; date: string; changes: string[] }[];
}

// Global Application Color Theme
export type AppTheme = 'light' | 'dosaaf_navy';
