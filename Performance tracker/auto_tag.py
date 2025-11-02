# auto_tag.py
# Usage:
#   python auto_tag.py
#   streamlit run auto_tag.py -- --review

import os, re, csv, argparse
import cv2
import pytesseract
from pathlib import Path
from collections import defaultdict, Counter, deque

import pandas as pd
import networkx as nx

# ============ Paths ============
BASE = Path("/Users/zichenglew/Downloads/Add Math Form 4 知识图谱")
P_CONCEPTS = BASE / "concept_nodes_F4_ALL.csv"
P_SKILLS   = BASE / "skill_nodes_F4_ALL.csv"
P_EDGES    = BASE / "edges_F4_ALL.csv"
P_QUEST    = BASE / "data" / "questions.csv"
P_OUT_DRAFT= BASE / "data" / "questions_to_skills.csv"
P_OUT_FINAL= BASE / "data" / "questions_to_skills_final.csv"
P_OCR_DIR = BASE / "data" / "ocr_cache"

# ============ Helpers ============
def read_rows(path):
    with open(path, "r", encoding="utf-8", newline="") as f:
        for row in csv.reader(f):
            if not row: continue
            vals=[c.strip() for c in row]
            if not any(vals): continue
            if ",".join(vals).lower().startswith("#"): continue
            yield vals

def load_nodes(csv_path, kind_hint=None):
    nodes={}
    for vals in read_rows(csv_path):
        t=None
        for i,v in enumerate(vals):
            if v in ("concept","skill"): t=v; break
        node_type=t or kind_hint or "unknown"
        nid=None
        for v in vals:
            if v and (v.startswith("F4") or v.startswith("F5") or v.startswith("F4.FN")):
                nid=v; break
        if not nid:
            for v in reversed(vals):
                if v and (v.startswith("F4") or v.startswith("F5")):
                    nid=v; break
        if not nid: continue
        text_cols=[v for v in vals if v not in ("concept","skill",nid,"")]
        desc=max(text_cols,key=len) if text_cols else ""
        name=sorted(text_cols,key=len)[0] if len(text_cols)>=2 else ""
        nodes[nid]={"type":node_type, "name":name or nid, "desc":desc}
    return nodes

def load_edges(csv_path):
    edges=[]
    for vals in read_rows(csv_path):
        if vals[0].lower().startswith("source_id"): continue
        if len(vals)<2: continue
        u,v = vals[0], vals[1]
        rel  = vals[2] if len(vals)>2 else ""
        desc = ",".join(vals[3:]) if len(vals)>3 else ""
        edges.append((u,v,rel,desc))
    return edges

def build_graph():
    c = load_nodes(P_CONCEPTS)
    s = load_nodes(P_SKILLS, kind_hint="skill")
    G = nx.DiGraph()
    for nid,a in {**c, **{k:v for k,v in s.items() if k not in c}}.items():
        G.add_node(nid, **a)
    for u,v,rel,desc in load_edges(P_EDGES):
        if u not in G: G.add_node(u, type="unknown", name=u, desc="")
        if v not in G: G.add_node(v, type="unknown", name=v, desc="")
        G.add_edge(u,v, relation=rel, description=desc)
    return G

def is_kw_node(n, G):
    if not isinstance(n,str): return False
    if not n.endswith("_KW"): return False
    if n.endswith("_KW_NOTE"): return False
    if n.endswith("_SKILL_KW"): return False
    return G.nodes[n].get("type")=="concept"

def normalize(s): 
    return re.sub(r"\s+"," ",(s or "")).strip().lower()

# ============ OCR Helpers ============
def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)

def preprocess_for_ocr(img_path: Path):
    """
    Basic preprocessing for printed/scanned questions:
    - grayscale → bilateral filter (denoise) → adaptive threshold → slight dilate
    """
    img = cv2.imread(str(img_path))
    if img is None:
        return None
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.bilateralFilter(gray, d=7, sigmaColor=75, sigmaSpace=75)
    th = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                               cv2.THRESH_BINARY, 31, 10)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1,1))
    th = cv2.dilate(th, kernel, iterations=1)
    return th

