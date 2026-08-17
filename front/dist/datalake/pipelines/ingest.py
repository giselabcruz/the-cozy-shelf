#!/usr/bin/env python3
import json
from pathlib import Path
from datetime import datetime
from extract_covers import process_raw_books

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_FILE = BASE_DIR / "processed" / "books.json"
ANALYTICS_FILE = BASE_DIR / "analytics" / "reading_stats.json"

def validate_book(book):
    required = ["id", "title", "author", "status"]
    for field in required:
        if field not in book or not book[field]:
            raise ValueError(f"Book missing required field: {field}")
    return True

def compute_analytics(books):
    total_books = len(books)
    completed = sum(1 for b in books if b.get("status") == "completed")
    currently_reading = sum(1 for b in books if b.get("status") == "currently-reading")
    want_to_read = sum(1 for b in books if b.get("status") == "want-to-read")
    
    total_pages_read = sum(b.get("pages_read", 0) for b in books)
    total_pages_catalog = sum(b.get("pages", 0) for b in books)
    favorites_count = sum(1 for b in books if b.get("favorite") is True)

    genres = {}
    for b in books:
        g = b.get("genre", "Uncategorized")
        genres[g] = genres.get(g, 0) + 1

    stats = {
        "last_updated": datetime.now().isoformat(),
        "total_books": total_books,
        "status_breakdown": {
            "completed": completed,
            "currently_reading": currently_reading,
            "want_to_read": want_to_read
        },
        "reading_progress": {
            "total_pages_read": total_pages_read,
            "total_pages_catalog": total_pages_catalog,
            "completion_rate_percent": round((completed / total_books * 100), 1) if total_books > 0 else 0
        },
        "favorites_count": favorites_count,
        "genre_distribution": genres
    }
    return stats

def run_pipeline():
    print("📚 Running Cozy Shelf Raw Data Processing...")
    process_raw_books()

    if not PROCESSED_FILE.exists():
        print(f"Error: {PROCESSED_FILE} does not exist.")
        return

    with open(PROCESSED_FILE, "r", encoding="utf-8") as f:
        books = json.load(f)

    valid_books = []
    for b in books:
        try:
            validate_book(b)
            valid_books.append(b)
        except ValueError as e:
            print(f"⚠️ Validation warning: {e}")

    stats = compute_analytics(valid_books)
    
    ANALYTICS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(ANALYTICS_FILE, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    print(f"✅ Ingested {len(valid_books)} books successfully.")
    print(f"Analytics saved to {ANALYTICS_FILE}!")

if __name__ == "__main__":
    run_pipeline()
