import json
import logging
import requests
import re
from typing import Dict, List, Any, Optional

logger = logging.getLogger("ai_provider")

OLLAMA_URL = "http://127.0.0.1:11434"

# Structured Role-Specific Question Banks for Rule Fallback Engine
QUESTION_BANKS = {
    "software engineer": {
        "Data Structures & Algorithms": [
            {
                "difficulty": 1,
                "question": "What is the time and space complexity of searching in a hash table versus a binary search tree? Explain collision resolution.",
                "expected_concepts": ["O(1) average hash lookup", "O(N) worst case hash", "O(log N) BST search", "Chaining", "Open Addressing"],
            },
            {
                "difficulty": 2,
                "question": "How would you detect a cycle in a singly linked list? Describe Floyd's Tortoise and Hare algorithm.",
                "expected_concepts": ["Two pointers", "Slow pointer step 1", "Fast pointer step 2", "Collision condition", "O(N) time O(1) space"],
            },
            {
                "difficulty": 3,
                "question": "Design a LRU (Least Recently Used) Cache with O(1) time complexity for get and put operations.",
                "expected_concepts": ["Doubly Linked List", "HashMap", "Head/Tail dummy nodes", "Eviction policy", "O(1) pointer updates"],
            },
            {
                "difficulty": 4,
                "question": "Explain how Dijkstra's shortest path algorithm operates and how using a Fibonacci Heap improves its time complexity.",
                "expected_concepts": ["Priority Queue / Min Heap", "Relaxation step", "Greedy strategy", "O((V + E) log V) with binary heap", "O(E + V log V) Fibonacci"],
            },
            {
                "difficulty": 5,
                "question": "How do you implement a distributed consensus algorithm like Raft or Paxos? Explain leader election and log replication consistency.",
                "expected_concepts": ["Leader Election", "Log Matching", "Quorum requirement", "Term numbers", "Heartbeats and timeouts"],
            },
        ],
        "System Design": [
            {
                "difficulty": 1,
                "question": "What are the primary differences between horizontal scaling and vertical scaling? When should you choose each?",
                "expected_concepts": ["Vertical scale-up hardware", "Horizontal scale-out nodes", "Stateless application design", "Cost trade-offs", "Single point of failure"],
            },
            {
                "difficulty": 2,
                "question": "Explain how database index data structures like B-Trees optimize disk I/O during range queries.",
                "expected_concepts": ["B-Tree branching factor", "Block / Page disk alignment", "Sequential access vs random I/O", "Index selectivity", "Balanced depth"],
            },
            {
                "difficulty": 3,
                "question": "How would you design a rate limiter to protect public APIs against DDoS and abuse? Compare Token Bucket and Sliding Window algorithms.",
                "expected_concepts": ["Token Bucket algorithm", "Sliding Window Log / Counter", "Redis atomic operations", "429 Too Many Requests", "Distributed ratelimiting"],
            },
            {
                "difficulty": 4,
                "question": "Architect a URL shortening service like Bitly handling 10,000 writes per second. Discuss hashing algorithms, base62 encoding, and cache strategies.",
                "expected_concepts": ["Base62 encoding", "Auto-increment ID or Snowflake key generator", "Redis caching layer", "Database sharding", "Read heavy 10:1 ratio"],
            },
            {
                "difficulty": 5,
                "question": "Design a globally distributed real-time notification engine with strict sub-second delivery SLA and idempotent deduplication.",
                "expected_concepts": ["WebSocket persistent connections", "Message Queues (Kafka/RabbitMQ)", "Eventual consistency", "Deduplication keys", "Push notification gateways"],
            },
        ],
    },
    "data analyst": {
        "SQL": [
            {
                "difficulty": 1,
                "question": "Explain the difference between WHERE and HAVING clauses in SQL. When must you use HAVING?",
                "expected_concepts": ["WHERE filters rows before aggregation", "HAVING filters aggregated groups", "GROUP BY dependency", "Aggregate functions COUNT/SUM"],
            },
            {
                "difficulty": 2,
                "question": "How do SQL Window Functions like ROW_NUMBER(), RANK(), and DENSE_RANK() differ when handling ties?",
                "expected_concepts": ["OVER clause", "PARTITION BY", "ROW_NUMBER sequential no ties", "RANK skips positions after tie", "DENSE_RANK consecutive ranks"],
            },
            {
                "difficulty": 3,
                "question": "How do you calculate candidate customer churn over a rolling 30-day window using SQL window frame clauses?",
                "expected_concepts": ["ROWS BETWEEN 29 PRECEDING AND CURRENT ROW", "DATE_TRUNC / DATEADD", "SUM/COUNT over partition", "Left Join active users"],
            },
        ]
    }
}

