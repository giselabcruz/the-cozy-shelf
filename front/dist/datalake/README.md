# The Cozy Shelf - Data Lake Architecture

The Data Lake serves as the centralized storage and processing engine for digital book metadata, raw book ingestion, reading analytics, and cover extraction.

## Folder Structure

```
datalake/
├── raw/                 # Incoming raw book files (.epub, .pdf, metadata JSON dumps)
├── processed/           # Sanitized, structured JSON/database feeds for the frontend
│   └── books.json       # Master book catalog
├── analytics/           # Computed reading statistics and progress logs
│   └── reading_stats.json
└── pipelines/           # Data processing & ingestion scripts
    ├── ingest.py        # Ingestion & schema validation pipeline
    └── extract_covers.py # Cover image extraction & placeholder generator
```

## Running the Ingestion Pipeline

To process raw files in `datalake/raw/` and update `datalake/processed/books.json`:

```bash
python3 datalake/pipelines/ingest.py
```
