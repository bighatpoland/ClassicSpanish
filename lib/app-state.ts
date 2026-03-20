import { clamp, createId, daysBetween, formatLongDate, hoursBetween, toDateKey } from "@/lib/date";
import { createDefaultDailyLog, createDefaultDailyPlan, createSeedCards, createSeedPhraseInbox, createSeedSpeakingSessions, createSeedTutorNotes, DEFAULT_SETTINGS } from "@/lib/defaults";
import { applySm2Review, canCreateNewCards, isBacklogOverloaded, sortReviewQueue } from "@/lib/srs";
import type { AppState, Card, DailyLog, DailyPlanRecord, PhraseInboxItem, Review, SessionTemplate, SpeakingSession, TodayPlanStep, TodayPlanView, TutorNote, StudyMode } from "@/lib/types";

export function createSeedState(now = new Date()): AppState {
  const today = toDateKey(now);
  return {
    createdAt: now.toISOString(),
    cards: createSeedCards(now),
    reviews: [],
    phraseInbox: createSeedPhraseInbox(now),
    speakingSessions: createSeedSpeakingSessions(),
    dailyLogs: [createDefaultDailyLog(today)],
    dailyPlans: [createDefaultDailyPlan(today)],
    tutorNotes: createSeedTutorNotes(now),
    settings: DEFAULT_SETTINGS
  };
}

export function ensureAppStateDefaults(state: AppState | null | undefined, now = new Date()): AppState {
  const seeded = state ?? createSeedState(now);
  const today = toDateKey(now);
  const dailyLogs = seeded.dailyLogs.length > 0 ? seeded.dailyLogs : [createDefaultDailyLog(today)];
  const dailyPlans = seeded.dailyPlans.length > 0 ? seeded.dailyPlans : [createDefaultDailyPlan(today)];

  return {
    createdAt: seeded.createdAt ?? now.toISOString(),
    cards: seeded.cards ?? [],
    reviews: seeded.reviews ?? [],
    phraseInbox: seeded.phraseInbox ?? [],
    speakingSessions: seeded.speakingSessions ?? [],
    dailyLogs: dailyLogs.some((log) => log.date === today) ? dailyLogs : [...dailyLogs, createDefaultDailyLog(today)],
    dailyPlans: dailyPlans.some((plan) => plan.date === today) ? dailyPlans : [...dailyPlans, createDefaultDailyPlan(today)],
    tutorNotes: seeded.tutorNotes ?? [],
    settings: {
      ...DEFAULT_SETTINGS,
      ...seeded.settings
    }
  };
}

function findOrCreateLog(state: AppState, date: string): DailyLog {
  return state.dailyLogs.find((entry) => entry.date === date) ?? createDefaultDailyLog(date);
}

function findOrCreatePlan(state: AppState, date: string): DailyPlanRecord {
  return state.dailyPlans.find((entry) => entry.date === date) ?? createDefaultDailyPlan(date);
}

export function buildTodaySteps(mode: StudyMode, template: SessionTemplate): TodayPlanStep[] {
  const isMinimum = template === "minimum";
  return [
    {
      id: "srs",
      title: "SRS",
      minutes: isMinimum ? 5 : 6,
      description: "Produkcja PL -> ES i kontrola backlogu.",
      route: "/study/srs"
    },
    {
      id: "input",
      title: "Input",
      minutes: isMinimum ? 5 : 7,
      description: "Latwy material i szybkie przechwytywanie fraz.",
      route: "/study/input"
    },
    {
      id: "speak",
      title: mode === "voice" ? "Speak" : "Quiet recall",
      minutes: isMinimum ? 5 : 7,
      description: mode === "voice" ? "Nagranie albo glosna wypowiedz." : "Cichy retell i przygotowanie do glosu.",
      route: "/study/speak"
    }
  ];
}

export function getTodayPlanView(state: AppState, now = new Date()): TodayPlanView {
  const date = toDateKey(now);
  const record = findOrCreatePlan(state, date);
  const steps = buildTodaySteps(record.mode, record.template).map((step) => ({
    ...step,
    completed: record.completedStepIds.includes(step.id)
  }));
  return {
    date,
    mode: record.mode,
    template: record.template,
    steps,
    completedCount: steps.filter((step) => step.completed).length
  };
}

export function getTodayLog(state: AppState, now = new Date()): DailyLog {
  return findOrCreateLog(state, toDateKey(now));
}

function replaceDailyLog(state: AppState, nextLog: DailyLog): AppState {
  const exists = state.dailyLogs.some((entry) => entry.date === nextLog.date);
  return {
    ...state,
    dailyLogs: exists ? state.dailyLogs.map((entry) => (entry.date === nextLog.date ? nextLog : entry)) : [...state.dailyLogs, nextLog]
  };
}

