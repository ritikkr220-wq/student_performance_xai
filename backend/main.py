from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

from ml_pipeline import MLPipeline

app = FastAPI(title="Student Performance XAI API")

# Setup CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os

# Global instance of our ML pipeline
ml_pipeline = MLPipeline()

# Automatically train the model if the dataset exists
dataset_path = "../student_performance_dataset.csv"
if os.path.exists(dataset_path):
    try:
        df = pd.read_csv(dataset_path)
        ml_pipeline.train_model(df)
        print("Model trained automatically on startup using student_performance_dataset.csv")
    except Exception as e:
        print(f"Error training model on startup: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to Student Performance XAI API"}

@app.post("/api/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
        # Initialize the pipeline with the uploaded dataset
        metrics = ml_pipeline.train_model(df)
        
        # Get dataset stats
        stats = ml_pipeline.get_dataset_stats()
        
        return {
            "message": "Dataset uploaded and model trained successfully",
            "metrics": metrics,
            "columns": df.columns.tolist(),
            "dataset_stats": stats
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing dataset: {str(e)}")

@app.get("/api/dataset-stats")
def get_dataset_stats():
    """Returns comprehensive dataset statistics."""
    stats = ml_pipeline.get_dataset_stats()
    if stats is None:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload a dataset first.")
    return stats

@app.get("/api/model-metrics")
def get_model_metrics():
    """Returns model training metrics."""
    if ml_pipeline.metrics is None:
        raise HTTPException(status_code=400, detail="Model not trained yet.")
    return ml_pipeline.metrics

@app.get("/api/students")
def get_students():
    """Returns a list of students for the frontend to select from."""
    if ml_pipeline.model is None or ml_pipeline.df is None:
        raise HTTPException(status_code=400, detail="Model not trained yet. Please upload a dataset.")
    
    # Return student index, name, practical avg, theoretical avg, and target
    students = []
    df = ml_pipeline.df
    practical_cols = [c for c in df.columns if '(P)' in c and pd.api.types.is_numeric_dtype(df[c])]
    theoretical_cols = [c for c in df.columns if '(T)' in c and pd.api.types.is_numeric_dtype(df[c])]
    target_col = ml_pipeline.target_column
    student_names = ml_pipeline.student_names
    
    for i in range(len(df)):
        row = df.iloc[i]
        prac_avg = round(float(row[practical_cols].mean()), 1) if practical_cols else 0
        theo_avg = round(float(row[theoretical_cols].mean()), 1) if theoretical_cols else 0
        target_val = str(row[target_col]) if target_col in df.columns else "N/A"
        
        # Use actual student name from dataset
        name = student_names[i] if i < len(student_names) else f"Student {i + 1}"
        
        students.append({
            "id": i,
            "label": name,
            "practical_avg": prac_avg,
            "theoretical_avg": theo_avg,
            "actual_result": target_val
        })
    
    return {"students": students}

@app.get("/api/predict/{student_id}")
def predict_student(student_id: int):
    """Predict performance for a specific student and generate SHAP explanations."""
    if ml_pipeline.model is None:
        raise HTTPException(status_code=400, detail="Model not trained yet.")
        
    try:
        prediction, probability, shap_values, base_value, features, prediction_label = ml_pipeline.predict_and_explain(student_id)
        
        # Get student name
        student_name = ml_pipeline.student_names[student_id] if student_id < len(ml_pipeline.student_names) else f"Student {student_id + 1}"
        
        # Separate features into practical and theoretical for the comparison chart
        practical_features = {}
        theoretical_features = {}
        other_features = {}
        
        for feat_name, feat_val in features.items():
            if '(P)' in feat_name:
                clean_name = feat_name.replace('(P)', '').strip()
                practical_features[clean_name] = feat_val
            elif '(T)' in feat_name:
                clean_name = feat_name.replace('(T)', '').strip()
                theoretical_features[clean_name] = feat_val
            else:
                other_features[feat_name] = feat_val
        
        return {
            "student_id": student_id,
            "student_name": student_name,
            "prediction": int(prediction),
            "prediction_label": prediction_label,
            "probability": float(probability),
            "shap_values": shap_values,
            "base_value": float(base_value),
            "features": features,
            "practical_features": practical_features,
            "theoretical_features": theoretical_features,
            "other_features": other_features,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating prediction: {str(e)}")

@app.get("/api/suggestions/{student_id}")
def get_suggestions(student_id: int):
    """Generate personalized improvement suggestions for a student."""
    if ml_pipeline.model is None:
        raise HTTPException(status_code=400, detail="Model not trained yet.")
    
    try:
        suggestions = ml_pipeline.generate_suggestions(student_id)
        return suggestions
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating suggestions: {str(e)}")
