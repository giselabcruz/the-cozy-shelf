#!/usr/bin/env python3
"""
Cover Image Generator & Pipeline for The Cozy Shelf.
Generates artistic, high-definition SVG covers for books in the data lake
and default placeholders for newly added items.
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
THUMBNAIL_DIR = BASE_DIR / "cover_images" / "thumbnails"
PLACEHOLDER_DIR = BASE_DIR / "cover_images" / "placeholders"

# Standard cover dimension: 400x600 px (2:3 aspect ratio)

COVERS_DATA = [
    {
        "filename": "ocean_at_end_of_lane.svg",
        "bg_start": "#0f2027",
        "bg_end": "#203a43",
        "accent": "#2c5364",
        "gold": "#e0c3fc",
        "icon": """
            <path d="M50 380 Q 200 320, 350 380 T 650 380" fill="none" stroke="#8ec5fc" stroke-width="4" opacity="0.6"/>
            <path d="M0 420 Q 180 370, 400 420" fill="none" stroke="#e0c3fc" stroke-width="3" opacity="0.4"/>
            <circle cx="200" cy="220" r="45" fill="none" stroke="#8ec5fc" stroke-width="3" />
            <circle cx="200" cy="220" r="35" fill="#1b2a47" />
            <polygon points="200,140 205,155 220,155 208,165 212,180 200,170 188,180 192,165 180,155 195,155" fill="#8ec5fc"/>
        """,
        "title": "The Ocean at the",
        "subtitle": "End of the Lane",
        "author": "Neil Gaiman"
    },
    {
        "filename": "legends_and_lattes.svg",
        "bg_start": "#3e2723",
        "bg_end": "#4e342e",
        "accent": "#d7ccc8",
        "gold": "#ffb74d",
        "icon": """
            <!-- Coffee Cup with steam -->
            <path d="M 170 230 A 30 30 0 0 0 230 230 L 220 280 A 20 20 0 0 1 180 280 Z" fill="#d7ccc8" />
            <path d="M 230 240 Q 250 240, 250 255 Q 250 270, 225 270" fill="none" stroke="#d7ccc8" stroke-width="4" />
            <path d="M 185 210 Q 180 190, 190 170" fill="none" stroke="#ffb74d" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
            <path d="M 200 215 Q 205 195, 198 175" fill="none" stroke="#ffb74d" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
            <path d="M 215 210 Q 210 190, 220 170" fill="none" stroke="#ffb74d" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        """,
        "title": "Legends & Lattes",
        "subtitle": "A Novel of High Fantasy & Low Stakes",
        "author": "Travis Baldree"
    },
    {
        "filename": "psalm_for_wild_built.svg",
        "bg_start": "#1b4332",
        "bg_end": "#2d6a4f",
        "accent": "#d8f3dc",
        "gold": "#95d5b2",
        "icon": """
            <!-- Tea Leaves & Sun -->
            <circle cx="200" cy="200" r="50" fill="#e9d8a6" opacity="0.8"/>
            <path d="M 200 150 Q 240 200, 200 250 Q 160 200, 200 150 Z" fill="#74c69d"/>
            <path d="M 200 150 L 200 250" stroke="#1b4332" stroke-width="2"/>
        """,
        "title": "A Psalm for the",
        "subtitle": "Wild-Built",
        "author": "Becky Chambers"
    },
    {
        "filename": "house_in_cerulean_sea.svg",
        "bg_start": "#023e8a",
        "bg_end": "#0077b6",
        "accent": "#caf0f8",
        "gold": "#ffd166",
        "icon": """
            <!-- Cozy House on Island -->
            <path d="M 140 400 Q 200 370, 260 400 Z" fill="#90e0ef" />
            <polygon points="200,200 160,240 240,240" fill="#ee6c4d"/>
            <rect x="170" y="240" width="60" height="50" fill="#fff3b0"/>
            <rect x="190" y="260" width="20" height="30" fill="#6c584c"/>
            <circle cx="200" cy="140" r="25" fill="#ffd166"/>
        """,
        "title": "The House in the",
        "subtitle": "Cerulean Sea",
        "author": "TJ Klune"
    },
    {
        "filename": "before_coffee_gets_cold.svg",
        "bg_start": "#4a154b",
        "bg_end": "#6b114d",
        "accent": "#f3c68f",
        "gold": "#e8a598",
        "icon": """
            <!-- Pocket Watch & Steam -->
            <circle cx="200" cy="220" r="45" fill="none" stroke="#f3c68f" stroke-width="5"/>
            <line x1="200" y1="220" x2="200" y2="195" stroke="#f3c68f" stroke-width="4" stroke-linecap="round"/>
            <line x1="200" y1="220" x2="220" y2="220" stroke="#f3c68f" stroke-width="3" stroke-linecap="round"/>
            <circle cx="200" cy="165" r="8" fill="#f3c68f"/>
        """,
        "title": "Before the Coffee",
        "subtitle": "Gets Cold",
        "author": "Toshikazu Kawaguchi"
    },
    {
        "filename": "kikis_delivery_service.svg",
        "bg_start": "#31103f",
        "bg_end": "#522566",
        "accent": "#f8c8dc",
        "gold": "#fbc4ab",
        "icon": """
            <!-- Broomstick & Cat Silhouette -->
            <line x1="120" y1="260" x2="280" y2="180" stroke="#ddbea9" stroke-width="6" stroke-linecap="round"/>
            <path d="M 120 260 L 90 280 L 100 250 Z" fill="#cb997e"/>
            <circle cx="240" cy="180" r="14" fill="#111111"/>
            <polygon points="232,170 236,160 242,170" fill="#111111"/>
            <polygon points="242,170 248,160 250,170" fill="#111111"/>
        """,
        "title": "Kiki's Delivery",
        "subtitle": "Service",
        "author": "Eiko Kadono"
    },
    {
        "filename": "goblin_emperor.svg",
        "bg_start": "#2b1e3a",
        "bg_end": "#453257",
        "accent": "#e0aaff",
        "gold": "#ffd700",
        "icon": """
            <!-- Royal Crown -->
            <polygon points="150,240 160,180 180,210 200,160 220,210 240,180 250,240" fill="#ffd700"/>
            <rect x="150" y="240" width="100" height="15" fill="#c9a227" rx="3"/>
            <circle cx="200" cy="160" r="6" fill="#e0aaff"/>
            <circle cx="160" cy="180" r="5" fill="#e0aaff"/>
            <circle cx="240" cy="180" r="5" fill="#e0aaff"/>
        """,
        "title": "The Goblin Emperor",
        "subtitle": "A Novel of Imperial Court & Kindness",
        "author": "Katherine Addison"
    },
    {
        "filename": "little_prince.svg",
        "bg_start": "#0a192f",
        "bg_end": "#172a45",
        "accent": "#64ffda",
        "gold": "#ffe066",
        "icon": """
            <!-- Asteroid & Rose -->
            <circle cx="200" cy="240" r="55" fill="#3a506b"/>
            <path d="M 200 185 L 200 170" stroke="#48cae4" stroke-width="4"/>
            <circle cx="200" cy="165" r="10" fill="#f72585"/>
            <circle cx="150" cy="120" r="2" fill="#ffe066"/>
            <circle cx="260" cy="100" r="3" fill="#ffe066"/>
            <circle cx="230" cy="150" r="2" fill="#ffe066"/>
            <circle cx="120" cy="180" r="2" fill="#ffe066"/>
        """,
        "title": "The Little Prince",
        "subtitle": "Antoine de Saint-Exupéry",
        "author": "Classic Edition"
    }
]

def generate_svg(data):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{data['bg_start']}"/>
      <stop offset="100%" stop-color="{data['bg_end']}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="400" height="600" fill="url(#bgGrad)" rx="12" />
  
  <!-- Decorative Frame -->
  <rect x="20" y="20" width="360" height="560" fill="none" stroke="{data['gold']}" stroke-width="2" rx="8" opacity="0.6"/>
  <rect x="26" y="26" width="348" height="548" fill="none" stroke="{data['gold']}" stroke-width="1" rx="6" stroke-dasharray="6,4" opacity="0.4"/>

  <!-- Icon Illustration -->
  <g filter="url(#shadow)">
    {data['icon']}
  </g>

  <!-- Title & Subtitle -->
  <text x="200" y="440" font-family="'Playfair Display', Georgia, serif" font-size="24" font-weight="700" fill="{data['accent']}" text-anchor="middle">
    {data['title']}
  </text>
  <text x="200" y="470" font-family="'Playfair Display', Georgia, serif" font-size="18" font-style="italic" fill="{data['gold']}" text-anchor="middle">
    {data['subtitle']}
  </text>

  <!-- Divider Line -->
  <line x1="140" y1="495" x2="260" y2="495" stroke="{data['gold']}" stroke-width="1.5" opacity="0.7"/>

  <!-- Author -->
  <text x="200" y="530" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" letter-spacing="2" font-weight="600" fill="{data['accent']}" text-anchor="middle" text-transform="uppercase">
    {data['author']}
  </text>
</svg>"""

def build_covers():
    THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)
    PLACEHOLDER_DIR.mkdir(parents=True, exist_ok=True)

    for item in COVERS_DATA:
        filepath = THUMBNAIL_DIR / item["filename"]
        svg_content = generate_svg(item)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"🎨 Generated cover: {filepath}")

    # Generate default placeholder
    placeholder_data = {
        "filename": "default_placeholder.svg",
        "bg_start": "#2d2424",
        "bg_end": "#443434",
        "accent": "#f5ebe0",
        "gold": "#d4a373",
        "icon": '<circle cx="200" cy="220" r="40" fill="#d4a373" opacity="0.5"/>',
        "title": "Cozy Edition",
        "subtitle": "Digital Book",
        "author": "The Cozy Shelf"
    }
    with open(PLACEHOLDER_DIR / "default_placeholder.svg", "w", encoding="utf-8") as f:
        f.write(generate_svg(placeholder_data))
    print(f"🎨 Generated placeholder cover.")

if __name__ == "__main__":
    build_covers()
