import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { api } from '../../services/api.js';
import { useGame } from '../../game/store.js';
import { audio } from '../../services/audio.js';

/** Educational quiz. Answers are graded by the backend. */
export default function QuizModal({ quizKey, onClose }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [i, setI] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.quiz(quizKey).then((r) => setQuiz(r.quiz)).catch((e) => setError(e.message));
  }, [quizKey]);

  const submit = async (final) => {
    setBusy(true);
    try {
      const r = await api.submitQuiz(quizKey, final);
      setResult(r);
      const store = useGame.getState();
      store.setProfile(r.profile);
      store.handleUpdates(r.missionUpdates);
      r.passed ? audio.success() : audio.error();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <Modal title="Quiz" onClose={onClose}><p className="text-red-600">{error}</p></Modal>;
  if (!quiz) return <Modal title="Quiz" onClose={onClose}><p>Loading…</p></Modal>;

  if (result) {
    return (
      <Modal title={quiz.title} icon="📝" onClose={onClose} footer={
        <div className="flex gap-2">
          {!result.passed && (
            <button className="btn-ocean flex-1" onClick={() => { setResult(null); setAnswers([]); setI(0); }}>
              Try again
            </button>
          )}
          <button className="btn-primary flex-1" onClick={onClose}>Close</button>
        </div>
      }>
        <div className={`rounded-2xl p-4 text-center ${result.passed ? 'bg-tropical text-white' : 'bg-sunset/30'}`}>
          <div className="font-display text-3xl font-extrabold">{result.passed ? '🎉 Passed!' : 'Almost there!'}</div>
          <div className="font-bold">{result.score} / {result.total} correct</div>
          {result.rewards && <div className="mt-1 text-sm font-bold">+{result.rewards.xp} XP · +{result.rewards.coins} coins</div>}
        </div>
        <ol className="mt-4 space-y-3">
          {quiz.questions.map((q, k) => (
            <li key={q.id} className="rounded-xl border border-navy/10 p-3 text-sm">
              <div className="font-bold">{k + 1}. {q.question}</div>
              <div className={result.results[k].correct ? 'text-tropical' : 'text-red-600'}>
                {result.results[k].correct ? '✔ Correct' : `✘ Answer: ${q.options[result.results[k].correctIndex]}`}
              </div>
              <div className="text-navy/70">{result.results[k].explanation}</div>
            </li>
          ))}
        </ol>
      </Modal>
    );
  }

  const q = quiz.questions[i];
  const chosen = answers[i];
  const last = i === quiz.questions.length - 1;
  return (
    <Modal title={quiz.title} icon="📝" onClose={onClose}>
      <div className="mb-2 flex items-center justify-between text-sm font-bold text-navy/60">
        <span>Question {i + 1} of {quiz.questions.length}</span>
        <span>Pass: {Math.round(quiz.passRatio * 100)}%</span>
      </div>
      <div className="font-display text-xl font-bold leading-snug">{q.question}</div>
      <div className="mt-3 grid gap-2">
        {q.options.map((opt, k) => (
          <button
            key={k}
            onClick={() => {
              const a = [...answers];
              a[i] = k;
              setAnswers(a);
              audio.click();
            }}
            className={`rounded-xl border-2 px-4 py-3 text-left font-semibold transition ${chosen === k ? 'border-ocean bg-ocean/15' : 'border-navy/10 hover:border-ocean/50'}`}
          >
            <span className="mr-2 font-display font-extrabold text-ocean">{'ABCD'[k]}</span>
            {opt}
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <button className="btn-ghost btn-sm !border-navy/20 !text-navy" disabled={i === 0} onClick={() => setI(i - 1)}>◂ Back</button>
        {last ? (
          <button className="btn-green" disabled={busy || answers.filter((a) => a !== undefined).length < quiz.questions.length} onClick={() => submit(answers)}>
            Submit answers
          </button>
        ) : (
          <button className="btn-ocean" disabled={chosen === undefined} onClick={() => setI(i + 1)}>Next ▸</button>
        )}
      </div>
    </Modal>
  );
}
