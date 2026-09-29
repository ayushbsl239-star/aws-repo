/**
 * DEMO MODE SEEDED DATA (Clearly separated from production AWS integration).
 * Used exclusively for local offline demonstration, CI previews, and hackathon judge walk-throughs.
 * Production mode uses live AWS API Gateway, Bedrock, DynamoDB, Polly, and Transcribe.
 */
import { DashboardSummary, InterviewReportResponse, QuestionClient, SubmitAnswerResponse } from '../types';

export const DEMO_USER = {
  sub: 'demo-user-judge-1234',
  email: 'judge@awsinnovation2026.com',
  name: 'Alex Morgan',
};

export const DEMO_DASHBOARD: DashboardSummary = {
  total_interviews_completed: 4,
  average_readiness_score: 76.5,
  strongest_skill: 'SQL (8.8/10)',
  primary_improvement_area: 'Statistics (5.4/10)',
  progress_trend: [
    { interviewNumber: 1, role: 'Data Analyst', score: 61.0, date: '12 Sep' },
    { interviewNumber: 2, role: 'Data Analyst', score: 68.5, date: '18 Sep' },
    { interviewNumber: 3, role: 'Data Analyst', score: 74.0, date: '22 Sep' },
    { interviewNumber: 4, role: 'Data Analyst', score: 82.5, date: '28 Sep' },
  ],
  recent_interviews: [
    {
      interview_id: 'demo-int-001',
      role: 'Data Analyst',
      experience: 'Fresher',
      interview_type: 'mixed',
      status: 'COMPLETED',
      question_limit: 5,
      current_question_number: 5,
      readiness_score: 82.5,
      created_at: Date.now() / 1000 - 86400,
      completed_at: Date.now() / 1000 - 85000,
    },
    {
      interview_id: 'demo-int-002',
      role: 'Product Manager',
      experience: '2–5 years',
      interview_type: 'behavioral',
      status: 'COMPLETED',
      question_limit: 8,
      current_question_number: 8,
      readiness_score: 71.0,
      created_at: Date.now() / 1000 - 250000,
      completed_at: Date.now() / 1000 - 248000,
    }
  ],
};

// Scripted Hackathon Demo Flow questions matching Requirement 73
export const DEMO_QUESTIONS: Record<number, QuestionClient> = {
  1: {
    id: 'demo-q1',
    number: 1,
    question: 'How do you determine whether to use an INNER JOIN versus a LEFT OUTER JOIN when analyzing customer order retention?',
    skill: 'SQL',
    difficulty: 2,
    type: 'technical',
  },
  2: {
    id: 'demo-q2',
    number: 2,
    question: 'Suppose your query joining 50 million transaction rows is timing out. How would you diagnose the execution plan and optimize query performance?',
    skill: 'SQL',
    difficulty: 3,
    type: 'scenario',
  },
  3: {
    id: 'demo-q3',
    number: 3,
    question: 'What type of database index would you create for filtering on transaction timestamps and why?',
    skill: 'SQL',
    difficulty: 3,
    type: 'follow_up',
  },
  4: {
    id: 'demo-q4',
    number: 4,
    question: 'Your stakeholder claims a marketing experiment increased conversion by 12% with a p-value of 0.08 on a sample of 200 users. How do you evaluate and communicate the statistical validity of this finding?',
    skill: 'Statistics',
    difficulty: 2,
    type: 'technical',
  },
  5: {
    id: 'demo-q5',
    number: 5,
    question: 'Explain how you would compute a 95% confidence interval for average order value, and what business action you would recommend if the interval spans zero.',
    skill: 'Statistics',
    difficulty: 2,
    type: 'problem_solving',
  },
};

