import { randomUUID } from 'crypto';
import { getPool } from './db';
import type { RecommendationSet, ResultQuestion, ResultRecord, ResultUpsertPayload } from './types';

type ResultRow = {
  result_id: string;
  user_id: string;
  state: string;
  year: number;
  paper_no: string;
  date_done: string;
  time_spent_min: number | null;
  notes: string | null;
  total_score: number;
  total_max: number;
  created_at: string;
  updated_at: string;
};

type QuestionRow = {
  result_id: string;
  q_no: number;
  section: string;
  max_score: number;
  score: number | null;
  chapter: string | null;
  subtopic: string | null;
  cognitive: string | null;
};

type RecommendationRow = {
  id: string;
  user_id: string;
  week_start: string;
  subtopics: string[] | null;
  question_ids: string[] | null;
  estimated_time_min: number | null;
  status: string;
  title: string;
  description: string | null;
  carries_forward: boolean;
};

export async function listResults(userId: string): Promise<ResultRecord[]> {
  const pool = getPool();
  const resultsQuery = await pool.query<ResultRow>(
    `
      SELECT
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
      FROM tracker_results
      WHERE user_id = $1
      ORDER BY date_done DESC, updated_at DESC
    `,
    [userId]
  );

  if (resultsQuery.rows.length === 0) {
    return [];
  }

  const ids = resultsQuery.rows.map((row) => row.result_id);
  const questionsQuery = await pool.query<QuestionRow>(
    `
      SELECT
        result_id,
        q_no,
        section,
        max_score,
        score,
        chapter,
        subtopic,
        cognitive
      FROM tracker_result_questions
      WHERE result_id = ANY($1::uuid[])
      ORDER BY section, q_no
    `,
    [ids]
  );

  const groupedQuestions = new Map<string, ResultQuestion[]>();
  questionsQuery.rows.forEach((row) => {
    const list = groupedQuestions.get(row.result_id) ?? [];
    list.push({
      q_no: row.q_no,
      section: row.section,
      max_score: Number(row.max_score),
      score: row.score === null ? null : Number(row.score),
      chapter: row.chapter,
      subtopic: row.subtopic,
      cognitive: row.cognitive
    });
    groupedQuestions.set(row.result_id, list);
  });

  return resultsQuery.rows.map((row) => ({
    result_id: row.result_id,
    user_id: row.user_id,
    state: row.state,
    year: Number(row.year),
    paper_no: row.paper_no as 'P1' | 'P2',
    date_done: row.date_done,
    time_spent_min: row.time_spent_min === null ? null : Number(row.time_spent_min),
    notes: row.notes,
    total_score: Number(row.total_score),
    total_max: Number(row.total_max),
    by_question: groupedQuestions.get(row.result_id) ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

export async function getResultById(userId: string, resultId: string): Promise<ResultRecord | null> {
  const pool = getPool();
  const result = await pool.query<ResultRow>(
    `
      SELECT
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
      FROM tracker_results
      WHERE user_id = $1 AND result_id = $2
      LIMIT 1
    `,
    [userId, resultId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const questions = await pool.query<QuestionRow>(
    `
      SELECT
        result_id,
        q_no,
        section,
        max_score,
        score,
        chapter,
        subtopic,
        cognitive
      FROM tracker_result_questions
      WHERE result_id = $1
      ORDER BY section, q_no
    `,
    [resultId]
  );

  return {
    ...result.rows[0],
    year: Number(result.rows[0].year),
    paper_no: result.rows[0].paper_no as 'P1' | 'P2',
    total_score: Number(result.rows[0].total_score),
    total_max: Number(result.rows[0].total_max),
    time_spent_min:
      result.rows[0].time_spent_min === null ? null : Number(result.rows[0].time_spent_min),
    by_question: questions.rows.map((row) => ({
      q_no: row.q_no,
      section: row.section,
      max_score: Number(row.max_score),
      score: row.score === null ? null : Number(row.score),
      chapter: row.chapter,
      subtopic: row.subtopic,
      cognitive: row.cognitive
    }))
  };
}

export async function deleteResult(userId: string, resultId: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(
    'DELETE FROM tracker_results WHERE result_id = $1 AND user_id = $2',
    [resultId, userId]
  );
  return res.rowCount > 0;
}

export async function upsertResult(payload: ResultUpsertPayload): Promise<ResultRecord> {
  const pool = getPool();
  const client = await pool.connect();
  const totals = computeTotals(payload.by_question);

  try {
    await client.query('BEGIN');

    const existing = await client.query<{ result_id: string }>(
      `
        SELECT result_id
        FROM tracker_results
        WHERE user_id = $1 AND state = $2 AND year = $3 AND paper_no = $4
        LIMIT 1
      `,
      [payload.user_id, payload.state, payload.year, payload.paper_no]
    );

    const resultId = existing.rows[0]?.result_id ?? randomUUID();

    if (existing.rows.length > 0) {
      await client.query(
        `
          UPDATE tracker_results
          SET
            date_done = $1,
            time_spent_min = $2,
            notes = $3,
            total_score = $4,
            total_max = $5,
            updated_at = NOW()
          WHERE result_id = $6
        `,
        [
          payload.date_done,
          payload.time_spent_min,
          payload.notes,
          totals.totalScore,
          totals.totalMax,
          resultId
        ]
      );

      await client.query('DELETE FROM tracker_result_questions WHERE result_id = $1', [resultId]);
    } else {
      await client.query(
        `
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
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        `,
        [
          resultId,
          payload.user_id,
          payload.state,
          payload.year,
          payload.paper_no,
          payload.date_done,
          payload.time_spent_min,
          payload.notes,
          totals.totalScore,
          totals.totalMax
        ]
      );
    }

    for (const question of payload.by_question) {
      await client.query(
        `
          INSERT INTO tracker_result_questions (
            result_id,
            q_no,
            section,
            max_score,
            score,
            chapter,
            subtopic,
            cognitive
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          resultId,
          question.q_no,
          question.section,
          question.max_score,
          typeof question.score === 'number' ? question.score : null,
          question.chapter ?? null,
          question.subtopic ?? null,
          question.cognitive ?? null
        ]
      );
    }

    await client.query('COMMIT');

    const saved = await getResultById(payload.user_id, resultId);
    if (!saved) {
      throw new Error('Failed to load saved result');
    }
    return saved;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listRecommendations(userId: string): Promise<RecommendationSet[]> {
  const pool = getPool();
  const rows = await pool.query<RecommendationRow>(
    `
      SELECT
        id,
        user_id,
        week_start,
        subtopics,
        question_ids,
        estimated_time_min,
        status,
        title,
        description,
        carries_forward
      FROM tracker_recommendation_sets
      WHERE user_id = $1
      ORDER BY week_start DESC
    `,
    [userId]
  );

  return rows.rows.map((row) => ({
    id: row.id,
    week_start: row.week_start,
    subtopics: row.subtopics ?? [],
    question_ids: row.question_ids ?? [],
    estimated_time_min:
      row.estimated_time_min === null ? 0 : Number(row.estimated_time_min),
    status: row.status as RecommendationSet['status'],
    title: row.title,
    description: row.description ?? '',
    carries_forward: row.carries_forward
  }));
}

function computeTotals(questions: ResultQuestion[]) {
  return questions.reduce(
    (acc, question) => ({
      totalScore: acc.totalScore + (typeof question.score === 'number' ? question.score : 0),
      totalMax: acc.totalMax + question.max_score
    }),
    { totalScore: 0, totalMax: 0 }
  );
}
