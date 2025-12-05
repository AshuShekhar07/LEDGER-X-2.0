import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Try connecting to the default 'postgres' database first to check credentials
url = os.getenv("DATABASE_URL")
if not url:
    print("❌ DATABASE_URL is not set in .env")
    exit(1)

print(f"Original URL: {url}")

try:
    # Parse URL to switch dbname to 'postgres'
    from urllib.parse import urlparse, urlunparse
    parsed = urlparse(url)
    postgres_url = urlunparse(parsed._replace(path="/postgres"))
    
    print(f"Testing credentials with: {postgres_url}")
    conn = psycopg2.connect(postgres_url)
    print("✅ Credentials are correct! Connected to 'postgres' DB.")
    conn.close()
    
    # Now check the actual database
    print(f"Testing target DB: {url}")
    conn = psycopg2.connect(url)
    print("✅ Target database 'ledger_db' exists and is accessible!")
    conn.close()

except psycopg2.OperationalError as e:
    print(f"❌ Connection failed: {e}")
    if "password authentication failed" in str(e):
        print("👉 HINT: The password in .env is incorrect.")
    elif "database \"ledger_db\" does not exist" in str(e):
        print("👉 Database 'ledger_db' missing. Attempting to create it...")
        try:
            from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
            conn = psycopg2.connect(postgres_url)
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cur = conn.cursor()
            cur.execute("CREATE DATABASE ledger_db")
            cur.close()
            conn.close()
            print("✅ Successfully created database 'ledger_db'!")
            
            # Verify again
            conn = psycopg2.connect(url)
            print("✅ Connection verified!")
            conn.close()
        except Exception as create_err:
            print(f"❌ Failed to create database: {create_err}")
            print("Please create it manually: CREATE DATABASE ledger_db;")
except Exception as e:
    print(f"❌ Error: {e}")
