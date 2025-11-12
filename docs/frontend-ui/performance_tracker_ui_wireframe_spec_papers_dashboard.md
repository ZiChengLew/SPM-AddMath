# Performance Tracker — UI Wireframe & Spec

> Scope: Two-page flow (**Papers** input/management + **Dashboard** analysis) with weekly AI recommendations and knowledge-link diagnostics. No CSV import/export. Store only the **latest** result per paper (idempotent overwrite).

---

## Global Navigation
- Top header tabs persist across app:
  - **Topical Past Paper Questions** | **Question Lists** | **Performance Tracker**
- When on Performance Tracker, show secondary tabs:
  - **Papers** | **Dashboard** (active highlighted)

---

## Routes
- `/tracker/papers` — Papers (input/management)
- `/tracker/dashboard` — Dashboard (analysis)

---

## Page 1: Papers (输入/管理)

### 1) Page Header
- Title: **Papers**  
- Subtitle: "Record your latest scores by question. We keep the most recent attempt for each paper."
- Actions (right): **Add Result** (primary button)

### 2) Filters / Controls Row
- State (All States)
- Year (All Years)
- Paper (All Papers)
- Date range (Last 30 days | Last 90 days | All)
- Search (placeholder: "Search by state/year/notes…")

### 3) Table List (one row per paper record)
- Columns:
  - **Date** (YYYY-MM-DD)
  - **State** (badge)
  - **Year**
  - **Paper** (P1/P2)
  - **Questions Done** (e.g., 15/15)
  - **Total / Max** (e.g., 62 / 80)
  - **%**
  - **Time Spent (min)** (optional)
  - **Notes** (truncate)
  - **Actions** (Edit • View • Delete)

### 4) Add / Edit Result (Sheet or Modal)
- **Paper Info**
  - Select: State, Year, Paper (P1/P2)
  - Date Done (default: today)
  - Time Spent (min, optional)
  - Notes (optional)
- **Mark Table** (paper-style, matching the exam cover aesthetic)

```
┌──────────────────────────────────────────────────────────────┐
│ Untuk Kegunaan Pemeriksa                                     │
├──────────┬────────────┬───────────────┬───────────────────────┤
│ Bahagian │ Nombor     │ Markah Penuh  │ Markah Diperolehi     │
│          │ Soalan     │               │ (input fields)        │
├──────────┼────────────┼───────────────┼───────────────────────┤
│ A        │ 1          │ 5             │ [ 0–5 ]               │
│ A        │ 2          │ 7             │ [ 0–7 ]               │
│ …        │ …          │ …             │ [ … ]                 │
│ B        │ 13         │ 8             │ [ 0–8 ]               │
│ B        │ 14         │ 8             │ [ 0–8 ]               │
│ B        │ 15         │ 8             │ [ 0–8 ]               │
├──────────┴────────────┴───────────────┼───────────────────────┤
│ JUMLAH (Total)                         │  [ auto-sum / 80 ]   │
└───────────────────────────────────────┴───────────────────────┘
```

- Sticky footer: **Total: 62/80 (77.5%)** • **Save Result** (primary) • Cancel
- Idempotency: if a record exists for (state, year, paper), saving **overwrites** the previous attempt.

### 5) Empty State
- Illustration + text: "No results yet. Add your first result to see your analysis here."
- CTA: **Add Result**

### 6) Loading / Error States
- Skeleton rows for table
- Toasts for save/delete success & errors

---

## Page 2: Dashboard (分析)

### KPI Cards (remove chapter coverage; show recent only)
- **Avg Score (last 3 attempts)**
- **Papers Completed (this week)**
- **Error Rate (last 7 days)**
- **Active Recommendations** (count of current week’s sets)

### Charts / Sections
1) **Progress Trend**  
   - Line chart: X = date (last 60–90 days), Y = average score or %  
   - Toggle: Average % | Raw Total

2) **Weak Links (Top 3 Subtopics)**  
   - Horizontal bars showing score % (last 7 days).  
   - Each bar has a **Fix it** CTA which jumps to the recommended set or opens subtopic detail.