def run_ocr(img_path: Path, lang: str = None):
    """
    OCR using Tesseract via pytesseract.
    Use language from CLI if provided: 'eng', 'msa', or 'eng+msa'.
    """
    if lang is None:
        lang = getattr(run_ocr, "_LANG", "eng")
    img = preprocess_for_ocr(img_path)
    if img is None:
        return ""
    config = "--psm 6 --oem 3 -c preserve_interword_spaces=1"
    whitelist = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-×*/=()[]{}^_.,:;<>≤≥∞πθΣΔ∫√|’'\"% "
    config += f" -c tessedit_char_whitelist={whitelist}"
    langs_to_try = [lang] if lang else ["eng"]
    for lg in langs_to_try:
        try:
            text = pytesseract.image_to_string(img, lang=lg, config=config)
            if text and len(text.strip()) >= 3:
                return text
        except pytesseract.TesseractError:
            continue
    return ""

# ============ Indexes ============
def extract_chapter_id_from_node(nid:str):
    # e.g. F5C3_CON_01 -> F5C3, F4C7_KW -> F4C7
    m=re.match(r"(F[45]C\d+)", nid)
    return m.group(1) if m else None

def build_indexes(G):
    # chapter -> kw_text (EN+MS)
    chapter_kw = defaultdict(str)
    for n in G.nodes:
        if is_kw_node(n,G):
            chap = extract_chapter_id_from_node(n)
            desc = normalize(G.nodes[n].get("desc",""))
            chapter_kw[chap] += " " + desc

    # skills list with chapter hint + bag of words
    skills=[]
    for n in G.nodes:
        if G.nodes[n].get("type")=="skill":
            chap = extract_chapter_id_from_node(n)
            text = normalize(G.nodes[n].get("name","")+" "+G.nodes[n].get("desc",""))
            skills.append({"skill_id":n, "chapter":chap, "text":text})
    return chapter_kw, skills

# ============ Scoring ============
KW_HIT = 1.0
REGEX_BONUS = 0.5
CHAPTER_PRIOR = 2.0

REGEXES = [
    r"\bdy/dx\b", r"\bdx\b", r"\b∫\b", r"\bv\s*=\s*u\s*\+\s*a\s*t\b", r"\bs\s*=\s*u\s*t\b"
]

def score_question_to_skill(qtext:str, chapter_hint:str, skill, chapter_kw):
    """
    Return (score, detail) where detail contains components used to build the score.
    """
    score = 0.0
    detail = {
        'chapter_prior': 0.0,
        'kw_overlap': 0,
        'kw_overlap_score': 0.0,
        'regex_hits': 0,
        'regex_score': 0.0,
        'tokens_hit': 0
    }

    # Chapter prior
    if chapter_hint and chapter_hint == skill["chapter"]:
        detail['chapter_prior'] = CHAPTER_PRIOR
        score += CHAPTER_PRIOR
    else:
        # Weak prior via overlap with chapter keyword text
        ckw = chapter_kw.get(skill["chapter"], "")
        overlap = set(qtext.split()) & set(ckw.split())
        detail['kw_overlap'] = len(overlap)
        detail['kw_overlap_score'] = min(len(overlap), 3) * 0.5
        score += detail['kw_overlap_score']

    # Very light token overlap with the skill text (bag-of-words)
    hit = 0
    for w in set(skill["text"].split()):
        if w and w in qtext:
            hit += 1
            score += KW_HIT * 0.05
    detail['tokens_hit'] = hit

    # Regex cues (dy/dx, ∫, v=u+at, ...)
    rhits = 0
    for pat in REGEXES:
        if re.search(pat, qtext, flags=re.I):
            rhits += 1
            score += REGEX_BONUS
    detail['regex_hits'] = rhits
    detail['regex_score'] = rhits * REGEX_BONUS

    return score, detail

def infer_chapter_from_filename(stem:str):
    # e.g. AM_Kedah_2025_P1_Q01 -> try map by known paper → (optional)
    return None

