# EduPredict XAI: Student Performance Predictor & Explainable AI Dashboard

EduPredict XAI is a modern, high-fidelity Web Application designed to predict student performance (Pass/Fail) and provide actionable, transparent insights using **Explainable AI (XAI)**. Utilizing **XGBoost** for prediction and **SHAP (SHapley Additive exPlanations)** for machine learning interpretability, the dashboard empowers educators, advisors, and students to understand *why* a model made a prediction and *how* a student can improve to succeed.

---

## 🚀 Key Features

*   **📂 CSV Dataset Upload**: Upload student academic logs with standard attributes (practical scores `(P)`, theoretical scores `(T)`, attendance, etc.) to retrain the underlying XGBoost model on the fly.
*   **📊 Comprehensive Dashboard**: Monitor model performance (Accuracy, Precision, Recall, F1-score) and view general statistics of the cohort (average practical vs. theoretical performance, attendance distribution).
*   **🧠 Explainable Predictions (SHAP)**: Inspect individual student predictions with high-granularity explanations. See precisely which features contributed positively or negatively to the student's prediction.
*   **💡 Actionable Suggestion Engine**: Personalized feedback loops. If a student is predicted to fail, the system dynamically calculates what improvements in specific practical or theoretical courses will transition their prediction to "Pass", complete with reference tips and learning resources.
*   **✉ Report Exporter**: Download student-specific performance and improvement report text files at the click of a button.

---

## 🛠 Tech Stack

*   **Frontend**: React (v19), Vite, Recharts (custom charts), Lucide React (icons), Axios.
*   **Backend**: Python, FastAPI, Uvicorn, Pandas, Scikit-learn.
*   **Machine Learning & XAI**: XGBoost, SHAP (TreeExplainer).

---

## 📁 Repository Structure

```text
student_performance_xai/
│
├── backend/                       # FastAPI Backend
│   ├── main.py                    # Main FastAPI Router & Endpoints
│   ├── ml_pipeline.py             # ML Pipeline (XGBoost training, SHAP value generation)
│   ├── generate_dataset.py        # Generates a synthetic mock student dataset
│   ├── requirements.txt           # Python dependency specifications
│   ├── test_ml.py                 # Pipeline testing script
│   └── test_upload.py             # Endpoint file upload testing script
│
├── frontend/                      # React-Vite Frontend
│   ├── src/
│   │   ├── App.jsx                # Main Dashboard View and Controller
│   │   ├── index.css              # Custom styled CSS stylesheet
│   │   └── main.jsx               # React entrypoint
│   ├── package.json               # Node.js dependencies & scripts
│   └── vite.config.js             # Vite configurations
│
├── setup_project.py               # Root setup automation script
├── student_performance_dataset.csv # Generated dataset (Root CWD)
└── README.md                      # Project documentation
```

---

## ⚡ Quick Start (Automated Setup)

We have provided a unified script to install dependencies and configure the workspace automatically.

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/student_performance_xai.git
    cd student_performance_xai
    ```
2.  **Run the Setup Script**:
    ```bash
    python setup_project.py
    ```
    This script will:
    *   Generate the mock dataset (`student_performance_dataset.csv`) at the root.
    *   Create a virtual environment (`venv`) and install dependencies from `backend/requirements.txt`.
    *   Install frontend dependencies using `npm install`.

3.  **Start Backend & Frontend** (see commands in section below).

---

## ⚙ Manual Setup & Installation

If you prefer to set up components manually, follow these instructions:

### 1. Backend API Server Setup
Make sure you have Python 3.9+ installed.

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install required Python libraries
pip install -r requirements.txt

# Generate the student dataset in the root directory (one directory level up)
cd ..
python backend/generate_dataset.py
cd backend

# Run the FastAPI server
uvicorn main:app --reload --port 8002
```
*The backend API will be available at `http://localhost:8002`.*

### 2. Frontend Setup
Make sure you have Node.js (v18+) installed.

```bash
# Navigate to the frontend directory
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```
*The React frontend will be available at `http://localhost:5173` (or the port specified by Vite).*

---

## ⚙ How the Machine Learning & XAI Works

1.  **Preprocessing & Classifiers**:
    The system reads input student records, handles missing metrics with median imputation, and processes any categorical descriptors. It trains an **XGBoost Classifier** configured to achieve optimized accuracy.
2.  **SHAP (SHapley Additive exPlanations)**:
    SHAP computes the Shapley values of the game theory coalition to distribute features' contributions to the prediction.
    *   **Base Value**: The average model output (expected value) over the training dataset.
    *   **Shapley Value**: The amount by which a feature pushes the prediction above or below the base value.
    *   **Positive Contributions (Green)**: Attributes raising the probability of passing.
    *   **Negative Contributions (Red)**: Attributes dragging the student toward failure.
3.  **Prescriptive Recommendations**:
    When a student requires support, the pipeline uses SHAP impact weights to sort the most improvable subjects (e.g. where the student scores below average). It runs a **counterfactual simulator** to evaluate the minimum increment in marks required to shift the predicted outcome class from `Fail` to `Pass`, generating customized advice.

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file details.
