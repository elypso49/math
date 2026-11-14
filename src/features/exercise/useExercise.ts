import { useCallback, useMemo, useRef, useState } from 'react';
import { newId } from '../../lib/utils/storage';
import type { Answer, Child, Levels, LevelChange, Session, SessionKind } from '../../types/math.types';
import { useChildSessions, useFamily } from '../family/family.context';
import { itemOf } from '../learning/classify';
import { timeline } from '../learning/mastery';
import { adaptLevels } from '../learning/progression';
import { estimateLevels } from './levels';
import { createFromItem, createQuestion, withBlank, type Question } from './questions';
import { buildSeries, isPractice, MAX_EXTRA_QUESTIONS } from './series';

/** Longest answer the pad accepts. */
export const MAX_ANSWER_DIGITS = 4;

/** Wrong answers of a training brought back a few questions later. */
export const MAX_RETRIES = 2;

/** Questions between a mistake and its second chance. */
export const RETRY_GAP = 3;

/** Minimum time the verdict stays on screen, so that a double tap cannot skip it. */
export const VERDICT_LOCK_MS = 450;

/** Where the child stands in the series. */
export type ExercisePhase = 'answering' | 'checked' | 'saving';

const closeSeries = (kind: SessionKind, child: Child, previous: Session[], answers: Answer[]): { levels: Levels; changes: LevelChange[] } =>
  kind === 'evaluation' ? { levels: estimateLevels(answers, child.levels), changes: [] } : adaptLevels(child.levels, previous, answers);

/**
 * Runs a training series or an evaluation for a child: draws the questions,
 * times the thinking, the answer and the reading of the verdict (a training
 * shows it after each question, an evaluation only in the summary), gives a
 * second chance on a missed item a few questions later, lets an evaluation
 * give up a question too hard for a new one, then stores the session and the
 * new levels.
 * @param kind Training or evaluation.
 * @param child The child playing.
 * @param trainingLength Number of questions of a training or a table review.
 * @returns The current question, the typing state and the actions of the pad.
 */
export function useExercise(kind: SessionKind, child: Child, trainingLength: number) {
  const { recordSession } = useFamily();
  const previous = useChildSessions(child.id);
  const initial = useMemo(
    () => buildSeries(kind, child, timeline(previous), Math.random, Date.now(), trainingLength),
    [kind, child.id],
  );

  const [questions, setQuestions] = useState<Question[]>(initial);
  const startedAt = useRef(Date.now());
  const shownAt = useRef(Date.now());
  const firstKeyAt = useRef<number | null>(null);
  const checkedAt = useRef(0);
  const erasures = useRef(0);
  const retries = useRef(0);
  const extras = useRef(0);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<ExercisePhase>('answering');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const question = questions[index]!;
  const lastAnswer = phase === 'answering' ? null : (answers[index] ?? null);

  const press = useCallback(
    (digit: string) => {
      if (phase !== 'answering')
        return;
      firstKeyAt.current ??= Date.now();
      setTyped((current) => (current === '0' ? digit : current + digit).slice(0, MAX_ANSWER_DIGITS));
    },
    [phase],
  );

  const erase = useCallback(() => {
    if (phase !== 'answering')
      return;
    erasures.current++;
    setTyped((current) => current.slice(0, -1));
  }, [phase]);

  const scheduleRetry = useCallback(
    (missed: Question) => {
      const slot = Math.min(index + RETRY_GAP, questions.length - 1);
      if (!isPractice(kind) || retries.current >= MAX_RETRIES || slot <= index)
        return;
      retries.current++;
      const fresh = createFromItem(itemOf(missed), Math.random);
      const replay: Question = { ...(missed.blank ? withBlank(fresh, Math.random) : fresh), reason: 'retry' };
      setQuestions((current) => current.map((planned, position) => (position === slot ? replay : planned)));
    },
    [kind, index, questions.length],
  );

  const finish = useCallback(
    async (final: Answer[]): Promise<string | null> => {
      setPhase('saving');
      setError(null);
      const { levels, changes } = closeSeries(kind, child, previous, final);
      const session: Session = {
        id: newId(),
        childId: child.id,
        kind,
        startedAt: new Date(startedAt.current).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: final.reduce((total, answer) => total + answer.durationMs, 0),
        elapsedMs: Date.now() - startedAt.current,
        answers: final,
        changes,
      };
      try {
        await recordSession(session, levels);
        return session.id;
      } catch (failure) {
        setError((failure as Error).message);
        setPhase('checked');
        return null;
      }
    },
    [kind, child, previous, recordSession],
  );

  const moveOn = useCallback(
    async (final: Answer[], count: number, now: number): Promise<string | null> => {
      setAnswers(final);
      if (index >= count - 1)
        return finish(final);
      setIndex((current) => current + 1);
      setTyped('');
      setPhase('answering');
      shownAt.current = now;
      firstKeyAt.current = null;
      erasures.current = 0;
      return null;
    },
    [index, finish],
  );

  const next = useCallback(async (): Promise<string | null> => {
    const now = Date.now();
    if (phase !== 'checked' || now - checkedAt.current < VERDICT_LOCK_MS)
      return null;
    const reviewed = answers.map((answer, position) =>
      position === index && answer.reviewMs === undefined ? { ...answer, reviewMs: now - checkedAt.current } : answer,
    );
    return moveOn(reviewed, questions.length, now);
  }, [phase, answers, index, questions.length, moveOn]);

  const validate = useCallback(async (): Promise<string | null> => {
    if (phase !== 'answering' || typed === '')
      return null;
    const now = Date.now();
    const given = Number(typed);
    const answer: Answer = {
      operation: question.operation,
      level: question.level,
      left: question.left,
      right: question.right,
      expected: question.expected,
      given,
      correct: given === question.expected,
      durationMs: now - shownAt.current,
      thinkMs: (firstKeyAt.current ?? now) - shownAt.current,
      erasures: erasures.current,
      reason: question.reason,
      blank: question.blank,
    };
    if (kind === 'evaluation')
      return moveOn([...answers, answer], questions.length, now);
    setAnswers((current) => [...current, answer]);
    if (!answer.correct)
      scheduleRetry(question);
    checkedAt.current = now;
    setPhase('checked');
    return null;
  }, [phase, typed, question, kind, answers, questions.length, moveOn, scheduleRetry]);

  const skip = useCallback(async (): Promise<string | null> => {
    if (phase !== 'answering' || kind !== 'evaluation')
      return null;
    const now = Date.now();
    const answer: Answer = {
      operation: question.operation,
      level: question.level,
      left: question.left,
      right: question.right,
      expected: question.expected,
      given: 0,
      correct: false,
      skipped: true,
      durationMs: now - shownAt.current,
      erasures: erasures.current,
      reason: question.reason,
      blank: question.blank,
    };
    let count = questions.length;
    if (extras.current < MAX_EXTRA_QUESTIONS) {
      extras.current++;
      count++;
      const extra: Question = { ...createQuestion(question.operation, question.level, Math.random), reason: 'evaluation' };
      setQuestions((current) => [...current, extra]);
    }
    return moveOn([...answers, answer], count, now);
  }, [phase, kind, question, questions.length, answers, moveOn]);

  return {
    question,
    position: index + 1,
    total: questions.length,
    typed,
    phase,
    lastAnswer,
    error,
    press,
    erase,
    validate,
    next,
    skip,
  };
}
