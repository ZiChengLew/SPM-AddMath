-- tracker_results stores the latest attempt per (user, state, year, paper_no)
CREATE TABLE IF NOT EXISTS tracker_results (
  result_id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  state TEXT NOT NULL,
  year INTEGER NOT NULL,
  paper_no TEXT NOT NULL,
  date_done DATE NOT NULL,
  time_spent_min INTEGER,
  notes TEXT,
  total_score NUMERIC NOT NULL,
  total_max NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS tracker_results_unique_attempt
  ON tracker_results (user_id, state, year, paper_no);

-- tracker_result_questions stores per-question breakdown for each result
CREATE TABLE IF NOT EXISTS tracker_result_questions (
  result_id UUID REFERENCES tracker_results(result_id) ON DELETE CASCADE,
  q_no INTEGER NOT NULL,
  section TEXT NOT NULL,
  max_score NUMERIC NOT NULL,
  score NUMERIC,
  chapter TEXT,
  subtopic TEXT,
  cognitive TEXT,
  PRIMARY KEY (result_id, q_no)
);

-- tracker_recommendation_sets stores weekly recommendation metadata
CREATE TABLE IF NOT EXISTS tracker_recommendation_sets (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  subtopics TEXT[] DEFAULT '{}',
  question_ids TEXT[] DEFAULT '{}',
  estimated_time_min INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  carries_forward BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