# ============ Pipeline ============
def load_questions():
    rows=[]
    if not P_QUEST.exists():
        print(f"[WARN] {P_QUEST} not found. Create it to supply questions.")
        return rows
    df=pd.read_csv(P_QUEST, dtype=str).fillna("")
    needed={"question_id","year","paper","chapter_hint","image_path","text"}
    miss = needed - set(df.columns)
    if miss: 
        raise ValueError(f"questions.csv missing columns: {sorted(miss)}")
    for r in df.itertuples(index=False):
        ocr_cache_txt = str(r.text)
        if getattr(load_questions, "_DO_OCR", False):
            ensure_dir(P_OCR_DIR)
            cache_file = P_OCR_DIR / f"{r.question_id}.txt"
            # If text field already has content, keep it; otherwise try cache → OCR
            if not (ocr_cache_txt and ocr_cache_txt.strip()):
                if cache_file.exists():
                    try:
                        ocr_cache_txt = cache_file.read_text(encoding="utf-8", errors="ignore")
                    except Exception:
                        ocr_cache_txt = ""
                if not (ocr_cache_txt and ocr_cache_txt.strip()) and r.image_path:
                    try:
                        ocr_text = run_ocr(Path(r.image_path))
                    except Exception:
                        ocr_text = ""
                    ocr_cache_txt = ocr_text
                    try:
                        cache_file.write_text(ocr_text, encoding="utf-8")
                    except Exception:
                        pass

        rows.append({
            "question_id": r.question_id,
            "year": r.year,
            "paper": r.paper,
            "chapter_hint": r.chapter_hint or infer_chapter_from_filename(Path(r.image_path).stem),
            "image_path": r.image_path,
            "text": (ocr_cache_txt or "")
        })
    return rows

def ensure_out_dir(p:Path):
    p.parent.mkdir(parents=True, exist_ok=True)

def generate_candidates():
    G = build_graph()
    chapter_kw, skills = build_indexes(G)
    questions = load_questions()
    if not questions:
        print("[INFO] No questions supplied. Add data/questions.csv first.")
        return

    ensure_out_dir(P_OUT_DRAFT)
    # We always regenerate the candidate file from scratch to avoid header drift
    existing = set()

    rows=[]
    for q in questions:
        qtext = normalize((q["text"] or "") + " " + Path(q["image_path"]).stem.replace("_"," "))
        # For each skill produce a score and keep top-5 per question
        scored = []
        for sk in skills:
            sc, det = score_question_to_skill(qtext, q["chapter_hint"], sk, chapter_kw)
            if sc <= 0:
                continue
            key = (q["question_id"], sk["skill_id"]) 
            if key in existing:
                continue
            # Read human-friendly name/desc from graph
            node = G.nodes.get(sk["skill_id"], {})
            nm = node.get("name", sk["skill_id"])  # English short name if present
            dsc = node.get("desc", "")
            chap = extract_chapter_id_from_node(sk["skill_id"]) or ""
            scored.append({
                "question_id": q["question_id"],
                "skill_id_candidate": sk["skill_id"],
                "skill_name": nm,
                "skill_desc": dsc,
                "skill_chapter": chap,
                "score": round(sc, 3),
                "score_chapter_prior": round(det["chapter_prior"], 3),
                "score_kw_overlap": round(det["kw_overlap_score"], 3),
                "kw_overlap_tokens": det["kw_overlap"],
                "score_regex": round(det["regex_score"], 3),
                "regex_hits": det["regex_hits"],
                "tokens_hit": det["tokens_hit"],
                "year": q["year"],
                "paper": q["paper"],
                "image_path": q["image_path"],
                "chosen": 0
            })

        # Keep only top-5 by score for this question
        scored.sort(key=lambda r: r["score"], reverse=True)
        rows.extend(scored[:5])

    with open(P_OUT_DRAFT, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=[
            "question_id","skill_id_candidate","skill_name","skill_desc","skill_chapter",
            "score","score_chapter_prior","score_kw_overlap","kw_overlap_tokens",
            "score_regex","regex_hits","tokens_hit",
            "year","paper","image_path","chosen"
        ])
        w.writeheader()
        for r in rows:
            w.writerow(r)

    print(f"[DONE] Wrote candidates to: {P_OUT_DRAFT}")

