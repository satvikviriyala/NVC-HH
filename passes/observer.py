"""
Pass 1: Observer
Extracts objective observations and detected evaluations.
Uses: judgment_markers_ontology
"""

from typing import Dict, Any
from passes.base import BaseLLMPass


class ObserverPass(BaseLLMPass):
    PASS_NAME = "observer"
    OUTPUT_FIELDS = [
        "ofnr.observation"
    ]
    PROMPT_FILE = "pass_observer.txt"
    REQUIRED_ONTOLOGIES = ["judgment_markers_ontology"]
    
    def _default_system_prompt(self) -> str:
        return """You are an NVC Observer. Extract objective observations only.
Apply the Camera Test: only facts a video camera could record.
Output JSON: {"observation": "..."}"""
    
    def build_user_prompt(self, row: Dict[str, Any]) -> str:
        prompt = row.get("prompt", "")
        context = row.get("context", "")
        chosen = row.get("human_chosen_response")
        rejected = row.get("human_rejected_response")
        
        return f"""Analyze this conversation and extract a single objective observation string.

CONTEXT:
{context[:1500] if context else "(none)"}

LAST USER TURN:
{prompt}

CHOSEN ASSISTANT RESPONSE:
{chosen[:2000] if chosen else "(none)"}

REJECTED ASSISTANT RESPONSE (Negative Example):
{rejected[:2000] if rejected else "(none)"}

Extract: A single objective observation string summarizing the interaction (camera-test). The rejected response is a negative example of assistant behavior; focus your observation on the factual turns and the chosen path."""
    
    def parse_response(self, response: str) -> Dict[str, Any]:
        data = self._extract_json(response)
        
        obs = data.get("observation", "")
        if isinstance(obs, list):
            obs = " ".join(obs)
            
        return {
            "ofnr.observation": obs
        }
