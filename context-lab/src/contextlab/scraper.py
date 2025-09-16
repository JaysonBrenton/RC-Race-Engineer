# filepath: src/contextlab/scraper.py
from __future__ import annotations
"""
Polite, domain-locked scraper for live.liverc.com that writes:
- Markdown to: data/raw/web/live.liverc.com/<slug>.md
- Structured index row to: data/web/index.jsonl

CLI uses scrape_site(...) and search_index(...).
"""

import hashlib
import json
import re
import time
from dataclasses import dataclass
from datetime import datetime, date
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse
import urllib.robotparser as robotparser

import httpx
from bs4 import BeautifulSoup

# Optional but preferred for clean article extraction
try:
    from readability import Document  # type: ignore
except Exception:  # pragma: no cover
    Document = None  # type: ignore

# Optional date parsing
try:
    from dateutil import parser as dateparser  # type: ignore
except Exception:  # pragma: no cover
    dateparser = None  # type: ignore


ALLOWED_NETLOC = "live.liverc.com"
USER_AGENT = "contextlab-scraper/1.0 (+https://example.invalid)"
MD_ROOT = Path("data/raw/web") / ALLOWED_NETLOC
IDX_PATH = Path("data/web/index.jsonl")


@dataclass
class IndexRow:
    id: str
    url: str
    path_md: str
    title: str
    driver_name: Optional[str]
    transponder: Optional[str]
    event_name: Optional[str]
    event_date: Optional[str]  # ISO yyyy-mm-dd
    fetched_at: str  # ISO timestamp

    def to_json(self) -> str:
        return json.dumps(self.__dict__, ensure_ascii=False)


# -------------------- helpers --------------------

def _slugify(path: str) -> str:
    # keep path-ish slugs stable
    s = re.sub(r"[^a-zA-Z0-9/_-]+", "-", path)
    s = re.sub(r"-+", "-", s).strip("-")
    s = s.strip("/")
    return s or "index"


