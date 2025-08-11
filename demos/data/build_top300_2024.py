#!/usr/bin/env python3
# build_top300_2024.py
# Produces: top300_2024.csv with header:
# id,name,team,position,byeWeek,injuryStatus,points,adp

import time
import sys
import math
import re
from typing import Dict, Optional, List

import pandas as pd
import cloudscraper
from bs4 import BeautifulSoup

PFR_URL = "https://www.pro-football-reference.com/years/2024/fantasy.htm"  # players + PPR
FP_K_URL = "https://www.fantasypros.com/nfl/stats/k.php"                   # top kickers (FPTS)
FP_DST_URL = "https://www.fantasypros.com/nfl/stats/dst.php"               # top DST (FPTS)
FP_BYE_URL = "https://www.fantasypros.com/nfl/bye-weeks.php"               # bye weeks table

# Team code normalizers
PFR_TO_STD = {
    "GNB": "GB", "KAN": "KC", "NWE": "NE", "NOR": "NO", "SFO": "SF", "TAM": "TB",
    "LVR": "LV", "SDG": "LAC", "STL": "LAR", "OAK": "LV", "WSH": "WAS",
    # pass-through for modern codes
    "ARI":"ARI","ATL":"ATL","BAL":"BAL","BUF":"BUF","CAR":"CAR","CHI":"CHI","CIN":"CIN","CLE":"CLE",
    "DAL":"DAL","DEN":"DEN","DET":"DET","HOU":"HOU","IND":"IND","JAX":"JAX","LAC":"LAC","LAR":"LAR",
    "MIA":"MIA","MIN":"MIN","NE":"NE","NO":"NO","NYG":"NYG","NYJ":"NYJ","PHI":"PHI","PIT":"PIT",
    "SEA":"SEA","SF":"SF","TB":"TB","TEN":"TEN","WAS":"WAS","LV":"LV","GB":"GB","KC":"KC"
}

FP_TO_STD = {
    "ARI":"ARI","ATL":"ATL","BAL":"BAL","BUF":"BUF","CAR":"CAR","CHI":"CHI","CIN":"CIN","CLE":"CLE",
    "DAL":"DAL","DEN":"DEN","DET":"DET","HOU":"HOU","IND":"IND","JAC":"JAX","JAX":"JAX","KC":"KC",
    "LAC":"LAC","LAR":"LAR","LV":"LV","MIA":"MIA","MIN":"MIN","NE":"NE","NO":"NO","NYG":"NYG",
    "NYJ":"NYJ","PHI":"PHI","PIT":"PIT","SEA":"SEA","SF":"SF","TB":"TB","TEN":"TEN","WAS":"WAS","FA": None
}

TEAM_NAME_TO_STD = {
    "Arizona Cardinals":"ARI","Atlanta Falcons":"ATL","Baltimore Ravens":"BAL","Buffalo Bills":"BUF",
    "Carolina Panthers":"CAR","Chicago Bears":"CHI","Cincinnati Bengals":"CIN","Cleveland Browns":"CLE",
    "Dallas Cowboys":"DAL","Denver Broncos":"DEN","Detroit Lions":"DET","Green Bay Packers":"GB",
    "Houston Texans":"HOU","Indianapolis Colts":"IND","Jacksonville Jaguars":"JAX","Kansas City Chiefs":"KC",
    "Las Vegas Raiders":"LV","Los Angeles Chargers":"LAC","Los Angeles Rams":"LAR","Miami Dolphins":"MIA",
    "Minnesota Vikings":"MIN","New England Patriots":"NE","New Orleans Saints":"NO",
    "New York Giants":"NYG","New York Jets":"NYJ","Philadelphia Eagles":"PHI","Pittsburgh Steelers":"PIT",
    "San Francisco 49ers":"SF","Seattle Seahawks":"SEA","Tampa Bay Buccaneers":"TB",
    "Tennessee Titans":"TEN","Washington Commanders":"WAS"
}

ALLOWED_TEAMS = set(TEAM_NAME_TO_STD.values())

# Conservative fallback bye weeks (if FantasyPros parse fails).
# NOTE: These were compiled from 2024 public listings. If the parser succeeds, it will override these.
BYE_WEEK_FALLBACK = {
    "DET":5,"LAC":5,"PHI":5,"TEN":5,
    "KC":6,"LAR":6,"MIA":6,"MIN":6,
    "CHI":7,"DAL":7,
    # (Week 8 had no byes in 2024)
    "PIT":9,"SF":9,
    "CLE":10,"GB":10,"LV":10,"SEA":10,
    "ARI":11,"CAR":11,"NYG":11,"TB":11,
    "ATL":12,"BUF":12,"CIN":12,"JAX":12,"NO":12,"NYJ":12,
    "BAL":14,"DEN":14,"HOU":14,"IND":14,"NE":14,"WAS":14,
}

