import json
import os
import glob
import numpy as np

def calculate_metrics(base_dir):
    metrics = {
        'observation_is_nonjudgmental': [],
        'needs_list_match': [],
        'overall_confidence': []
    }
    
    # Find all jsonl files in the subdirectories
    jsonl_files = glob.glob(os.path.join(base_dir, '**/*.jsonl'), recursive=True)
    
    total_rows = 0
    for file_path in jsonl_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    # Get quality metrics
                    if 'quality' in data:
                        quality = data['quality']
                        for key in metrics.keys():
                            if key in quality and quality[key] is not None:
                                metrics[key].append(quality[key])
                    total_rows += 1
                except json.JSONDecodeError:
                    pass
    
    print(f"Processed {total_rows} rows from {len(jsonl_files)} files.\n")
    print("--- Quality Metrics (Mean ± Std) ---")
    
    for key, values in metrics.items():
        if not values:
            print(f"{key}: No data")
            continue
            
        mean_val = np.mean(values)
        std_val = np.std(values)
        print(f"{key}: {mean_val:.2f} ± {std_val:.2f} (n={len(values)})")

if __name__ == "__main__":
    calculate_metrics("/Users/satvik/Downloads/NVC_HH/Data_refined")
