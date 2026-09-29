import {
  DashboardSummary,
  InterviewReportResponse,
  QuestionClient,
  SubmitAnswerResponse,
} from '../types';
import { getAuthToken } from './auth';
import {
  DEMO_DASHBOARD,
  DEMO_QUESTIONS,
  DEMO_REPORT,
} from './demoData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || !API_BASE_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If live backend configured, execute real network request
  if (!IS_DEMO_MODE) {
    const url = `${API_BASE_URL.replace(/\/$/, '')}${path}`;
    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData?.error?.message || `Request failed with status ${res.status}`;
        throw new Error(message);
      }
      return await res.json();
    } catch (err: any) {
      console.warn(`[API] Network call to ${url} failed: ${err.message}.`);
      throw err;
    }
  }

  // =========================================================================
  // DEMO MODE DISPATCHER (For hackathon offline walk-throughs & preview)
  // =========================================================================
  console.info(`[DEMO_MODE] Simulated endpoint: ${options.method || 'GET'} ${path}`);
  await new Promise((resolve) => setTimeout(resolve, 600)); // Realistic network latency

  if (path === '/dashboard') {
    return DEMO_DASHBOARD as unknown as T;
  }

  if (path === '/interviews' && options.method === 'POST') {
    return {
      interview_id: 'demo-int-001',
      status: 'CONFIGURED',
      target_competencies: ['SQL', 'Statistics', 'Problem Solving', 'Data Visualization'],
    } as unknown as T;
  }

  if (path === '/interviews' && options.method === 'GET') {
    return { interviews: DEMO_DASHBOARD.recent_interviews } as unknown as T;
  }

  if (path.includes('/start') && options.method === 'POST') {
    return {
      interview_id: 'demo-int-001',
      status: 'ACTIVE',
      current_difficulty: 2,
      first_question: DEMO_QUESTIONS[1],
    } as unknown as T;
  }

  if (path.includes('/answers') && options.method === 'POST') {
    const body = JSON.parse((options.body as string) || '{}');
    const answerText = body.answer || '';
    const qId = body.questionId || 'demo-q1';

    // Simulated adaptive logic matching Requirement 73 demo flow
    if (qId === 'demo-q1') {
      return {
        accepted: true,
        interview_status: 'ACTIVE',
        completed: false,
        next_question: DEMO_QUESTIONS[2],
        debug_info: {
          previous_score: 8.9,
          skill: 'SQL',
          current_rolling_skill_score: 8.9,
          difficulty: '2 -> 3',
          decision: 'INCREASE_DIFFICULTY',
          reason: 'Strong answer (8.9/10). Relational join algebra verified; escalating to query optimization.',
          ai_confidence: 0.95,
          mode: 'AGENTIC',
          next_competency: 'SQL Optimization',
        },
      } as unknown as T;
    } else if (qId === 'demo-q2') {
      return {
        accepted: true,
        interview_status: 'ACTIVE',
        completed: false,
        next_question: DEMO_QUESTIONS[3],
        debug_info: {
          previous_score: 7.0,
          skill: 'SQL',
          current_rolling_skill_score: 8.2,
          difficulty: '3 -> 3',
          decision: 'ASK_FOLLOWUP',
          reason: 'Candidate mentioned indexing without specifying suitable index type for timestamps.',
          ai_confidence: 0.9,
          mode: 'AGENTIC',
          next_competency: 'SQL',
        },
      } as unknown as T;
    } else if (qId === 'demo-q3') {
      return {
        accepted: true,
        interview_status: 'ACTIVE',
        completed: false,
        next_question: DEMO_QUESTIONS[4],
        debug_info: {
          previous_score: 8.5,
          skill: 'SQL',
          current_rolling_skill_score: 8.4,
          difficulty: '3 -> 2',
          decision: 'SWITCH_COMPETENCY',
          reason: 'SQL coverage sufficient (3 questions). Switching to untested competency: Statistics.',
          ai_confidence: 0.94,
          mode: 'AGENTIC',
          next_competency: 'Statistics',
        },
      } as unknown as T;
    } else if (qId === 'demo-q4') {
      return {
        accepted: true,
        interview_status: 'ACTIVE',
        completed: false,
        next_question: DEMO_QUESTIONS[5],
        debug_info: {
          previous_score: 4.8,
          skill: 'Statistics',
          current_rolling_skill_score: 5.4,
          difficulty: '2 -> 2',
          decision: 'DECREASE_DIFFICULTY',
          reason: 'Statistical gap detected on p-value interpretation (4.8/10). Maintaining foundational diagnostic.',
          ai_confidence: 0.92,
          mode: 'AGENTIC',
          next_competency: 'Statistics',
        },
      } as unknown as T;
    } else {
      // Question 5 -> Completion!
      return {
        accepted: true,
        interview_status: 'COMPLETED',
        completed: true,
        next_question: null,
        report_ready: true,
        debug_info: {
          previous_score: 7.2,
          skill: 'Statistics',
          current_rolling_skill_score: 5.8,
          difficulty: '2',
          decision: 'END_INTERVIEW',
          reason: 'Configured question limit reached (5 questions). Synthesizing report.',
          mode: 'AGENTIC',
        },
      } as unknown as T;
    }
  }

  if (path.includes('/report')) {
    return DEMO_REPORT as unknown as T;
  }

  if (path.includes('/complete') && options.method === 'POST') {
    return DEMO_REPORT as unknown as T;
  }

  if (path.includes('/practice-weaknesses') && options.method === 'POST') {
    return {
      interview_id: 'demo-int-weak-001',
      status: 'CONFIGURED',
      targeted_weaknesses: ['Statistics', 'Communication'],
      initial_difficulty: 1,
    } as unknown as T;
  }

  if (path.includes('/voice/synthesize') && options.method === 'POST') {
    return {
      contentType: 'audio/mpeg',
      audioBase64: null,
      voiceId: 'Ruth',
    } as unknown as T;
  }

  return {} as unknown as T;
}

