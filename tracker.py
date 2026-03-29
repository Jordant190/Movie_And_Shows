#!/usr/bin/env python3
"""Movie and Show Tracker with Recommendations via TMDB (free API)."""

import json
import os
from datetime import datetime

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

DATA_FILE = os.path.join(os.path.dirname(__file__), "movies.json")
API_KEY_FILE = os.path.join(os.path.dirname(__file__), ".tmdb_api_key")
TMDB_BASE = "https://api.themoviedb.org/3"

CATEGORIES = [
    "Action", "Adventure", "Animation", "Comedy", "Crime",
    "Documentary", "Drama", "Fantasy", "Horror", "Mystery",
    "Romance", "Sci-Fi", "Thriller", "Western", "Other",
]


# ---------------------------------------------------------------------------
# Storage helpers
# ---------------------------------------------------------------------------

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return {"movies": [], "shows": []}


def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def load_api_key():
    if os.path.exists(API_KEY_FILE):
        with open(API_KEY_FILE, "r") as f:
            return f.read().strip()
    return None


def save_api_key(key):
    with open(API_KEY_FILE, "w") as f:
        f.write(key)


# ---------------------------------------------------------------------------
# Display helpers
# ---------------------------------------------------------------------------

def header(title):
    print("\n" + "=" * 52)
    print(f"  {title}")
    print("=" * 52)


def show_entry(entry, index=None):
    prefix = f"{index}. " if index is not None else "   "
    mtype = entry.get("type", "Movie")
    rating = entry.get("rating")
    rating_str = f"{rating}/10" if rating is not None else "Not rated"
    cats = ", ".join(entry.get("categories", ["Other"]))
    print(f"\n{prefix}[{mtype}] {entry['title']} ({entry.get('year') or 'N/A'})")
    print(f"     Categories : {cats}")
    print(f"     Rating     : {rating_str}")
    if entry.get("notes"):
        print(f"     Notes      : {entry['notes']}")
    print(f"     Added      : {entry.get('added_date', 'N/A')}")


# ---------------------------------------------------------------------------
# TMDB helpers
# ---------------------------------------------------------------------------

def tmdb_search(title, media_type, api_key):
    """Return TMDB id for the best-matching title, or None."""
    endpoint = "movie" if media_type == "Movie" else "tv"
    try:
        r = requests.get(
            f"{TMDB_BASE}/search/{endpoint}",
            params={"api_key": api_key, "query": title},
            timeout=6,
        )
        results = r.json().get("results", []) if r.ok else []
        return results[0]["id"] if results else None
    except Exception:
        return None


def tmdb_recommendations(tmdb_id, media_type, api_key):
    """Fetch TMDB recommendations list for a given id/type."""
    endpoint = "movie" if media_type == "Movie" else "tv"
    try:
        r = requests.get(
            f"{TMDB_BASE}/{endpoint}/{tmdb_id}/recommendations",
            params={"api_key": api_key},
            timeout=6,
        )
        return r.json().get("results", []) if r.ok else []
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Menu actions
# ---------------------------------------------------------------------------

def add_entry(data):
    header("Add Movie / Show")

    print("\nType:  1. Movie   2. TV Show")
    media_type = "Show" if input("Select (1/2): ").strip() == "2" else "Movie"

    title = input("Title: ").strip()
    if not title:
        print("Title cannot be empty.")
        return

    year = input("Year  (Enter to skip): ").strip() or None

    print("\nCategories:")
    for i, c in enumerate(CATEGORIES, 1):
        print(f"  {i:2}. {c}")
    cats = []
    raw = input("Enter numbers separated by commas: ").strip()
    for tok in raw.split(","):
        try:
            idx = int(tok.strip()) - 1
            if 0 <= idx < len(CATEGORIES):
                cats.append(CATEGORIES[idx])
        except ValueError:
            pass
    if not cats:
        cats = ["Other"]

    rating = None
    raw_r = input("Rating 1-10 (Enter to skip): ").strip()
    if raw_r:
        try:
            v = float(raw_r)
            rating = v if 1 <= v <= 10 else None
        except ValueError:
            pass

    notes = input("Notes  (Enter to skip): ").strip() or None

    # Try to resolve TMDB id right away if key is available
    tmdb_id = None
    if REQUESTS_AVAILABLE:
        api_key = load_api_key()
        if api_key:
            tmdb_id = tmdb_search(title, media_type, api_key)

    entry = {
        "title": title,
        "type": media_type,
        "year": year,
        "categories": cats,
        "rating": rating,
        "notes": notes,
        "added_date": datetime.now().strftime("%Y-%m-%d"),
        "tmdb_id": tmdb_id,
    }

    bucket = "movies" if media_type == "Movie" else "shows"
    data[bucket].append(entry)
    save_data(data)
    print(f"\n  '{title}' added successfully!")