function replaceDailyPlan(state: AppState, nextPlan: DailyPlanRecord): AppState {
  const exists = state.dailyPlans.some((entry) => entry.date === nextPlan.date);
  return {
    ...state,
    dailyPlans: exists ? state.dailyPlans.map((entry) => (entry.date === nextPlan.date ? nextPlan : entry)) : [...state.dailyPlans, nextPlan]
  };
}

function refreshDailyCompletion(state: AppState, date: string): AppState {
  const plan = findOrCreatePlan(state, date);
  const completed = buildTodaySteps(plan.mode, plan.template).every((step) => plan.completedStepIds.includes(step.id));
  const log = findOrCreateLog(state, date);
  return replaceDailyLog(state, { ...log, completed });
}

export function setTodayMode(state: AppState, mode: StudyMode, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const date = toDateKey(now);
  const nextState = replaceDailyPlan(prepared, { ...findOrCreatePlan(prepared, date), mode });
  return replaceDailyLog(nextState, { ...findOrCreateLog(prepared, date), mode });
}

export function setTodayTemplate(state: AppState, template: SessionTemplate, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const date = toDateKey(now);
  const nextState = replaceDailyPlan(prepared, { ...findOrCreatePlan(prepared, date), template });
  return refreshDailyCompletion(replaceDailyLog(nextState, { ...findOrCreateLog(prepared, date), sessionTemplate: template }), date);
}

export function updateDailyReflection(state: AppState, values: Pick<DailyLog, "stress" | "confidence">, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const log = findOrCreateLog(prepared, toDateKey(now));
  return replaceDailyLog(prepared, {
    ...log,
    stress: clamp(values.stress, 1, 5),
    confidence: clamp(values.confidence, 1, 5)
  });
}

export function toggleTodayStep(state: AppState, stepId: TodayPlanStep["id"], now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const date = toDateKey(now);
  const plan = findOrCreatePlan(prepared, date);
  const log = findOrCreateLog(prepared, date);
  const targetStep = buildTodaySteps(plan.mode, plan.template).find((step) => step.id === stepId);
  if (!targetStep) {
    return prepared;
  }

  const alreadyCompleted = plan.completedStepIds.includes(stepId);
  const completedStepIds = alreadyCompleted ? plan.completedStepIds.filter((value) => value !== stepId) : [...plan.completedStepIds, stepId];
  const nextState = replaceDailyPlan(prepared, { ...plan, completedStepIds });
  const totalMin = clamp(log.totalMin + (alreadyCompleted ? -targetStep.minutes : targetStep.minutes), 0, 180);
  const spoke = stepId === "speak" ? !alreadyCompleted : log.spoke;
  return refreshDailyCompletion(replaceDailyLog(nextState, { ...log, totalMin, spoke }), date);
}

export function completeTodayStep(state: AppState, stepId: TodayPlanStep["id"], now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const step = getTodayPlanView(prepared, now).steps.find((entry) => entry.id === stepId);
  if (!step || step.completed) {
    return prepared;
  }
  return toggleTodayStep(prepared, stepId, now);
}

export function getDueCards(state: AppState, now = new Date()): Card[] {
  return sortReviewQueue(state.cards, now);
}

export function getRecycleCandidates(state: AppState, now = new Date()): PhraseInboxItem[] {
  return state.phraseInbox.filter((item) => item.status !== "spoken" && hoursBetween(item.createdAt, now) <= 48);
}

export function recordReview(state: AppState, cardId: string, grade: Review["grade"], responseMs: number, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const log = findOrCreateLog(prepared, toDateKey(now));
  return replaceDailyLog(
    {
      ...prepared,
      cards: prepared.cards.map((card) => (card.id === cardId ? applySm2Review(card, grade, now) : card)),
      reviews: [...prepared.reviews, { id: createId("review"), cardId, grade, reviewedAt: now.toISOString(), responseMs }]
    },
    { ...log, reviewCount: log.reviewCount + 1 }
  );
}

export function capturePhrase(state: AppState, textEs: string, source: string, now = new Date()): AppState {
  if (!textEs.trim()) {
    return state;
  }
  const prepared = ensureAppStateDefaults(state, now);
  return {
    ...prepared,
    phraseInbox: [{ id: createId("phrase"), textEs: textEs.trim(), source, status: "captured", createdAt: now.toISOString() }, ...prepared.phraseInbox]
  };
}

