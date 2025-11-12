"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { MathLiveField } from '@/components/mathlive-field';
import { SAMPLE_ANSWERS } from '@/data/ai-marking/sample-answers';
import { recognizeAnswer, gradeAnswer } from '@/lib/ai-marking/client';
import type { GradeResult, RecognitionResult } from '@/types/ai-marking';

const QUESTIONS = SAMPLE_ANSWERS;
const PROGRESS_HIDE_DELAY_MS = 900;

type ProgressPhase = 'recognizing' | 'grading';
type ProgressState = {
  phase: ProgressPhase;
  value: number;
  message: string;
};

export default function AIMarkingPage() {
  const [questionId, setQuestionId] = useState(QUESTIONS[0]?.id ?? '');
  const selectedQuestion = useMemo(
    () => QUESTIONS.find((item) => item.id === questionId) ?? QUESTIONS[0],
    [questionId]
  );

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);
  const [studentLatex, setStudentLatex] = useState('');
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'recognizing' | 'grading'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const progressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const busy = status === 'recognizing' || status === 'grading';

  const clearProgressTimeout = () => {
    if (progressTimeoutRef.current) {
      clearTimeout(progressTimeoutRef.current);
      progressTimeoutRef.current = null;
    }
  };

  const startProgress = (
    phase: ProgressPhase,
    message: string,
    value = 0.1
  ) => {
    clearProgressTimeout();
    setProgress({ phase, message, value });
  };

  const updateProgress = (message: string, value?: number) => {
    setProgress((prev) =>
      prev ? { ...prev, message, value: value ?? prev.value } : prev
    );
  };

  const finishProgress = () => {
    clearProgressTimeout();
    setProgress((prev) =>
      prev ? { ...prev, value: 1, message: 'Completed' } : prev
    );
    progressTimeoutRef.current = setTimeout(() => {
      setProgress(null);
      progressTimeoutRef.current = null;
    }, PROGRESS_HIDE_DELAY_MS);
  };

  useEffect(() => () => clearProgressTimeout(), []);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setGrade(null);
    setRecognition(null);
    setStudentLatex('');

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    startProgress('recognizing', 'Uploading image…', 0.2);
    setStatus('recognizing');
    try {
      updateProgress('Running Pix2Text + PaddleOCR…', 0.6);
      const result = await recognizeAnswer(file);
      updateProgress('Preparing MathLive preview…', 0.9);
      setRecognition(result);
      setStudentLatex(result.latex ?? '');
      finishProgress();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : 'Unable to process the uploaded image.'
      );
      clearProgressTimeout();
      setProgress(null);
    } finally {
      setStatus('idle');
    }
  }

  async function handleGrade() {
    if (!studentLatex) {
      setError('Confirm the recognized formula before grading.');
      return;
    }
    if (!selectedQuestion) {
      setError('Select a question to compare against.');
      return;
    }

    setError(null);
    startProgress('grading', 'Normalizing expressions…', 0.3);
    setStatus('grading');
    try {
      updateProgress('Running SymPy equivalence check…', 0.7);
      const result = await gradeAnswer(studentLatex, selectedQuestion.answerLatex);
      setGrade(result);
      updateProgress('Finalizing feedback…', 0.9);
      finishProgress();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Grading failed.');
      clearProgressTimeout();
      setProgress(null);
    } finally {
      setStatus('idle');
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-semibold">AI Marking (SPM Add Math)</h1>
        <p className="mt-2 text-lg text-white/90">
          Upload a single worked answer, verify the OCR result via MathLive, and let SymPy
          check it against the model solution.
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">1. Pick a question</h2>
          <p className="mt-1 text-sm text-gray-500">
            The official answer is pulled automatically when you choose an item.
          </p>
          <label className="mt-4 block text-sm font-medium text-gray-700">
            Question
            <select
              value={questionId}
              onChange={(event) => setQuestionId(event.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none"
              disabled={busy}
            >
              {QUESTIONS.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.label} · {question.topic}
                </option>
              ))}
            </select>
          </label>

          {selectedQuestion && (
            <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Model answer
              </p>
              <MathLiveField value={selectedQuestion.answerLatex} readOnly />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">2. Upload the answer</h2>
          <p className="mt-1 text-sm text-gray-500">
            Use a clear snapshot of a single working or final answer. The OCR engine merges
            Pix2Text (math) and PaddleOCR (text).
          </p>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 hover:border-indigo-400">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={busy}
            />
            <span className="font-medium text-indigo-600">Click to upload</span>
            <span className="text-gray-400">PNG / JPG</span>
          </label>

          {imagePreview && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Uploaded preview
              </p>
              <img
                src={imagePreview}
                alt="Uploaded answer preview"
                className="mt-2 max-h-64 w-full rounded-lg object-contain border border-gray-200"
              />
            </div>
          )}

          {recognition && (
            <div className="mt-6 space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Confidence</span>
                <span className="font-semibold text-gray-900">
                  {(recognition.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="rounded-md border border-white bg-white/90 p-3 shadow-inner">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Plain text context
                </p>
                <p className="mt-1 text-sm text-gray-900">{recognition.raw_text}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  MathLive confirmation
                </p>
                <MathLiveField
                  value={studentLatex}
                  onChange={setStudentLatex}
                  aria-label="Student answer"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">3. Grade with SymPy</h2>
        <p className="mt-1 text-sm text-gray-500">
          Once the math-field looks correct, run the grading equivalence check.
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={handleGrade}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
            disabled={busy || !studentLatex}
          >
            {status === 'grading' ? 'Checking…' : 'Confirm & grade'}
          </button>
          <button
            type="button"
            onClick={() => {
              setRecognition(null);
              setGrade(null);
              setStudentLatex('');
              setImagePreview(null);
              setError(null);
            }}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            disabled={busy}
          >
            Reset
          </button>
        </div>

        {progress && (
          <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <div className="flex items-center justify-between text-sm font-medium text-indigo-900">
              <span>
                {progress.phase === 'recognizing' ? 'Recognizing answer' : 'Grading answer'}
              </span>
              <span>{Math.round(Math.min(progress.value, 1) * 100)}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${Math.min(progress.value, 1) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-indigo-900">{progress.message}</p>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {grade && (
          <div
            className={`mt-4 rounded-lg border p-4 ${
              grade.correct
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            <p className="text-base font-semibold text-gray-900">
              {grade.correct ? 'Correct' : 'Needs review'}
            </p>
            <p className="mt-1 text-sm text-gray-700">{grade.reason}</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Normalized student
                </p>
                <MathLiveField value={grade.normalized_student ?? ''} readOnly />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Normalized answer
                </p>
                <MathLiveField value={grade.normalized_answer ?? ''} readOnly />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