def view_all(data):
    header("All Movies & Shows")
    all_entries = data["movies"] + data["shows"]
    if not all_entries:
        print("\nNothing tracked yet. Use option 1 to add entries.")
        return

    print(f"\nTotal entries: {len(all_entries)}")
    print("Sort:  1. Date added (newest)  2. Rating (highest)  3. Title (A-Z)")
    sort = input("Select (default 1): ").strip() or "1"

    if sort == "2":
        all_entries = sorted(all_entries, key=lambda e: e.get("rating") or 0, reverse=True)
    elif sort == "3":
        all_entries = sorted(all_entries, key=lambda e: e["title"].lower())
    else:
        all_entries = sorted(all_entries, key=lambda e: e.get("added_date", ""), reverse=True)

    for i, e in enumerate(all_entries, 1):
        show_entry(e, i)


def view_by_category(data):
    header("Browse by Category")
    for i, c in enumerate(CATEGORIES, 1):
        print(f"  {i:2}. {c}")
    try:
        idx = int(input("\nSelect category number: ").strip()) - 1
        cat = CATEGORIES[idx]
    except (ValueError, IndexError):
        print("Invalid selection.")
        return

    header(f"Category: {cat}")
    entries = [e for e in data["movies"] + data["shows"] if cat in e.get("categories", [])]
    if not entries:
        print(f"\nNo entries in '{cat}'.")
        return
    for i, e in enumerate(entries, 1):
        show_entry(e, i)


def rate_entry(data):
    header("Rate a Movie / Show")
    all_entries = []
    for e in data["movies"]:
        all_entries.append(("movies", data["movies"].index(e), e))
    for e in data["shows"]:
        all_entries.append(("shows", data["shows"].index(e), e))

    if not all_entries:
        print("\nNothing to rate yet.")
        return

    for i, (_, _, e) in enumerate(all_entries, 1):
        r = e.get("rating")
        print(f"  {i}. {e['title']}  [{e.get('type','Movie')}]  — {f'{r}/10' if r else 'Not rated'}")

    try:
        choice = int(input("\nEntry number to rate: ").strip()) - 1
        bucket, idx, entry = all_entries[choice]
        raw = input(f"Rating for '{entry['title']}' (1-10): ").strip()
        v = float(raw)
        if not 1 <= v <= 10:
            raise ValueError
        data[bucket][idx]["rating"] = v
        save_data(data)
        print(f"\n  Rating set to {v}/10")
    except (ValueError, IndexError):
        print("Invalid input.")


def delete_entry(data):
    header("Delete Entry")
    all_entries = []
    for e in data["movies"]:
        all_entries.append(("movies", data["movies"].index(e), e))
    for e in data["shows"]:
        all_entries.append(("shows", data["shows"].index(e), e))

    if not all_entries:
        print("\nNothing to delete.")
        return

    for i, (_, _, e) in enumerate(all_entries, 1):
        print(f"  {i}. [{e.get('type','Movie')}] {e['title']}")

    try:
        choice = int(input("\nEntry number to delete (0 to cancel): ").strip())
        if choice == 0:
            return
        bucket, idx, entry = all_entries[choice - 1]
        confirm = input(f"Delete '{entry['title']}'? (y/n): ").strip().lower()
        if confirm == "y":
            data[bucket].pop(idx)
            save_data(data)
            print(f"\n  '{entry['title']}' deleted.")
    except (ValueError, IndexError):
        print("Invalid input.")


