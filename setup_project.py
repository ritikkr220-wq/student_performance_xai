import os
import sys
import subprocess
import shutil

def run_command(command, cwd=None):
    """Utility to run a terminal command and print its output."""
    print(f"\nRunning: {' '.join(command)} in {cwd or 'current directory'}")
    try:
        result = subprocess.run(command, cwd=cwd, check=True, text=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e}")
        return False
    except FileNotFoundError:
        print(f"Command not found: {command[0]}. Please ensure it is installed and in your PATH.")
        return False

def main():
    root_dir = os.path.abspath(os.path.dirname(__file__))
    print("==================================================================")
    print("                 EduPredict XAI - Setup Helper                     ")
    print("==================================================================")
    
    # 1. Generate Dataset
    print("\n--- Step 1: Generating Mock Student Dataset ---")
    gen_script = os.path.join(root_dir, "backend", "generate_dataset.py")
    if os.path.exists(gen_script):
        # We run it from the root directory so the CSV is created at the root, 
        # which backend/main.py expects as "../student_performance_dataset.csv"
        run_command([sys.executable, gen_script], cwd=root_dir)
        
        # Verify the CSV exists at the root
        expected_csv = os.path.join(root_dir, "student_performance_dataset.csv")
        if os.path.exists(expected_csv):
            print(f"✔ Success: dataset generated at {expected_csv}")
        else:
            print("❌ Warning: student_performance_dataset.csv was not found in the root directory.")
    else:
        print("❌ Error: generate_dataset.py not found under backend/ directory.")
        sys.exit(1)

    # 2. Check Virtual Environment
    print("\n--- Step 2: Setting up Python Virtual Environment ---")
    venv_dir = os.path.join(root_dir, "venv")
    if not os.path.exists(venv_dir):
        print("Creating virtual environment 'venv'...")
        success = run_command([sys.executable, "-m", "venv", "venv"], cwd=root_dir)
        if not success:
            print("Could not automatically create venv. Proceeding with system python (not recommended).")
    else:
        print("✔ Virtual environment 'venv' already exists.")

    # 3. Determine python / pip paths
    # Windows vs Unix paths
    if os.name == 'nt':
        venv_python = os.path.join(venv_dir, "Scripts", "python.exe")
        venv_pip = os.path.join(venv_dir, "Scripts", "pip.exe")
    else:
        venv_python = os.path.join(venv_dir, "bin", "python")
        venv_pip = os.path.join(venv_dir, "bin", "pip")

    # Fallback to sys.executable if venv creation failed
    if not os.path.exists(venv_python):
        venv_python = sys.executable
        venv_pip = "pip"

    # 4. Install backend dependencies
    print("\n--- Step 3: Installing Backend Dependencies ---")
    req_file = os.path.join(root_dir, "backend", "requirements.txt")
    if os.path.exists(req_file):
        run_command([venv_pip, "install", "-r", req_file])
    else:
        print("❌ Error: requirements.txt not found in backend/ directory.")

    # 5. Install frontend dependencies
    print("\n--- Step 4: Installing Frontend Dependencies ---")
    frontend_dir = os.path.join(root_dir, "frontend")
    package_json = os.path.join(frontend_dir, "package.json")
    if os.path.exists(package_json):
        # Locate npm
        npm_cmd = "npm.cmd" if os.name == 'nt' else "npm"
        run_command([npm_cmd, "install"], cwd=frontend_dir)
    else:
        print("❌ Error: package.json not found in frontend/ directory.")

    print("\n==================================================================")
    print("Setup completed successfully!")
    print("==================================================================")
    print("\nTo run the application:")
    print("1. Start the Backend API server:")
    if os.name == 'nt':
        print(f"   Activate venv: venv\\Scripts\\activate")
    else:
        print(f"   Activate venv: source venv/bin/activate")
    print("   Run: cd backend && uvicorn main:app --reload --port 8002")
    print("\n2. Start the Frontend client (in a separate terminal):")
    print("   Run: cd frontend && npm run dev")
    print("==================================================================")

if __name__ == "__main__":
    main()
