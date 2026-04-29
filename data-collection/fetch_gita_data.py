#!/usr/bin/env python3
"""
GitaSaar — Bhagavad Gita Data Collection Script  v3.0
======================================================
Fetches all 700 shlokas — Sanskrit text, transliteration, English & Marathi
translations, and commentaries — and writes one JSON file per chapter to
../app/public/data/.

Sources (all public-domain / openly licensed):
  1. vedicscriptures.github.io  — primary: Sanskrit, transliteration,
       Swami Sivananda, Gambhirananda, Purohit Swami (English translations),
       Adi Shankaracharya commentary, Swami Chinmayananda, Tejomayananda,
       AND A.C. Bhaktivedanta translation + purport (prabhu.et / prabhu.ec)
  2. mr.wikisource.org          — public-domain Marathi Bhagavad Gita,
                                  one request per chapter (SSR MediaWiki HTML)
  3. vedabase.io /en/           — English Bhaktivedanta translation & purport
                                  (fallback / supplement to vedicscriptures)

Run from data-collection/:
    cd data-collection
    python3 -m venv .venv && source .venv/bin/activate
    python3 -m pip install -r requirements.txt
    python3 fetch_gita_data.py            # all 18 chapters
    python3 fetch_gita_data.py 1 3        # chapters 1–3 only (faster for testing)
    python3 fetch_gita_data.py --no-vedabase   # skip vedabase.io (faster)
    python3 fetch_gita_data.py --no-marathi    # skip Marathi
"""

import json
import time
import re
import sys
import os
import logging
from pathlib import Path
from typing import Optional

# ── Python version check ───────────────────────────────────────────────────────
if sys.version_info < (3, 8):
    sys.exit("❌  Python 3.8+ required.")

try:
    import requests
except ImportError:
    sys.exit("❌  Run: python3 -m pip install -r requirements.txt")

try:
    from bs4 import BeautifulSoup
    from tqdm import tqdm
except ImportError:
    sys.exit("❌  Run: python3 -m pip install -r requirements.txt")

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("fetch.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("gitasaar")

# ── Configuration ──────────────────────────────────────────────────────────────
OUTPUT_DIR  = Path(__file__).parent / ".." / "app" / "public" / "data"
RATE_LIMIT  = 0.5    # seconds between requests
MAX_RETRIES = 3
TIMEOUT     = 25

# Primary API — static JSON files served via GitHub Pages
# GET https://vedicscriptures.github.io/slok/{chapter}/{verse}/
# Also contains prabhu.et (Bhaktivedanta translation) and prabhu.ec (purport)
VEDIC_BASE   = "https://vedicscriptures.github.io/slok"

# Marathi translations — Marathi Wikisource (one page per chapter, public domain)
# Structured as: मूळ श्लोक → संदर्भित अन्वयार्थ → अर्थ (Marathi translation)
# All content is in the SSR HTML; no JavaScript needed.
WIKISOURCE_BASE = "https://mr.wikisource.org/wiki"
WIKISOURCE_CHAPTERS = [
    "श्रीमद्‌भगवद्‌गीता_:_पहिला_अध्याय_(अर्जुनविषादयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_दुसरा_अध्याय_(सांख्ययोग)",
    "श्रीमद्‌भगवद्‌गीता_:_तिसरा_अध्याय_(कर्मयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_चौथा_अध्याय_(ज्ञानकर्मसंन्यासयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_पाचवा_अध्याय_(कर्मसंन्यासयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_सहावा_अध्याय_(आत्मसंयमयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_सातवा_अध्याय_(ज्ञानविज्ञानयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_आठवा_अध्याय_(अक्षरब्रह्मयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_नववा_अध्याय_(राजविद्याराजगुह्ययोग)",
    "श्रीमद्‌भगवद्‌गीता_:_दहावा_अध्याय_(विभूतियोग)",
    "श्रीमद्‌भगवद्‌गीता_:_अकरावा_अध्याय_(विश्वरूपदर्शनयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_बारावा_अध्याय_(भक्तियोग)",
    "श्रीमद्‌भगवद्‌गीता_:_तेरावा_अध्याय_(क्षेत्रक्षत्रज्ञविभागयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_चौदावा_अध्याय_(गुणत्रयविभागयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_पंधरावा_अध्याय_(पुरुषोत्तमयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_सोळावा_अध्याय_(दैवासुरसंपद्विभागयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_सतरावा_अध्याय_(श्रद्धात्रयविभागयोग)",
    "श्रीमद्‌भगवद्‌गीता_:_अठरावा_अध्याय_(मोक्षसंन्यासयोग)",
]

# Devanagari digit → ASCII digit translation table (for verse-number parsing)
_DEVA_DIGIT_TABLE = str.maketrans('०१२३४५६७८९', '0123456789')
# Pattern: ॥ chapter-verse ॥  e.g. ॥ १-१ ॥  or  ॥ १-२०-२१ ॥ (grouped shlokas)
_VERSE_REF_RE = re.compile(r'॥\s*([\u0966-\u096F\d]+)-([\u0966-\u096F\d]+)\s*॥')

# Bhaktivedanta purport from vedabase.io (English) — supplementary
VEDABASE_BASE = "https://vedabase.io/en/library/bg"

# ── Chapter metadata ───────────────────────────────────────────────────────────
VERSE_COUNTS = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78]

