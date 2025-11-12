# SPM Additional Mathematics Website Setup (Image-Based)

This guide defines how to structure your Next.js website for displaying
**SPM Additional Mathematics** questions and solutions using **image
pairs**.

------------------------------------------------------------------------

## 🗂️ Folder Structure

    /public
      /questions/
        kedah-2025-p1-q01.png
        kedah-2025-p1-q02.png
        kedah-2025-p1-q03.png
      /solutions/
        kedah-2025-p1-q01-scheme.png
        kedah-2025-p1-q02-scheme.png
        kedah-2025-p1-q03-scheme.png
    /data/
      questions.json

------------------------------------------------------------------------

## 📦 questions.json Example

``` json
[
  {
    "id": "kedah-2025-p1-q01",
    "paper_id": "kedah-2025-p1",
    "question_number": 1,
    "year": 2025,
    "state": "Kedah",
    "paper_code": "Kertas 1",
    "section": "A",
    "marks": 5,
    "question_img": "/questions/kedah-2025-p1-q01.png",
    "solution_img": "/solutions/kedah-2025-p1-q01-scheme.png"
  },
  {
    "id": "kedah-2025-p1-q02",
    "paper_id": "kedah-2025-p1",
    "question_number": 2,
    "year": 2025,
    "state": "Kedah",
    "paper_code": "Kertas 1",
    "section": "A",
    "marks": 7,
    "question_img": "/questions/kedah-2025-p1-q02.png",
    "solution_img": "/solutions/kedah-2025-p1-q02-scheme.png"
  }
]
```

------------------------------------------------------------------------

## 💻 Frontend Behavior

-   Each question is displayed as an `<img>` sourced from
    `/public/questions/`.
-   A "View Solution" button toggles the corresponding image from
    `/public/solutions/`.
-   No downloads, no external links --- purely on-site viewing.
-   Data dynamically loaded from `/data/questions.json`.

------------------------------------------------------------------------

## 🧭 User Flow

1.  User selects a paper (e.g. Kedah 2025 P1).
2.  The website loads related questions from `questions.json`.
3.  Each question shows an image and a "View Solution" toggle.
4.  User can navigate sequentially between questions.

------------------------------------------------------------------------

## ⚙️ Implementation Notes for Codex

When prompting Codex, say:

> Render a page that loads questions from `/data/questions.json` and
> displays each question image. Add a button to toggle its respective
> solution image below. Do not enable right-click download or direct PDF
> access. The page should be responsive and mobile-friendly.
