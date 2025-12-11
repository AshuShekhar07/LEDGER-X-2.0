import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL is not set in .env")
    exit(1)

print(f"Testing connection to: {DATABASE_URL}")

try:
    if "sqlite" in DATABASE_URL:
        # SQLite specific check
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Connection successful! Database is accessible.")
            
            # Check if tables exist (optional, but good for verifying if app initialized them)
            # This query lists tables in sqlite
            result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
            tables = [row[0] for row in result]
            print(f"✅ Found tables: {tables}")
    else:
        print("❌ DATABASE_URL is not configured for SQLite. Please check .env")
        
except Exception as e:
    print(f"❌ Connection failed: {e}")
