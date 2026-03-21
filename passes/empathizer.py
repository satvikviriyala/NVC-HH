"""
Pass 2: Empathizer
Extracts feelings, needs, and emotional data.
Uses: feelings_ontology, needs_ontology, pseudo_feelings_lexicon
"""

from typing import Dict, Any
from passes.base import BaseLLMPass


class EmpathizerPass(BaseLLMPass):
    PASS_NAME = "empathizer"
    OUTPUT_FIELDS = [
        "ofnr.feeling",
        "ofnr.need",
        "ofnr.explicit_need",
        "ofnr.implicit_need",
        "ofnr.pseudo_feelings_detected",
        "metadata.emotion_arousal_hint",
        "metadata.emotion_valence_hint"
    ]
    PROMPT_FILE = "pass_empathizer.txt"
    REQUIRED_ONTOLOGIES = ["feelings_ontology", "needs_ontology", "pseudo_feelings_lexicon"]
    
    def _default_system_prompt(self) -> str:
        return """You are an NVC Empathizer. Identify feelings and needs.
Use ONLY canonical tokens from the ontologies provided.
Translate pseudo-feelings to true feelings.
Output JSON: {"feeling": [...], "need": [...], ...}"""
    
    def build_user_prompt(self, row: Dict[str, Any]) -> str:
        ofnr = row.get("ofnr", {})
        
        prompt = row.get("prompt", "")
        observation = ofnr.get("observation", "")
        
        return f"""Based on the observation, identify feelings and needs.

OBSERVATION (from Pass 1):
{observation}

ORIGINAL USER TURN:
{prompt}

Identify: feelings (canonical only), universal needs (canonical only), explicit/implicit wants, pseudo-feelings (translate them), arousal/valence."""
    
    def parse_response(self, response: str) -> Dict[str, Any]:
        data = self._extract_json(response)
        return {
            "ofnr.feeling": data.get("feeling", data.get("feelings", [])),
            "ofnr.need": data.get("need", []),
            "ofnr.explicit_need": data.get("explicit_need", data.get("explicit_needs", [])),
            "ofnr.implicit_need": data.get("implicit_need", data.get("implicit_needs", [])),
            "ofnr.pseudo_feelings_detected": data.get("pseudo_feelings_detected", []),
            "metadata.emotion_arousal_hint": data.get("emotion_arousal_hint"),
            "metadata.emotion_valence_hint": data.get("emotion_valence_hint")
        }