3) **Knowledge Link Chain View**  
   - Graph-like chain for a chosen chapter:  
   `Functions (✅) → Differentiation (⚠️) → Applications of Derivative (❌)`  
   - Color code: ✅ ≥70%, ⚠️ 50–69%, ❌ <50% (based on last 7–14 days).  
   - Clicking a node reveals: definition, common mistakes, linked practice set.

4) **Weekly Recommendation Set**  
   - Card list (one per set):  
     - Title: *Smart Revision Set — Week of 2025-11-03*  
     - Chips: Subtopics included, total items, estimated time  
     - Primary CTA: **Start Practice**  
     - Secondary: View details (see included questions)  
   - Logic: If **no new papers** uploaded in the last 7 days → keep previous set (do not regenerate).

### Diagnostic Copy Examples
- "Differentiation → Tangent gradient questions remain <50% for 2 weeks. Review gradient function & tangent line formula. Recommended 5-question set curated to address this link."
- "Notable improvement (+8pp last 14 days), mainly from Vectors and Functions."

---

## Weekly Refresh Logic (No papers ⇒ no change)
- Refresh schedule: weekly (Sunday night) or manual refresh button.
- Steps:
  1. Gather last 7 days results. If none ⇒ skip regeneration.
  2. Compute subtopic score % and deltas vs prior week.
  3. Pick bottom 3 subtopics (min attempts threshold, e.g., ≥3 questions).
  4. Build a **Weekly Recovery Set**: 3–5 questions per weak subtopic + 1 composite question combining two weak links.
  5. Save as a list (tagged with the week). Display in Dashboard and allow direct practice.

---

## Data Model (minimal, idempotent)

**results**
- `result_id` (UUID)
- `user_id`
- `state` (string)
- `year` (int)
- `paper_no` ("P1" | "P2")
- `date_done` (date)
- `time_spent_min` (int, optional)
- `notes` (text, optional)
- `total_score` (number)
- `total_max` (number)
- `by_question` (array of items below)

**result_question** (embedded per result)
- `q_no` (int)
- `score` (number)
- `max_score` (number)
- `chapter` (string)
- `subtopic` (string)
- `cognitive` (optional; e.g., "Apply", "Analyze")

**recommendation_set**
- `id` (UUID)
- `week_start` (date)
- `subtopics` ([string])
- `question_ids` ([string])
- `estimated_time_min` (int)
- `status` ("active" | "archived")

**Idempotency Rule**
- Unique key: `(user_id, state, year, paper_no)`
- On save: replace existing record (keep `updated_at` for trend).

---

## Copy & Micro-Interactions
- Save success: "Result saved (latest attempt kept)."
- Overwrite warning (subtle): "This replaces your previous attempt for this paper."
- Empty recommendation: "Upload a paper this week to get a fresh Smart Revision Set."

---

## Hand-off Prompt (for later Codex use)
> Build **Performance Tracker** with two pages: **Papers** (paper-style score input) and **Dashboard** (analysis). Keep header tabs persistent. Papers page uses an exam-cover-inspired table: columns = Bahagian, Nombor Soalan, Markah Penuh, Markah Diperolehi, with JUMLAH auto-sum. Save is idempotent per (state, year, paper). Dashboard shows recent-only KPIs, a progress trend, Weak Links (Top 3 subtopics), a Knowledge Link Chain view with node colors by recent score%, and a Weekly Recommendation Set that only regenerates if the user uploaded papers in the last 7 days. Maintain existing blue/white, rounded-2xl, soft-shadow style. No CSV import/export.

---

## Next Steps Checklist
- [ ] Confirm subtopic taxonomy completeness (F4+F5)
- [ ] Define per-question max scores per paper (P1/P2) for auto-fill
- [ ] Decide the minimum attempts threshold for weak-link detection (e.g., ≥3)
- [ ] Draft 1–2 sample recommendation sets with real question IDs
- [ ] Write diagnostic copy templates (5–8 patterns)

