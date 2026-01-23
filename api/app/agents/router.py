from typing import Any


BUDDY_TRIGGERS = ["пропал", "устал", "стыдно", "нет времени", "выгораю"]
PLANNER_TRIGGERS = ["план", "расписание", "что дальше"]
TUTOR_WHY_TRIGGERS = ["почему", "объясни", "зачем"]


def select_agent(message: str, fsm_state: str, context: dict[str, Any] | None, risk_level: str) -> tuple[str, dict[str, Any]]:
    ctx = context.copy() if context else {}
    lowered = message.lower()

    if risk_level == "high":
        return "BuddyAgent", {"blocked": True}

    if any(trigger in lowered for trigger in BUDDY_TRIGGERS):
        return "BuddyAgent", ctx

    if any(trigger in lowered for trigger in PLANNER_TRIGGERS):
        return "PlannerAgent", ctx

    if any(trigger in lowered for trigger in TUTOR_WHY_TRIGGERS):
        ctx["rationale_mode"] = True
        return "TutorAgent", ctx

    if "diagnostic" in fsm_state or (context and context.get("mode") == "diagnostic"):
        return "AssessorAgent", ctx

    return "TutorAgent", ctx
