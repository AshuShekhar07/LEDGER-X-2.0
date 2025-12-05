import requests
import random
import string

def get_random_string(length):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

base_url = "http://127.0.0.1:8000"
username = f"user_{get_random_string(5)}"
email = f"{username}@example.com"
password = "testpassword123"

print(f"Attempting to register user: {username}")

payload = {
    "username": username,
    "email": email,
    "password": password
}

try:
    response = requests.post(f"{base_url}/register", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Backend registration successful!")
    else:
        print("❌ Backend registration failed.")
except Exception as e:
    print(f"❌ Error connecting to backend: {e}")
