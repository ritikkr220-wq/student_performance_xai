import pandas as pd
from ml_pipeline import MLPipeline

import os
print("Loading dataset...")
dataset_path = 'student_performance_dataset.csv'
if not os.path.exists(dataset_path) and os.path.exists('../student_performance_dataset.csv'):
    dataset_path = '../student_performance_dataset.csv'
df = pd.read_csv(dataset_path)

print("Initializing pipeline...")
pipeline = MLPipeline()

print("Training model...")
metrics = pipeline.train_model(df)
print("Metrics:")
for k, v in metrics.items():
    if k != 'confusion_matrix':
        print(f"  {k}: {v}")

print("\nGenerating suggestions for student 13...")
suggestions = pipeline.generate_suggestions(13)
print(f"Original prob: {suggestions['original_pass_probability']}%")
print(f"Combined prob: {suggestions['combined_probability']}%")
print(f"Combined change: {suggestions['combined_change']}%")
for s in suggestions['suggestions']:
    print(f"\nSubject: {s['subject']}")
    print(f"  Change: {s['current_marks']} -> {s['target_marks']}")
    print(f"  Prob Change: {s['probability_before']}% -> {s['probability_after']}% (+{s['probability_change']}%)")
    print(f"  Tip: {s['tip']}")
