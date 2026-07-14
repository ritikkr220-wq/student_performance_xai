import pandas as pd
import numpy as np
import random

np.random.seed(42)
random.seed(42)

n_samples = 500

# ─────────────────────────────────────────────────────────────
# Indian student names (realistic, diverse)
# ─────────────────────────────────────────────────────────────
first_names = [
    "Aarav", "Aditi", "Aditya", "Akash", "Amita", "Ananya", "Anil", "Anjali", "Arjun", "Aryan",
    "Bhavya", "Chetan", "Deepa", "Deepak", "Devi", "Dhruv", "Divya", "Gaurav", "Geeta", "Harini",
    "Harsh", "Isha", "Ishaan", "Jaya", "Kabir", "Kavya", "Kiran", "Krishna", "Lakshmi", "Manoj",
    "Meera", "Mohit", "Nandini", "Naveen", "Neha", "Nikhil", "Nisha", "Pallavi", "Pankaj", "Pooja",
    "Priya", "Rahul", "Rajesh", "Rakesh", "Ravi", "Rekha", "Ritika", "Rohit", "Rohan", "Sakshi",
    "Sandeep", "Sanjay", "Sapna", "Sarika", "Shreya", "Shubham", "Simran", "Sneha", "Sonia", "Suresh",
    "Swati", "Tanvi", "Tarun", "Tushar", "Uma", "Varun", "Vijay", "Vikram", "Vinay", "Yash",
    "Zara", "Pranav", "Manish", "Preeti", "Ramya", "Sagar", "Megha", "Aman", "Kriti", "Vivek",
    "Aisha", "Nitin", "Rashmi", "Gaurangi", "Dev", "Tanya", "Kunal", "Radhika", "Sunil", "Anjana",
    "Abhi", "Mira", "Sahil", "Nidhi", "Kartik", "Lavanya", "Ashwin", "Bhumi", "Chirag", "Disha",
]

last_names = [
    "Sharma", "Verma", "Patel", "Singh", "Kumar", "Gupta", "Joshi", "Reddy", "Nair", "Iyer",
    "Rao", "Das", "Mishra", "Pandey", "Mehta", "Shah", "Bhat", "Kulkarni", "Desai", "Patil",
    "Hegde", "Shetty", "Acharya", "Goyal", "Tiwari", "Chopra", "Malhotra", "Kapoor", "Bansal", "Saxena",
    "Chauhan", "Yadav", "Thakur", "Jain", "Bose", "Sen", "Mukherjee", "Dutta", "Roy", "Ghosh",
    "Pillai", "Menon", "Gowda", "Naidu", "Rajan", "Swamy", "Prasad", "Mohan", "Sethi", "Khatri",
]

# Generate unique names
names = []
used = set()
for i in range(n_samples):
    while True:
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        full = f"{fn} {ln}"
        if full not in used:
            used.add(full)
            names.append(full)
            break

# ─────────────────────────────────────────────────────────────
# Latent factors — ULTRA STRONG signal for 98%+ accuracy
# ─────────────────────────────────────────────────────────────
practical_talent = np.random.normal(0, 1, n_samples)
theoretical_talent = np.random.normal(0, 1, n_samples)
study_hours = np.random.normal(0, 1, n_samples)


# ─────────────────────────────────────────────────────────────
# PRACTICAL SUBJECTS (P) — very high signal, minimal noise
# ─────────────────────────────────────────────────────────────
data_structure = 65 + 15 * practical_talent + 8 * study_hours + np.random.normal(0, 1.5, n_samples)
data_structure = np.clip(np.round(data_structure, 1), 15, 100)

python_marks = 68 + 14 * practical_talent + 9 * study_hours + np.random.normal(0, 1.5, n_samples)
python_marks = np.clip(np.round(python_marks, 1), 18, 100)

java_marks = 63 + 15 * practical_talent + 7 * study_hours + np.random.normal(0, 1.5, n_samples)
java_marks = np.clip(np.round(java_marks, 1), 12, 100)

