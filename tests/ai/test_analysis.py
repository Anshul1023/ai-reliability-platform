import pytest
from app.ai.analysis import analyze_incident
@pytest.mark.asyncio
async def test_analysis_returns_evidence():
    result=await analyze_incident(1)
    assert result["confidence"] > 0
    assert result["evidence"]