def get_recommendations(data):
    header("Get Recommendations")

    if not REQUESTS_AVAILABLE:
        print("\n'requests' is not installed.")
        print("Fix: pip install requests")
        return

    api_key = load_api_key()
    if not api_key:
        print("\nA free TMDB API key is required.")
        print("Register at https://www.themoviedb.org/ then go to Settings > API.")
        api_key = input("Paste your API key (or Enter to cancel): ").strip()
        if not api_key:
            return
        save_api_key(api_key)

    all_entries = data["movies"] + data["shows"]

    # Backfill any missing TMDB ids
    updated = False
    for e in all_entries:
        if not e.get("tmdb_id"):
            tid = tmdb_search(e["title"], e["type"], api_key)
            if tid:
                e["tmdb_id"] = tid
                updated = True
    if updated:
        save_data(data)

    rated = [e for e in all_entries if e.get("rating") and e.get("tmdb_id")]
    if not rated:
        print("\nNo rated entries with TMDB matches found.")
        print("Add and rate some titles first, then try again.")
        return

    rated.sort(key=lambda e: e["rating"], reverse=True)
    seeds = rated[:5]

    print("\nBasing recommendations on:")
    for e in seeds:
        print(f"  {e['title']} ({e['rating']}/10)")

    print("\nShow recommendations for:  1. Movies  2. TV Shows  3. Both")
    pref = input("Select (default 3): ").strip() or "3"

    existing_ids = {e["tmdb_id"] for e in all_entries if e.get("tmdb_id")}
    seen_ids = set()
    recs = []

    for seed in seeds:
        for mtype in (["movie"] if pref == "1" else ["tv"] if pref == "2" else ["movie", "tv"]):
            for item in tmdb_recommendations(seed["tmdb_id"], seed["type"], api_key):
                if item["id"] not in seen_ids and item["id"] not in existing_ids:
                    item["_rec_type"] = "Movie" if mtype == "movie" else "TV Show"
                    recs.append(item)
                    seen_ids.add(item["id"])

    if not recs:
        print("\nNo new recommendations found. Try rating more titles.")
        return

    recs.sort(key=lambda x: x.get("vote_average", 0), reverse=True)

    header("Recommended For You")
    for i, rec in enumerate(recs[:10], 1):
        title = rec.get("title") or rec.get("name", "Unknown")
        year = (rec.get("release_date") or rec.get("first_air_date") or "")[:4]
        score = rec.get("vote_average", 0)
        overview = rec.get("overview", "No description available.")
        short = overview[:120] + ("..." if len(overview) > 120 else "")
        print(f"\n{i}. [{rec['_rec_type']}] {title} ({year})  —  TMDB: {score:.1f}/10")
        print(f"   {short}")


def view_stats(data):
    header("Your Stats")
    movies = data["movies"]
    shows = data["shows"]
    all_entries = movies + shows
    rated = [e for e in all_entries if e.get("rating") is not None]

    print(f"\n  Movies        : {len(movies)}")
    print(f"  TV Shows      : {len(shows)}")
    print(f"  Total         : {len(all_entries)}")
    print(f"  Rated         : {len(rated)}")

    if rated:
        avg = sum(e["rating"] for e in rated) / len(rated)
        best = max(rated, key=lambda e: e["rating"])
        print(f"\n  Avg rating    : {avg:.1f}/10")
        print(f"  Top rated     : {best['title']} ({best['rating']}/10)")

    cat_counts: dict = {}
    for e in all_entries:
        for c in e.get("categories", []):
            cat_counts[c] = cat_counts.get(c, 0) + 1
    if cat_counts:
        print("\n  Top categories:")
        for c, n in sorted(cat_counts.items(), key=lambda x: -x[1])[:5]:
            print(f"    {c}: {n}")


def setup_api_key():
    header("TMDB API Key Setup")
    current = load_api_key()
    if current:
        print(f"\n  Current key: {current[:8]}...")
        if input("  Replace it? (y/n): ").strip().lower() != "y":
            return
    print("\n  Get a free key at https://www.themoviedb.org/settings/api")
    key = input("  Paste new key: ").strip()
    if key:
        save_api_key(key)
        print("  API key saved.")


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

MENU = """
  1. Add Movie / Show
  2. View All
  3. Browse by Category
  4. Rate an Entry
  5. Get Recommendations
  6. View Stats
  7. Delete Entry
  8. Setup TMDB API Key
  9. Exit
"""

def main():
    print("\n+----------------------------------+")
    print("|    Movie & Show Tracker          |")
    print("+----------------------------------+")

    data = load_data()

    while True:
        print(MENU)
        choice = input("Select option: ").strip()

        if choice == "1":
            add_entry(data)
        elif choice == "2":
            view_all(data)
        elif choice == "3":
            view_by_category(data)
        elif choice == "4":
            rate_entry(data)
        elif choice == "5":
            get_recommendations(data)
        elif choice == "6":
            view_stats(data)
        elif choice == "7":
            delete_entry(data)
        elif choice == "8":
            setup_api_key()
        elif choice == "9":
            print("\nGoodbye!")
            break
        else:
            print("  Invalid option, try again.")

        input("\nPress Enter to continue...")


if __name__ == "__main__":
    main()
