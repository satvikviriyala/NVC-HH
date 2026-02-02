#!/usr/bin/env python3
"""
Merge original data (prompt/context/responses) with refined annotations and export as JSONL.

This script:
1. Reads original data from /Data (contains prompt, context, chosen/rejected responses)
2. Reads annotations from /Data_refined (contains ofnr, metadata, safety, quality, flags)
3. Merges them by ID
4. Outputs JSONL to the same folder as the annotations

Supports:
- helpful-online
- helpful-rejections-sampled
- red-team-attempts

Re-runnable: Only processes rows that exist in the annotations file at runtime.
"""

import json
import os
import re
from pathlib import Path


def normalize_id(id_str: str) -> str:
    """
    Normalize ID to ensure consistent 6-digit padding.
    e.g., red_team_attempts_00100 -> red_team_attempts_000100
    """
    # Match pattern: prefix_digits
    match = re.match(r"^(.+_)(\d+)$", id_str)
    if match:
        prefix, num = match.groups()
        # Pad to 6 digits
        return f"{prefix}{int(num):06d}"
    return id_str

# Base paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "Data"
DATA_REFINED_DIR = BASE_DIR / "Data_refined"

# Dataset configurations
# Format: (refined_folder, original_folder, original_file, id_prefix)
DATASETS = [
    {
        "name": "helpful-online",
        "refined_folder": "helpful-online",
        "original_folder": "helpful-online",
        "original_file": "train.jsonl",
    },
    {
        "name": "helpful-rejections-sampled",
        "refined_folder": "helpful-rejections-sampled",
        "original_folder": "helpful-rejection-sampled",  # Note: different name in Data/
        "original_file": "train.jsonl",
    },
    {
        "name": "red-team-attempts",
        "refined_folder": "red-team-attempts",
        "original_folder": "red-team-attempts",
        "original_file": "red_team_attempts.jsonl",
    },
]


def load_jsonl(filepath: Path) -> list[dict]:
    """Load a JSONL file into a list of dicts."""
    data = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                data.append(json.loads(line))
    return data


def load_json(filepath: Path) -> list[dict]:
    """Load a JSON array file into a list of dicts."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_jsonl(data: list[dict], filepath: Path) -> None:
    """Save a list of dicts as JSONL."""
    with open(filepath, "w", encoding="utf-8") as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")


def merge_dataset(dataset_config: dict) -> tuple[int, int]:
    """
    Merge original data with annotations for a single dataset.
    
    Returns: (num_merged, num_missing)
    """
    name = dataset_config["name"]
    
    # Paths
    refined_json = DATA_REFINED_DIR / dataset_config["refined_folder"] / "train.json"
    original_jsonl = DATA_DIR / dataset_config["original_folder"] / dataset_config["original_file"]
    output_jsonl = DATA_REFINED_DIR / dataset_config["refined_folder"] / "train.jsonl"
    
    # Check files exist
    if not refined_json.exists():
        print(f"  ⚠️  Refined JSON not found: {refined_json}")
        return 0, 0
    
    if not original_jsonl.exists():
        print(f"  ⚠️  Original JSONL not found: {original_jsonl}")
        return 0, 0
    
    # Load data
    print(f"  Loading annotations from {refined_json.name}...")
    annotations = load_json(refined_json)
    print(f"    Found {len(annotations)} annotations")
    
    print(f"  Loading original data from {original_jsonl.name}...")
    originals = load_jsonl(original_jsonl)
    print(f"    Found {len(originals)} original records")
    
    # Create lookup by ID for original data (normalized IDs)
    original_by_id = {normalize_id(item["id"]): item for item in originals}
    
    # Merge
    merged = []
    missing = []
    
    for annotation in annotations:
        ann_id = annotation["id"]
        normalized_ann_id = normalize_id(ann_id)
        
        if normalized_ann_id in original_by_id:
            orig = original_by_id[normalized_ann_id]
            
            # Build merged record with original fields first, then annotations
            # Use normalized ID for consistency
            merged_record = {
                "id": normalized_ann_id,
                "prompt": orig.get("prompt", ""),
                "context": orig.get("context", ""),
                "human_chosen_response": orig.get("human_chosen_response", ""),
                "human_rejected_response": orig.get("human_rejected_response", ""),
            }
            
            # Add annotation fields
            for key in ["ofnr", "metadata", "safety", "quality", "flags"]:
                if key in annotation:
                    merged_record[key] = annotation[key]
            
            merged.append(merged_record)
        else:
            missing.append(ann_id)
    
    # Save output
    if merged:
        save_jsonl(merged, output_jsonl)
        print(f"  ✅ Saved {len(merged)} merged records to {output_jsonl.name}")
    
    if missing:
        print(f"  ⚠️  {len(missing)} annotation IDs not found in original data")
        if len(missing) <= 5:
            for mid in missing:
                print(f"      - {mid}")
        else:
            print(f"      First 5: {missing[:5]}")
    
    return len(merged), len(missing)


def main():
    print("=" * 60)
    print("Merge & Convert to JSONL")
    print("=" * 60)
    
    total_merged = 0
    total_missing = 0
    
    for dataset in DATASETS:
        print(f"\n📁 Processing: {dataset['name']}")
        print("-" * 40)
        
        merged, missing = merge_dataset(dataset)
        total_merged += merged
        total_missing += missing
    
    print("\n" + "=" * 60)
    print(f"✅ Total merged: {total_merged}")
    if total_missing:
        print(f"⚠️  Total missing: {total_missing}")
    print("=" * 60)


if __name__ == "__main__":
    main()
