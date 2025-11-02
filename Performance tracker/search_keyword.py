import os, re, csv, argparse
import cv2
import pytesseract

BASE = Path("/Users/zichenglew/Downloads/Add Math Form 4 知识图谱")
P_CONCEPTS = BASE / "concept_nodes_F4_ALL.csv"
P_SKILLS   = BASE / "skill_nodes_F4_ALL.csv"
P_EDGES    = BASE / "edges_F4_ALL.csv"
P_OUT_FINAL= BASE / "data" / "questions_to_skills_final.csv"
P_OCR_DIR = BASE / "data" / "ocr_cache"

def normalize(s):
    return (s or "").strip().lower()

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

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--review", action="store_true", help="Review questions")
    ap.add_argument("--ocr", action="store_true", help="Run OCR for questions with empty text and cache the result")
    ap.add_argument("--ocr-lang", type=str, default="eng", help="Tesseract language codes, e.g. 'eng', 'msa', or 'eng+msa'")
    args = ap.parse_args()

    if args.ocr:
        # Pass flags via function attributes to avoid touching many signatures
        load_questions._DO_OCR = True
        run_ocr._LANG = args.ocr_lang

# Inside load_questions(), replace rows.append({...}) in the for loop with:

    # for r in df.itertuples(index=False):
    #     ocr_cache_txt = str(r.text)
    #     if getattr(load_questions, "_DO_OCR", False):
    #         ensure_dir(P_OCR_DIR)
    #         cache_file = P_OCR_DIR / f"{r.question_id}.txt"
    #         # If text field already has content, keep it; otherwise try cache → OCR
    #         if not (ocr_cache_txt and ocr_cache_txt.strip()):
    #             if cache_file.exists():
    #                 try:
    #                     ocr_cache_txt = cache_file.read_text(encoding="utf-8", errors="ignore")
    #                 except Exception:
    #                     ocr_cache_txt = ""
    #             if not (ocr_cache_txt and ocr_cache_txt.strip()) and r.image_path:
    #                 try:
    #                     ocr_text = run_ocr(Path(r.image_path))
    #                 except Exception:
    #                     ocr_text = ""
    #                 ocr_cache_txt = ocr_text
    #                 try:
    #                     cache_file.write_text(ocr_text, encoding="utf-8")
    #                 except Exception:
    #                     pass

    #     rows.append({
    #         "question_id": r.question_id,
    #         "year": r.year,
    #         "paper": r.paper,
    #         "chapter_hint": r.chapter_hint or infer_chapter_from_filename(Path(r.image_path).stem),
    #         "image_path": r.image_path,
    #         "text": (ocr_cache_txt or "")
    #     })