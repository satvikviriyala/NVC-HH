#!/usr/bin/env python3
"""
HH-RLHF to NVC-HHRHLF Schema Transformation specifically for Red Team Attempts

This script converts the red-team-attempts format to the structured NVC schema:
- Extracts context and prompt from the single transcript.
- Sets human_chosen_response and human_rejected_response to null as per schema.
- Initializes ofnr, metadata, safety, quality, and flags with empty values.
"""

import json
from pathlib import Path
from tqdm import tqdm

def parse_transcript(text):
    """
    Parses a continuous transcript into context and the final human prompt.
    Discards the final assistant response (if any).
    """
    text = text.strip()
    if '\n\nHuman: ' in text:
        parts = text.rpartition('\n\nHuman: ')
        context = parts[0].strip() + '\n\nHuman:'
        remainder = parts[2]
        
        if '\n\nAssistant:' in remainder:
            prompt = remainder.split('\n\nAssistant:')[0].strip()
        elif 'Assistant:' in remainder:
            prompt = remainder.split('Assistant:')[0].strip()
        else:
            prompt = remainder.strip()
    else:
        # Edge case: only one human turn in transcript
        if text.startswith('Human: '):
            context = 'Human:'
            remainder = text[7:]
        else:
            context = ''
            remainder = text
            
        if '\n\nAssistant:' in remainder:
            prompt = remainder.split('\n\nAssistant:')[0].strip()
        elif 'Assistant:' in remainder:
            prompt = remainder.split('Assistant:')[0].strip()
        else:
            prompt = remainder.strip()
            
    return context, prompt

def transform_row(idx, row, folder_prefix):
    """Transform a single red-team record to the target schema."""
    transcript_text = row.get("transcript", "")
    context, prompt = parse_transcript(transcript_text)
    
    # Build target record with null chosen/rejected responses
    record = {
        "id": f"{folder_prefix}_{idx+1:06d}",
        "prompt": prompt,
        "context": context,
        "human_chosen_response": None,
        "human_rejected_response": None,
        "ofnr": {
            "observation": "",
            "feeling": [],
            "need": [],
            "explicit_need": [],
            "implicit_need": [],
            "explicit_request": [],
            "implicit_request": [],
            "implicit_intent": "",
            "pseudo_feelings_detected": []
        },
        "metadata": {
            "emotion_arousal_hint": "",
            "emotion_valence_hint": "",
            "somatic_markers": []
        },
        "safety": {
            "label": "",
            "reason": ""
        },
        "quality": {
            "observation_is_nonjudgmental": None,
            "needs_list_match": None,
            "overall_confidence": None
        },
        "flags": {
            "error_flags": [],
            "warnings": []
        }
    }
    return record

def main():
    """Main function to process the red-team-attempts folder."""
    
    input_dir = Path("hh-rlhf")
    output_dir = Path("nvc-hhrlhf")
    
    folder = "red-team-attempts"
    folder_prefix = "red_team_attempts"
    filename = "red_team_attempts.jsonl"
    
    input_path = input_dir / folder / filename
    output_path = output_dir / folder / filename
    
    print("=" * 60)
    print(f"HH-RLHF to NVC-HHRHLF Schema Transformation: {folder}")
    print("=" * 60)
    
    if not input_path.exists():
        print(f"File not found: {input_path}")
        return
        
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Check if the file is a JSON array instead of JSONL
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            first_char = f.read(1)
            
        if first_char == '[':
            with open(input_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = []
            with open(input_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        data.append(json.loads(line))
    except Exception as e:
        print(f"Failed to load input file: {e}")
        return
        
    processed_in_file = 0
    
    with open(output_path, 'w', encoding='utf-8') as outfile:
        for idx, row in tqdm(enumerate(data), total=len(data), desc=f"Processing {folder}/{filename}"):
            try:
                transformed = transform_row(idx, row, folder_prefix)
                outfile.write(json.dumps(transformed, ensure_ascii=False) + '\n')
                processed_in_file += 1
            except Exception as e:
                print(f"\nError at index {idx}: {e}")
                
    print("\n" + "=" * 60)
    print(f"✓ Saved {processed_in_file} records to {output_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()