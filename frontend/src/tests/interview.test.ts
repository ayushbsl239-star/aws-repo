import { describe, it, expect } from 'vitest';
import { DEMO_REPORT, DEMO_QUESTIONS, DEMO_DASHBOARD } from '../services/demoData';

describe('AI Adaptive Interview Coach - Core Logic & Data Contracts', () => {
  it('validates demo report readiness score range and non-hiring disclaimer', () => {
    expect(DEMO_REPORT.readiness_score).toBeGreaterThanOrEqual(0);
    expect(DEMO_REPORT.readiness_score).toBeLessThanOrEqual(100);
    expect(DEMO_REPORT.score_disclaimer).toContain('not a hiring probability');
  });

  it('validates all interview questions adhere to difficulty bounds [1, 5]', () => {
    Object.values(DEMO_QUESTIONS).forEach((q) => {
      expect(q.difficulty).toBeGreaterThanOrEqual(1);
      expect(q.difficulty).toBeLessThanOrEqual(5);
      expect(q.question.length).toBeGreaterThan(10);
      expect(q.skill).toBeDefined();
    });
  });

  it('validates 7-day personalized improvement plan covers all 7 days with concrete tasks', () => {
    const schedule = DEMO_REPORT.report.personalized_improvement_plan.seven_day_schedule;
    expect(schedule).toHaveLength(7);
    schedule.forEach((item, index) => {
      expect(item.day).toBe(index + 1);
      expect(item.topic).toBeDefined();
      expect(item.task.length).toBeGreaterThan(10);
    });
  });

  it('validates question-by-question breakdown contains example improved answers and rubrics', () => {
    expect(DEMO_REPORT.report.question_improvements.length).toBeGreaterThan(0);
    DEMO_REPORT.report.question_improvements.forEach((imp) => {
      expect(imp.example_improved_answer).toBeDefined();
      expect(imp.coaching_tip).toBeDefined();
    });
  });

  it('validates dashboard summary aggregates completed interviews accurately', () => {
    expect(DEMO_DASHBOARD.total_interviews_completed).toBe(4);
    expect(DEMO_DASHBOARD.average_readiness_score).toBe(76.5);
    expect(DEMO_DASHBOARD.progress_trend.length).toBe(4);
  });
});
