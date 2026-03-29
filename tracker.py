#!/usr/bin/env python3
"""Movie & Show Tracker — Modern GUI Application."""

import json
import os
import threading
from datetime import datetime
from tkinter import messagebox

import customtkinter as ctk

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

# ── App theme ──────────────────────────────────────────────────────────────
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# ── Constants ──────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_FILE  = os.path.join(BASE_DIR, "movies.json")
KEY_FILE   = os.path.join(BASE_DIR, ".tmdb_api_key")
TMDB_BASE  = "https://api.themoviedb.org/3"

CATEGORIES = [
    "Action", "Adventure", "Animation", "Comedy", "Crime",
    "Documentary", "Drama", "Fantasy", "Horror", "Mystery",
    "Romance", "Sci-Fi", "Thriller", "Western", "Other",
]

NAV_ITEMS = ["Dashboard", "Movies & Shows", "Recommendations", "Settings"]


# ── Data helpers ───────────────────────────────────────────────────────────

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return {"movies": [], "shows": []}


def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def load_key():
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "r") as f:
            return f.read().strip()
    return ""


def save_key(k):
    with open(KEY_FILE, "w") as f:
        f.write(k)


# ── TMDB helpers ───────────────────────────────────────────────────────────

def tmdb_search_id(title, mtype, api_key):
    ep = "movie" if mtype == "Movie" else "tv"
    try:
        r = requests.get(f"{TMDB_BASE}/search/{ep}",
                         params={"api_key": api_key, "query": title}, timeout=6)
        res = r.json().get("results", []) if r.ok else []
        return res[0]["id"] if res else None
    except Exception:
        return None


def tmdb_recs(tmdb_id, mtype, api_key):
    ep = "movie" if mtype == "Movie" else "tv"
    try:
        r = requests.get(f"{TMDB_BASE}/{ep}/{tmdb_id}/recommendations",
                         params={"api_key": api_key}, timeout=6)
        return r.json().get("results", []) if r.ok else []
    except Exception:
        return []


# ── Utility ────────────────────────────────────────────────────────────────

def rating_color(rating):
    if rating is None:
        return "#888888"
    if rating >= 7:
        return "#4caf50"
    if rating >= 5:
        return "#ff9800"
    return "#f44336"


# ══════════════════════════════════════════════════════════════════════════
# Add / Edit Dialog
# ══════════════════════════════════════════════════════════════════════════

