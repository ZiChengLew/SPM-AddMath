BEGIN;

-- Clear previous demo data for the tracker demo user
DELETE FROM tracker_result_questions
WHERE result_id IN (
  SELECT result_id FROM tracker_results WHERE user_id = 'demo-user'
);

DELETE FROM tracker_results
WHERE user_id = 'demo-user';

DELETE FROM tracker_recommendation_sets
WHERE user_id = 'demo-user';

-- Selangor 2024 Paper 1
INSERT INTO tracker_results (
  result_id,
  user_id,
  state,
  year,
  paper_no,
  date_done,
  time_spent_min,
  notes,
  total_score,
  total_max,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'demo-user',
  'Selangor',
  2024,
  'P1',
  '2024-05-12',
  95,
  'Vectors and differentiation mistakes. Need quicker check on sign errors.',
  73,
  90,
  NOW(),
  NOW()
);

INSERT INTO tracker_result_questions (
  result_id,
  q_no,
  section,
  max_score,
  score
) VALUES
  ('11111111-1111-4111-8111-111111111111', 1, 'A', 5, 5),
  ('11111111-1111-4111-8111-111111111111', 2, 'A', 7, 6),
  ('11111111-1111-4111-8111-111111111111', 3, 'A', 6, 6),
  ('11111111-1111-4111-8111-111111111111', 4, 'A', 6, 5),
  ('11111111-1111-4111-8111-111111111111', 5, 'A', 5, 4),
  ('11111111-1111-4111-8111-111111111111', 6, 'A', 5, 5),
  ('11111111-1111-4111-8111-111111111111', 7, 'A', 5, 4),
  ('11111111-1111-4111-8111-111111111111', 8, 'A', 5, 5),
  ('11111111-1111-4111-8111-111111111111', 9, 'A', 5, 5),
  ('11111111-1111-4111-8111-111111111111', 10, 'A', 5, 4),
  ('11111111-1111-4111-8111-111111111111', 11, 'A', 6, 6),
  ('11111111-1111-4111-8111-111111111111', 12, 'A', 6, 5),
  ('11111111-1111-4111-8111-111111111111', 13, 'B', 8, 6),
  ('11111111-1111-4111-8111-111111111111', 14, 'B', 8, 3),
  ('11111111-1111-4111-8111-111111111111', 15, 'B', 8, 4);

-- Penang 2023 Paper 2
INSERT INTO tracker_results (
  result_id,
  user_id,
  state,
  year,
  paper_no,
  date_done,
  time_spent_min,
  notes,
  total_score,
  total_max,
  created_at,
  updated_at
) VALUES (
  '22222222-2222-4222-8222-222222222222',
  'demo-user',
  'Penang',
  2023,
  'P2',
  '2024-04-28',
  140,
  'Lost marks on integration by parts. Revisit formula sheet.',
  74,
  94,
  NOW(),
  NOW()
);

INSERT INTO tracker_result_questions (
  result_id,
  q_no,
  section,
  max_score,
  score
) VALUES
  ('22222222-2222-4222-8222-222222222222', 1, 'A', 6, 6),
  ('22222222-2222-4222-8222-222222222222', 2, 'A', 6, 6),
  ('22222222-2222-4222-8222-222222222222', 3, 'A', 6, 5),
  ('22222222-2222-4222-8222-222222222222', 4, 'A', 7, 6),
  ('22222222-2222-4222-8222-222222222222', 5, 'A', 7, 5),
  ('22222222-2222-4222-8222-222222222222', 6, 'A', 7, 6),
  ('22222222-2222-4222-8222-222222222222', 7, 'A', 7, 5),
  ('22222222-2222-4222-8222-222222222222', 8, 'B', 12, 10),
  ('22222222-2222-4222-8222-222222222222', 9, 'B', 12, 9),
  ('22222222-2222-4222-8222-222222222222', 10, 'B', 12, 8),
  ('22222222-2222-4222-8222-222222222222', 11, 'B', 12, 8);

-- Johor 2025 Paper 1
INSERT INTO tracker_results (
  result_id,
  user_id,
  state,
  year,
  paper_no,
  date_done,
  time_spent_min,
  notes,
  total_score,
  total_max,
  created_at,
  updated_at
) VALUES (
  '33333333-3333-4333-8333-333333333333',
  'demo-user',
  'Johor',
  2025,
  'P1',
  '2025-01-18',
  88,
  'Speed improving. Attempted all questions this round.',
  84,
  90,
  NOW(),
  NOW()
);

