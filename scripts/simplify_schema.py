#!/usr/bin/env python3
"""
HH-RLHF to NVC-HHRHLF Schema Transformation

This script converts the original HH-RLHF format to the structured NVC schema:
- Extracts context, prompt, human_chosen_response, and human_rejected_response
- Initializes ofnr, metadata, safety, quality, and flags with empty values
"""

import json
import os
from pathlib import Path
from tqdm import tqdm

def parse_conversation(text):
    """
    Parses the full conversation into context, prompt, and the last response.
    Expected format: \n\nHuman: [Q1]\n\nAssistant: [A1]\n\nHuman: [Q2]\n\nAssistant: [A2]
    """
    text = text.strip()
    # Find the last Assistant response
    parts = text.rpartition('\n\nAssistant: ')
    response = parts[2].strip()
    history = parts[0].strip()
    
    # In history, find the last Human prompt
    if '\n\nHuman: ' in history:
        h_parts = history.rpartition('\n\nHuman: ')
        # Combine everything before the last \n\nHuman: with \n\nHuman:
        context = h_parts[0].strip() + '\n\nHuman:'
        prompt = h_parts[2].strip()
    else:
        # Only one human turn
        if history.startswith('Human: '):
            context = 'Human:'
            prompt = history[7:].strip()
        else:
            context = ''
            prompt = history.strip()
            
    return context, prompt, response

def transform_row(idx, row, folder_prefix):
    """Transform a single HH-RLHF record to the target schema."""
    chosen_text = row.get("chosen", "")
    rejected_text = row.get("rejected", "")
    
    # Extract prompt and context from 'chosen' branch
    context, prompt, chosen_resp = parse_conversation(chosen_text)
    
    # Extract only the final response from 'rejected' branch
    _, _, rejected_resp = parse_conversation(rejected_text)
    
    # Build target record
    record = {
        "id": f"{folder_prefix}_{idx+1:06d}",
        "prompt": prompt,
        "context": context,
        "human_chosen_response": chosen_resp,
        "human_rejected_response": rejected_resp,
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
    """Main function to process HH-RLHF folders."""
    
    # Define directories relative to current path
    input_dir = Path("hh-rlhf")
    output_dir = Path("nvc-hhrlhf")
    
    # Define folders to process (excluding red-team-attempts as requested)
    folders = [
        "harmless-base",
        "helpful-base",
        "helpful-online",
        "helpful-rejection-sampled"
    ]
    
    files = ["train.jsonl", "test.jsonl"]
    
    print("=" * 60)
    print("HH-RLHF to NVC-HHRHLF Schema Transformation")
    print("=" * 60)
    print(f"Input directory: {input_dir}")
    print(f"Output directory: {output_dir}")
    print("=" * 60)
    
    total_processed = 0
    
    for folder in folders:
        folder_prefix = folder.replace('-', '_')
        for filename in files:
            input_path = input_dir / folder / filename
            output_path = output_dir / folder / filename
            
            if not input_path.exists():
                continue
            
            # Ensure output directory exists
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Count lines for progress bar
            with open(input_path, 'r', encoding='utf-8') as f:
                total_lines = sum(1 for _ in f)
            
            processed_in_file = 0
            
            with open(input_path, 'r', encoding='utf-8') as infile, \
                 open(output_path, 'w', encoding='utf-8') as outfile:
                
                for idx, line in tqdm(enumerate(infile), total=total_lines, desc=f"Processing {folder}/{filename}"):
                    line = line.strip()
                    if not line:
                        continue
                    
                    try:
                        row = json.loads(line)
                        transformed = transform_row(idx, row, folder_prefix)
                        outfile.write(json.dumps(transformed, ensure_ascii=False) + '\n')
                        processed_in_file += 1
                        total_processed += 1
                    except Exception as e:
                        print(f"\nError at {folder}/{filename} index {idx}: {e}")
            
            print(f"✓ Saved {processed_in_file} records to {output_path}")
    
    print("\n" + "=" * 60)
    print("Transformation Complete")
    print("=" * 60)
    print(f"Total records processed: {total_processed}")
    print(f"Output directory: {output_dir}")
    print("=" * 60)

if __name__ == "__main__":
    main()
