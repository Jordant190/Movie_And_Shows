# Movie & Show Tracker

A command-line app to track movies and TV shows, rate them 1-10, and get free personalized recommendations.

## Features

- Add movies and TV shows with categories (Action, Comedy, Drama, etc.)
- Rate entries from 1 to 10
- Browse your list sorted by date, rating, or title
- Filter by category
- Get recommendations powered by the free [TMDB API](https://www.themoviedb.org/)
- View personal stats (average rating, top categories, etc.)

## Requirements

- Python 3.7+
- `requests` library (for recommendations)

## How to Run

### 1. Install Python

Download from https://www.python.org/downloads/ if you don't have it.

### 2. Install dependencies

Open a command prompt in this folder and run:

```
pip install -r requirements.txt
```

### 3. Run the app

```
python tracker.py
```

On Mac/Linux you can also use:

```
python3 tracker.py
```

## Recommendations (Free)

Recommendations use the TMDB API, which is completely free.

1. Create a free account at https://www.themoviedb.org/
2. Go to **Settings > API** and request a free API key
3. In the app, select **Option 8 - Setup TMDB API Key** and paste your key

After that, add and rate some movies/shows, then use **Option 5 - Get Recommendations**.

## Data Storage

All your data is saved locally in `movies.json` in the same folder.