CHAPTER_NAMES = [
    ("अर्जुनविषादयोग",           "Arjuna Visada Yoga",            "The Yoga of Arjuna's Despondency"),
    ("साङ्ख्ययोग",               "Sankhya Yoga",                  "The Yoga of Knowledge"),
    ("कर्मयोग",                  "Karma Yoga",                    "The Yoga of Action"),
    ("ज्ञानकर्मसन्न्यासयोग",     "Jnana Karma Sannyas Yoga",      "The Yoga of Wisdom, Action & Renunciation"),
    ("कर्मसन्न्यासयोग",          "Karma Sannyas Yoga",            "The Yoga of Renunciation of Action"),
    ("आत्मसंयमयोग",              "Atma Samyama Yoga",             "The Yoga of Self-Restraint"),
    ("ज्ञानविज्ञानयोग",          "Jnana Vijnana Yoga",            "The Yoga of Knowledge & Wisdom"),
    ("अक्षरब्रह्मयोग",           "Aksara Brahma Yoga",            "The Yoga of the Imperishable Absolute"),
    ("राजविद्याराजगुह्ययोग",     "Raja Vidya Raja Guhya Yoga",    "The Yoga of Royal Knowledge & Royal Secret"),
    ("विभूतियोग",                "Vibhuti Yoga",                  "The Yoga of Divine Glories"),
    ("विश्वरूपदर्शनयोग",         "Vishvarupa Darshana Yoga",      "The Yoga of the Vision of the Cosmic Form"),
    ("भक्तियोग",                 "Bhakti Yoga",                   "The Yoga of Devotion"),
    ("क्षेत्रक्षेत्रज्ञविभागयोग", "Kshetra Kshetrajnavibhaga Yoga","The Yoga of the Field & the Knower of the Field"),
    ("गुणत्रयविभागयोग",          "Gunatraya Vibhaga Yoga",        "The Yoga of the Three Modes of Nature"),
    ("पुरुषोत्तमयोग",            "Purushottama Yoga",             "The Yoga of the Supreme Person"),
    ("दैवासुरसम्पद्विभागयोग",    "Daivasurasampadvibhaga Yoga",   "The Yoga of the Divine & Demoniac Natures"),
    ("श्रद्धात्रयविभागयोग",      "Shraddhatraya Vibhaga Yoga",    "The Yoga of the Threefold Faith"),
    ("मोक्षसन्न्यासयोग",         "Moksha Sannyas Yoga",           "The Yoga of Liberation through Renunciation"),
]

