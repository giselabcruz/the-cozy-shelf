#!/usr/bin/env python3
"""
Dynamic PDF / EPUB Cover Extractor & Ingestion Pipeline for The Cozy Shelf.

1. Scans `datalake/raw/` for PDF and EPUB files.
2. Extracts the first page/image of each file as a crisp cover PNG into `cover_images/thumbnails/`.
3. Updates or registers book entries in `datalake/processed/books.json` with file paths for downloading/viewing.
4. Generates fallback SVG covers for metadata-only books.
"""

import os
import json
import pymupdf
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
RAW_DIR = BASE_DIR / "datalake" / "raw"
PROCESSED_FILE = BASE_DIR / "datalake" / "processed" / "books.json"
THUMBNAIL_DIR = BASE_DIR / "cover_images" / "thumbnails"
PLACEHOLDER_DIR = BASE_DIR / "cover_images" / "placeholders"

def extract_pdf_cover(pdf_path, output_png_path):
    """Extracts Page 1 of a PDF as a high-resolution PNG image."""
    try:
        doc = pymupdf.open(pdf_path)
        if len(doc) == 0:
            return False, 0
        
        page = doc[0]  # First page
        pix = page.get_pixmap(dpi=150)  # Render page 1 at 150 DPI
        pix.save(output_png_path)
        page_count = len(doc)
        doc.close()
        print(f"📖 Extracted Page 1 cover from PDF: {pdf_path.name} -> {output_png_path.name}")
        return True, page_count
    except Exception as e:
        print(f"⚠️ Failed to extract PDF cover for {pdf_path.name}: {e}")
        return False, 0

def generate_svg(title, author, genre="Book", bg_color="#2c3e50"):
    """Generates a clean, elegant SVG book cover fallback."""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="100%" height="100%">
  <rect width="400" height="600" fill="{bg_color}" rx="12" />
  <rect x="18" y="18" width="364" height="564" fill="none" stroke="#f5ebe0" stroke-width="2" rx="8" opacity="0.4"/>
  <circle cx="200" cy="200" r="45" fill="none" stroke="#f5ebe0" stroke-width="3" opacity="0.6"/>
  <text x="200" y="206" font-family="Georgia, serif" font-size="28" fill="#f5ebe0" text-anchor="middle" opacity="0.8">📖</text>
  
  <text x="200" y="360" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">
    {title}
  </text>
  <text x="200" y="395" font-family="sans-serif" font-size="14" fill="#f5ebe0" letter-spacing="1" text-anchor="middle" opacity="0.8">
    {genre.upper()}
  </text>

  <line x1="150" y1="430" x2="250" y2="430" stroke="#f5ebe0" stroke-width="1.5" opacity="0.5"/>

  <text x="200" y="475" font-family="sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">
    {author}
  </text>
</svg>"""

def process_raw_books():
    """Scans datalake/raw/, extracts covers, and updates datalake/processed/books.json."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)
    PLACEHOLDER_DIR.mkdir(parents=True, exist_ok=True)

    books = []
    if PROCESSED_FILE.exists():
        with open(PROCESSED_FILE, "r", encoding="utf-8") as f:
            books = json.load(f)

    existing_files = {b.get("file_path"): b for b in books if b.get("file_path")}

    # Process all PDF files in datalake/raw/
    for file_path in RAW_DIR.glob("*.*"):
        if file_path.suffix.lower() in [".pdf", ".epub"]:
            rel_file_path = f"datalake/raw/{file_path.name}"
            book_id = file_path.stem.replace(" ", "_").lower()
            cover_filename = f"{book_id}_cover.png"
            cover_png_path = THUMBNAIL_DIR / cover_filename
            rel_cover_path = f"cover_images/thumbnails/{cover_filename}"

            success = False
            page_count = 100
            if file_path.suffix.lower() == ".pdf":
                success, page_count = extract_pdf_cover(file_path, cover_png_path)

            file_size_mb = round(file_path.stat().st_size / (1024 * 1024), 2)
            if file_size_mb == 0:
                file_size_mb = 0.1

            # Check if entry already exists in books.json
            found = False
            for b in books:
                if b.get("file_path") == rel_file_path or b.get("id") == f"raw-{book_id}":
                    b["cover_image"] = rel_cover_path if success else b.get("cover_image")
                    b["file_path"] = rel_file_path
                    b["file_type"] = file_path.suffix.lower().replace(".", "")
                    b["file_size_mb"] = file_size_mb
                    if page_count > 0:
                        b["pages"] = page_count
                    found = True
                    break

            if not found:
                # Create a new book record from raw file
                formatted_title = file_path.stem.replace("_", " ").replace("-", " ").title()
                new_book = {
                    "id": f"raw-{book_id}",
                    "title": formatted_title,
                    "author": "Digital Library",
                    "genre": "PDF Document",
                    "publication_year": 2026,
                    "pages": page_count if page_count > 0 else 150,
                    "pages_read": 0,
                    "status": "currently-reading",
                    "rating": 5,
                    "favorite": True,
                    "spine_color": "#1e3d59",
                    "cover_image": rel_cover_path if success else "cover_images/placeholders/default_placeholder.svg",
                    "file_path": rel_file_path,
                    "file_type": file_path.suffix.lower().replace(".", ""),
                    "file_size_mb": file_size_mb,
                    "description": f"Original raw book file uploaded to {rel_file_path}. Click to view or download.",
                    "quote": "Extracted directly from datalake/raw/",
                    "date_added": "2026-02-17",
                    "tags": ["pdf", "raw-ingested"]
                }
                books.insert(0, new_book)
                print(f"✨ Registered new raw book: {formatted_title}")

    # Generate fallback covers for metadata-only books
    for book in books:
        cover_path = book.get("cover_image", "")
        if cover_path.endswith(".svg"):
            filename = Path(cover_path).name
            filepath = THUMBNAIL_DIR / filename
            svg_content = generate_svg(
                title=book.get("title", "Untitled"),
                author=book.get("author", "Unknown"),
                genre=book.get("genre", "Digital Book"),
                bg_color=book.get("spine_color", "#2c3e50")
            )
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(svg_content)

    # Save updated books.json
    PROCESSED_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROCESSED_FILE, "w", encoding="utf-8") as f:
        json.dump(books, f, indent=2)

    print(f"✅ Updated {PROCESSED_FILE} with {len(books)} book records.")

if __name__ == "__main__":
    process_raw_books()