export const api = {
  getDashboard: () => request<DashboardSummary>('/dashboard'),
  createInterview: (data: any) =>
    request<{ interview_id: string; status: string; target_competencies: string[] }>('/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getInterviews: () => request<{ interviews: any[] }>('/interviews'),
  getInterviewState: (id: string) => request<any>(`/interviews/${id}`),
  startInterview: (id: string) =>
    request<{ interview_id: string; status: string; current_difficulty: number; first_question: QuestionClient }>(
      `/interviews/${id}/start`,
      { method: 'POST' }
    ),
  submitAnswer: (id: string, questionId: string, answer: string) =>
    request<SubmitAnswerResponse>(`/interviews/${id}/answers`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answer }),
    }),
  completeInterview: (id: string) =>
    request<InterviewReportResponse>(`/interviews/${id}/complete`, { method: 'POST' }),
  getReport: (id: string) => request<InterviewReportResponse>(`/interviews/${id}/report`),
  practiceWeaknesses: (id: string, questionLimit = 5) =>
    request<{ interview_id: string; status: string; targeted_weaknesses: string[]; initial_difficulty: number }>(
      `/interviews/${id}/practice-weaknesses`,
      {
        method: 'POST',
        body: JSON.stringify({ previous_interview_id: id, question_limit: questionLimit }),
      }
    ),
  deleteInterview: (id: string) =>
    request<{ deleted: boolean; interview_id: string }>(`/interviews/${id}`, { method: 'DELETE' }),
  synthesizeVoice: (text: string) =>
    request<{ contentType: string; audioBase64: string | null; voiceId: string }>('/voice/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  presignDocument: async (fileName: string, fileType: string, category: string) => {
    if (import.meta.env.VITE_APP_MODE === 'local') {
      return {
        upload_url: '',
        s3_key: `local_${Date.now()}_${fileName}`,
        fields: {},
      };
    }
    return request<{ upload_url: string; s3_key: string; fields: Record<string, string> }>('/documents/presign', {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName, file_type: fileType, category }),
    });
  },
  processDocument: (s3Key: string, category: string, rawText?: string) =>
    request<{ text: string; analysis: any }>('/documents/process', {
      method: 'POST',
      body: JSON.stringify({ s3_key: s3Key, category, raw_text: rawText }),
    }),
  presignVoice: (fileName: string) =>
    request<{ upload_url: string; s3_key: string; fields: Record<string, string> }>('/voice/presign', {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName }),
    }),
  startTranscribe: (s3Key: string) =>
    request<{ job_name: string; status: string }>('/voice/transcribe', {
      method: 'POST',
      body: JSON.stringify({ s3_key: s3Key }),
    }),
  getTranscription: (jobName: string) =>
    request<{ status: string; transcript: string | null }>(`/voice/transcriptions/${jobName}`),
};
