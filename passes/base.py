"""
Base class for all LLM passes with dynamic ontology injection using GCP Vertex AI.

Paths are resolved relative to the project structure:
- NVC_Contructive/ (project root)
  - passes/
  - prompts/
  - scripts/
- ontologies/ (sibling to project)
"""

import json
import os
import re
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from pathlib import Path
import asyncio
from tqdm.asyncio import tqdm
from google import genai
from google.genai.types import (
    GenerateContentConfig,
    HttpOptions,
    HarmCategory,
    HarmBlockThreshold
)

# Resolve paths relative to this file's location
_THIS_FILE = Path(__file__).resolve()
_PASSES_DIR = _THIS_FILE.parent  # NVC_Contructive/passes/
_PROJECT_ROOT = _PASSES_DIR.parent  # NVC_Contructive/
_DATA_GEN_ROOT = _PROJECT_ROOT.parent  # Data Gen/

# Default paths
DEFAULT_PROMPTS_DIR = _PROJECT_ROOT / "prompts"
DEFAULT_ONTOLOGIES_DIR = _DATA_GEN_ROOT / "ontologies"

PROJECT_ID = "gcp-learn-483706"

class BaseLLMPass(ABC):
    """Base class for all pipeline passes."""
    
    # Subclasses MUST override these
    PASS_NAME: str = "base"
    OUTPUT_FIELDS: List[str] = []
    PROMPT_FILE: str = ""
    REQUIRED_ONTOLOGIES: List[str] = []  # e.g., ["feelings_ontology", "needs_ontology"]
    
    def __init__(
        self,
        model_id: str,
        location: str = "global",
        temperature: float = 0.2,
        max_tokens: int = 8192,
        prompts_dir: Optional[str] = None,
        ontologies_dir: Optional[str] = None,
        folder_prompt_file: Optional[str] = None,
        max_concurrent: int = 5
    ):
        self.model_id = model_id
        self.location = location
        self.temperature = temperature
        self.max_tokens = max_tokens
        # Use default paths if not specified
        self.prompts_dir = Path(prompts_dir) if prompts_dir else DEFAULT_PROMPTS_DIR
        self.ontologies_dir = Path(ontologies_dir) if ontologies_dir else DEFAULT_ONTOLOGIES_DIR
        self.folder_prompt_file = folder_prompt_file
        self.max_concurrent = max_concurrent
        self._system_prompt: Optional[str] = None
        self._ontologies: Dict[str, Any] = {}
        
        # Log paths for debugging
        print(f"[{self.PASS_NAME}] Prompts dir: {self.prompts_dir}")
        print(f"[{self.PASS_NAME}] Ontologies dir: {self.ontologies_dir}")
        if self.folder_prompt_file:
            print(f"[{self.PASS_NAME}] Folder prompt: {self.folder_prompt_file}")
    
    def load_ontologies(self) -> Dict[str, Any]:
        """Load required ontology JSON files."""
        if self._ontologies:
            return self._ontologies
        
        for ontology_name in self.REQUIRED_ONTOLOGIES:
            filepath = os.path.join(self.ontologies_dir, f"{ontology_name}.json")
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    self._ontologies[ontology_name] = json.load(f)
            else:
                print(f"Warning: Ontology not found: {filepath}")
        
        return self._ontologies
    
    def _build_ontology_section(self) -> str:
        """Build the ontology injection section for the prompt."""
        ontologies = self.load_ontologies()
        if not ontologies:
            return ""
        
        sections = ["== ONTOLOGIES (REFERENCE DATA - USE THESE TOKENS ONLY) ==\n"]
        
        for name, data in ontologies.items():
            # Extract the most relevant parts for the model
            section = f"\n### {name.upper().replace('_', ' ')}\n"
            section += json.dumps(self._extract_relevant_data(name, data), indent=2, ensure_ascii=False)
            sections.append(section)
        
        return "\n".join(sections)
    
    def _extract_relevant_data(self, name: str, data: dict) -> dict:
        """Extract the most relevant data from ontology for prompt injection."""
        if name == "feelings_ontology":
            return {
                "canonical_feelings": data.get("canonical_feelings_flat_list", []),
                "normalization_map": data.get("normalization_map", {}),
                "explicit_exclusion": data.get("explicit_exclusion", {}).get("disallowed_tokens", [])
            }
        elif name == "needs_ontology":
            # Flatten needs from taxonomy
            all_needs = []
            for category in data.get("taxonomy", []):
                for need in category.get("needs", []):
                    all_needs.append({
                        "id": need.get("id"),
                        "aliases": need.get("aliases", []),
                        "anti_examples": need.get("anti_examples", [])
                    })
            return {"canonical_needs": all_needs}
        elif name == "pseudo_feelings_lexicon":
            return {
                "forbidden_as_feelings": data.get("forbidden_as_feelings", {}).get("tokens", []),
                "clusters": [{
                    "cluster_id": c.get("cluster_id"),
                    "entries": [{
                        "token": e.get("token"),
                        "true_feelings_candidates": e.get("true_feelings_candidates"),
                        "likely_needs": e.get("likely_needs"),
                        "template": e.get("ofnr_translation_template")
                    } for e in c.get("entries", [])]
                } for c in data.get("clusters", [])]
            }
        elif name == "judgment_markers_ontology":
            return {
                "clusters": [{
                    "label": c.get("label"),
                    "tokens": c.get("tokens", c.get("markers", []))
                } for c in data.get("clusters", [])],
                "regex_patterns": data.get("regex_patterns", [])
            }
        elif name == "plato_strategy_filter":
            return data  # Include full PLATO filter
        elif name == "request_quality_ontology":
            return data  # Include full request quality rules
        else:
            return data
    
    @property
    def system_prompt(self) -> str:
        """Load system prompt from file and inject ontologies."""
        if self._system_prompt is None:
            base_prompt = ""
            
            # 1. Load Global System Instructions (as reference)
            sys_instr_path = os.path.join(self.prompts_dir, "system_instructions.txt")
            if os.path.exists(sys_instr_path):
                with open(sys_instr_path, 'r') as f:
                    base_prompt += "== GLOBAL SYSTEM INSTRUCTIONS (REFERENCE) ==\n" + f.read() + "\n\n"
            
            # 2. Load Folder-Specific Context
            if self.folder_prompt_file:
                folder_prompt_path = os.path.join(self.prompts_dir, "Folder_Prompts", self.folder_prompt_file)
                if os.path.exists(folder_prompt_path):
                    with open(folder_prompt_path, 'r') as f:
                        base_prompt += "== FOLDER CONTEXT ==\n" + f.read() + "\n\n"
            
            # 3. Load Pass-Specific Role & Rules (The core mission)
            prompt_path = os.path.join(self.prompts_dir, self.PROMPT_FILE)
            if os.path.exists(prompt_path):
                with open(prompt_path, 'r') as f:
                    base_prompt += "== YOUR SPECIFIC ROLE FOR THIS TASK (PRIORITY) ==\n" + f.read()
            else:
                base_prompt += self._default_system_prompt()
            
            # 5. Strict Output Formatting Reminder
            base_prompt += "\n\nCRITICAL: You are currently performing only ONE step of a multi-pass pipeline. Even if the global instructions mention other fields, you MUST ONLY output the JSON keys specified in YOUR SPECIFIC ROLE section above. Do not output the full schema."
            
            # 4. Inject Ontologies
            ontology_section = self._build_ontology_section()
            self._system_prompt = base_prompt + "\n\n" + ontology_section
        
        return self._system_prompt
    
    @abstractmethod
    def _default_system_prompt(self) -> str:
        """Fallback system prompt if file not found."""
        pass
    
    @abstractmethod
    def build_user_prompt(self, row: Dict[str, Any]) -> str:
        """Build the user message from the row data."""
        pass
    
    @abstractmethod
    def parse_response(self, response: str) -> Dict[str, Any]:
        """Parse LLM response into structured data."""
        pass
    
    def apply_to_row(self, row: Dict[str, Any], parsed: Dict[str, Any]) -> Dict[str, Any]:
        """Apply parsed output to row, respecting field ownership."""
        for field_path in self.OUTPUT_FIELDS:
            value = parsed.get(field_path)
            if value is not None:
                self._set_nested(row, field_path, value)
        return row
    
    def _get_nested(self, obj: Dict, path: str) -> Any:
        """Get value from nested dict using dot notation."""
        keys = path.split('.')
        for key in keys:
            if obj is None:
                return None
            if key in obj:
                obj = obj[key]
            else:
                return None
        return obj
    
    def _set_nested(self, obj: Dict, path: str, value: Any):
        """Set value in nested dict using dot notation."""
        keys = path.split('.')
        for key in keys[:-1]:
            if key not in obj:
                obj[key] = {}
            obj = obj[key]
        obj[keys[-1]] = value
    
    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract JSON from LLM response."""
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        
        text = text.strip()
        if text.startswith('{'):
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                pass
        
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end+1])
            except json.JSONDecodeError:
                pass
        
        return {}
    
    async def _call_llm(self, client: genai.Client, semaphore: asyncio.Semaphore, user_prompt: str) -> str:
        """Call LLM API with retries and backoff."""
        prompt = f"{self.system_prompt}\n\n{user_prompt}"
        
        config = GenerateContentConfig(
            max_output_tokens=self.max_tokens,
            temperature=self.temperature,
            safety_settings=[
                {"category": HarmCategory.HARM_CATEGORY_HATE_SPEECH, "threshold": HarmBlockThreshold.BLOCK_NONE},
                {"category": HarmCategory.HARM_CATEGORY_HARASSMENT, "threshold": HarmBlockThreshold.BLOCK_NONE},
                {"category": HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, "threshold": HarmBlockThreshold.BLOCK_NONE},
                {"category": HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, "threshold": HarmBlockThreshold.BLOCK_NONE},
            ]
        )

        async with semaphore:
            for attempt in range(4):
                try:
                    response = await client.aio.models.generate_content(
                        model=self.model_id,
                        contents=prompt,
                        config=config
                    )
                    
                    eval_text = response.text or ""
                    if not eval_text and response.candidates:
                        finish_reason = getattr(response.candidates[0], "finish_reason", "UNKNOWN")
                        if str(finish_reason).endswith("PROHIBITED_CONTENT") or str(finish_reason).endswith("SAFETY"):
                            print(f"[{self.PASS_NAME}] Blocked by safety filter. Returning empty.")
                            return ""
                    return eval_text
                except Exception as e:
                    err_msg = str(e)
                    print(f"[{self.PASS_NAME}] Error (attempt {attempt+1}): {err_msg}")
                    if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                        await asyncio.sleep(10 * (attempt + 1))
                
                if attempt < 3:
                    await asyncio.sleep(2 * (attempt + 1))
            
            print(f"[{self.PASS_NAME}] FAILED entirely after 4 attempts.")
            return ""
    
    async def process_batch(self, rows: List[Dict[str, Any]], batch_size: int = 64) -> List[Dict[str, Any]]:
        """Process rows in batches."""
        results = []
        
        client = genai.Client(
            vertexai=True,
            project=PROJECT_ID,
            location=self.location,
            http_options=HttpOptions(api_version="v1")
        )
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i+batch_size]
            tasks = []
            
            for row in batch:
                if self._is_already_processed(row):
                    results.append(row)
                    continue
                
                user_prompt = self.build_user_prompt(row)
                tasks.append(self._process_single(client, semaphore, row, user_prompt))
            
            if tasks:
                batch_results = await tqdm.gather(*tasks, desc=f"{self.PASS_NAME} batch")
                results.extend(batch_results)
        
        return results
    
    async def _process_single(self, client: genai.Client, semaphore: asyncio.Semaphore, row: Dict[str, Any], user_prompt: str) -> Dict[str, Any]:
        """Process a single row."""
        response = await self._call_llm(client, semaphore, user_prompt)
        if response:
            print(f"\nRAW LLM RESPONSE for {row['id']}: {response}\n")
            parsed = self.parse_response(response)
            row = self.apply_to_row(row, parsed)
        return row
    
    def _is_already_processed(self, row: Dict[str, Any]) -> bool:
        """Check if row already processed by this pass.
        Returns True only if ALL output fields for this pass have values.
        """
        for field_path in self.OUTPUT_FIELDS:
            value = self._get_nested(row, field_path)
            if value is None or value == "" or value == []:
                # At least one field is missing or empty - needs processing
                return False
        # All fields have values - already processed
        return True
    
    def run_file(self, input_path: str, output_path: str, limit: Optional[int] = None, batch_size: int = 64):
        """Process a JSONL file."""
        rows = []
        with open(input_path, 'r') as f:
            for i, line in enumerate(f):
                if limit and i >= limit:
                    break
                try:
                    rows.append(json.loads(line))
                except:
                    continue
        
        print(f"[{self.PASS_NAME}] Loaded {len(rows)} rows")
        print(f"[{self.PASS_NAME}] Ontologies: {self.REQUIRED_ONTOLOGIES}")
        
        processed = asyncio.run(self.process_batch(rows, batch_size=batch_size))
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w') as f:
            for row in processed:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
        
        print(f"[{self.PASS_NAME}] Saved {len(processed)} rows")
