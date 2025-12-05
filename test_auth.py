import requests

base_url = "http://127.0.0.1:8000"

# 1. Register
print("Registering...")
reg_data = {"username": "testuser", "email": "test@example.com", "password": "testpassword"}
try:
    resp = requests.post(f"{base_url}/register", json=reg_data)
    print(f"Register Status: {resp.status_code}")
    print(f"Register Response: {resp.text}")
except Exception as e:
    print(f"Register Failed: {e}")

# 2. Login
print("\nLogging in...")
login_data = {"username": "testuser", "password": "testpassword"}
try:
    resp = requests.post(f"{base_url}/token", data=login_data)
    print(f"Login Status: {resp.status_code}")
    print(f"Login Response: {resp.text}")
except Exception as e:
    print(f"Login Failed: {e}")