def create_scraper():
    # Emulate a real browser to avoid 403s
    return cloudscraper.create_scraper(
        browser={"browser": "firefox", "platform": "windows", "mobile": False}
    )

def fetch_html(scraper, url: str, retries: int = 3, backoff: float = 2.0) -> str:
    last_err = None
    for i in range(retries):
        try:
            resp = scraper.get(url, timeout=30)
            resp.raise_for_status()
            return resp.text
        except Exception as e:
            last_err = e
            time.sleep(backoff * (i + 1))
    raise last_err

def flatten_cols(cols):
    flat = []
    for c in cols:
        if isinstance(c, tuple):
            flat.append(c[-1])
        else:
            flat.append(c)
    return flat

def get_bye_weeks(scraper) -> Dict[str,int]:
    """Parse bye weeks from FantasyPros bye-weeks page. Fallback to BYE_WEEK_FALLBACK if needed."""
    try:
        html = fetch_html(scraper, FP_BYE_URL)
        # Try to find a table that has "Team" and either "Bye" or "Week" column
        tables = pd.read_html(html)
        mapping = {}
        for t in tables:
            t.columns = [str(c).strip() for c in t.columns]
            cols = set(t.columns)
            if ("Team" in cols) and (("Bye" in cols) or ("Bye Week" in cols) or ("Week" in cols)):
                # Normalize column name
                if "Bye" in t.columns:
                    bye_col = "Bye"
                elif "Bye Week" in t.columns:
                    bye_col = "Bye Week"
                else:
                    bye_col = "Week"
                df = t[["Team", bye_col]].dropna()
                # Team may be full name ("Dallas Cowboys") or code in parentheses; handle both
                for _, row in df.iterrows():
                    team_raw = str(row["Team"]).strip()
                    wk = int(str(row[bye_col]).strip())
                    code = None
                    # If format like "Cowboys (DAL)" keep the parenthetical code
                    m = re.search(r"\(([A-Z]{2,3})\)", team_raw)
                    if m:
                        code = FP_TO_STD.get(m.group(1))
                    else:
                        # Try full-name mapping
                        code = TEAM_NAME_TO_STD.get(team_raw)
                    if code in ALLOWED_TEAMS:
                        mapping[code] = wk
                if len(mapping) >= 28:  # sanity threshold
                    return mapping
        # If that failed, try a second approach: parse list sections by week
        soup = BeautifulSoup(html, "lxml")
        by_text = {}
        for header in soup.find_all(["h2","h3"]):
            txt = header.get_text(" ", strip=True)
            m = re.search(r"Week\s+(\d+)", txt)
            if not m:
                continue
            wk = int(m.group(1))
            ul = header.find_next("ul")
            if not ul:
                continue
            for li in ul.find_all("li"):
                tname = li.get_text(" ", strip=True)
                tcode = TEAM_NAME_TO_STD.get(tname)
                if tcode:
                    by_text[tcode] = wk
        if len(by_text) >= 28:
            return by_text
        # Fallback
        return BYE_WEEK_FALLBACK
    except Exception:
        return BYE_WEEK_FALLBACK

def get_pfr_players(scraper, n_players=290, bye_map: Optional[Dict[str,int]] = None) -> pd.DataFrame:
    html = fetch_html(scraper, PFR_URL)
    # PFR often wraps tables in HTML comments; pandas can still read them from the raw string
    tables = pd.read_html(html)
    target = None
    for t in tables:
        t.columns = flatten_cols(t.columns)
        cols = set(map(str, t.columns))
        if {"Player","Tm","FantPos"}.issubset(cols) and ("PPR" in cols or "PPR.1" in cols):
            target = t
            break
    if target is None:
        raise RuntimeError("Could not find PFR fantasy rankings table")

    df = target.copy()
    df = df[df["Player"].notna()].copy()
    # Clean player names (remove * + and trailing markers)
    df["Player"] = df["Player"].astype(str).str.replace(r"[*+]", "", regex=True).str.strip()
    # Drop multi-team aggregates
    df = df[~df["Tm"].astype(str).isin(["2TM","3TM","4TM"])]
    # Only offensive fantasy positions (K from FantasyPros)
    df = df[df["FantPos"].isin(["QB","RB","WR","TE"])]

    # Normalize team codes
    df["team"] = df["Tm"].map(PFR_TO_STD).fillna(df["Tm"])
    df = df[df["team"].isin(ALLOWED_TEAMS)]

    # PPR points
    ppr_col = "PPR" if "PPR" in df.columns else "PPR.1"
    df["points"] = pd.to_numeric(df[ppr_col], errors="coerce").fillna(0.0)

    # Take top n by PPR points
    df = df.sort_values("points", ascending=False).head(n_players).copy()

    # Map bye weeks (0 if missing)
    bye_map = bye_map or {}
    df["byeWeek"] = df["team"].map(bye_map).fillna(0).astype(int)

    out = pd.DataFrame({
        "name": df["Player"].astype(str),
        "team": df["team"].astype(str),
        "position": df["FantPos"].astype(str),
        "byeWeek": df["byeWeek"].astype(int),
        "injuryStatus": "NA",
        "points": df["points"].round(1)
    })
    return out

