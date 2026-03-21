"""
Pass 4: Critic
Evaluates safety and quality.
Uses: All ontologies for validation
"""

from typing import Dict, Any
from passes.base import BaseLLMPass


class CriticPass(BaseLLMPass):
    PASS_NAME = "critic"
    OUTPUT_FIELDS = [
        "safety.label",
        "safety.reason",
        "quality.observation_is_nonjudgmental",
        "quality.needs_list_match",
        "quality.overall_confidence",
        "flags.error_flags",
        "flags.warnings",
        "metadata.somatic_markers"
    ]
    PROMPT_FILE = "pass_critic.txt"
    REQUIRED_ONTOLOGIES = [
        "feelings_ontology",
        "needs_ontology",
        "pseudo_feelings_lexicon",
        "judgment_markers_ontology",
        "somatic_markers_ontology",
        "request_quality_ontology",
        "plato_strategy_filter"
    ]
    
    def _default_system_prompt(self) -> str:
        return """You are an NVC Critic. Evaluate safety and quality.
Check if annotation follows ontology constraints.
Score each quality metric 1-5.
Output JSON: {"safety": {...}, "quality": {...}, "flags": {...}}"""
    
    def build_user_prompt(self, row: Dict[str, Any]) -> str:
        ofnr = row.get("ofnr", {})
        
        prompt = row.get("prompt", "")
        chosen = row.get("human_chosen_response") or ""
        rejected = row.get("human_rejected_response") or ""
        
        return f"""Evaluate this OFNR annotation for safety and quality.

ORIGINAL INPUT:
Prompt: {prompt}
Chosen: {chosen[:500] if chosen else 'N/A'}
Rejected: {rejected[:500] if rejected else 'N/A'}

OFNR ANNOTATION:
Observation: {ofnr.get('observation', "")}
Feelings: {ofnr.get('feeling', [])}
Needs: {ofnr.get('need', [])}
Explicit Request: {ofnr.get('explicit_request', [])}
Implicit Request: {ofnr.get('implicit_request', [])}
Pseudo-feelings detected: {ofnr.get('pseudo_feelings_detected', [])}

Evaluate: safety label, quality scores (1-5), flags. Check against ontologies."""
    
    def parse_response(self, response: str) -> Dict[str, Any]:
        data = self._extract_json(response)
        
        safety = data.get("safety", {})
        quality = data.get("quality", {})
        flags = data.get("flags", {})
        
        return {
            "safety.label": safety.get("label"),
            "safety.reason": safety.get("reason"),
            "quality.observation_is_nonjudgmental": quality.get("observation_is_nonjudgmental"),
            "quality.needs_list_match": quality.get("needs_list_match"),
            "quality.overall_confidence": quality.get("overall_confidence"),
            "flags.error_flags": flags.get("error_flags", []),
            "flags.warnings": flags.get("warnings", []),
            "metadata.somatic_markers": data.get("somatic_markers", [])
        }
