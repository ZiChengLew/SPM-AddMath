export type SampleQuestion = {
  id: string;
  label: string;
  topic: string;
  answerLatex: string;
};

export const SAMPLE_ANSWERS: SampleQuestion[] = [
  {
    id: "kedah-2025-q1",
    label: "2025 Kedah Trial Paper 1 Q1",
    topic: "Functions",
    answerLatex: "\\frac{2x-3}{x+1}",
  },
  {
    id: "kedah-2025-q4",
    label: "2025 Kedah Trial Paper 1 Q4",
    topic: "Differentiation",
    answerLatex: "2xe^{x}",
  },
  {
    id: "kedah-2025-q11",
    label: "2025 Kedah Trial Paper 1 Q11",
    topic: "Integration",
    answerLatex: "x^{3} - \\frac{3}{2}x^{2} + 2x",
  },
];
