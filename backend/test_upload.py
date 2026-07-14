import requests
import pandas as pd
import numpy as np

# Create a mock CSV file
df = pd.DataFrame({
    'age': [18, 19, 20, 21, 22],
    'gender': ['M', 'F', 'M', 'F', 'M'],
    'score': [85.5, 90.0, 78.5, 88.0, 92.5],
    'target': ['Pass', 'Pass', 'Fail', 'Pass', 'Pass']
})
df.to_csv('mock_dataset.csv', index=False)

# Upload the CSV file to the backend
url = 'http://localhost:8000/api/upload-dataset'
with open('mock_dataset.csv', 'rb') as f:
    files = {'file': ('mock_dataset.csv', f, 'text/csv')}
    response = requests.post(url, files=files)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
