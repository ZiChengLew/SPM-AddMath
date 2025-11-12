
---
title: SPM Add Math AI Project — Repository Refactor Analysis
author: GPT-5 (analysis for Zi Cheng Lew)
date: 2025-11-03
context: This document summarizes the current structure, pain points, and a recommended reorganization plan for the SPM Add Math AI project. It is meant to be reviewed by Codex for validation and further technical refinement.
---

# 🧭 Overview

This document analyses the **SPM Add Math AI project** repository (from `SPM Add Math copy.zip`), summarizing the current file organization, detected issues, and a proposed **refactor plan** that aligns technical conventions (Next.js + FastAPI/Node scripts) with conceptual layers (Vision / Data / Models / Frontend / Results).

> **2025-11-03 update:** Initial restructuring has begun. Knowledge graph CSVs now live under `data/graph/`, tracker automation scripts under `models/auto_tag/`, and documentation has been grouped under `docs/*`. The sections below capture the original assessment for historical context.

---

# 1️⃣ Current Repository Overview

After inspecting the zip, here’s what’s present:

### **Frontend / API**
- Next.js App Router structure (`app/(pages)`, `app/api/*`, `components/`, `lib/`, `styles/`)
- API routes like `/api/questions` and `/api/lists` read/write local JSONs (`data/questions.json`, `data/lists.json`)
- Pages include:
  - *Topical Past Paper Questions*
  - *Question Lists*
  - *Performance Tracker* (`/tracker/papers`, `/tracker/dashboard`)

### **Data & Static Assets**
- Question and solution images in `public/questions/` and `public/solutions/`
- Duplicates in `/2025/` subfolders
- Metadata JSONs: `data/questions.json`, `data/lists.json`

### **Scripts / Database**
- SQL migration and seeding files (`db/migrations/001_init.sql`, `db/seeds/tracker_sample.sql`)
- `scripts/tag-questions.mjs` — scans `public/questions/` + `docs/data-knowledge/Chapter List.md` and updates metadata using OpenAI API

### **Knowledge Graph & Tracker**
- Knowledge graph assets now live in `data/graph/` and tracker automation scripts under `models/auto_tag/`.
- Tracker UI specs and Chapter taxonomy documentation are grouped under `docs/frontend-ui/` and `docs/data-knowledge/`.

### **Engineering Configuration**
- `.env.example`, `.env.local`, `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json` all exist
- Redundant `.DS_Store`, `__MACOSX/` (from macOS zip)

---

# 2️⃣ Main Pain Points

| Issue | Description | Impact |
|-------|--------------|--------|
| **Image duplication** | `public/` and `2025/` contain the same images | Unnecessary size, confusing file references |
| **Data fragmentation** | Knowledge CSVs, JSONs, and scripts live in separate folders | Hard to maintain consistent paths |
| **Hardcoded paths** | Python scripts (`auto_tag.py`) use absolute Mac paths | Not portable or deployable |
| **Local JSON persistence** | `/api/questions` & `/api/lists` modify local JSON | Fails for multi-user or deployed environments |

---

# 3️⃣ Recommended Structure

Preserve the **Next.js standard runtime directories**, while introducing clean separation for data, models, and documentation.  

```bash
.
├─ src/
│  ├─ app/                 # Next.js routes & APIs
│  ├─ components/
│  ├─ lib/                 # Shared utilities + config.ts
│  └─ styles/
├─ db/
│  ├─ migrations/
│  └─ schema/
├─ scripts/                # CLI/Batch tools
├─ models/                 # AI modules (auto_tag / ocr / irt)
│  ├─ auto_tag/
│  ├─ ocr/
│  └─ irt/
├─ data/
│  ├─ graph/               # Concepts/skills/edges CSVs
│  ├─ manifests/           # Image–question mapping JSONs
│  ├─ samples/             # Small sample sets
│  └─ artifacts/           # Logs, large files (ignored or LFS)
├─ docs/
│  ├─ vision/
│  ├─ data-knowledge/
│  ├─ ai-models/
│  ├─ frontend-ui/
│  └─ results/
└─ ...
```

---

# 4️⃣ Immediate Action Plan (8 Steps)

1. **Unify image source**  
   Keep `public/questions/` & `public/solutions/`, remove duplicates in `/2025/`.  
   Optionally generate mapping JSONs in `data/manifests/`.

2. **Centralize graph data**  
   Move `concept_nodes_F4_ALL.csv`, `skill_nodes_F4_ALL.csv`, `edges_F4_ALL.csv` → `data/graph/`.

3. **Add a single config file**  
   Create `src/lib/config.ts` to store all path constants (DATA_DIR, GRAPH_DIR, etc.).

4. **Make scripts portable**  
   Rewrite `scripts/tag-questions.mjs` and `models/auto_tag/auto_tag.py` to use relative imports and environment paths.

5. **Graph validator**  
   Add a `scripts/graph-validate.ts` to ensure CSV cross-references and question links are consistent.

6. **Version control hygiene**  
   Add `.gitignore` and optional `.gitattributes` for Git-LFS management.

7. **Keep API JSON for now**  
   Maintain `/api/lists` and `/api/questions` with JSON backend, migrate to DB later.

8. **Move design notes to docs/**  
   Relocate tracker wireframes, UI specs, and “Chapter List.md” into appropriate `docs/*` subfolders.

---

# 5️⃣ Suggested Docs Organization (5 Themes)

| Folder | Focus | Typical Content |
|---------|--------|----------------|
| `docs/vision/` | Product philosophy, goals, guardrail mode, percentile simulator | `overview.md`, `roadmap.md` |
| `docs/data-knowledge/` | Knowledge graph schemas, data dictionary | `data_dictionary.md` |
| `docs/ai-models/` | OCR, auto_tag, IRT model documentation | `overview.md` |
| `docs/frontend-ui/` | UI notes, wireframes, component mapping | `notes.md` |
| `docs/results/` | Experimental outcomes, performance reports | `summary.md` |

---

# 6️⃣ Integration Plan for Codex

Once this document is saved as  
`docs/analysis_repo_structure.md`,  
you can ask Codex:

> “Read the file `docs/analysis_repo_structure.md` and comment on its proposed structure and migration plan.”

Codex will then:
- Validate whether the plan matches your actual code dependencies  
- Suggest automation scripts (for moving files or adjusting imports)  
- Highlight potential build/deploy issues  
- Propose further backend modularization or database integration steps

---

# 7️⃣ Next Possible Branch Work

After Codex feedback, create a new branch:

```bash
git checkout -b refactor/repo-structure
```

Then gradually apply:
- File movements and `config.ts` setup  
- Data relocation  
- Docs scaffolding  
- Script path fixes  

Commit each section separately with clear messages.

---

# 8️⃣ Summary

✅ **Current repo**: Working prototype but fragmented  
⚙️ **Goal**: Clean, portable, and scalable structure  
📂 **Approach**: Standardize paths + separate conceptual documentation  
🧠 **Next step**: Let Codex review this document and co-design automation for migration

---

> _Prepared collaboratively by GPT-5 (analysis) for review by Codex in Cursor environment._
