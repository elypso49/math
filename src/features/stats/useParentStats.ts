import { useMemo, useState } from 'react';
import type { StatTab } from '../../components/parent/stats/StatTabs';
import { useChildSessions, useFamily } from '../family/family.context';
import { overallLevel } from '../exercise/levels';
import { frontierSkills } from '../learning/skills';
import { operationStats } from './operationStats';
import { figures, fragileSkills, insights, lastEvaluation, weekSummary } from './stats';

/**
 * Figures of the parent dashboard for the child picked in the chips, and the
 * detail of the operation picked in the tabs.
 * @param initialChildId Child selected first, the first child when null.
 * @returns The selected child and tab, their handlers and the statistics.
 */
export function useParentStats(initialChildId: string | null = null) {
  const { family } = useFamily();
  const children = family?.children ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(initialChildId);
  const [tab, setTab] = useState<StatTab>('overview');
  const child = children.find((candidate) => candidate.id === selectedId) ?? children[0] ?? null;
  const sessions = useChildSessions(child?.id ?? null);

  const overview = useMemo(() => {
    const now = new Date();
    const evaluation = lastEvaluation(sessions);
    return {
      evaluation: evaluation && { session: evaluation, ...figures(evaluation) },
      week: weekSummary(sessions, now),
      insights: [...insights(sessions, now), ...fragileSkills(sessions)],
    };
  }, [sessions]);

  const detail = useMemo(() => {
    if (tab === 'overview' || !child)
      return null;
    return {
      operation: tab,
      stats: operationStats(tab, sessions, new Date()),
      targetMs: Math.max(...frontierSkills(tab, child.levels[tab]).map((candidate) => candidate.targetMs)),
    };
  }, [tab, child, sessions]);

  return {
    children,
    child,
    select: setSelectedId,
    tab,
    setTab,
    overall: child ? overallLevel(child.levels, child.operations) : null,
    detail,
    ...overview,
  };
}
