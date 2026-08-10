from app.ai.rag.retriever import retrieve_evidence
from app.ai.tools.metrics_tool import get_metrics
from app.ai.tools.github_tool import get_recent_changes
from app.ai.prompts.incident_prompt import build_prompt

async def analyze_incident(incident_id:int):
    evidence=retrieve_evidence(incident_id)
    metrics=get_metrics(incident_id)
    changes=await get_recent_changes()
    prompt=build_prompt(incident_id,evidence,metrics,changes)
    return {
        "incident_id":incident_id,
        "confidence":87,
        "root_cause":"A recent deployment likely changed database connection settings.",
        "evidence":evidence+changes,
        "recommendation":"Review deployment changes and validate the connection-pool configuration.",
        "prompt_preview":prompt[:500],
        "provider":"demo"
    }
