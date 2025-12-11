import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_yearly_trend():
    # 1. Login to get token
    try:
        login_res = requests.post(f"{BASE_URL}/token", data={"username": "testuser", "password": "password123"})
        if login_res.status_code != 200:
            # Try registering if login fails
            requests.post(f"{BASE_URL}/register", json={"username": "testuser", "email": "test@example.com", "password": "password123"})
            login_res = requests.post(f"{BASE_URL}/token", data={"username": "testuser", "password": "password123"})
            
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Add some test data for different years
        years = [2023, 2024, 2025]
        for year in years:
            requests.post(f"{BASE_URL}/ledger/", json={
                "date": f"{year}-05-01",
                "name": "Test Expense",
                "description": "Test",
                "category": "Food",
                "salary": 0,
                "expenses": 100.0
            }, headers=headers)
            
        # 3. Call the new endpoint
        res = requests.get(f"{BASE_URL}/api/yearly-spending-trend", headers=headers)
        print(f"Status Code: {res.status_code}")
        print(f"Response: {json.dumps(res.json(), indent=2)}")
        
        if res.status_code == 200 and isinstance(res.json(), list):
            print("✅ Endpoint works correctly!")
        else:
            print("❌ Endpoint failed.")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_yearly_trend()