CHAPTER_SUMMARIES = [
    "Arjuna, overwhelmed by sorrow and delusion at the sight of his kinsmen arrayed for battle on the field of Kurukshetra, sinks down in his chariot and refuses to fight.",
    "Krishna speaks of the immortality of the soul, the nature of dharma, and introduces Nishkama Karma — selfless action — and the 'Sthitaprajna' (person of steady wisdom).",
    "Krishna explains the necessity of action and the importance of performing one's duties without attachment to results, introducing Yajna as a cosmic mechanism.",
    "Krishna reveals that He has taught this eternal wisdom in past ages and explains the divine nature of His incarnations, describing different types of sacrifices.",
    "Krishna reconciles renunciation and selfless action, showing they lead to the same goal. A sage acts without being bound by karma.",
    "Krishna describes Dhyana Yoga (meditation), proper posture, and the characteristics of a perfected yogi. He addresses the fate of a yogi who does not complete the path.",
    "Krishna reveals His divine nature as the source of all creation, His eight material energies, and speaks of four types of devotees who approach Him.",
    "Krishna explains the process of death and describes the paths of light and darkness, assuring that those who remember Him at death attain Him.",
    "Krishna reveals the most confidential knowledge — the science of devotion — describing how the universe exists in Him yet He transcends it.",
    "Krishna enumerates His divine manifestations, explaining that everything beautiful or powerful in creation is a spark of His splendor.",
    "At Arjuna's request, Krishna reveals His awe-inspiring Cosmic Form (Vishvarupa). Arjuna is overwhelmed with wonder and fear.",
    "Krishna declares that direct devotion to His personal form is superior to meditating on the impersonal Absolute, and describes the qualities of His most beloved devotees.",
    "Krishna explains the distinction between the body (field) and the soul (knower of the field), describing the nature of knowledge and the qualities leading to liberation.",
    "Krishna explains the three modes of nature (sattva, rajas, tamas) and how they bind the soul, describing how to transcend them through devotional service.",
    "Using the metaphor of the inverted Ashvattha tree, Krishna describes material existence and reveals Himself as the Supreme Person, Purushottama.",
    "Krishna describes the divine and demoniac natures, emphasizing that those with divine qualities are destined for liberation.",
    "Krishna explains how the three modes influence faith, food, sacrifices, austerities, and charity, introducing the sacred formula 'Om Tat Sat'.",
    "Krishna summarizes the entire Gita, explaining tyaga (renunciation), the role of the three gunas, and concludes with the most secret teaching — full surrender to Him.",
]

# ── HTTP session ───────────────────────────────────────────────────────────────
session = requests.Session()
session.headers.update({
    "User-Agent": (
        "GitaSaar/2.0 Educational Gita Reader "
        "(github.com/gitasaar; kedar.joshi070@gmail.com)"
    ),
    "Accept": "application/json, text/html",
    "Accept-Language": "en-US,en;q=0.9,mr;q=0.8,sa;q=0.7",
})

_last_req = 0.0


