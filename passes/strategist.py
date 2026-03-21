"""
Pass 3: Strategist
Generates constructive requests.
Uses: plato_strategy_filter, request_quality_ontology
"""

from typing import Dict, Any
from passes.base import BaseLLMPass


class StrategistPass(BaseLLMPass):
    PASS_NAME = "strategist"
    OUTPUT_FIELDS = [
        "ofnr.explicit_request",
        "ofnr.implicit_request",
        "ofnr.implicit_intent"
    ]
    PROMPT_FILE = "pass_strategist.txt"
    REQUIRED_ONTOLOGIES = ["plato_strategy_filter", "request_quality_ontology"]
    
    def _default_system_prompt(self) -> str:
        return """You are an NVC Strategist. Formulate constructive requests.
Apply PLATO test to detect strategies.
Convert demands to positive requests.
Output JSON: {"explicit_request": [...], "implicit_request": [...], ...}"""
    
    def build_user_prompt(self, row: Dict[str, Any]) -> str:
        ofnr = row.get("ofnr", {})
        
        prompt = row.get("prompt", "")
        observation = ofnr.get("observation", "")
        feeling = ofnr.get("feeling", [])
        needs = ofnr.get("need", [])
        explicit_need = ofnr.get("explicit_need", [])
        implicit_need = ofnr.get("implicit_need", [])
        
        return f"""Based on the analysis, formulate requests/action plans for the Assistant.

OBSERVATION: {observation}
FEELINGS: {feeling}
NEEDS (universal): {needs}
EXPLICIT WANTS (explicit_need): {explicit_need}
IMPLICIT WANTS (implicit_need): {implicit_need}

ORIGINAL USER TURN:
{prompt}

Generate: explicit_request (list), implicit_request (list), implicit_intent (string)."""
    
    def parse_response(self, response: str) -> Dict[str, Any]:
        data = self._extract_json(response)
        
        exp_req = data.get("explicit_request", [])
        if isinstance(exp_req, str):
            exp_req = [exp_req]
            
        imp_req = data.get("implicit_request", [])
        if isinstance(imp_req, str):
            imp_req = [imp_req]
            
        return {
            "ofnr.explicit_request": exp_req,
            "ofnr.implicit_request": imp_req,
            "ofnr.implicit_intent": data.get("implicit_intent", "")
        }
