export type RoleOption =
  | 'Software Engineer'
  | 'Data Analyst'
  | 'Business Analyst'
  | 'Product Manager'
  | 'Cloud Engineer'
  | 'Cybersecurity Analyst'
  | 'Data Scientist'
  | 'DevOps Engineer'
  | string;

export type ExperienceLevel =
  | 'Fresher'
  | '0–2 years'
  | '2–5 years'
  | '5–10 years'
  | '10+ years';

export type InterviewType = 'technical' | 'behavioral' | 'mixed' | 'job_specific';

export type InputMode = 'text' | 'voice' | 'text_voice';

export type InterviewStatus = 'CONFIGURED' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

export interface QuestionClient {
  id: string;
  number: number;
  question: string;
  skill: string;
  difficulty: number;
  type: string;
}

export interface SkillScore {
  skill_name: string;
  current_score: number;
  previous_score?: number | null;
  observation_count: number;
  confidence: number;
}

export interface DebugInfo {
  previous_score?: number;
  skill?: string;
  current_rolling_skill_score?: number;
  difficulty?: string;
  decision?: string;
  reason?: string;
  ai_confidence?: number;
  mode?: 'AGENTIC' | 'DETERMINISTIC';
  next_competency?: string;
}

export interface SubmitAnswerResponse {
  accepted: boolean;
  interview_status: InterviewStatus;
  completed: boolean;
  next_question?: QuestionClient | null;
  report_ready?: boolean;
  debug_info?: DebugInfo;
}

export interface SevenDayItem {
  day: number;
  topic: string;
  task: string;
}

export interface FinalReportData {
  executive_summary: string;
  strengths: string[];
  key_development_areas: string[];
  competency_breakdown: Record<string, { score: number; feedback: string }>;
  question_improvements: Array<{
    question_number: number;
    example_improved_answer: string;
    coaching_tip: string;
  }>;
  personalized_improvement_plan: {
    top_3_priorities: string[];
    study_topics: string[];
    practice_exercises: string[];
    next_mock_focus: string;
    seven_day_schedule: SevenDayItem[];
  };
}

export interface QuestionHistoryItem {
  number: number;
  skill: string;
  difficulty: number;
  question: string;
  candidate_answer: string;
  evaluation?: {
    technical_accuracy?: number;
    relevance?: number;
    completeness?: number;
    communication?: number;
    problem_solving?: number;
    overall_score?: number;
    strengths?: string[];
    weaknesses?: string[];
    missing_concepts?: string[];
    confidence?: number;
    follow_up_warranted?: boolean;
    follow_up_reason?: string;
  };
}

export interface InterviewReportResponse {
  interview_id: string;
  role: string;
  experience: string;
  status: InterviewStatus;
  readiness_score: number;
  score_disclaimer: string;
  report: FinalReportData;
  skill_profile: Record<string, { current_score: number; observations: number }>;
  pdf_download_url?: string | null;
  questions_history: QuestionHistoryItem[];
  completed_at?: number;
}

export interface DashboardSummary {
  total_interviews_completed: number;
  average_readiness_score: number;
  strongest_skill: string;
  primary_improvement_area: string;
  progress_trend: Array<{
    interviewNumber: number;
    role: string;
    score: number;
    date: string;
  }>;
  recent_interviews: Array<{
    interview_id: string;
    role: string;
    experience: string;
    interview_type: string;
    status: InterviewStatus;
    question_limit: number;
    current_question_number: number;
    readiness_score?: number | null;
    created_at: number;
    completed_at?: number | null;
  }>;
}

export interface UserProfile {
  sub: string;
  email: string;
  name: string;
}
