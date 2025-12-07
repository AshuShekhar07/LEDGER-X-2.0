from database import engine, Base
from models import User, Finance, Budget
from sqlalchemy import text

def reset_database():
    print("Resetting database...")
    try:
        # Create a connection to drop tables
        with engine.connect() as connection:
            # Drop tables in correct order (dependencies first)
            print("Dropping tables...")
            # We use cascade to ensure dependent rows/constraints are removed
            connection.execute(text("DROP TABLE IF EXISTS budgets CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS finance CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS users CASCADE"))
            connection.commit()
            print("Tables dropped.")

        # Recreate tables
        print("Creating new tables...")
        Base.metadata.create_all(bind=engine)
        print("Database reset successful! New schema with user_id is ready.")
        
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == "__main__":
    reset_database()