class EntryDialog(ctk.CTkToplevel):
    """Modal dialog for adding or editing a movie/show entry."""

    def __init__(self, parent, entry=None, on_save=None):
        super().__init__(parent)
        self.on_save = on_save
        self.entry   = entry or {}

        self.title("Edit Entry" if entry else "Add Movie / Show")
        self.geometry("540x680")
        self.resizable(False, False)
        self.grab_set()

        self._build()
        self._populate()

    # ── Build UI ──────────────────────────────────────────────────────────

    def _build(self):
        pad = {"padx": 20, "pady": (6, 0)}

        # Type
        ctk.CTkLabel(self, text="Type", anchor="w").pack(fill="x", **pad)
        self.type_var = ctk.StringVar(value="Movie")
        row = ctk.CTkFrame(self, fg_color="transparent")
        row.pack(fill="x", padx=20, pady=(4, 0))
        ctk.CTkRadioButton(row, text="Movie",   variable=self.type_var, value="Movie").pack(side="left", padx=(0, 20))
        ctk.CTkRadioButton(row, text="TV Show", variable=self.type_var, value="Show").pack(side="left")

        # Title
        ctk.CTkLabel(self, text="Title *", anchor="w").pack(fill="x", **pad)
        self.title_entry = ctk.CTkEntry(self, placeholder_text="e.g. Inception")
        self.title_entry.pack(fill="x", padx=20, pady=(4, 0))

        # Year
        ctk.CTkLabel(self, text="Year", anchor="w").pack(fill="x", **pad)
        self.year_entry = ctk.CTkEntry(self, placeholder_text="e.g. 2010")
        self.year_entry.pack(fill="x", padx=20, pady=(4, 0))

        # Categories
        ctk.CTkLabel(self, text="Categories", anchor="w").pack(fill="x", **pad)
        cat_frame = ctk.CTkScrollableFrame(self, height=110)
        cat_frame.pack(fill="x", padx=20, pady=(4, 0))
        self.cat_vars = {}
        cols = 3
        for i, cat in enumerate(CATEGORIES):
            v = ctk.BooleanVar()
            self.cat_vars[cat] = v
            cb = ctk.CTkCheckBox(cat_frame, text=cat, variable=v, width=140)
            cb.grid(row=i // cols, column=i % cols, sticky="w", padx=4, pady=2)

        # Rating
        ctk.CTkLabel(self, text="Rating  (drag slider or leave at 0 = not rated)",
                     anchor="w").pack(fill="x", **pad)
        self.rating_label = ctk.CTkLabel(self, text="0 / 10", width=60)
        self.rating_label.pack(anchor="e", padx=24)
        self.rating_slider = ctk.CTkSlider(self, from_=0, to=10, number_of_steps=20,
                                           command=self._on_rating)
        self.rating_slider.pack(fill="x", padx=20)
        self.rating_slider.set(0)

        # Notes
        ctk.CTkLabel(self, text="Notes", anchor="w").pack(fill="x", **pad)
        self.notes_box = ctk.CTkTextbox(self, height=60)
        self.notes_box.pack(fill="x", padx=20, pady=(4, 0))

        # Buttons
        btn_row = ctk.CTkFrame(self, fg_color="transparent")
        btn_row.pack(fill="x", padx=20, pady=16)
        ctk.CTkButton(btn_row, text="Cancel", fg_color="#555", hover_color="#444",
                      command=self.destroy).pack(side="left", expand=True, fill="x", padx=(0, 8))
        ctk.CTkButton(btn_row, text="Save",
                      command=self._save).pack(side="left", expand=True, fill="x")

    def _on_rating(self, val):
        self.rating_label.configure(text=f"{float(val):.1f} / 10")

    # ── Populate (edit mode) ──────────────────────────────────────────────

    def _populate(self):
        e = self.entry
        if not e:
            return
        self.type_var.set(e.get("type", "Movie"))
        self.title_entry.insert(0, e.get("title", ""))
        self.year_entry.insert(0, e.get("year") or "")
        for cat in e.get("categories", []):
            if cat in self.cat_vars:
                self.cat_vars[cat].set(True)
        r = e.get("rating") or 0
        self.rating_slider.set(r)
        self.rating_label.configure(text=f"{float(r):.1f} / 10")
        if e.get("notes"):
            self.notes_box.insert("1.0", e["notes"])

    # ── Save ──────────────────────────────────────────────────────────────

    def _save(self):
        title = self.title_entry.get().strip()
        if not title:
            messagebox.showwarning("Missing title", "Please enter a title.", parent=self)
            return

        cats = [c for c, v in self.cat_vars.items() if v.get()] or ["Other"]
        r    = round(self.rating_slider.get(), 1)
        rating = r if r > 0 else None
        notes  = self.notes_box.get("1.0", "end").strip() or None
        year   = self.year_entry.get().strip() or None

        result = dict(self.entry)
        result.update({
            "title":      title,
            "type":       self.type_var.get(),
            "year":       year,
            "categories": cats,
            "rating":     rating,
            "notes":      notes,
        })
        if "added_date" not in result:
            result["added_date"] = datetime.now().strftime("%Y-%m-%d")
        if "tmdb_id" not in result:
            result["tmdb_id"] = None

        if self.on_save:
            self.on_save(result)
        self.destroy()


# ══════════════════════════════════════════════════════════════════════════
# Entry Card widget
# ══════════════════════════════════════════════════════════════════════════

class EntryCard(ctk.CTkFrame):
    def __init__(self, parent, entry, on_edit, on_delete, **kwargs):
        super().__init__(parent, corner_radius=10, **kwargs)
        self._build(entry, on_edit, on_delete)

    def _build(self, entry, on_edit, on_delete):
        # Left: text info
        left = ctk.CTkFrame(self, fg_color="transparent")
        left.pack(side="left", fill="both", expand=True, padx=12, pady=10)

        mtype  = entry.get("type", "Movie")
        year   = entry.get("year") or ""
        cats   = ", ".join(entry.get("categories", []))
        rating = entry.get("rating")
        rstr   = f"{rating}/10" if rating else "Not rated"
        rcol   = rating_color(rating)

        title_row = ctk.CTkFrame(left, fg_color="transparent")
        title_row.pack(fill="x")

        ctk.CTkLabel(title_row, text=entry["title"],
                     font=ctk.CTkFont(size=15, weight="bold"),
                     anchor="w").pack(side="left")
        if year:
            ctk.CTkLabel(title_row, text=f"  ({year})",
                         text_color="#888", anchor="w").pack(side="left")

        badge_color = "#1a6eb5" if mtype == "Movie" else "#7b2d8b"
        ctk.CTkLabel(left, text=f"{mtype}  •  {cats}",
                     text_color="#aaa", anchor="w",
                     font=ctk.CTkFont(size=12)).pack(fill="x")

        if entry.get("notes"):
            ctk.CTkLabel(left, text=entry["notes"],
                         text_color="#888", anchor="w",
                         font=ctk.CTkFont(size=11),
                         wraplength=480).pack(fill="x")

        # Right: rating + buttons
        right = ctk.CTkFrame(self, fg_color="transparent")
        right.pack(side="right", padx=12, pady=10)

        ctk.CTkLabel(right, text=rstr,
                     text_color=rcol,
                     font=ctk.CTkFont(size=14, weight="bold")).pack(pady=(0, 8))

        ctk.CTkButton(right, text="Edit", width=70, height=28,
                      command=on_edit).pack(pady=2)
        ctk.CTkButton(right, text="Delete", width=70, height=28,
                      fg_color="#8b0000", hover_color="#6b0000",
                      command=on_delete).pack(pady=2)


# ══════════════════════════════════════════════════════════════════════════
# Pages
# ══════════════════════════════════════════════════════════════════════════

class DashboardPage(ctk.CTkFrame):
    def __init__(self, parent, app, **kw):
        super().__init__(parent, fg_color="transparent", **kw)
        self.app = app
        self._build()

    def refresh(self):
        for w in self.winfo_children():
            w.destroy()
        self._build()

    def _build(self):
        data = self.app.data
        all_e = data["movies"] + data["shows"]
        rated = [e for e in all_e if e.get("rating")]

        ctk.CTkLabel(self, text="Dashboard",
                     font=ctk.CTkFont(size=24, weight="bold")).pack(anchor="w", pady=(0, 20))

        # Stat cards row
        stats_row = ctk.CTkFrame(self, fg_color="transparent")
        stats_row.pack(fill="x", pady=(0, 20))

        def stat_card(parent, label, value, color):
            f = ctk.CTkFrame(parent, corner_radius=12)
            f.pack(side="left", expand=True, fill="both", padx=6)
            ctk.CTkLabel(f, text=str(value),
                         font=ctk.CTkFont(size=32, weight="bold"),
                         text_color=color).pack(pady=(16, 4))
            ctk.CTkLabel(f, text=label,
                         text_color="#aaa",
                         font=ctk.CTkFont(size=13)).pack(pady=(0, 16))

        stat_card(stats_row, "Movies",     len(data["movies"]), "#4a9eff")
        stat_card(stats_row, "TV Shows",   len(data["shows"]),  "#b05ae8")
        stat_card(stats_row, "Rated",      len(rated),          "#ff9800")
        avg = (sum(e["rating"] for e in rated) / len(rated)) if rated else 0
        stat_card(stats_row, "Avg Rating", f"{avg:.1f}",        rating_color(avg) if rated else "#888")

        # Recent additions
        ctk.CTkLabel(self, text="Recently Added",
                     font=ctk.CTkFont(size=16, weight="bold")).pack(anchor="w", pady=(10, 8))

        recent = sorted(all_e, key=lambda e: e.get("added_date", ""), reverse=True)[:5]
        if recent:
            for e in recent:
                self._mini_card(e)
        else:
            ctk.CTkLabel(self, text="Nothing added yet — go to Movies & Shows to get started!",
                         text_color="#888").pack(anchor="w")

        # Top rated
        if rated:
            ctk.CTkLabel(self, text="Top Rated",
                         font=ctk.CTkFont(size=16, weight="bold")).pack(anchor="w", pady=(20, 8))
            top = sorted(rated, key=lambda e: e["rating"], reverse=True)[:5]
            for e in top:
                self._mini_card(e)

    def _mini_card(self, e):
        f = ctk.CTkFrame(self, corner_radius=8, height=44)
        f.pack(fill="x", pady=3)
        f.pack_propagate(False)

        r = e.get("rating")
        ctk.CTkLabel(f, text=e["title"],
                     font=ctk.CTkFont(size=13, weight="bold"),
                     anchor="w").place(relx=0.01, rely=0.5, anchor="w")
        ctk.CTkLabel(f, text=f"{r}/10" if r else "—",
                     text_color=rating_color(r),
                     font=ctk.CTkFont(size=13, weight="bold"),
                     anchor="e").place(relx=0.99, rely=0.5, anchor="e")


# ─────────────────────────────────────────────────────────────────────────

class ListPage(ctk.CTkFrame):
    def __init__(self, parent, app, **kw):
        super().__init__(parent, fg_color="transparent", **kw)
        self.app = app
        self._build()

    def refresh(self):
        self._reload_cards()

    def _build(self):
        # Top bar
        top = ctk.CTkFrame(self, fg_color="transparent")
        top.pack(fill="x", pady=(0, 12))

        ctk.CTkLabel(top, text="Movies & Shows",
                     font=ctk.CTkFont(size=24, weight="bold")).pack(side="left")
        ctk.CTkButton(top, text="+ Add", width=90,
                      command=self._add).pack(side="right")

        # Filters
        ctrl = ctk.CTkFrame(self, fg_color="transparent")
        ctrl.pack(fill="x", pady=(0, 10))

        self.search_var = ctk.StringVar()
        self.search_var.trace_add("write", lambda *_: self._reload_cards())
        ctk.CTkEntry(ctrl, placeholder_text="Search...",
                     textvariable=self.search_var,
                     width=200).pack(side="left", padx=(0, 8))

        self.filter_type = ctk.CTkOptionMenu(ctrl,
            values=["All Types", "Movie", "TV Show"],
            command=lambda _: self._reload_cards(), width=120)
        self.filter_type.pack(side="left", padx=(0, 8))

        self.filter_cat = ctk.CTkOptionMenu(ctrl,
            values=["All Categories"] + CATEGORIES,
            command=lambda _: self._reload_cards(), width=150)
        self.filter_cat.pack(side="left", padx=(0, 8))

        self.sort_by = ctk.CTkOptionMenu(ctrl,
            values=["Newest First", "Highest Rated", "Title A-Z"],
            command=lambda _: self._reload_cards(), width=150)
        self.sort_by.pack(side="left")

        # Scrollable card list
        self.scroll = ctk.CTkScrollableFrame(self)
        self.scroll.pack(fill="both", expand=True)

        self._reload_cards()

    def _reload_cards(self):
        for w in self.scroll.winfo_children():
            w.destroy()

        data = self.app.data
        all_e = data["movies"] + data["shows"]

        q     = self.search_var.get().lower()
        ftype = self.filter_type.get()
        fcat  = self.filter_cat.get()
        sort  = self.sort_by.get()

        filtered = []
        for e in all_e:
            if q and q not in e["title"].lower():
                continue
            if ftype != "All Types":
                want = "Movie" if ftype == "Movie" else "Show"
                if e.get("type") != want:
                    continue
            if fcat != "All Categories" and fcat not in e.get("categories", []):
                continue
            filtered.append(e)

        if sort == "Highest Rated":
            filtered.sort(key=lambda e: e.get("rating") or 0, reverse=True)
        elif sort == "Title A-Z":
            filtered.sort(key=lambda e: e["title"].lower())
        else:
            filtered.sort(key=lambda e: e.get("added_date", ""), reverse=True)

        if not filtered:
            ctk.CTkLabel(self.scroll,
                         text="No entries match your filters.",
                         text_color="#888").pack(pady=40)
            return

        for e in filtered:
            def make_edit(entry=e):
                return lambda: self._edit(entry)
            def make_delete(entry=e):
                return lambda: self._delete(entry)

            card = EntryCard(self.scroll, e,
                             on_edit=make_edit(),
                             on_delete=make_delete())
            card.pack(fill="x", pady=4, padx=2)

    def _add(self):
        EntryDialog(self, on_save=self._save_new)

    def _save_new(self, result):
        bucket = "movies" if result["type"] == "Movie" else "shows"
        self.app.data[bucket].append(result)
        save_data(self.app.data)
        self._reload_cards()
        self.app.refresh_all()

    def _edit(self, entry):
        def on_save(result):
            bucket = "movies" if result["type"] == "Movie" else "shows"
            old_bucket = "movies" if entry.get("type") == "Movie" else "shows"
            # Remove old, add updated
            try:
                self.app.data[old_bucket].remove(entry)
            except ValueError:
                pass
            self.app.data[bucket].append(result)
            save_data(self.app.data)
            self._reload_cards()
            self.app.refresh_all()

        EntryDialog(self, entry=entry, on_save=on_save)

    def _delete(self, entry):
        if messagebox.askyesno("Delete",
                               f"Delete '{entry['title']}'?",
                               parent=self):
            bucket = "movies" if entry.get("type") == "Movie" else "shows"
            try:
                self.app.data[bucket].remove(entry)
            except ValueError:
                pass
            save_data(self.app.data)
            self._reload_cards()
            self.app.refresh_all()


# ─────────────────────────────────────────────────────────────────────────

class RecommendationsPage(ctk.CTkFrame):
    def __init__(self, parent, app, **kw):
        super().__init__(parent, fg_color="transparent", **kw)
        self.app = app
        self._build()

    def refresh(self):
        pass

    def _build(self):
        ctk.CTkLabel(self, text="Recommendations",
                     font=ctk.CTkFont(size=24, weight="bold")).pack(anchor="w", pady=(0, 12))

        info = ctk.CTkFrame(self, corner_radius=10)
        info.pack(fill="x", pady=(0, 16))
        ctk.CTkLabel(info,
                     text="Powered by the free TMDB API. Rate movies & shows first, then fetch recommendations.",
                     text_color="#aaa", wraplength=700,
                     font=ctk.CTkFont(size=13)).pack(padx=16, pady=12)

        ctrl = ctk.CTkFrame(self, fg_color="transparent")
        ctrl.pack(fill="x", pady=(0, 12))

        self.rec_type = ctk.CTkOptionMenu(ctrl,
            values=["Both", "Movies Only", "TV Shows Only"], width=160)
        self.rec_type.pack(side="left", padx=(0, 10))

        self.fetch_btn = ctk.CTkButton(ctrl, text="Fetch Recommendations",
                                       command=self._fetch)
        self.fetch_btn.pack(side="left")

        self.status_label = ctk.CTkLabel(ctrl, text="", text_color="#aaa")
        self.status_label.pack(side="left", padx=12)

        self.scroll = ctk.CTkScrollableFrame(self)
        self.scroll.pack(fill="both", expand=True)

    def _fetch(self):
        if not REQUESTS_AVAILABLE:
            messagebox.showerror("Missing library",
                                 "requests is not installed.\nRun: pip install requests")
            return

        api_key = load_key()
        if not api_key:
            messagebox.showinfo("API Key Required",
                "A free TMDB API key is needed.\n\n"
                "1. Register at themoviedb.org\n"
                "2. Go to Settings > API\n"
                "3. Add your key in the Settings tab.")
            return

        self.fetch_btn.configure(state="disabled")
        self.status_label.configure(text="Fetching...")
        threading.Thread(target=self._fetch_thread, args=(api_key,), daemon=True).start()

    def _fetch_thread(self, api_key):
        data = self.app.data
        all_e = data["movies"] + data["shows"]

        # Back-fill TMDB ids
        updated = False
        for e in all_e:
            if not e.get("tmdb_id"):
                tid = tmdb_search_id(e["title"], e["type"], api_key)
                if tid:
                    e["tmdb_id"] = tid
                    updated = True
        if updated:
            save_data(data)

        rated = sorted(
            [e for e in all_e if e.get("rating") and e.get("tmdb_id")],
            key=lambda e: e["rating"], reverse=True
        )[:5]

        if not rated:
            self.after(0, self._show_error,
                       "No rated entries with TMDB matches.\nAdd and rate some titles first.")
            return

        pref     = self.rec_type.get()
        existing = {e["tmdb_id"] for e in all_e if e.get("tmdb_id")}
        seen     = set()
        recs     = []

        for seed in rated:
            types_to_try = []
            if pref in ("Both", "Movies Only"):
                types_to_try.append("Movie")
            if pref in ("Both", "TV Shows Only"):
                types_to_try.append("Show")

            for mt in types_to_try:
                for item in tmdb_recs(seed["tmdb_id"], mt, api_key):
                    if item["id"] not in seen and item["id"] not in existing:
                        item["_rec_type"] = "Movie" if mt == "Movie" else "TV Show"
                        recs.append(item)
                        seen.add(item["id"])

        recs.sort(key=lambda x: x.get("vote_average", 0), reverse=True)
        self.after(0, self._show_recs, recs[:15])

    def _show_error(self, msg):
        self.fetch_btn.configure(state="normal")
        self.status_label.configure(text="")
        for w in self.scroll.winfo_children():
            w.destroy()
        ctk.CTkLabel(self.scroll, text=msg, text_color="#f88").pack(pady=30)

    def _show_recs(self, recs):
        self.fetch_btn.configure(state="normal")
        self.status_label.configure(text=f"{len(recs)} recommendations found")
        for w in self.scroll.winfo_children():
            w.destroy()

        if not recs:
            ctk.CTkLabel(self.scroll,
                         text="No recommendations found. Try rating more entries.",
                         text_color="#888").pack(pady=30)
            return

        for rec in recs:
            title   = rec.get("title") or rec.get("name", "Unknown")
            year    = (rec.get("release_date") or rec.get("first_air_date") or "")[:4]
            score   = rec.get("vote_average", 0)
            overview = rec.get("overview", "")
            rtype   = rec.get("_rec_type", "")

            card = ctk.CTkFrame(self.scroll, corner_radius=10)
            card.pack(fill="x", pady=4, padx=2)

            left = ctk.CTkFrame(card, fg_color="transparent")
            left.pack(side="left", fill="both", expand=True, padx=12, pady=10)

            title_row = ctk.CTkFrame(left, fg_color="transparent")
            title_row.pack(fill="x")
            ctk.CTkLabel(title_row,
                         text=title,
                         font=ctk.CTkFont(size=14, weight="bold"),
                         anchor="w").pack(side="left")
            if year:
                ctk.CTkLabel(title_row, text=f"  ({year})",
                             text_color="#888").pack(side="left")
            ctk.CTkLabel(left, text=rtype, text_color="#aaa",
                         font=ctk.CTkFont(size=12), anchor="w").pack(fill="x")
            if overview:
                short = overview[:130] + ("..." if len(overview) > 130 else "")
                ctk.CTkLabel(left, text=short,
                             text_color="#888",
                             font=ctk.CTkFont(size=11),
                             wraplength=560, anchor="w",
                             justify="left").pack(fill="x")

            right = ctk.CTkFrame(card, fg_color="transparent")
            right.pack(side="right", padx=12, pady=10)
            ctk.CTkLabel(right, text=f"{score:.1f}/10",
                         text_color=rating_color(score),
                         font=ctk.CTkFont(size=14, weight="bold")).pack()
            ctk.CTkLabel(right, text="TMDB", text_color="#666",
                         font=ctk.CTkFont(size=10)).pack()

            def make_add(r=rec, rt=rtype):
                return lambda: self._add_from_rec(r, rt)
            ctk.CTkButton(right, text="+ Add", width=70, height=26,
                          command=make_add()).pack(pady=(6, 0))

    def _add_from_rec(self, rec, rtype):
        title = rec.get("title") or rec.get("name", "")
        year  = (rec.get("release_date") or rec.get("first_air_date") or "")[:4]
        prefill = {
            "title":      title,
            "type":       "Movie" if rtype == "Movie" else "Show",
            "year":       year,
            "categories": [],
            "rating":     None,
            "notes":      None,
            "tmdb_id":    rec.get("id"),
        }

        def on_save(result):
            bucket = "movies" if result["type"] == "Movie" else "shows"
            self.app.data[bucket].append(result)
            save_data(self.app.data)
            self.app.refresh_all()

        EntryDialog(self, entry=prefill, on_save=on_save)


# ─────────────────────────────────────────────────────────────────────────

class SettingsPage(ctk.CTkFrame):
    def __init__(self, parent, app, **kw):
        super().__init__(parent, fg_color="transparent", **kw)
        self.app = app
        self._build()

    def refresh(self):
        pass

    def _build(self):
        ctk.CTkLabel(self, text="Settings",
                     font=ctk.CTkFont(size=24, weight="bold")).pack(anchor="w", pady=(0, 20))

        # TMDB API
        box = ctk.CTkFrame(self, corner_radius=12)
        box.pack(fill="x", pady=(0, 16))

        ctk.CTkLabel(box, text="TMDB API Key",
                     font=ctk.CTkFont(size=15, weight="bold"),
                     anchor="w").pack(fill="x", padx=16, pady=(14, 4))
        ctk.CTkLabel(box,
                     text="Required for recommendations. Free at themoviedb.org → Settings → API",
                     text_color="#aaa", anchor="w",
                     font=ctk.CTkFont(size=12)).pack(fill="x", padx=16)

        self.key_entry = ctk.CTkEntry(box, placeholder_text="Paste API key here",
                                      show="*", width=400)
        self.key_entry.pack(padx=16, pady=8, anchor="w")
        existing = load_key()
        if existing:
            self.key_entry.insert(0, existing)

        ctk.CTkButton(box, text="Save Key", width=120,
                      command=self._save_key).pack(padx=16, pady=(0, 14), anchor="w")

        # Appearance
        box2 = ctk.CTkFrame(self, corner_radius=12)
        box2.pack(fill="x", pady=(0, 16))
        ctk.CTkLabel(box2, text="Appearance",
                     font=ctk.CTkFont(size=15, weight="bold"),
                     anchor="w").pack(fill="x", padx=16, pady=(14, 4))

        mode_row = ctk.CTkFrame(box2, fg_color="transparent")
        mode_row.pack(fill="x", padx=16, pady=(0, 14))
        ctk.CTkLabel(mode_row, text="Theme:").pack(side="left", padx=(0, 8))
        ctk.CTkOptionMenu(mode_row,
            values=["Dark", "Light", "System"],
            command=lambda v: ctk.set_appearance_mode(v.lower()),
            width=120).pack(side="left")

        # Stats box
        box3 = ctk.CTkFrame(self, corner_radius=12)
        box3.pack(fill="x")
        ctk.CTkLabel(box3, text="Library Stats",
                     font=ctk.CTkFont(size=15, weight="bold"),
                     anchor="w").pack(fill="x", padx=16, pady=(14, 4))

        data = self.app.data
        all_e = data["movies"] + data["shows"]
        rated = [e for e in all_e if e.get("rating")]
        avg   = (sum(e["rating"] for e in rated) / len(rated)) if rated else 0

        stats_text = (
            f"Total Movies:    {len(data['movies'])}\n"
            f"Total TV Shows:  {len(data['shows'])}\n"
            f"Rated Entries:   {len(rated)}\n"
            f"Average Rating:  {avg:.1f} / 10"
        )
        ctk.CTkLabel(box3, text=stats_text,
                     text_color="#ccc", justify="left",
                     font=ctk.CTkFont(size=13, family="Courier")).pack(
                         padx=16, pady=(0, 14), anchor="w")

    def _save_key(self):
        k = self.key_entry.get().strip()
        if k:
            save_key(k)
            messagebox.showinfo("Saved", "API key saved!", parent=self)
        else:
            messagebox.showwarning("Empty", "Please paste a key first.", parent=self)


# ══════════════════════════════════════════════════════════════════════════
# Main Application Window
# ══════════════════════════════════════════════════════════════════════════

class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Movie & Show Tracker")
        self.geometry("1100x720")
        self.minsize(900, 600)

        self.data = load_data()
        self._current_nav = None
        self._pages = {}

        self._build()
        self._nav("Dashboard")

    def _build(self):
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # ── Sidebar ──────────────────────────────────────────────────────
        sidebar = ctk.CTkFrame(self, width=210, corner_radius=0)
        sidebar.grid(row=0, column=0, sticky="nsew")
        sidebar.grid_rowconfigure(len(NAV_ITEMS) + 2, weight=1)
        sidebar.grid_propagate(False)

        ctk.CTkLabel(sidebar, text="Movie &\nShow Tracker",
                     font=ctk.CTkFont(size=18, weight="bold"),
                     justify="left").grid(row=0, column=0, padx=20, pady=(24, 20), sticky="w")

        self._nav_btns = {}
        for i, name in enumerate(NAV_ITEMS):
            btn = ctk.CTkButton(sidebar, text=name, anchor="w",
                                fg_color="transparent",
                                hover_color=("gray75", "gray25"),
                                text_color=("gray10", "gray90"),
                                font=ctk.CTkFont(size=14),
                                height=40,
                                command=lambda n=name: self._nav(n))
            btn.grid(row=i + 1, column=0, padx=10, pady=2, sticky="ew")
            self._nav_btns[name] = btn

        # ── Main content ──────────────────────────────────────────────────
        self._content = ctk.CTkFrame(self, fg_color="transparent")
        self._content.grid(row=0, column=1, sticky="nsew", padx=24, pady=24)
        self._content.grid_columnconfigure(0, weight=1)
        self._content.grid_rowconfigure(0, weight=1)

    def _nav(self, name):
        if self._current_nav == name and name in self._pages:
            return

        # Highlight active button
        for n, btn in self._nav_btns.items():
            btn.configure(fg_color=("#3a7ebf" if n == name else "transparent"),
                          text_color=("white" if n == name else ("gray10", "gray90")))

        # Destroy current page
        for w in self._content.winfo_children():
            w.destroy()
        self._pages.clear()

        page_cls = {
            "Dashboard":       DashboardPage,
            "Movies & Shows":  ListPage,
            "Recommendations": RecommendationsPage,
            "Settings":        SettingsPage,
        }[name]

        page = page_cls(self._content, self)
        page.grid(row=0, column=0, sticky="nsew")
        self._pages[name] = page
        self._current_nav = name

    def refresh_all(self):
        for page in self._pages.values():
            if hasattr(page, "refresh"):
                page.refresh()


# ══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    app = App()
    app.mainloop()