def parse_fp_table(scraper, url: str, top_n: int, is_dst: bool, bye_map: Optional[Dict[str,int]]) -> pd.DataFrame:
    html = fetch_html(scraper, url)
    tables = pd.read_html(html)
    if not tables:
        raise RuntimeError(f"No tables found at {url}")
    # Find a table with FPTS + Player
    t = None
    for cand in tables:
        cand.columns = [str(c) for c in cand.columns]
        if "Player" in cand.columns and any(c.upper()=="FPTS" for c in cand.columns):
            t = cand
            break
    if t is None:
        t = tables[0]
        t.columns = [str(c) for c in t.columns]

    df = t.copy()
    df = df[df["Player"].notna()].copy()

    # Extract team code from trailing "(XXX)" in Player column; label is left side for naming
    m = df["Player"].astype(str).str.extract(r"^(?P<label>.+?)\s*\((?P<code>[A-Z]{2,3})\)\s*$")
    df["label"] = m["label"].fillna(df["Player"].astype(str)).str.strip()
    df["code_raw"] = m["code"]
    df["team"] = df["code_raw"].map(FP_TO_STD)
    df = df[df["team"].isin(ALLOWED_TEAMS)].copy()

    # Points
    fcol = next((c for c in df.columns if c.upper()=="FPTS"), None)
    df["points"] = pd.to_numeric(df[fcol], errors="coerce").fillna(0.0)

    df = df.sort_values("points", ascending=False).head(top_n).copy()
    bye_map = bye_map or {}
    df["byeWeek"] = df["team"].map(bye_map).fillna(0).astype(int)

    if is_dst:
        names = df["label"].astype(str) + " DST"  # e.g., "Dallas Cowboys DST"
        pos = "DST"
    else:
        names = df["label"].astype(str)           # kicker player name
        pos = "K"

    out = pd.DataFrame({
        "name": names,
        "team": df["team"].astype(str),
        "position": pos,
        "byeWeek": df["byeWeek"].astype(int),
        "injuryStatus": "NA",
        "points": df["points"].round(1)
    })
    return out

def main():
    scraper = create_scraper()

    # Build bye-week map first (overrides fallback on success)
    bye_map = get_bye_weeks(scraper)

    # Be polite between sites
    players = get_pfr_players(scraper, n_players=290, bye_map=bye_map)
    time.sleep(2.0)
    kickers = parse_fp_table(scraper, FP_K_URL, top_n=5, is_dst=False, bye_map=bye_map)
    time.sleep(2.0)
    dst = parse_fp_table(scraper, FP_DST_URL, top_n=5, is_dst=True, bye_map=bye_map)

    combined = pd.concat([players, kickers, dst], ignore_index=True)

    # Ensure we have exactly 300; top-up if needed (rare)
    if combined.shape[0] != 300:
        need = 300 - combined.shape[0]
        if need > 0:
            extra = get_pfr_players(scraper, n_players=290+need, bye_map=bye_map).tail(need)
            combined = pd.concat([combined, extra], ignore_index=True)
        else:
            combined = combined.head(300).copy()

    # Rank by total points (overall)
    combined = combined.sort_values("points", ascending=False).reset_index(drop=True)
    combined["adp"] = combined.index + 1
    combined["id"] = combined["adp"]

    # Final ordering and types
    combined = combined[["id","name","team","position","byeWeek","injuryStatus","points","adp"]]
    combined["byeWeek"] = combined["byeWeek"].astype(int)
    combined["adp"] = combined["adp"].astype(int)
    combined["id"] = combined["id"].astype(int)

    out_path = "top300_2024.csv"
    combined.to_csv(out_path, index=False, encoding="utf-8", lineterminator="\n")
    print(f"Wrote {out_path} with {len(combined)} rows.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("ERROR:", e, file=sys.stderr)
        sys.exit(1)