INSERT INTO tracker_result_questions (
  result_id,
  q_no,
  section,
  max_score,
  score
) VALUES
  ('33333333-3333-4333-8333-333333333333', 1, 'A', 5, 5),
  ('33333333-3333-4333-8333-333333333333', 2, 'A', 7, 7),
  ('33333333-3333-4333-8333-333333333333', 3, 'A', 6, 6),
  ('33333333-3333-4333-8333-333333333333', 4, 'A', 6, 6),
  ('33333333-3333-4333-8333-333333333333', 5, 'A', 5, 5),
  ('33333333-3333-4333-8333-333333333333', 6, 'A', 5, 5),
  ('33333333-3333-4333-8333-333333333333', 7, 'A', 5, 5),
  ('33333333-3333-4333-8333-333333333333', 8, 'A', 5, 5),
  ('33333333-3333-4333-8333-333333333333', 9, 'A', 5, 5),
  ('33333333-3333-4333-8333-333333333333', 10, 'A', 5, 5),
  ('33333333-3333-4333-8333-333333333333', 11, 'A', 6, 6),
  ('33333333-3333-4333-8333-333333333333', 12, 'A', 6, 6),
  ('33333333-3333-4333-8333-333333333333', 13, 'B', 8, 6),
  ('33333333-3333-4333-8333-333333333333', 14, 'B', 8, 6),
  ('33333333-3333-4333-8333-333333333333', 15, 'B', 8, 6);

-- Kuala Lumpur 2023 Paper 2 (recent attempt)
INSERT INTO tracker_results (
  result_id,
  user_id,
  state,
  year,
  paper_no,
  date_done,
  time_spent_min,
  notes,
  total_score,
  total_max,
  created_at,
  updated_at
) VALUES (
  '44444444-4444-4444-8444-444444444444',
  'demo-user',
  'Kuala Lumpur',
  2023,
  'P2',
  CURRENT_DATE - INTERVAL '5 days',
  132,
  'Slight rush in Section A but better accuracy on definite integrals.',
  81,
  94,
  NOW(),
  NOW()
);

INSERT INTO tracker_result_questions (
  result_id,
  q_no,
  section,
  max_score,
  score
) VALUES
  ('44444444-4444-4444-8444-444444444444', 1, 'A', 6, 6),
  ('44444444-4444-4444-8444-444444444444', 2, 'A', 6, 5),
  ('44444444-4444-4444-8444-444444444444', 3, 'A', 6, 6),
  ('44444444-4444-4444-8444-444444444444', 4, 'A', 7, 6),
  ('44444444-4444-4444-8444-444444444444', 5, 'A', 7, 7),
  ('44444444-4444-4444-8444-444444444444', 6, 'A', 7, 6),
  ('44444444-4444-4444-8444-444444444444', 7, 'A', 7, 6),
  ('44444444-4444-4444-8444-444444444444', 8, 'B', 12, 11),
  ('44444444-4444-4444-8444-444444444444', 9, 'B', 12, 10),
  ('44444444-4444-4444-8444-444444444444', 10, 'B', 12, 9),
  ('44444444-4444-4444-8444-444444444444', 11, 'B', 12, 9);

-- Recommendation sets for the current user
INSERT INTO tracker_recommendation_sets (
  id,
  user_id,
  week_start,
  subtopics,
  question_ids,
  estimated_time_min,
  status,
  title,
  description,
  carries_forward,
  created_at
) VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'demo-user',
    (CURRENT_DATE - INTERVAL '7 days')::date,
    ARRAY['Differentiation: Tangent Gradient', 'Integration: Area Under Curve', 'Vectors: Lines & Planes'],
    ARRAY['P1-2024-13', 'P2-2023-08', 'P2-2023-09', 'P2-2025-08'],
    85,
    'archived',
    'Smart Revision Set — Week of ' || to_char(CURRENT_DATE - INTERVAL '7 days', 'YYYY-MM-DD'),
    'Blend of core derivative applications with fresh integration practice.',
    FALSE,
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'demo-user',
    date_trunc('week', CURRENT_DATE)::date,
    ARRAY['Integration: Substitution with bounds', 'Applications of Derivative: Tangent & Normal'],
    ARRAY['P2-2023-08', 'P2-2023-09', 'P1-2025-13'],
    70,
    'active',
    'Smart Revision Set — Week of ' || to_char(date_trunc('week', CURRENT_DATE)::date, 'YYYY-MM-DD'),
    'Targeted clean-up on substitution slips and tangent equation accuracy.',
    FALSE,
    NOW()
  );

COMMIT;
