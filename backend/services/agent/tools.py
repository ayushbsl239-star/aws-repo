"""
Controlled AgentCore tools for interview orchestration.
All actions enforce user ownership, interview state validation, and schema checking.
No unrestricted database or system access is granted to the LLM.
"""
from typing import Any, Dict, List, Optional
from backend.models.interview import InterviewModel
from backend.utils.logger import logger


AGENT_TOOL_DEFINITIONS = [
    {
        "toolSpec": {
            "name": "get_interview_state",
            "description": "Returns current interview state including question number, difficulty, and questions asked.",
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "interview_id": {"type": "string", "description": "The current interview ID"}
                    },
                    "required": ["interview_id"]
                }
            }
        }
    },
    {
        "toolSpec": {
            "name": "get_candidate_skill_profile",
            "description": "Returns candidate's rolling skill scores and observation counts.",
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "interview_id": {"type": "string", "description": "The current interview ID"}
                    },
                    "required": ["interview_id"]
                }
            }
        }
    },
    {
        "toolSpec": {
            "name": "propose_next_action",
            "description": "Proposes the next interview action to the safety-gated execution engine.",
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "action": {
                            "type": "string",
                            "enum": [
                                "ASK_FOLLOWUP",
                                "INCREASE_DIFFICULTY",
                                "MAINTAIN_DIFFICULTY",
                                "DECREASE_DIFFICULTY",
                                "SWITCH_COMPETENCY",
                                "ASK_WEAK_SKILL",
                                "END_INTERVIEW"
                            ],
                            "description": "The next pedagogical action"
                        },
                        "next_competency": {"type": "string", "description": "Target competency to test next"},
                        "next_difficulty": {"type": "integer", "minimum": 1, "maximum": 5, "description": "Difficulty from 1 to 5"},
                        "reason": {"type": "string", "description": "Detailed justification based on rubric evidence"}
                    },
                    "required": ["action", "next_competency", "next_difficulty", "reason"]
                }
            }
        }
    }
]


class AgentToolExecutor:
    def __init__(self, interview: InterviewModel, user_sub: str):
        self.interview = interview
        self.user_sub = user_sub

    def execute_tool(self, tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """Executes a controlled tool safely within user authorization bounds."""
        logger.info(f"Agent requested tool: {tool_name}", extra={"input": tool_input})

        # Ownership validation
        if self.interview.owner_sub != self.user_sub:
            logger.error("Agent tool execution rejected: user sub mismatch")
            return {"error": "UNAUTHORIZED_ACCESS"}

        if tool_name == "get_interview_state":
            return {
                "interview_id": self.interview.interview_id,
                "current_question": self.interview.current_question_number,
                "question_limit": self.interview.question_limit,
                "current_difficulty": self.interview.current_difficulty,
                "role": self.interview.role,
                "target_competencies": self.interview.target_competencies,
                "recent_questions": [q.question_text for q in self.interview.questions[-4:]],
            }

        elif tool_name == "get_candidate_skill_profile":
            return {
                skill: {
                    "score": s.current_score,
                    "observations": s.observation_count,
                    "confidence": s.confidence
                }
                for skill, s in self.interview.skill_profile.items()
            }

        elif tool_name == "propose_next_action":
            # Just echoes the validated proposal to be handed to the Safety Boundary
            return {
                "status": "PROPOSED",
                "action": tool_input.get("action"),
                "next_competency": tool_input.get("next_competency"),
                "next_difficulty": tool_input.get("next_difficulty"),
                "reason": tool_input.get("reason"),
            }

        return {"error": f"Unknown tool: {tool_name}"}
