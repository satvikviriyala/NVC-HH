#!/usr/bin/env python3
"""
Convert JSON array file to JSONL (JSON Lines) format.
Each object in the array becomes a separate line.
"""

import json
import sys
from pathlib import Path


def json_to_jsonl(input_path: str, output_path: str = None) -> None:
    """
    Convert a JSON array file to JSONL format.
    
    Args:
        input_path: Path to input JSON file containing an array
        output_path: Path to output JSONL file (defaults to same name with .jsonl extension)
    """
    input_file = Path(input_path)
    
    if output_path is None:
        output_path = input_file.with_suffix('.jsonl')
    else:
        output_path = Path(output_path)
    
    # Read the JSON array
    print(f"Reading: {input_file}")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not isinstance(data, list):
        raise ValueError("Input JSON must be an array")
    
    # Write as JSONL
    print(f"Writing: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    
    print(f"Converted {len(data)} items to JSONL format")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Default: convert train.json in same directory
        script_dir = Path(__file__).parent
        input_file = script_dir / "Data_refined/harmless-base/train.json"
        json_to_jsonl(str(input_file))
    else:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        json_to_jsonl(input_file, output_file)