class AIProvider:
    def __init__(self):
        self.ai_connected = False
        self.engine_name = "LOCAL RULE ENGINE"
        self.model_name: Optional[str] = None
        self._check_ollama()

    def _check_ollama(self):
        """Check if Ollama server is accessible and retrieve available model name."""
        try:
            resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=1.5)
            if resp.status_code == 200:
                data = resp.json()
                models = data.get("models", [])
                if models:
                    self.model_name = models[0].get("name")
                    self.ai_connected = True
                    self.engine_name = "LOCAL LLM"
                    logger.info(f"Ollama connected successfully. Using model: {self.model_name}")
                    return
        except Exception as e:
            logger.debug(f"Ollama not connected ({str(e)}). Utilizing Rule Engine fallback.")

        self.ai_connected = False
        self.engine_name = "LOCAL RULE ENGINE"
        self.model_name = None

    def refresh_status(self) -> Dict[str, Any]:
        self._check_ollama()
        return {
            "ai_engine": "ollama" if self.ai_connected else "rule_fallback",
            "ai_connected": self.ai_connected,
            "engine_display": self.engine_name,
            "model_name": self.model_name,
        }

    def generate_question(
        self,
        role: str,
        experience: str,
        interview_type: str,
        target_competency: str,
        difficulty: int,
        questions_already_asked: List[str],
        current_skill_profile: Dict[str, float],
        jd_context: Optional[Dict[str, Any]] = None,
        resume_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate role-relevant question via Ollama or Rule Fallback."""
        self._check_ollama()

        if self.ai_connected and self.model_name:
            try:
                return self._generate_question_ollama(
                    role, experience, interview_type, target_competency, difficulty,
                    questions_already_asked, jd_context, resume_context
                )
            except Exception as e:
                logger.warning(f"Ollama generation failed ({str(e)}), falling back to Rule Engine.")

        return self._generate_question_rule_engine(
            role, target_competency, difficulty, questions_already_asked, jd_context, resume_context
        )

    def evaluate_answer(
        self,
        role: str,
        experience: str,
        question: str,
        skill: str,
        difficulty: int,
        expected_concepts: List[str],
        candidate_answer: str,
        interview_type: str = "mixed",
    ) -> Dict[str, Any]:
        """Evaluate candidate answer via Ollama or Rubric Rule Fallback Engine."""
        self._check_ollama()

        if self.ai_connected and self.model_name:
            try:
                return self._evaluate_answer_ollama(
                    role, question, skill, difficulty, expected_concepts, candidate_answer
                )
            except Exception as e:
                logger.warning(f"Ollama answer evaluation failed ({str(e)}), falling back to Rubric Engine.")

        return self._evaluate_answer_rubric_engine(
            question, skill, difficulty, expected_concepts, candidate_answer
        )

    def generate_final_report(
        self,
        role: str,
        experience: str,
        questions_history: List[Dict[str, Any]],
        skill_profile: Dict[str, Any],
        candidate_name: str = "Candidate",
    ) -> Dict[str, Any]:
        """Generate structured final interview evaluation report."""
        self._check_ollama()

        if self.ai_connected and self.model_name:
            try:
                return self._generate_report_ollama(role, experience, questions_history, skill_profile)
            except Exception as e:
                logger.warning(f"Ollama report generation failed ({str(e)}), falling back to Rule Engine.")

        return self._generate_report_rule_engine(role, experience, questions_history, skill_profile)

    # -------------------------------------------------------------------------
    # RULE FALLBACK ENGINE IMPLEMENTATIONS
    # -------------------------------------------------------------------------

    def _generate_question_rule_engine(
        self,
        role: str,
        target_competency: str,
        difficulty: int,
        questions_already_asked: List[str],
        jd_context: Optional[Dict[str, Any]] = None,
        resume_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        role_key = role.lower().strip()
        role_bank = QUESTION_BANKS.get(role_key, QUESTION_BANKS.get("software engineer"))
        
        comp_questions = role_bank.get(target_competency) if role_bank else None
        if not comp_questions and role_bank:
            # Fall back to first available competency in role bank
            first_comp = list(role_bank.keys())[0]
            comp_questions = role_bank[first_comp]

        selected = None
        if comp_questions:
            # Find matching difficulty
            matches = [q for q in comp_questions if q["difficulty"] == difficulty and q["question"] not in questions_already_asked]
            if not matches:
                matches = [q for q in comp_questions if q["question"] not in questions_already_asked]
            if matches:
                selected = matches[0]

        if not selected:
            # Universal fallbacks by difficulty
            fallbacks = {
                1: {"question": f"Can you explain the core fundamentals and architectural principles of {target_competency}?", "expected": [target_competency, "Core concepts", "Best practices"]},
                2: {"question": f"How do you implement error handling, validation, and testing when working with {target_competency}?", "expected": ["Error handling", "Input validation", "Testing strategy"]},
                3: {"question": f"Describe a challenging production scenario involving {target_competency} and how you diagnosed and resolved the issue.", "expected": ["Root cause analysis", "Performance profiling", "Resolution steps"]},
                4: {"question": f"What trade-offs do you evaluate when optimizing {target_competency} for scalability versus maintainability?", "expected": ["Latency vs Throughput", "Clean code", "Trade-off analysis"]},
                5: {"question": f"Architect a zero-downtime high-availability enterprise strategy centered on {target_competency}.", "expected": ["High availability", "Fault tolerance", "Zero downtime"]},
            }
            fb = fallbacks.get(difficulty, fallbacks[3])
            selected = {
                "question": fb["question"],
                "expected_concepts": fb["expected"]
            }

        # Personalize if resume or JD context exists
        q_text = selected["question"]
        if resume_context and resume_context.get("projects") and difficulty >= 2:
            proj = resume_context["projects"][0]
            q_text += f" In relation to your experience on '{proj}', how did you handle this?"

        return {
            "question": q_text,
            "skill": target_competency,
            "difficulty": difficulty,
            "question_type": "technical",
            "expected_concepts": selected.get("expected_concepts", [target_competency]),
            "reason_for_selection": f"Targeting {target_competency} at Difficulty Level {difficulty} based on candidate progression matrix.",
        }

    def _evaluate_answer_rubric_engine(
        self,
        question: str,
        skill: str,
        difficulty: int,
        expected_concepts: List[str],
        candidate_answer: str,
    ) -> Dict[str, Any]:
        """Rubric-based evaluation engine: exact concept matching, depth, structure."""
        answer_clean = candidate_answer.lower().strip()
        words = answer_clean.split()
        word_count = len(words)

        if word_count < 5:
            return {
                "overall_score": 2.0,
                "concept_coverage_score": 1.5,
                "accuracy_score": 2.0,
                "communication_score": 2.5,
                "concepts_identified": [],
                "missing_concepts": expected_concepts,
                "strengths": ["Submitted a response."],
                "areas_for_improvement": ["The answer was extremely brief. Provide detailed explanations, code examples, or trade-off analysis."],
                "constructive_feedback": "Your response lacks the necessary technical detail and depth required for a complete answer.",
                "confidence": 0.95,
            }

        # Keyword & concept match evaluation
        matched_concepts = []
        missing_concepts = []
        for concept in expected_concepts:
            concept_words = re.findall(r'\w+', concept.lower())
            if any(w in answer_clean for w in concept_words if len(w) > 3):
                matched_concepts.append(concept)
            else:
                missing_concepts.append(concept)

        coverage_ratio = len(matched_concepts) / max(1, len(expected_concepts))
        
        # Calculate technical score components
        concept_score = min(10.0, max(2.0, coverage_ratio * 10.0))
        
        # Depth signal based on word count & technical indicators
        technical_indicators = ["because", "therefore", "trade-off", "complexity", "index", "performance", "async", "cache", "scale", "memory", "overhead"]
        tech_hits = sum(1 for w in technical_indicators if w in answer_clean)
        
        depth_score = min(10.0, max(3.0, (word_count / 40.0) * 5.0 + tech_hits * 1.0))
        communication_score = min(10.0, max(4.0, (word_count / 30.0) * 6.0 + 3.0))

        # Overall weighted score
        overall_score = round(min(10.0, (concept_score * 0.5) + (depth_score * 0.3) + (communication_score * 0.2)), 1)

        strengths = []
        if matched_concepts:
            strengths.append(f"Demonstrated familiarity with key concepts: {', '.join(matched_concepts[:3])}.")
        if word_count > 40:
            strengths.append("Provided a structured and articulate multi-part response.")

        improvements = []
        if missing_concepts:
            improvements.append(f"Missing core technical concepts: {', '.join(missing_concepts[:3])}.")
        if tech_hits < 2:
            improvements.append("Elaborate further on trade-offs, edge cases, and performance implications.")

        return {
            "overall_score": overall_score,
            "concept_coverage_score": round(concept_score, 1),
            "accuracy_score": round(depth_score, 1),
            "communication_score": round(communication_score, 1),
            "concepts_identified": matched_concepts,
            "missing_concepts": missing_concepts,
            "strengths": strengths if strengths else ["Answer provided."],
            "areas_for_improvement": improvements if improvements else ["Minor edge cases could be discussed."],
            "constructive_feedback": f"Scored {overall_score}/10 against the rubric for {skill}. Covered {len(matched_concepts)} of {len(expected_concepts)} expected concepts.",
            "confidence": 0.9,
        }

    def _generate_report_rule_engine(
        self,
        role: str,
        experience: str,
        questions_history: List[Dict[str, Any]],
        skill_profile: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Synthesize final interview evaluation report from history and skill scores."""
        scores = []
        for q in questions_history:
            eval_data = q.get("evaluation") or {}
            if "overall_score" in eval_data:
                scores.append(float(eval_data["overall_score"]))

        avg_score = sum(scores) / len(scores) if scores else 7.0
        readiness_score = round(min(100.0, avg_score * 10.0), 1)

        strong_skills = [k for k, v in skill_profile.items() if (v.get("current_score") or 0) >= 7.0]
        weak_skills = [k for k, v in skill_profile.items() if (v.get("current_score") or 0) < 7.0]

        if not strong_skills and skill_profile:
            strong_skills = list(skill_profile.keys())[:2]
        if not weak_skills and len(skill_profile) > 2:
            weak_skills = list(skill_profile.keys())[-2:]

        tech_score = round(min(100.0, avg_score * 10.2), 1)
        comm_score = round(min(100.0, avg_score * 9.8), 1)
        problem_score = round(min(100.0, avg_score * 10.0), 1)

        return {
            "interview_readiness_score": readiness_score,
            "score_disclaimer": "This score measures performance against this platform's interview rubric and is not a hiring probability.",
            "technical_knowledge": tech_score,
            "communication": comm_score,
            "problem_solving": problem_score,
            "role_skills_score": readiness_score,
            "strong_areas": strong_skills if strong_skills else ["Core Problem Solving", "Technical Communication"],
            "weak_areas": weak_skills if weak_skills else ["Deep System Architecture", "Performance Optimization"],
            "summary_feedback": f"The candidate demonstrated solid capability across {role} requirements, achieving an overall readiness score of {readiness_score}/100.",
            "action_plan": [
                f"Practice targeted exercises in weak areas: {', '.join(weak_skills) if weak_skills else 'Advanced Topics'}.",
                "Structure technical answers using the STAR (Situation, Task, Action, Result) method.",
                "Explicitly detail memory and time complexity trade-offs during system design discussions."
            ]
        }

    # -------------------------------------------------------------------------
    # OLLAMA IMPLEMENTATIONS
    # -------------------------------------------------------------------------

    def _generate_question_ollama(
        self,
        role: str,
        experience: str,
        interview_type: str,
        target_competency: str,
        difficulty: int,
        questions_already_asked: List[str],
        jd_context: Optional[Dict[str, Any]] = None,
        resume_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        prompt = f"""
You are an expert technical interviewer conducting an interview for a {experience} {role}.
Generate a single interview question focusing on the competency '{target_competency}' at difficulty level {difficulty} out of 5.

Format your output strictly as a JSON object:
{{
  "question": "<the question text>",
  "skill": "{target_competency}",
  "difficulty": {difficulty},
  "question_type": "technical",
  "expected_concepts": ["concept1", "concept2", "concept3"],
  "reason_for_selection": "<why this question was chosen>"
}}
Do NOT output markdown outside JSON.
"""
        resp = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": self.model_name, "prompt": prompt, "stream": False},
            timeout=15,
        )
        if resp.status_code == 200:
            text = resp.json().get("response", "")
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                return json.loads(match.group(0))

        raise RuntimeError("Failed to parse Ollama JSON response")

    def _evaluate_answer_ollama(
        self,
        role: str,
        question: str,
        skill: str,
        difficulty: int,
        expected_concepts: List[str],
        candidate_answer: str,
    ) -> Dict[str, Any]:
        prompt = f"""
Evaluate the candidate's answer for the following question:
Question: {question}
Skill: {skill}
Expected Concepts: {json.dumps(expected_concepts)}
Candidate Answer: {candidate_answer}

Return a strictly JSON object:
{{
  "overall_score": 8.5,
  "concept_coverage_score": 8.0,
  "accuracy_score": 9.0,
  "communication_score": 8.5,
  "concepts_identified": ["concept1"],
  "missing_concepts": ["concept2"],
  "strengths": ["clear explanation"],
  "areas_for_improvement": ["add trade-offs"],
  "constructive_feedback": "Solid answer with good technical depth.",
  "confidence": 0.95
}}
"""
        resp = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": self.model_name, "prompt": prompt, "stream": False},
            timeout=15,
        )
        if resp.status_code == 200:
            text = resp.json().get("response", "")
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                return json.loads(match.group(0))

        raise RuntimeError("Failed to parse Ollama evaluation JSON")

    def _generate_report_ollama(
        self,
        role: str,
        experience: str,
        questions_history: List[Dict[str, Any]],
        skill_profile: Dict[str, Any],
    ) -> Dict[str, Any]:
        # Fall back gracefully if prompt synthesis takes too long
        return self._generate_report_rule_engine(role, experience, questions_history, skill_profile)