export const DEMO_REPORT: InterviewReportResponse = {
  interview_id: 'demo-int-001',
  role: 'Data Analyst',
  experience: 'Fresher',
  status: 'COMPLETED',
  readiness_score: 82.5,
  score_disclaimer: "This score reflects performance against this platform's interview rubric. It is not a hiring probability.",
  skill_profile: {
    'SQL': { current_score: 8.8, observations: 3 },
    'Python': { current_score: 7.5, observations: 2 },
    'Statistics': { current_score: 5.4, observations: 2 },
    'Data Visualization': { current_score: 7.2, observations: 1 },
    'Communication': { current_score: 6.8, observations: 4 },
    'Problem Solving': { current_score: 7.4, observations: 4 },
  },
  report: {
    executive_summary: "The candidate demonstrated strong foundational command of SQL syntax and query construction, articulating join mechanisms clearly. When escalated to high-volume query optimization and index trade-offs, they reasoned systematically. A moderate knowledge gap was observed in practical hypothesis testing and interpreting p-values.",
    strengths: [
      "Precise explanation of relational set algebra and row-level vs aggregate filtering.",
      "Clear articulation of execution plan diagnosis using EXPLAIN ANALYZE.",
      "Structured, conversational communication style suitable for business stakeholder meetings."
    ],
    key_development_areas: [
      "Rigorous interpretation of statistical hypothesis testing and sample power.",
      "Differentiating between statistical significance and practical business impact.",
      "Understanding index write-overhead trade-offs in high-write transactional schemas."
    ],
    competency_breakdown: {
      'SQL': {
        score: 8.8,
        feedback: "Exceptional mastery of relational joins and index mechanics. Answered advanced escalation smoothly."
      },
      'Statistics': {
        score: 5.4,
        feedback: "Basic definition recalled, but struggled with confidence intervals and sample size caveats."
      },
      'Problem Solving': {
        score: 7.4,
        feedback: "Methodical approach to root-cause debugging under database timeouts."
      },
      'Communication': {
        score: 6.8,
        feedback: "Direct and articulate, but could structure recommendations using clear executive takeaways."
      }
    },
    question_improvements: [
      {
        question_number: 1,
        example_improved_answer: "I choose an INNER JOIN when my analysis strictly requires matching records in both tables, such as calculating revenue from verified purchases. In contrast, I use a LEFT OUTER JOIN when preserving all rows from the primary dimension—like every registered customer—is critical, even if they have zero orders. This prevents attrition blindness by explicitly capturing non-transacting users with NULL order fields.",
        coaching_tip: "Highlighting the business impact (e.g. attrition blindness) elevates a purely syntactic answer into a senior analyst answer."
      },
      {
        question_number: 4,
        example_improved_answer: "At a p-value of 0.08 with a conventional alpha of 0.05, this experiment fails to reach standard statistical significance. Furthermore, a sample size of only 200 users makes the test underpowered, meaning high variance could easily create false positives. I would communicate to stakeholders that while the 12% lift is a promising directional signal, rolling it out across the entire user base poses an unacceptable risk without extending the test for additional power.",
        coaching_tip: "Always address both statistical power/sample size and practical commercial trade-offs."
      }
    ],
    personalized_improvement_plan: {
      top_3_priorities: [
        "Statistical hypothesis testing and p-value interpretation",
        "A/B testing sample size estimation and minimum detectable effect (MDE)",
        "B-Tree vs Hash index write-overhead trade-offs"
      ],
      study_topics: [
        "Type I vs Type II errors and statistical power",
        "SQL window functions (LEAD, LAG, NTILE) for cohort retention",
        "Executive presentation frameworks for analytical findings"
      ],
      practice_exercises: [
        "Write 5 complex queries using CTEs and window frames against a public e-commerce dataset.",
        "Calculate sample size requirements for a 5% baseline conversion rate using statistical calculators.",
        "Synthesize a mock executive memo evaluating an inconclusive A/B test."
      ],
      next_mock_focus: "Data Analyst - Statistics & Experimentation Deep Dive",
      seven_day_schedule: [
        { day: 1, topic: "SQL Aggregation & Set Operations", task: "Review HAVING vs WHERE and multi-table joins under edge cases." },
        { day: 2, topic: "Window Functions & Analytical Queries", task: "Practice running totals, moving averages, and retention cohorts." },
        { day: 3, topic: "Database Indexing & Query Plans", task: "Study B-tree vs composite index selection and EXPLAIN plan interpretation." },
        { day: 4, topic: "Statistical Foundations & Distributions", task: "Study normal distribution, standard error, and central limit theorem." },
        { day: 5, topic: "Hypothesis Testing & A/B Experiments", task: "Work through 5 case studies calculating p-values and confidence intervals." },
        { day: 6, topic: "Timed Mock Interview Simulation", task: "Complete a full 8-question timed adaptive interview on this platform." },
        { day: 7, topic: "Adaptive Re-test & Weakness Verification", task: "Use 'Practice Weak Areas' to verify mastery of Statistics." }
      ]
    }
  },
  questions_history: [
    {
      number: 1,
      skill: "SQL",
      difficulty: 2,
      question: "How do you determine whether to use an INNER JOIN versus a LEFT OUTER JOIN when analyzing customer order retention?",
      candidate_answer: "WHERE filters rows before any grouping occurs, while HAVING filters aggregated groups. For joins, INNER JOIN only keeps matching rows whereas LEFT JOIN keeps all left rows and fills NULLs if no right match.",
      evaluation: {
        technical_accuracy: 9.0,
        relevance: 9.5,
        completeness: 8.5,
        communication: 8.5,
        problem_solving: 8.5,
        overall_score: 8.9,
        strengths: ["Clear explanation of NULL handling in outer joins."],
        weaknesses: ["Could mention filtering performance differences."],
        missing_concepts: ["Retention cohort edge cases"],
        confidence: 0.95
      }
    },
    {
      number: 4,
      skill: "Statistics",
      difficulty: 2,
      question: "Your stakeholder claims a marketing experiment increased conversion by 12% with a p-value of 0.08 on a sample of 200 users. How do you evaluate and communicate the statistical validity of this finding?",
      candidate_answer: "The p-value is 0.08 which is pretty close to 0.05, so I think it's likely a true effect and we should probably roll it out.",
      evaluation: {
        technical_accuracy: 4.5,
        relevance: 7.0,
        completeness: 4.0,
        communication: 6.0,
        problem_solving: 4.0,
        overall_score: 5.0,
        strengths: ["Direct answer addressing the stakeholder prompt."],
        weaknesses: ["Conflated marginal p-value with statistical significance; neglected small sample size risk."],
        missing_concepts: ["Statistical power", "Sample size inadequacy", "Type I error rate"],
        confidence: 0.92
      }
    }
  ]
};