def _sha1(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()


def _canonical(url: str) -> Optional[str]:
    try:
        u = urlparse(url)
        if u.scheme in {"http", "https"} and u.netloc == ALLOWED_NETLOC:
            return u._replace(fragment="").geturl()
        return None
    except Exception:
        return None


def _robots(client: httpx.Client) -> robotparser.RobotFileParser:
    rp = robotparser.RobotFileParser()
    try:
        r = client.get(f"https://{ALLOWED_NETLOC}/robots.txt", timeout=10)
        if r.status_code == 200:
            rp.parse(r.text.splitlines())
        else:
            rp.disallow_all = False
    except Exception:
        rp.disallow_all = False
    rp.useragent = USER_AGENT
    return rp


def _extract_fields(url: str, html: str) -> Tuple[str, str, Dict[str, Optional[str]]]:
    """
    Return: (title, text, meta)
    Heuristics for driver/transponder/event/date. Refine later with site-specific selectors.
    """
    title = ""
    text = ""
    try:
        if Document is not None:
            doc = Document(html)  # type: ignore
            title = (doc.short_title() or "").strip()
            readable_html = doc.summary(html_partial=True)
            text = BeautifulSoup(readable_html, "lxml").get_text("\n")
        else:
            soup = BeautifulSoup(html, "lxml")
            title = (soup.title.string if soup.title else "").strip()
            text = soup.get_text("\n")
    except Exception:
        soup = BeautifulSoup(html, "lxml")
        title = (soup.title.string if soup.title else "").strip()
        text = soup.get_text("\n")

    lower = text.lower()
    driver = None
    transponder = None
    event = None
    ev_date_iso: Optional[str] = None

    # Driver name (look for label "driver")
    m = re.search(r"driver\\s*[:#-]?\\s*([a-z][a-z\\s'.-]{2,60})", lower, re.I)
    if m:
        driver = m.group(1).strip().title()

    # Transponder (digits/hyphens), prefer lines near the word
    m = re.search(r"transponder\\s*[:#-]?\\s*([0-9-]{4,20})", lower, re.I)
    if m:
        transponder = m.group(1).strip()
    else:
        m = re.search(r"\\b([0-9]{6,15})\\b", lower)
        if m:
            transponder = m.group(1)

    # Event name (look for 'event') or fall back to title
    m = re.search(r"event\\s*[:#-]?\\s*([\\w\\s'.-]{3,120})", lower, re.I)
    if m:
        event = m.group(1).strip().title()
    elif title:
        event = title

    # Date (first plausible date)
    if dateparser is not None:
        try:
            dt = dateparser.parse(text, fuzzy=True, default=datetime.utcnow())
            if dt:
                ev_date_iso = dt.date().isoformat()
        except Exception:
            ev_date_iso = None

    meta = {
        "driver_name": driver,
        "transponder": transponder,
        "event_name": event,
        "event_date": ev_date_iso,
    }
    return title or url, text, meta


def _write_markdown(url: str, title: str, text: str, meta: Dict[str, Optional[str]]) -> Path:
    MD_ROOT.mkdir(parents=True, exist_ok=True)
    u = urlparse(url)
    slug = _slugify(u.path if u.path else "/")
    md_path = MD_ROOT / f"{slug or 'index'}.md"
    fetched_at = datetime.utcnow().isoformat(timespec="seconds") + "Z"

    front_matter = [
        "---",
        f"source_url: {url}",
        f"title: {title}",
        f"driver: {meta.get('driver_name') or ''}",
        f"transponder: {meta.get('transponder') or ''}",
        f"event: {meta.get('event_name') or ''}",
        f"event_date: {meta.get('event_date') or ''}",
        f"fetched_at: {fetched_at}",
        "---",
        "",
    ]
    content = "\n".join(front_matter) + text.strip() + "\n"
    md_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.write_text(content, encoding="utf-8")
    return md_path


def _append_index(row: IndexRow) -> None:
    IDX_PATH.parent.mkdir(parents=True, exist_ok=True)
    with IDX_PATH.open("a", encoding="utf-8") as f:
        f.write(row.to_json() + "\n")


# -------------------- public API --------------------

def scrape_site(
    allowlist_path: Path,
    delay: float = 2.0,
    max_pages: int = 200,
    force: bool = False,
) -> Dict[str, int]:
    """Crawl only live.liverc.com from allowlist seeds. Returns counters."""
    seeds: List[str] = []
    for raw in allowlist_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        c = _canonical(line)
        if c:
            seeds.append(c)

    seeds = [s for s in seeds if urlparse(s).netloc == ALLOWED_NETLOC]
    if not seeds:
        raise ValueError("allowlist contains no valid URLs for live.liverc.com")

    client = httpx.Client(
        headers={"User-Agent": USER_AGENT},
        follow_redirects=True,
        timeout=20,
    )
    rp = _robots(client)

    visited: Set[str] = set()
    queue: List[str] = list(dict.fromkeys(seeds))  # de-dup while preserving order
    fetched = 0
    written = 0

    while queue and fetched < max_pages:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)

        if not rp.can_fetch(USER_AGENT, url):
            continue

        try:
            r = client.get(url)
        except Exception:
            continue
        if r.status_code != 200 or not r.text:
            continue
        fetched += 1

        title, text, meta = _extract_fields(url, r.text)

        # Always write for now (keeps metadata fresh). Add content-hash compare later if needed.
        md_path = _write_markdown(url, title, text, meta)
        written += 1

        row = IndexRow(
            id=_sha1(url),
            url=url,
            path_md=str(md_path),
            title=title,
            driver_name=meta.get("driver_name"),
            transponder=meta.get("transponder"),
            event_name=meta.get("event_name"),
            event_date=meta.get("event_date"),
            fetched_at=datetime.utcnow().isoformat(timespec="seconds") + "Z",
        )
        _append_index(row)

        # Enqueue same-domain links
        soup = BeautifulSoup(r.text, "lxml")
        for a in soup.find_all("a", href=True):
            nxt = _canonical(urljoin(url, a["href"]))
            if not nxt:
                continue
            if urlparse(nxt).netloc != ALLOWED_NETLOC:
                continue
            if nxt not in visited:
                queue.append(nxt)

        time.sleep(max(0.0, float(delay)))

    client.close()
    return {"fetched": fetched, "written": written, "visited": len(visited)}


def _parse_iso(d: Optional[str]) -> Optional[date]:
    if not d:
        return None
    try:
        return datetime.fromisoformat(d).date()
    except Exception:
        return None


def search_index(
    driver: Optional[str] = None,
    transponder: Optional[str] = None,
    event: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> List[Dict[str, str]]:
    """Return matching rows from data/web/index.jsonl (latest by id wins)."""
    if not IDX_PATH.exists():
        return []
    latest: Dict[str, Dict[str, str]] = {}
    with IDX_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            try:
                row = json.loads(line)
                latest[row["id"]] = row  # last write wins
            except Exception:
                continue

    def _to_date(x: Optional[str]) -> Optional[date]:
        try:
            return datetime.fromisoformat(x).date() if x else None
        except Exception:
            return None

    df = _to_date(date_from)
    dt = _to_date(date_to)

    def _ok(row: Dict[str, str]) -> bool:
        if driver and (row.get("driver_name") or "").lower().find(driver.lower()) == -1:
            return False
        if transponder and (row.get("transponder") or "").lower().find(transponder.lower()) == -1:
            return False
        if event and (row.get("event_name") or "").lower().find(event.lower()) == -1:
            return False
        if df or dt:
            evd = _to_date(row.get("event_date"))
            if not evd:
                return False
            if df and evd < df:
                return False
            if dt and evd > dt:
                return False
        return True

    return [r for r in latest.values() if _ok(r)]

