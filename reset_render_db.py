import requests
import sys

def reset_database():
    print("--- Remote Database Reset Tool ---")
    print("This will DELETE ALL DATA in the target database and recreate tables.")
    
    # Try to guess URL or ask user
    default_url = "https://ledger-x-2-0-qpzr.onrender.com"
    
    url = input(f"Enter your Render App URL [default: {default_url}]: ").strip()
    if not url:
        url = default_url
    
    # Ensure no trailing slash
    url = url.rstrip('/')
    
    confirm = input(f"Are you sure you want to reset the DB at {url}? (type 'yes' to confirm): ")
    if confirm.lower() != 'yes':
        print("Aborted.")
        return

    endpoint = f"{url}/api/admin/reset-db-force"
    print(f"Sending reset request to {endpoint}...")
    
    try:
        response = requests.get(endpoint)
        if response.status_code == 200:
            print("\nSUCCESS! Database has been reset.")
            print("Response:", response.json())
            print("\nYou can now register a new user.")
        else:
            print(f"\nFailed. Status Code: {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print(f"\nError: {e}")

if __name__ == "__main__":
    reset_database()
