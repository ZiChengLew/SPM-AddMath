import { GradeResult, RecognitionResult } from "@/types/ai-marking";

const API_BASE = process.env.NEXT_PUBLIC_AI_MARKING_API_BASE;

function ensureBaseUrl(): string {
  if (!API_BASE) {
    throw new Error(
      "NEXT_PUBLIC_AI_MARKING_API_BASE is not defined. See .env.example."
    );
  }
  return API_BASE.replace(/\/$/, "");
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function recognizeAnswer(image: File): Promise<RecognitionResult> {
  const base = ensureBaseUrl();
  const body = new FormData();
  body.append("image", image);

  const response = await fetch(`${base}/api/recognize-answer`, {
    method: "POST",
    body,
  });
  return handleResponse<RecognitionResult>(response);
}

export async function gradeAnswer(
  studentLatex: string,
  answerLatex: string
): Promise<GradeResult> {
  const base = ensureBaseUrl();
  const response = await fetch(`${base}/api/grade-answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ student_latex: studentLatex, answer_latex: answerLatex }),
  });
  return handleResponse<GradeResult>(response);
}

