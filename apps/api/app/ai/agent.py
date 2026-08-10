from app.ai.analysis import analyze_incident

class IncidentAgent:
    async def analyze(self, incident_id:int):
        return await analyze_incident(incident_id)
