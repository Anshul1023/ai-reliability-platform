def build_prompt(incident_id,evidence,metrics,changes):
    return f"""
Investigate incident {incident_id}.
Metrics: {metrics}
Evidence: {evidence}
Recent changes: {changes}
Return likely root cause, confidence, evidence and a reversible recommendation.
Never invent evidence that is not supplied.
""".strip()