def fetch(url: str, as_json: bool = False, retries: int = MAX_RETRIES) -> Optional[object]:
    """Rate-limited GET with retry. Returns parsed JSON or Response."""
    global _last_req
    gap = time.monotonic() - _last_req
    if gap < RATE_LIMIT:
        time.sleep(RATE_LIMIT - gap)

    for attempt in range(retries):
        try:
            r = session.get(url, timeout=TIMEOUT)
            _last_req = time.monotonic()
            if r.status_code == 429:
                wait = int(r.headers.get("Retry-After", 15))
                log.warning(f"Rate limited — waiting {wait}s")
                time.sleep(wait)
                continue
            if r.status_code == 404:
                return None
            r.raise_for_status()
            return r.json() if as_json else r
        except (requests.RequestException, ValueError) as e:
            log.warning(f"Attempt {attempt + 1}/{retries} failed for {url}: {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)

    log.error(f"All retries failed: {url}")
    return None


# ── Primary source: vedicscriptures.github.io ─────────────────────────────────
#
# API: GET https://vedicscriptures.github.io/slok/{chapter}/{verse}/
# Returns JSON with these keys (all optional):
#   slok           — Sanskrit (Devanagari)
#   transliteration — Roman transliteration
#   siva.et        — Swami Sivananda English translation
#   adi.et         — Adi Shankaracharya commentary (English)
#   gambir.et      — Gambhirananda English translation
#   puru.et        — Purohit Swami English translation
#   tej.et         — Swami Tejomayananda English translation
#   chinmay.hc     — Swami Chinmayananda Hindi commentary
#   anand.et       — Swami Anandagiri commentary (English)
#   rams.ht        — Swami Ramsukhdas Hindi
#
def fetch_vedic_verse(chapter: int, verse: int) -> dict:
    """Fetch from vedicscriptures.github.io JSON API."""
    url = f"{VEDIC_BASE}/{chapter}/{verse}/"
    data = fetch(url, as_json=True)
    if not data:
        log.warning(f"  vedicscriptures: no data for {chapter}.{verse}")
        return {}

    result = {}

    # Sanskrit text
    slok = clean(data.get("slok", ""))
    if slok:
        result["text_sanskrit"] = slok

    # Transliteration
    translit = clean(data.get("transliteration", ""))
    if translit:
        result["text_transliteration"] = translit

    # Translations
    translations = {}

    siva = _get_nested(data, "siva", "et")
    if siva:
        translations["english_sivananda"] = siva

    # Use Gambhirananda as a second English translation
    # (closest to a scholarly / neutral Bhaktivedanta equivalent in this API)
    gambir = _get_nested(data, "gambir", "et")
    if gambir:
        translations["english_gambhirananda"] = gambir

    # Purohit Swami — third English option
    puru = _get_nested(data, "puru", "et")
    if puru:
        translations["english_purohit"] = puru

    # Bhaktivedanta (Prabhupada) translation — available directly in vedicscriptures API
    # This is the same content as vedabase.io but without any "PURPORT" heading issue.
    prabhu_et = _get_nested(data, "prabhu", "et")
    if prabhu_et:
        translations["english_bhaktivedanta"] = prabhu_et

    if translations:
        result["translations"] = translations

    # Commentaries
    commentaries = {}

    shankara = _get_nested(data, "adi", "et")
    if shankara:
        commentaries["shankaracharya"] = shankara

    anand = _get_nested(data, "anand", "et")
    if anand:
        commentaries["anandagiri"] = anand

    chinmay = _get_nested(data, "chinmay", "hc")
    if chinmay:
        commentaries["chinmayananda"] = chinmay

    tej = _get_nested(data, "tej", "et")
    if tej:
        commentaries["tejomayananda"] = tej

    # Bhaktivedanta purport — from vedicscriptures API (no "PURPORT" heading here)
    prabhu_ec = _get_nested(data, "prabhu", "ec")
    if prabhu_ec:
        commentaries["bhaktivedanta"] = prabhu_ec[:4000]

    if commentaries:
        result["commentaries"] = commentaries

    return result


def _get_nested(d: dict, *keys) -> str:
    """Safely navigate nested dict and return cleaned string or ''."""
    obj = d
    for k in keys:
        if not isinstance(obj, dict):
            return ""
        obj = obj.get(k, "")
    return clean(str(obj)) if obj else ""


# ── Secondary source: Marathi Wikisource ─────────────────────────────────────
def _deva_to_int(s: str) -> int:
    """Convert a Devanagari (or ASCII) numeral string to int."""
    return int(s.translate(_DEVA_DIGIT_TABLE))


def fetch_marathi_chapter(chapter: int) -> dict:
    """
    Fetch ALL Marathi translations for a chapter in a single HTTP request.

    Source: mr.wikisource.org — public-domain Marathi Bhagavad Gita with
    Sanskrit text (मूळ श्लोक), word-by-word gloss (संदर्भित अन्वयार्थ),
    and Marathi translation (अर्थ) for every verse.

    Page structure (each verse block):
        <p>मूळ श्लोक</p>
        <pre>  Sanskrit text ॥ ch-verse ॥</pre>
        <p>संदर्भित अन्वयार्थ</p>
        <p>word = meaning, ...</p>
        <p>अर्थ</p>
        <p>← Marathi translation we want</p>

    Some blocks cover multiple shlokas (e.g. verses 4–5 share one translation).
    We parse verse numbers from the ॥ ch-verse ॥ markers in each <pre> and
    assign the following अर्थ paragraph to every verse in the group.

    Returns: {verse_number: marathi_text} dict (1-indexed).
    """
    page  = WIKISOURCE_CHAPTERS[chapter - 1]
    url   = f"{WIKISOURCE_BASE}/{page}"
    r     = fetch(url)
    if not r:
        log.warning(f"  Wikisource: could not fetch chapter {chapter}")
        return {}

    soup    = BeautifulSoup(r.text, "html.parser")
    content = soup.select_one(".mw-parser-output")
    if not content:
        log.warning(f"  Wikisource: .mw-parser-output not found for chapter {chapter}")
        return {}

    result:           dict = {}
    current_verses:   list = []   # verse numbers accumulated in the current block
    next_is_artha:    bool = False
    skip_first_artha: bool = True  # first अर्थ is the chapter intro, not a verse

    for el in content.children:
        if not hasattr(el, "name") or el.name is None:
            continue  # skip NavigableString (whitespace text nodes)

        tag  = el.name.lower()
        text = el.get_text(separator=" ").strip()

        if tag == "p":
            if text == "मूळ श्लोक":
                # Start of a new verse block — reset accumulator
                current_verses = []
                next_is_artha  = False

            elif text == "अर्थ":
                if skip_first_artha:
                    skip_first_artha = False   # discard the chapter-intro "अर्थ"
                else:
                    next_is_artha = True

            elif next_is_artha and text:
                # This paragraph is the Marathi translation for current_verses
                marathi = clean(text)
                if marathi and any("\u0900" <= c <= "\u097F" for c in marathi):
                    for vn in current_verses:
                        result[vn] = marathi
                next_is_artha = False

        elif tag == "pre":
            # Extract every ॥ chapter-verse ॥ marker from the Sanskrit shloka block
            for m in _VERSE_REF_RE.finditer(text):
                try:
                    ch_num  = _deva_to_int(m.group(1))
                    v_num   = _deva_to_int(m.group(2))
                    if ch_num == chapter and 1 <= v_num <= 200:
                        current_verses.append(v_num)
                except ValueError:
                    pass

    expected = VERSE_COUNTS[chapter - 1]
    log.info(
        f"  Wikisource Marathi: {len(result)}/{expected} verses "
        f"extracted for chapter {chapter}"
    )
    if len(result) < expected:
        missing = sorted(set(range(1, expected + 1)) - set(result))
        log.warning(f"  Wikisource ch {chapter}: missing verse(s): {missing}")
    return result


# ── Tertiary source: vedabase.io (Bhaktivedanta) ─────────────────────────────
_PURPORT_RE = re.compile(
    r'^[\s]*PURPORT[\s]*',
    re.IGNORECASE,
)

def _strip_purport_label(text: str) -> str:
    """Remove leading 'PURPORT' / 'Purport' heading that vedabase.io injects."""
    return _PURPORT_RE.sub("", text).strip()


def fetch_vedabase_verse(chapter: int, verse: int) -> dict:
    """
    Fetch Bhaktivedanta translation + purport from vedabase.io (English).

    vedabase.io is a Next.js SSR site. The relevant CSS classes are:
      av-translation  — wrapper for the "Translation" H2 + paragraph(s)
      av-purport      — wrapper for the "Purport" H2 + paragraphs

    We extract only <p> tag text inside each wrapper (skipping the H2
    heading) to avoid including the words "Translation" or "Purport".

    Note: vedicscriptures.github.io already exposes prabhu.et / prabhu.ec,
    so this function is a supplementary source that may provide a longer
    or slightly different version of the purport.
    """
    url = f"{VEDABASE_BASE}/{chapter}/{verse}/"
    r = fetch(url)
    if not r:
        return {}

    soup   = BeautifulSoup(r.text, "html.parser")
    result = {}

    # ── Translation ───────────────────────────────────────────────────────────
    trans_el = soup.select_one("[class*='av-translation']")
    if trans_el:
        # Prefer <p> tags to skip the H2 "Translation" heading
        paras = [p.get_text() for p in trans_el.select("p") if p.get_text().strip()]
        text  = clean(" ".join(paras)) if paras else clean(trans_el.get_text())
        # Extra safety: strip any "Translation" or "Purport" prefix leakage
        text  = re.sub(r'^(Translation|Purport)\s*', '', text, flags=re.IGNORECASE).strip()
        if text and len(text) > 20:
            result["english_bhaktivedanta"] = text

    # ── Purport ───────────────────────────────────────────────────────────────
    purport_el = soup.select_one("[class*='av-purport']")
    if purport_el:
        paras = [p.get_text() for p in purport_el.select("p") if p.get_text().strip()]
        text  = clean(" ".join(paras)) if paras else clean(purport_el.get_text())
        text  = re.sub(r'^(Purport|PURPORT)\s*', '', text).strip()
        if text and len(text) > 40:
            result["purport_bhaktivedanta"] = text[:4000]

    return result


# ── Utilities ──────────────────────────────────────────────────────────────────
def clean(text: str) -> str:
    if not text:
        return ""
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    # Strip common UI boilerplate that sometimes leaks through scrapers
    for phrase in ["Copy", "Embed", "Share", "Download", "Print", "Show more"]:
        text = text.replace(phrase, "")
    return text.strip()


def build_verse(chapter: int, verse_num: int, primary: dict, vedabase: dict, marathi: str = "") -> dict:
    """Merge data from all sources into a single verse object."""
    translations = {**primary.get("translations", {})}
    commentaries = {**primary.get("commentaries", {})}

    # Merge Bhaktivedanta data from vedabase
    if vedabase.get("english_bhaktivedanta"):
        translations["english_bhaktivedanta"] = vedabase["english_bhaktivedanta"]
    if vedabase.get("purport_bhaktivedanta"):
        commentaries["bhaktivedanta"] = vedabase["purport_bhaktivedanta"]

    # Marathi translation from Wikisource
    if marathi:
        translations["marathi"] = marathi

    obj = {
        "verse_number": verse_num,
    }
    if primary.get("text_sanskrit"):
        obj["text_sanskrit"] = primary["text_sanskrit"]
    if primary.get("text_transliteration"):
        obj["text_transliteration"] = primary["text_transliteration"]
    if translations:
        obj["translations"] = translations
    if commentaries:
        obj["commentaries"] = commentaries

    return obj


# ── Chapter fetch loop ─────────────────────────────────────────────────────────
def fetch_chapter(chapter: int, include_vedabase: bool = True, include_marathi: bool = True) -> list:
    verse_count = VERSE_COUNTS[chapter - 1]
    verses = []
    vedabase_failures = 0

    # Pre-fetch ALL Marathi translations for this chapter in ONE HTTP request.
    # Wikisource returns all verses in SSR HTML — much more efficient
    # than fetching per verse, and far more reliable than IITK or vedabase /mr/.
    marathi_translations: dict = {}
    if include_marathi:
        marathi_translations = fetch_marathi_chapter(chapter)

    for verse_num in tqdm(range(1, verse_count + 1), desc=f"  Ch {chapter:2d}", leave=False):
        # Primary — vedicscriptures JSON API (also provides prabhu.et / prabhu.ec)
        primary = fetch_vedic_verse(chapter, verse_num)

        # Marathi — look up from the chapter-level cache (no per-verse HTTP call)
        marathi = marathi_translations.get(verse_num, "")

        # Vedabase — supplementary Bhaktivedanta purport (skip on repeated failures)
        vedabase = {}
        if include_vedabase and vedabase_failures < 5:
            vedabase = fetch_vedabase_verse(chapter, verse_num)
            if not vedabase:
                vedabase_failures += 1
            else:
                vedabase_failures = 0

        verses.append(build_verse(chapter, verse_num, primary, vedabase, marathi))

    populated     = sum(1 for v in verses if len(v) > 1)
    marathi_count = sum(1 for v in verses if v.get("translations", {}).get("marathi"))
    log.info(
        f"  Chapter {chapter}: {populated}/{len(verses)} verses | "
        f"{marathi_count}/{len(verses)} Marathi translations"
    )
    if marathi_count == 0:
        log.warning(
            f"  ⚠️  Chapter {chapter}: 0 Marathi translations. "
            "Check that mr.wikisource.org is reachable and the "
            ".mw-parser-output structure is unchanged."
        )
    return verses


# ── Output helpers ─────────────────────────────────────────────────────────────
def write_json(path: Path, obj: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    log.info(f"Wrote {path}")


def build_index() -> dict:
    from datetime import datetime, timezone
    chapters = []
    for i, (sk, tr, mn) in enumerate(CHAPTER_NAMES, 1):
        chapters.append({
            "chapter_number": i,
            "name_sanskrit": sk,
            "name_transliterated": tr,
            "name_meaning": mn,
            "verse_count": VERSE_COUNTS[i - 1],
            "chapter_summary": CHAPTER_SUMMARIES[i - 1],
        })
    return {
        "version": "3.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_verses": sum(VERSE_COUNTS),
        "sources": {
            "primary": "vedicscriptures.github.io — Sanskrit, transliteration, multiple English translations & commentaries, A.C. Bhaktivedanta translation + purport (prabhu.et / prabhu.ec)",
            "marathi": "mr.wikisource.org — public-domain Marathi Bhagavad Gita with Sanskrit, word-by-word gloss, and Marathi अर्थ (one request per chapter)",
            "vedabase": "vedabase.io/en/library/bg — A.C. Bhaktivedanta Swami Prabhupada, Bhaktivedanta Book Trust (supplementary)",
        },
        "chapters": chapters,
    }


# ── Entry point ────────────────────────────────────────────────────────────────
def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    start_ch = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    end_ch   = int(sys.argv[2]) if len(sys.argv) > 2 else 18

    # Optional flags to skip slower sources
    include_vedabase = "--no-vedabase" not in sys.argv
    include_marathi  = "--no-marathi"  not in sys.argv

    if "--debug" in sys.argv:
        logging.getLogger().setLevel(logging.DEBUG)
        log.debug("Debug logging enabled — you'll see per-verse selector hits in fetch.log")

    log.info("=" * 60)
    log.info(f"GitaSaar v3.0 — fetching chapters {start_ch}–{end_ch}")
    log.info(f"Primary source  : vedicscriptures.github.io (incl. Bhaktivedanta)")
    log.info(f"Marathi source  : mr.wikisource.org — {'enabled' if include_marathi else 'DISABLED'}")
    log.info(f"Vedabase suppl  : vedabase.io/en — {'enabled' if include_vedabase else 'DISABLED'}")
    log.info(f"Output dir      : {OUTPUT_DIR.resolve()}")
    log.info("=" * 60)

    # Always write a fresh index
    write_json(OUTPUT_DIR / "index.json", build_index())

    for ch in tqdm(range(start_ch, end_ch + 1), desc="Chapters"):
        log.info(f"Fetching chapter {ch}…")
        verses = fetch_chapter(ch, include_vedabase=include_vedabase, include_marathi=include_marathi)

        sk, tr, mn = CHAPTER_NAMES[ch - 1]
        chapter_doc = {
            "chapter_number": ch,
            "name_sanskrit": sk,
            "name_transliterated": tr,
            "name_meaning": mn,
            "chapter_summary": CHAPTER_SUMMARIES[ch - 1],
            "verses": verses,
        }
        write_json(OUTPUT_DIR / f"chapter-{ch}.json", chapter_doc)

    log.info("=" * 60)
    log.info("All done! ✓")
    log.info("Now restart your Vite dev server (or redeploy to Vercel).")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
