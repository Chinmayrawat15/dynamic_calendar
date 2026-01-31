import sys
import os

# Add the parent directory to sys.path to allow imports from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.main import app
    from backend.database import init_db, SessionLocal
    print("Imports successful.")
except ImportError as e:
    print(f"Import failed: {e}")
    sys.exit(1)

def test_db():
    print("Testing DB creation...")
    try:
        init_db()
        print("DB initialized.")
        db = SessionLocal()
        print("DB session created.")
        db.close()
    except Exception as e:
        print(f"DB test failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_db()
    print("Setup verification passed.")