export function promotePhraseToCard(state: AppState, phraseId: string, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const todayLog = getTodayLog(prepared, now);
  if (!canCreateNewCards(prepared.cards, prepared.settings, todayLog.newCount, now)) {
    return prepared;
  }

  const phrase = prepared.phraseInbox.find((item) => item.id === phraseId);
  if (!phrase || phrase.status !== "captured") {
    return prepared;
  }

  const nextState: AppState = {
    ...prepared,
    cards: [
      {
        id: createId("card"),
        promptPl: `Powiedz po hiszpansku: ${phrase.textEs}`,
        answerEs: phrase.textEs,
        tags: ["today", phrase.source],
        ease: 2.5,
        interval: 0,
        dueAt: now.toISOString(),
        lapses: 0,
        createdAt: now.toISOString()
      },
      ...prepared.cards
    ],
    phraseInbox: prepared.phraseInbox.map((item) => (item.id === phraseId ? { ...item, status: "carded" as const } : item))
  };

  return replaceDailyLog(nextState, { ...todayLog, newCount: todayLog.newCount + 1 });
}

export function markPhraseSpoken(state: AppState, phraseId: string, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const nextState: AppState = {
    ...prepared,
    phraseInbox: prepared.phraseInbox.map((item) =>
      item.id === phraseId ? { ...item, status: "spoken" as const, lastUsedAt: now.toISOString() } : item
    )
  };
  return replaceDailyLog(nextState, { ...getTodayLog(nextState, now), spoke: true });
}

export function saveSpeakingSession(state: AppState, values: Omit<SpeakingSession, "id" | "date"> & { date?: string }, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const nextState: AppState = {
    ...prepared,
    speakingSessions: [
      {
        id: createId("speak"),
        date: values.date ?? now.toISOString(),
        promptId: values.promptId,
        mode: values.mode,
        durationMin: values.durationMin,
        audioRef: values.audioRef,
        selfScores: values.selfScores
      },
      ...prepared.speakingSessions
    ]
  };
  const withCompleted = completeTodayStep(nextState, "speak", now);
  return replaceDailyLog(withCompleted, { ...getTodayLog(withCompleted, now), confidence: values.selfScores.confidence, spoke: true });
}

export function saveTutorNote(state: AppState, topic: string, mistakes: string[], correctedForms: string[], now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const note: TutorNote = {
    id: createId("tutor"),
    lessonDate: now.toISOString(),
    topic,
    mistakes: mistakes.filter(Boolean),
    correctedForms: correctedForms.filter(Boolean),
    promotedToCards: []
  };
  return {
    ...prepared,
    tutorNotes: [note, ...prepared.tutorNotes]
  };
}

export function promoteTutorCorrection(state: AppState, noteId: string, correctedForm: string, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const todayLog = getTodayLog(prepared, now);
  if (!canCreateNewCards(prepared.cards, prepared.settings, todayLog.newCount, now)) {
    return prepared;
  }

  const nextState: AppState = {
    ...prepared,
    cards: [
      {
        id: createId("card"),
        promptPl: `Powiedz po hiszpansku: ${correctedForm}`,
        answerEs: correctedForm,
        tags: ["tutor", "today"],
        ease: 2.5,
        interval: 0,
        dueAt: now.toISOString(),
        lapses: 0,
        createdAt: now.toISOString()
      },
      ...prepared.cards
    ],
    tutorNotes: prepared.tutorNotes.map((note) =>
      note.id === noteId && !note.promotedToCards.includes(correctedForm) ? { ...note, promotedToCards: [...note.promotedToCards, correctedForm] } : note
    )
  };

  return replaceDailyLog(nextState, { ...todayLog, newCount: todayLog.newCount + 1 });
}

export function updateSettings(state: AppState, nextSettings: AppState["settings"], now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  return {
    ...prepared,
    settings: {
      ...prepared.settings,
      ...nextSettings
    }
  };
}

export function getWeeklyLogs(state: AppState, now = new Date()): DailyLog[] {
  const today = toDateKey(now);
  return state.dailyLogs.filter((log) => daysBetween(log.date, today) <= 6).sort((a, b) => a.date.localeCompare(b.date));
}

export function getSnapshotTargets(state: AppState, now = new Date()): Array<{ day: 1 | 7 | 14; due: boolean; label: string; session?: SpeakingSession }> {
  const startDate = toDateKey(state.createdAt);
  const daysSinceStart = daysBetween(startDate, toDateKey(now)) + 1;
  const sessions = [...state.speakingSessions].sort((a, b) => a.date.localeCompare(b.date));

  return [1, 7, 14].map((day) => ({
    day: day as 1 | 7 | 14,
    due: daysSinceStart >= day,
    label: `Dzien ${day} • ${formatLongDate(startDate, "pl-PL")}`,
    session: sessions.find((item) => daysBetween(startDate, item.date) + 1 >= day)
  }));
}

export function getDashboardSummary(state: AppState, now = new Date()) {
  return {
    todayLog: getTodayLog(state, now),
    dueCards: getDueCards(state, now),
    backlogBlocked: isBacklogOverloaded(state.cards, state.settings, now),
    recycleCandidates: getRecycleCandidates(state, now)
  };
}