# ============ Review UI ============
def review_ui():
    import streamlit as st
    st.set_page_config(page_title="AutoTag Review", layout="wide")
    st.title("Questions → Skill Candidates (Review)")

    if not P_OUT_DRAFT.exists():
        st.warning(f"{P_OUT_DRAFT} not found. Run: python auto_tag.py")
        return
    df = pd.read_csv(P_OUT_DRAFT)
    qids = sorted(df["question_id"].unique())

    chosen_rows=[]
    for qid in qids:
        st.subheader(f"Question: {qid}")
        sub = df[df["question_id"]==qid].sort_values("score", ascending=False).reset_index(drop=True)

        # Optional preview of image and OCR text
        st.write(":camera: Image")
        if sub["image_path"].iloc[0] and Path(sub["image_path"].iloc[0]).exists():
            st.image(sub["image_path"].iloc[0], width=520)
        # Try OCR cache
        try:
            cache_file = BASE / "data" / "ocr_cache" / f"{qid}.txt"
            if cache_file.exists():
                cache_txt = cache_file.read_text(encoding="utf-8", errors="ignore").strip()
                if cache_txt:
                    with st.expander("OCR Text"):
                        st.code(cache_txt)
        except Exception:
            pass

        cols = st.columns([3,3,1.2,1,1])
        cols[0].markdown("**skill_name**")
        cols[1].markdown("**skill_id**")
        cols[2].markdown("**score**")
        cols[3].markdown("**choose**")
        cols[4].markdown("**chapter**")

        picks=[]
        for i, row in sub.iterrows():
            c1, c2, c3, c4, c5 = st.columns([3,3,1.2,1,1])
            c1.write(row.get("skill_name", row["skill_id_candidate"]))
            c2.code(row["skill_id_candidate"]) 
            c3.write(row["score"]) 
            choose = c4.checkbox("✓", key=f"{qid}_{i}")
            c5.write(row.get("skill_chapter", ""))

            with st.expander("details", expanded=False):
                st.markdown(f"**Desc:** {row.get('skill_desc','') or '(no description)'}")
                st.markdown(
                    f"**Breakdown**  "
                    f"`chapter_prior={row.get('score_chapter_prior',0)}` | "
                    f"`kw_overlap={row.get('kw_overlap_tokens',0)} → {row.get('score_kw_overlap',0)}` | "
                    f"`regex_hits={row.get('regex_hits',0)} → {row.get('score_regex',0)}` | "
                    f"`tokens_hit={row.get('tokens_hit',0)}`"
                )

            if choose:
                picks.append(row.to_dict())
        if picks:
            for r in picks:
                r["chosen"]=1
                chosen_rows.append(r)

    def export(rows):
        ensure_out_dir(P_OUT_FINAL)
        out = pd.DataFrame(rows)
        if out.empty:
            st.info("No selections to export.")
            return
        # collapse to final mapping
        final = out[out["chosen"]==1][["question_id","skill_id_candidate","year","paper","image_path"]].drop_duplicates()
        final = final.rename(columns={"skill_id_candidate":"skill_id"})
        final.to_csv(P_OUT_FINAL, index=False)
        st.success(f"Exported to: {P_OUT_FINAL}")

    st.button("Export Selected to FINAL CSV", on_click=lambda: export(chosen_rows))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--review", action="store_true", help="Launch Streamlit review UI")
    ap.add_argument("--ocr", action="store_true", help="Run OCR for questions with empty text and cache the result")
    ap.add_argument("--ocr-lang", type=str, default="eng", help="Tesseract language codes, e.g. 'eng', 'msa', or 'eng+msa'")
    args = ap.parse_args()
    if args.ocr:
        # Pass flags via function attributes to avoid touching many signatures
        load_questions._DO_OCR = True
        run_ocr._LANG = args.ocr_lang
    if args.review:
        review_ui()
    else:
        generate_candidates()

if __name__ == "__main__":
    main()