#!/usr/bin/env python3
"""
Pipeline Orchestrator for NVC-HH

Runs the 4 passes sequentially, saving intermediary results to ensure resumability.
"""

import os
import argparse
from pathlib import Path

from passes.observer import ObserverPass
from passes.empathizer import EmpathizerPass
from passes.strategist import StrategistPass
from passes.critic import CriticPass

MODELS_CONFIG = {
    "observer": {
        "id": "zai-org/glm-4.7-maas",
        "location": "global"
    },
    "empathizer": {
        "id": "deepseek-ai/deepseek-v3.2-maas",
        "location": "global"
    },
    "strategist": {
        "id": "qwen/qwen3-235b-a22b-instruct-2507-maas",
        "location": "us-south1"
    },
    "critic": {
        "id": "meta/llama-4-maverick-17b-128e-instruct-maas",
        "location": "us-east5"
    }
}

def main():
    parser = argparse.ArgumentParser(description="Run NVC-HH annotation pipeline")
    parser.add_argument("--input_file", required=True, help="Path to input JSONL file")
    parser.add_argument("--folder_name", required=True, help="Name of the folder (e.g., harmless-base)")
    parser.add_argument("--output_dir", required=True, help="Directory to save intermediary and final results")
    parser.add_argument("--limit", type=int, default=None, help="Max rows to process (for testing)")
    parser.add_argument("--batch_size", type=int, default=10, help="Batch size for LLM calls")
    parser.add_argument("--max_concurrent", type=int, default=2, help="Max concurrent requests")
    
    args = parser.parse_args()
    
    input_path = Path(args.input_file)
    output_dir = Path(args.output_dir)
    folder_prompt_file = f"prompt_{args.folder_name.replace('-', '_')}.txt"
    
    os.makedirs(output_dir, exist_ok=True)
    
    print("=" * 60)
    print(f"Starting NVC-HH Pipeline for {args.folder_name}")
    print(f"Input: {input_path}")
    print("=" * 60)

    # Pass 1: Observer
    print("\n--- Running Pass 1: Observer ---")
    pass1_out = output_dir / "pass1_observer.jsonl"
    observer = ObserverPass(
        model_id=MODELS_CONFIG["observer"]["id"],
        location=MODELS_CONFIG["observer"]["location"],
        folder_prompt_file=folder_prompt_file,
        max_concurrent=args.max_concurrent
    )
    observer.run_file(
        input_path=str(input_path),
        output_path=str(pass1_out),
        limit=args.limit,
        batch_size=args.batch_size
    )
    
    # Pass 2: Empathizer
    print("\n--- Running Pass 2: Empathizer ---")
    pass2_out = output_dir / "pass2_empathizer.jsonl"
    empathizer = EmpathizerPass(
        model_id=MODELS_CONFIG["empathizer"]["id"],
        location=MODELS_CONFIG["empathizer"]["location"],
        folder_prompt_file=folder_prompt_file,
        max_concurrent=args.max_concurrent
    )
    empathizer.run_file(
        input_path=str(pass1_out),
        output_path=str(pass2_out),
        limit=args.limit,
        batch_size=args.batch_size
    )

    # Pass 3: Strategist
    print("\n--- Running Pass 3: Strategist ---")
    pass3_out = output_dir / "pass3_strategist.jsonl"
    strategist = StrategistPass(
        model_id=MODELS_CONFIG["strategist"]["id"],
        location=MODELS_CONFIG["strategist"]["location"],
        folder_prompt_file=folder_prompt_file,
        max_concurrent=args.max_concurrent
    )
    strategist.run_file(
        input_path=str(pass2_out),
        output_path=str(pass3_out),
        limit=args.limit,
        batch_size=args.batch_size
    )

    # Pass 4: Critic
    print("\n--- Running Pass 4: Critic ---")
    pass4_out = output_dir / "pass4_final.jsonl"
    critic = CriticPass(
        model_id=MODELS_CONFIG["critic"]["id"],
        location=MODELS_CONFIG["critic"]["location"],
        folder_prompt_file=folder_prompt_file,
        max_concurrent=args.max_concurrent
    )
    critic.run_file(
        input_path=str(pass3_out),
        output_path=str(pass4_out),
        limit=args.limit,
        batch_size=args.batch_size
    )
    
    print("\n" + "=" * 60)
    print(f"Pipeline completed! Final output saved to: {pass4_out}")
    print("=" * 60)

if __name__ == "__main__":
    main()