ds_lab = data_structure * 0.60 + 30 + 7 * practical_talent + np.random.normal(0, 1.5, n_samples)
ds_lab = np.clip(np.round(ds_lab, 1), 20, 100)

python_lab = python_marks * 0.60 + 30 + 7 * practical_talent + np.random.normal(0, 1.5, n_samples)
python_lab = np.clip(np.round(python_lab, 1), 25, 100)

java_lab = java_marks * 0.60 + 25 + 7 * practical_talent + np.random.normal(0, 1.5, n_samples)
java_lab = np.clip(np.round(java_lab, 1), 20, 100)

# ─────────────────────────────────────────────────────────────
# THEORETICAL SUBJECTS (T)
# ─────────────────────────────────────────────────────────────
english = 60 + 14 * theoretical_talent + 8 * study_hours + np.random.normal(0, 1.5, n_samples)
english = np.clip(np.round(english, 1), 15, 100)

hindi = 63 + 13 * theoretical_talent + 8 * study_hours + np.random.normal(0, 1.5, n_samples)
hindi = np.clip(np.round(hindi, 1), 18, 100)

kannada = 65 + 12 * theoretical_talent + 7 * study_hours + np.random.normal(0, 1.5, n_samples)
kannada = np.clip(np.round(kannada, 1), 15, 100)

sanskrit = 58 + 14 * theoretical_talent + 7 * study_hours + np.random.normal(0, 2, n_samples)
sanskrit = np.clip(np.round(sanskrit, 1), 10, 100)

software_eng = 60 + 13 * theoretical_talent + 9 * study_hours + np.random.normal(0, 1.5, n_samples)
software_eng = np.clip(np.round(software_eng, 1), 12, 100)

# ─────────────────────────────────────────────────────────────
# TARGET — EXACTLY 82% pass / 18% fail
# Clean classification boundary with ultra-low noise
# ─────────────────────────────────────────────────────────────
practical_avg = (data_structure + python_marks + java_marks + ds_lab + python_lab + java_lab) / 6
theoretical_avg = (english + hindi + kannada + sanskrit + software_eng) / 5

# Composite score — very low noise for clean boundary
overall_score = practical_avg * 0.55 + theoretical_avg * 0.45

# Force exactly 18% failure rate
n_fail = int(n_samples * 0.18)
sorted_indices = np.argsort(overall_score)
target = np.array(['Pass'] * n_samples)
target[sorted_indices[:n_fail]] = 'Fail'
target = target.tolist()

# ─────────────────────────────────────────────────────────────
# Attendance — strongly correlated with study_hours
# ─────────────────────────────────────────────────────────────
attendance = 60 + 18 * study_hours + np.random.normal(0, 2.5, n_samples)
attendance = np.clip(np.round(attendance, 1), 20, 100)

# ─────────────────────────────────────────────────────────────
# BUILD DATAFRAME — Name column first
# ─────────────────────────────────────────────────────────────
df = pd.DataFrame({
    'Student Name': names,
    'Data Structure(P)': data_structure,
    'Python(P)': python_marks,
    'Java(P)': java_marks,
    'Data Structure Lab(P)': ds_lab,
    'Python Lab(P)': python_lab,
    'Java Lab(P)': java_lab,
    'English(T)': english,
    'Hindi(T)': hindi,
    'Kannada(T)': kannada,
    'Sanskrit(T)': sanskrit,
    'Software Engineering(T)': software_eng,
    'Attendance(%)': attendance,
    'target': target
})

pass_count = target.count('Pass')
fail_count = target.count('Fail')
print(f"Generated student_performance_dataset.csv with {n_samples} students.")
print(f"\nPass: {pass_count}, Fail: {fail_count}")
print(f"Pass Rate: {pass_count / n_samples * 100:.1f}%")
print(f"Fail Rate: {fail_count / n_samples * 100:.1f}%")
print(f"\nPractical Average: {practical_avg.mean():.1f}")
print(f"Theoretical Average: {theoretical_avg.mean():.1f}")
print(f"\nSample rows:")
print(df.head(10).to_string())

df.to_csv('student_performance_dataset.csv', index=False)
print(f"\nSaved to student_performance_dataset.csv")
