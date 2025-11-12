export type RecognitionType = "formula" | "text";

export interface RecognitionResult {
  type: RecognitionType;
  latex: string;
  raw_text: string;
  confidence: number;
}

export interface GradeResult {
  correct: boolean;
  reason: string;
  normalized_student?: string | null;
  normalized_answer?: string | null;
}
