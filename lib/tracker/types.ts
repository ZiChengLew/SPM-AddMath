export type PaperCode = 'P1' | 'P2';

export type ResultQuestion = {
  q_no: number;
  section: string;
  max_score: number;
  score: number | null;
  chapter?: string | null;
  subtopic?: string | null;
  cognitive?: string | null;
};

export type ResultRecord = {
  result_id: string;
  user_id: string;
  state: string;
  year: number;
  paper_no: PaperCode;
  date_done: string;
  time_spent_min: number | null;
  notes: string | null;
  total_score: number;
  total_max: number;
  by_question: ResultQuestion[];
  created_at: string;
  updated_at: string;
};

export type ResultUpsertPayload = {
  user_id: string;
  state: string;
  year: number;
  paper_no: PaperCode;
  date_done: string;
  time_spent_min: number | null;
  notes: string | null;
  by_question: ResultQuestion[];
};

export type RecommendationSet = {
  id: string;
  week_start: string;
  subtopics: string[];
  question_ids: string[];
  estimated_time_min: number;
  status: 'active' | 'archived';
  title: string;
  description: string;
  carries_forward: boolean;
};
