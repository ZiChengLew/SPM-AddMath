'use client';

import { useEffect, useMemo, useState } from 'react';

type Question = {
  id: string;
  paper_id: string;
  question_number: number;
  year: number;
  state: string;
  paper_code: string;
  section: string | null;
  marks: number | null;
  question_img: string;
  solution_img: string;
};

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [solutionVisible, setSolutionVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/data/questions.json');
        if (!response.ok) {
          throw new Error(`Failed to load questions (status ${response.status})`);
        }
        const payload: Question[] = await response.json();
        setQuestions(payload);
        setSelectedPaper(payload[0]?.paper_id ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const paperOptions = useMemo(() => {
    const seen = new Map<string, Question>();
    questions.forEach((question) => {
      if (!seen.has(question.paper_id)) {
        seen.set(question.paper_id, question);
      }
    });
    return Array.from(seen.values());
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (!selectedPaper) {
      return [];
    }
    return questions
      .filter((question) => question.paper_id === selectedPaper)
      .sort((a, b) => a.question_number - b.question_number);
  }, [questions, selectedPaper]);

  const currentQuestion = filteredQuestions[currentIndex] ?? null;

  useEffect(() => {
    setCurrentIndex(0);
    setSolutionVisible(false);
  }, [selectedPaper]);

  useEffect(() => {
    setSolutionVisible(false);
  }, [currentIndex]);

  if (loading) {
    return <main className="status fullscreen">Loading questions…</main>;
  }

  if (error) {
    return (
      <main className="status fullscreen error">
        Error loading questions: {error}
      </main>
    );
  }

  if (!currentQuestion) {
    return <main className="status fullscreen">No questions available.</main>;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, filteredQuestions.length - 1));
  };

  return (
    <main className="page">
      <header className="header">
        <h1>SPM Additional Mathematics</h1>
        <p>Image bank for {currentQuestion.state} {currentQuestion.year} {currentQuestion.paper_code}</p>
      </header>

      <section className="card">
        <label className="field">
          <span>Select a paper</span>
          <select
            className="select"
            value={selectedPaper ?? ''}
            onChange={(event) => setSelectedPaper(event.target.value)}
          >
            {paperOptions.map((paper) => (
              <option key={paper.paper_id} value={paper.paper_id}>
                {paper.state} {paper.year} {paper.paper_code}
              </option>
            ))}
          </select>
        </label>
      </section>

      <article className="card">
        <div className="meta">
          <span>Question {currentQuestion.question_number}</span>
          <span>{currentQuestion.section ? `Section ${currentQuestion.section}` : 'Section N/A'}</span>
          <span>{currentQuestion.marks ? `${currentQuestion.marks} marks` : 'Marks N/A'}</span>
        </div>

        <div className="image-frame">
          <img
            src={currentQuestion.question_img}
            alt={`Question ${currentQuestion.question_number}`}
            onContextMenu={(event) => event.preventDefault()}
            draggable={false}
          />
        </div>

        <button
          type="button"
          className="button primary"
          onClick={() => setSolutionVisible((prev) => !prev)}
        >
          {solutionVisible ? 'Hide Solution' : 'View Solution'}
        </button>

        {solutionVisible && (
          <div className="image-frame">
            <img
              src={currentQuestion.solution_img}
              alt={`Solution for question ${currentQuestion.question_number}`}
              onContextMenu={(event) => event.preventDefault()}
              draggable={false}
            />
          </div>
        )}

        <div className="nav">
          <button
            type="button"
            className="button subtle"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            Previous
          </button>
          <span className="counter">
            {currentIndex + 1} of {filteredQuestions.length}
          </span>
          <button
            type="button"
            className="button subtle"
            onClick={handleNext}
            disabled={currentIndex === filteredQuestions.length - 1}
          >
            Next
          </button>
        </div>
      </article>
    </main>
  );
}
