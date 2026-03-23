import { clamp, createId, daysBetween, formatLongDate, hoursBetween, toDateKey } from "@/lib/date";
import {
  createDefaultDailyLog,
  createDefaultDailyPlan,
  createSeedCards,
  createSeedPhraseInbox,
  createSeedSpeakingSessions,
  createSeedTutorNotes,
  createSpeakingMissions,
  createWeeklyFocuses,
  DEFAULT_LEARNER_PROFILE,
  DEFAULT_SETTINGS,
  INPUT_LIBRARY,
  WEEKLY_FOCUS_TEMPLATES
} from "@/lib/defaults";
import { applySm2Review, canCreateNewCards, isBacklogOverloaded, sortReviewQueue } from "@/lib/srs";
import type {
  ActivationStage,
  AppState,
  Card,
  DailyLog,
  DailyPlanRecord,
  DashboardSummary,
  LearnerProfile,
  PhraseInboxItem,
  PhraseStatus,
  Review,
  SessionTemplate,
  SpeakingMission,
  SpeakingSession,
  TodayPlanStep,
  TodayPlanView,
  TutorCorrection,
  TutorCorrectionPin,
  TutorNote,
  UseTodayItem,
  WeeklyFocus,
  WeeklyRecommendation,
  StudyMode
} from "@/lib/types";

const ACTIVATION_ORDER: ActivationStage[] = ["captured", "clarified", "carded", "primed", "used_today", "reused", "stable"];

function stageRank(stage: ActivationStage): number {
  return ACTIVATION_ORDER.indexOf(stage);
}

function nextStageAfterSpeech(timesSpoken: number): ActivationStage {
  if (timesSpoken >= 3) {
    return "stable";
  }
  if (timesSpoken >= 2) {
    return "reused";
  }
  return "used_today";
}

function maxStage(current: ActivationStage, target: ActivationStage): ActivationStage {
  return stageRank(current) >= stageRank(target) ? current : target;
}

function inferStageFromStatus(status?: string, lastUsedAt?: string): ActivationStage {
  if (lastUsedAt || status === "spoken") {
    return "used_today";
  }
  if (status === "carded") {
    return "carded";
  }
  return "captured";
}

function derivePhraseStatus(stage: ActivationStage, timesSpoken: number): PhraseStatus {
  if (timesSpoken > 0 || stageRank(stage) >= stageRank("used_today")) {
    return "spoken";
  }
  if (stageRank(stage) >= stageRank("carded")) {
    return "carded";
  }
  return "captured";
}

function normalizePriorityContexts(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_LEARNER_PROFILE.priorityContexts;
  }
  const next = value.map((entry) => String(entry).trim()).filter(Boolean);
  return next.length > 0 ? next : DEFAULT_LEARNER_PROFILE.priorityContexts;
}

function chooseNextFocusId(profile: LearnerProfile, recentTopicIds: string[]): string {
  const ranked = WEEKLY_FOCUS_TEMPLATES.map((template) => {
    const priorityScore = profile.priorityContexts.some((context) => template.context.includes(context) || template.id.includes(context)) ? 2 : 0;
    const recentPenalty = recentTopicIds.includes(template.id) ? -1 : 0;
    return { id: template.id, score: priorityScore + recentPenalty };
  }).sort((left, right) => right.score - left.score);

  return ranked[0]?.id ?? WEEKLY_FOCUS_TEMPLATES[0]!.id;
}

function ensureLearnerProfile(profile: Partial<LearnerProfile> | null | undefined): LearnerProfile {
  return {
    ...DEFAULT_LEARNER_PROFILE,
    ...profile,
    priorityContexts: normalizePriorityContexts(profile?.priorityContexts)
  };
}

function ensureCardDefaults(card: Partial<Card>, now: Date, fallbackTopicId: string): Card {
  const activationStage = (card.activationStage as ActivationStage | undefined) ?? inferStageFromStatus(undefined, card.lastSpokenAt);
  return {
    id: card.id ?? createId("card"),
    promptPl: card.promptPl ?? "",
    answerEs: card.answerEs ?? "",
    tags: card.tags ?? [],
    ease: card.ease ?? 2.5,
    interval: card.interval ?? 0,
    dueAt: card.dueAt ?? now.toISOString(),
    lapses: card.lapses ?? 0,
    createdAt: card.createdAt ?? now.toISOString(),
    sourceType: card.sourceType ?? "phrase_inbox",
    topicId: card.topicId ?? fallbackTopicId,
    utilityScore: card.utilityScore ?? (card.tags?.includes("today") ? 85 : 70),
    activationStage,
    timesSpoken: card.timesSpoken ?? (card.lastSpokenAt ? 1 : 0),
    lastSpokenAt: card.lastSpokenAt,
    nextUseBy: card.nextUseBy,
    linkedPhraseId: card.linkedPhraseId
  };
}

function ensurePhraseDefaults(item: Partial<PhraseInboxItem>, now: Date, fallbackTopicId: string): PhraseInboxItem {
  const activationStage = (item.activationStage as ActivationStage | undefined) ?? inferStageFromStatus(item.status, item.lastUsedAt);
  const timesSpoken = item.timesSpoken ?? (item.lastUsedAt ? 1 : 0);
  return {
    id: item.id ?? createId("phrase"),
    textEs: item.textEs ?? "",
    source: item.source ?? "self",
    status: derivePhraseStatus(activationStage, timesSpoken),
    createdAt: item.createdAt ?? now.toISOString(),
    lastUsedAt: item.lastUsedAt,
    meaningOrPromptPl: item.meaningOrPromptPl,
    topicId: item.topicId ?? fallbackTopicId,
    clarified: item.clarified ?? Boolean(item.meaningOrPromptPl),
    promotedCardId: item.promotedCardId,
    timesSpoken,
    nextReuseAt: item.nextReuseAt,
    activationStage,
  };
}

function ensureTutorCorrectionDefaults(text: string, existing?: Partial<TutorCorrection>): TutorCorrection {
  return {
    id: existing?.id ?? createId("correction"),
    text,
    pin: existing?.pin ?? "this_week",
    promotedToCard: existing?.promotedToCard ?? false,
    usedInMission: existing?.usedInMission ?? false
  };
}

function ensureTutorNoteDefaults(note: Partial<TutorNote>, now: Date): TutorNote {
  const correctedForms = (note.correctedForms ?? note.corrections?.map((item) => item.text) ?? []).filter(Boolean);
  const existingCorrectionsByText = new Map((note.corrections ?? []).map((item) => [item.text, item]));
  const corrections = correctedForms.map((text) => ensureTutorCorrectionDefaults(text, existingCorrectionsByText.get(text)));

  return {
    id: note.id ?? createId("tutor"),
    lessonDate: note.lessonDate ?? now.toISOString(),
    topic: note.topic ?? "Lekcja",
    mistakes: note.mistakes ?? [],
    correctedForms,
    promotedToCards: note.promotedToCards ?? corrections.filter((item) => item.promotedToCard).map((item) => item.text),
    corrections
  };
}

function ensureWeeklyFocuses(state: Partial<AppState>, now: Date, learnerProfile: LearnerProfile): WeeklyFocus[] {
  const seeded = createWeeklyFocuses(now);
  if (!state.weeklyFocuses || state.weeklyFocuses.length === 0) {
    const preferredId = chooseNextFocusId(learnerProfile, []);
    return seeded.map((focus) => ({
      ...focus,
      status: focus.id === preferredId ? "active" : "queued"
    }));
  }

  const recentTopicIds = [...(state.cards ?? []), ...(state.phraseInbox ?? [])]
    .map((item) => item.topicId)
    .filter((value): value is string => Boolean(value))
    .slice(0, 5);
  const desiredActiveId = chooseNextFocusId(learnerProfile, recentTopicIds);
  const knownFocuses = state.weeklyFocuses.map((focus) => ({
    ...focus,
    status: focus.status ?? "queued"
  }));

  if (knownFocuses.some((focus) => focus.status === "active")) {
    return knownFocuses;
  }

  return knownFocuses.map((focus, index) => ({
    ...focus,
    status: focus.id === desiredActiveId || index === 0 ? "active" : focus.status
  }));
}

function ensureSpeakingMissions(state: Partial<AppState>, now: Date): SpeakingMission[] {
  const seeded = createSpeakingMissions(now);
  if (!state.speakingMissions || state.speakingMissions.length === 0) {
    return seeded;
  }

  const existing = new Map(state.speakingMissions.map((mission) => [mission.id, mission]));
  return seeded.map((mission) => ({
    ...mission,
    ...existing.get(mission.id)
  }));
}

export function createSeedState(now = new Date()): AppState {
  return ensureAppStateDefaults(
    {
      createdAt: now.toISOString(),
      cards: createSeedCards(now),
      reviews: [],
      phraseInbox: createSeedPhraseInbox(now),
      speakingSessions: createSeedSpeakingSessions(),
      dailyLogs: [createDefaultDailyLog(toDateKey(now))],
      dailyPlans: [createDefaultDailyPlan(toDateKey(now))],
      tutorNotes: createSeedTutorNotes(now),
      weeklyFocuses: createWeeklyFocuses(now),
      speakingMissions: createSpeakingMissions(now),
      learnerProfile: DEFAULT_LEARNER_PROFILE,
      settings: DEFAULT_SETTINGS
    },
    now
  );
}

export function ensureAppStateDefaults(state: Partial<AppState> | null | undefined, now = new Date()): AppState {
  const today = toDateKey(now);
  const seeded = state ?? {};
  const learnerProfile = ensureLearnerProfile(seeded.learnerProfile);
  const weeklyFocuses = ensureWeeklyFocuses(seeded, now, learnerProfile);
  const activeFocus = weeklyFocuses.find((focus) => focus.status === "active") ?? weeklyFocuses[0];
  const fallbackTopicId = activeFocus?.id ?? WEEKLY_FOCUS_TEMPLATES[0]!.id;

  const dailyLogs = (seeded.dailyLogs ?? []).map((log) => ({
    ...createDefaultDailyLog(log.date ?? today),
    ...log,
    activatedCount: log.activatedCount ?? 0,
    reusedCount: log.reusedCount ?? 0,
    missionCompleted: log.missionCompleted ?? false
  }));

  const dailyPlans = (seeded.dailyPlans ?? []).map((plan) => ({
    ...createDefaultDailyPlan(plan.date ?? today),
    ...plan
  }));

  return {
    createdAt: seeded.createdAt ?? now.toISOString(),
    cards: (seeded.cards ?? createSeedCards(now)).map((card) => ensureCardDefaults(card, now, fallbackTopicId)),
    reviews: seeded.reviews ?? [],
    phraseInbox: (seeded.phraseInbox ?? createSeedPhraseInbox(now)).map((item) => ensurePhraseDefaults(item, now, fallbackTopicId)),
    speakingSessions: (seeded.speakingSessions ?? createSeedSpeakingSessions()).map((session) => ({
      ...session,
      usedPhraseRefs: session.usedPhraseRefs ?? [],
      selfScores: {
        hesitation: session.selfScores?.hesitation ?? (session.selfScores as any)?.stumbles ?? 3,
        connectors: session.selfScores?.connectors ?? 3,
        repair: session.selfScores?.repair ?? (session.selfScores as any)?.clarity ?? 3,
        sentenceLength: session.selfScores?.sentenceLength ?? 3,
        confidence: session.selfScores?.confidence ?? 3
      }
    })),
    dailyLogs: dailyLogs.some((log) => log.date === today) ? dailyLogs : [...dailyLogs, createDefaultDailyLog(today)],
    dailyPlans: dailyPlans.some((plan) => plan.date === today) ? dailyPlans : [...dailyPlans, createDefaultDailyPlan(today)],
    tutorNotes: (seeded.tutorNotes ?? createSeedTutorNotes(now)).map((note) => ensureTutorNoteDefaults(note, now)),
    weeklyFocuses,
    speakingMissions: ensureSpeakingMissions(seeded, now),
    learnerProfile,
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

export function getCurrentWeeklyFocus(state: AppState): WeeklyFocus {
  return state.weeklyFocuses.find((focus) => focus.status === "active") ?? state.weeklyFocuses[0]!;
}

export function getCurrentMissions(state: AppState): SpeakingMission[] {
  const focus = getCurrentWeeklyFocus(state);
  return state.speakingMissions.filter((mission) => focus.missionIds.includes(mission.id));
}

export function getCurrentSpeakingMission(state: AppState): SpeakingMission {
  const missions = getCurrentMissions(state);
  return missions.find((mission) => mission.status !== "completed") ?? missions[0]!;
}

export function getCurrentInputItems(state: AppState) {
  const focus = getCurrentWeeklyFocus(state);
  return INPUT_LIBRARY.filter((item) => focus.inputIds.includes(item.id));
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

function replaceMission(state: AppState, nextMission: SpeakingMission): AppState {
  return {
    ...state,
    speakingMissions: state.speakingMissions.map((mission) => (mission.id === nextMission.id ? nextMission : mission))
  };
}

function replaceWeeklyFocus(state: AppState, nextFocus: WeeklyFocus): AppState {
  return {
    ...state,
    weeklyFocuses: state.weeklyFocuses.map((focus) => (focus.id === nextFocus.id ? nextFocus : focus))
  };
}

function refreshDailyCompletion(state: AppState, date: string): AppState {
  const plan = findOrCreatePlan(state, date);
  const completed = buildTodaySteps(plan.mode, plan.template).every((step) => plan.completedStepIds.includes(step.id));
  const log = findOrCreateLog(state, date);
  return replaceDailyLog(state, { ...log, completed });
}

function updateFocusChunkQueue(focus: WeeklyFocus, state: AppState): UseTodayItem[] {
  const usedTexts = new Set<string>();
  const chunkItems = focus.targetChunks.slice(0, 4).map((chunk, index) => ({
    id: `focus-item-${focus.id}-${index}`,
    refId: `focus:${focus.id}:${index}`,
    text: chunk,
    source: "focus" as const,
    activationStage: "clarified" as ActivationStage,
    topicId: focus.id,
    reason: "Target chunk for this week's speaking goal.",
    dueNow: true
  }));

  const fromPhrases = state.phraseInbox
    .filter((item) => item.topicId === focus.id && stageRank(item.activationStage) >= stageRank("clarified"))
    .slice(0, 2)
    .map((item) => ({
      id: item.id,
      refId: `phrase:${item.id}`,
      text: item.textEs,
      source: "phrase" as const,
      activationStage: item.activationStage,
      topicId: item.topicId,
      reason: item.nextReuseAt && new Date(item.nextReuseAt).getTime() <= Date.now() ? "Needs reuse in the next 48 hours." : "Recent captured phrase linked to this week.",
      dueNow: Boolean(item.nextReuseAt)
    }));

  const fromCards = sortReviewQueue(state.cards)
    .filter((card) => card.topicId === focus.id)
    .slice(0, 2)
    .map((card) => ({
      id: card.id,
      refId: `card:${card.id}`,
      text: card.answerEs,
      source: "card" as const,
      activationStage: card.activationStage,
      topicId: card.topicId,
      reason: "Due review with high utility for this week.",
      dueNow: true
    }));

  const fromTutor = state.tutorNotes.flatMap((note) =>
    note.corrections
      .filter((correction) => correction.pin === "this_week")
      .slice(0, 2)
      .map((correction) => ({
        id: correction.id,
        refId: `correction:${correction.id}`,
        text: correction.text,
        source: "tutor" as const,
        activationStage: correction.usedInMission ? ("used_today" as ActivationStage) : ("clarified" as ActivationStage),
        topicId: focus.id,
        reason: "Pinned tutor correction for this week.",
        dueNow: !correction.usedInMission
      }))
  );

  return [...fromCards, ...fromPhrases, ...fromTutor, ...chunkItems].filter((item) => {
    if (usedTexts.has(item.text)) {
      return false;
    }
    usedTexts.add(item.text);
    return true;
  });
}

export function buildTodaySteps(mode: StudyMode, template: SessionTemplate): TodayPlanStep[] {
  const isMinimum = template === "minimum";
  return [
    {
      id: "srs",
      title: "SRS",
      minutes: isMinimum ? 5 : 6,
      description: "Memory review plus priming phrases for use today.",
      route: "/study/srs"
    },
    {
      id: "input",
      title: "Input",
      minutes: isMinimum ? 5 : 7,
      description: "Notice key chunks, capture 1-2 useful lines, then hand off to speaking.",
      route: "/study/input"
    },
    {
      id: "speak",
      title: mode === "voice" ? "Speaking mission" : "Quiet mission",
      minutes: isMinimum ? 5 : 7,
      description: mode === "voice" ? "Complete one communicative mission using your target chunks." : "Prepare the mission mentally and rehearse target chunks.",
      route: "/study/speak"
    }
  ];
}

export function getTodayPlanView(state: AppState, now = new Date()): TodayPlanView {
  const date = toDateKey(now);
  const record = findOrCreatePlan(state, date);
  const focus = getCurrentWeeklyFocus(state);
  const mission = getCurrentSpeakingMission(state);
  const steps = buildTodaySteps(record.mode, record.template).map((step) => ({
    ...step,
    completed: record.completedStepIds.includes(step.id)
  }));
  const tutorCarryover = state.tutorNotes.flatMap((note) => note.corrections.filter((correction) => correction.pin === "this_week" && !correction.usedInMission));

  return {
    date,
    mode: record.mode,
    template: record.template,
    communicativeGoal: focus.goal,
    weeklyFocus: focus,
    mission,
    steps,
    completedCount: steps.filter((step) => step.completed).length,
    targetChunks: focus.targetChunks,
    useTodayQueue: updateFocusChunkQueue(focus, state),
    tutorCarryover
  };
}

export function getTodayLog(state: AppState, now = new Date()): DailyLog {
  return findOrCreateLog(state, toDateKey(now));
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
  return state.phraseInbox.filter((item) => {
    if (!item.nextReuseAt) {
      return hoursBetween(item.createdAt, now) <= 48 && stageRank(item.activationStage) < stageRank("reused");
    }
    return new Date(item.nextReuseAt).getTime() <= now.getTime();
  });
}

export function recordReview(state: AppState, cardId: string, grade: Review["grade"], responseMs: number, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const log = findOrCreateLog(prepared, toDateKey(now));

  return replaceDailyLog(
    {
      ...prepared,
      cards: prepared.cards.map((card) => {
        if (card.id !== cardId) {
          return card;
        }
        const reviewed = applySm2Review(card, grade, now);
        if (grade >= 3) {
          return {
            ...reviewed,
            activationStage: maxStage(reviewed.activationStage, "primed"),
            nextUseBy: reviewed.nextUseBy ?? new Date(now.getTime() + 48 * 3_600_000).toISOString()
          };
        }
        return reviewed;
      }),
      reviews: [...prepared.reviews, { id: createId("review"), cardId, grade, reviewedAt: now.toISOString(), responseMs }]
    },
    { ...log, reviewCount: log.reviewCount + 1 }
  );
}

export function capturePhrase(
  state: AppState,
  textEs: string,
  source: string,
  options?: { meaningOrPromptPl?: string; topicId?: string },
  now = new Date()
): AppState {
  if (!textEs.trim()) {
    return state;
  }
  const prepared = ensureAppStateDefaults(state, now);
  const focus = getCurrentWeeklyFocus(prepared);
  const clarified = Boolean(options?.meaningOrPromptPl?.trim());
  return {
    ...prepared,
    phraseInbox: [
      {
        id: createId("phrase"),
        textEs: textEs.trim(),
        source,
        status: "captured",
        createdAt: now.toISOString(),
        meaningOrPromptPl: options?.meaningOrPromptPl?.trim(),
        topicId: options?.topicId ?? focus.id,
        clarified,
        timesSpoken: 0,
        activationStage: clarified ? "clarified" : "captured"
      },
      ...prepared.phraseInbox
    ]
  };
}

export function clarifyPhrase(state: AppState, phraseId: string, meaningOrPromptPl: string, topicId?: string, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  return {
    ...prepared,
    phraseInbox: prepared.phraseInbox.map((item) =>
      item.id === phraseId
        ? {
            ...item,
            meaningOrPromptPl: meaningOrPromptPl.trim(),
            topicId: topicId ?? item.topicId,
            clarified: Boolean(meaningOrPromptPl.trim()),
            activationStage: meaningOrPromptPl.trim() ? maxStage(item.activationStage, "clarified") : item.activationStage
          }
        : item
    )
  };
}

export function promotePhraseToCard(state: AppState, phraseId: string, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const todayLog = getTodayLog(prepared, now);
  if (!canCreateNewCards(prepared.cards, prepared.settings, todayLog.newCount, now)) {
    return prepared;
  }

  const phrase = prepared.phraseInbox.find((item) => item.id === phraseId);
  if (!phrase || stageRank(phrase.activationStage) < stageRank("clarified")) {
    return prepared;
  }

  const nextCardId = createId("card");
  const nextState: AppState = {
    ...prepared,
    cards: [
      {
        id: nextCardId,
        promptPl: phrase.meaningOrPromptPl?.trim() || `Powiedz po hiszpansku: ${phrase.textEs}`,
        answerEs: phrase.textEs,
        tags: ["today", phrase.source],
        ease: 2.5,
        interval: 0,
        dueAt: now.toISOString(),
        lapses: 0,
        createdAt: now.toISOString(),
        sourceType: "phrase_inbox",
        topicId: phrase.topicId,
        utilityScore: phrase.topicId === getCurrentWeeklyFocus(prepared).id ? 90 : 76,
        activationStage: "carded",
        timesSpoken: 0,
        nextUseBy: new Date(now.getTime() + 48 * 3_600_000).toISOString(),
        linkedPhraseId: phrase.id
      },
      ...prepared.cards
    ],
    phraseInbox: prepared.phraseInbox.map((item) =>
      item.id === phraseId
        ? {
            ...item,
            status: "carded",
            promotedCardId: nextCardId,
            activationStage: maxStage(item.activationStage, "carded")
          }
        : item
    )
  };

  return replaceDailyLog(nextState, { ...todayLog, newCount: todayLog.newCount + 1 });
}

export function markPhraseSpoken(state: AppState, phraseId: string, now = new Date()): AppState {
  return completeSpeakingMission(
    ensureAppStateDefaults(state, now),
    getCurrentSpeakingMission(ensureAppStateDefaults(state, now)).id,
    {
      promptId: getCurrentSpeakingMission(ensureAppStateDefaults(state, now)).id,
      missionId: getCurrentSpeakingMission(ensureAppStateDefaults(state, now)).id,
      mode: getTodayPlanView(ensureAppStateDefaults(state, now), now).mode,
      durationMin: 1,
      selfScores: {
        hesitation: 3,
        connectors: 3,
        repair: 3,
        sentenceLength: 3,
        confidence: 3
      },
      usedPhraseRefs: [`phrase:${phraseId}`]
    },
    now
  );
}

function updatePhraseAfterSpeech(item: PhraseInboxItem, now: Date): { item: PhraseInboxItem; activated: boolean; reused: boolean } {
  const nextTimesSpoken = item.timesSpoken + 1;
  const nextStage = nextStageAfterSpeech(nextTimesSpoken);
  return {
    item: {
      ...item,
      timesSpoken: nextTimesSpoken,
      lastUsedAt: now.toISOString(),
      nextReuseAt: nextStage === "stable" ? undefined : new Date(now.getTime() + 48 * 3_600_000).toISOString(),
      activationStage: nextStage,
      status: derivePhraseStatus(nextStage, nextTimesSpoken)
    },
    activated: nextStage === "used_today",
    reused: nextStage === "reused" || nextStage === "stable"
  };
}

function updateCardAfterSpeech(card: Card, now: Date): { card: Card; activated: boolean; reused: boolean } {
  const nextTimesSpoken = card.timesSpoken + 1;
  const nextStage = nextStageAfterSpeech(nextTimesSpoken);
  return {
    card: {
      ...card,
      timesSpoken: nextTimesSpoken,
      lastSpokenAt: now.toISOString(),
      nextUseBy: nextStage === "stable" ? undefined : new Date(now.getTime() + 48 * 3_600_000).toISOString(),
      activationStage: nextStage
    },
    activated: nextStage === "used_today",
    reused: nextStage === "reused" || nextStage === "stable"
  };
}

function updateTutorCorrectionAfterSpeech(correction: TutorCorrection): TutorCorrection {
  return {
    ...correction,
    usedInMission: true,
    pin: correction.pin === "next_lesson" ? correction.pin : "this_week"
  };
}

function applyUsedRefs(
  state: AppState,
  usedPhraseRefs: string[],
  now: Date
): { state: AppState; activatedCount: number; reusedCount: number } {
  let activatedCount = 0;
  let reusedCount = 0;

  const phraseIds = usedPhraseRefs.filter((ref) => ref.startsWith("phrase:")).map((ref) => ref.replace("phrase:", ""));
  const cardIds = usedPhraseRefs.filter((ref) => ref.startsWith("card:")).map((ref) => ref.replace("card:", ""));
  const correctionIds = usedPhraseRefs.filter((ref) => ref.startsWith("correction:")).map((ref) => ref.replace("correction:", ""));
  const focusRefs = usedPhraseRefs.filter((ref) => ref.startsWith("focus:"));

  const nextPhraseInbox = state.phraseInbox.map((item) => {
    if (!phraseIds.includes(item.id)) {
      return item;
    }
    const result = updatePhraseAfterSpeech(item, now);
    if (result.activated) {
      activatedCount += 1;
    }
    if (result.reused) {
      reusedCount += 1;
    }
    return result.item;
  });

  const nextCards = state.cards.map((card) => {
    if (!cardIds.includes(card.id)) {
      return card;
    }
    const result = updateCardAfterSpeech(card, now);
    if (result.activated) {
      activatedCount += 1;
    }
    if (result.reused) {
      reusedCount += 1;
    }
    return result.card;
  });

  const nextTutorNotes = state.tutorNotes.map((note) => ({
    ...note,
    corrections: note.corrections.map((correction) => (correctionIds.includes(correction.id) ? updateTutorCorrectionAfterSpeech(correction) : correction)),
    promotedToCards: note.corrections
      .map((correction) => (correctionIds.includes(correction.id) ? updateTutorCorrectionAfterSpeech(correction) : correction))
      .filter((correction) => correction.promotedToCard)
      .map((correction) => correction.text)
  }));

  if (focusRefs.length > 0) {
    activatedCount += focusRefs.length;
  }

  return {
    state: {
      ...state,
      phraseInbox: nextPhraseInbox,
      cards: nextCards,
      tutorNotes: nextTutorNotes
    },
    activatedCount,
    reusedCount
  };
}

export function completeSpeakingMission(
  state: AppState,
  missionId: string,
  values: Omit<SpeakingSession, "id" | "date"> & { date?: string },
  now = new Date()
): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const mission = prepared.speakingMissions.find((item) => item.id === missionId) ?? getCurrentSpeakingMission(prepared);
  const withSession: AppState = {
    ...prepared,
    speakingSessions: [
      {
        id: createId("speak"),
        date: values.date ?? now.toISOString(),
        promptId: values.promptId,
        missionId: mission.id,
        mode: values.mode,
        durationMin: values.durationMin,
        audioRef: values.audioRef,
        selfScores: values.selfScores,
        usedPhraseRefs: values.usedPhraseRefs
      },
      ...prepared.speakingSessions
    ]
  };

  const updatedMission = {
    ...mission,
    status: "completed" as const,
    completedAt: now.toISOString()
  };
  const withMission = replaceMission(withSession, updatedMission);
  const speechApplied = applyUsedRefs(withMission, values.usedPhraseRefs, now);
  const completedStep = completeTodayStep(speechApplied.state, "speak", now);
  const log = getTodayLog(completedStep, now);
  const updatedFocus = getCurrentMissions(completedStep).every((item) => item.status === "completed")
    ? replaceWeeklyFocus(completedStep, { ...getCurrentWeeklyFocus(completedStep), status: "completed" })
    : completedStep;

  return replaceDailyLog(updatedFocus, {
    ...log,
    confidence: values.selfScores.confidence,
    spoke: true,
    missionCompleted: true,
    activatedCount: log.activatedCount + speechApplied.activatedCount,
    reusedCount: log.reusedCount + speechApplied.reusedCount
  });
}

export function saveSpeakingSession(
  state: AppState,
  values: Omit<SpeakingSession, "id" | "date"> & { date?: string },
  now = new Date()
): AppState {
  return completeSpeakingMission(state, values.missionId ?? getCurrentSpeakingMission(ensureAppStateDefaults(state, now)).id, values, now);
}

export function saveTutorNote(state: AppState, topic: string, mistakes: string[], correctedForms: string[], now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const corrections = correctedForms.filter(Boolean).map((text, index) =>
    ensureTutorCorrectionDefaults(text, {
      pin: index < 2 ? "this_week" : "srs_only"
    })
  );
  const note: TutorNote = {
    id: createId("tutor"),
    lessonDate: now.toISOString(),
    topic,
    mistakes: mistakes.filter(Boolean),
    correctedForms: corrections.map((item) => item.text),
    promotedToCards: [],
    corrections
  };
  return {
    ...prepared,
    tutorNotes: [note, ...prepared.tutorNotes]
  };
}

export function updateTutorCorrectionPin(state: AppState, noteId: string, correctionId: string, pin: TutorCorrectionPin, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  return {
    ...prepared,
    tutorNotes: prepared.tutorNotes.map((note) =>
      note.id === noteId
        ? {
            ...note,
            corrections: note.corrections.map((correction) => (correction.id === correctionId ? { ...correction, pin } : correction))
          }
        : note
    )
  };
}

export function promoteTutorCorrection(state: AppState, noteId: string, correctionId: string, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const todayLog = getTodayLog(prepared, now);
  if (!canCreateNewCards(prepared.cards, prepared.settings, todayLog.newCount, now)) {
    return prepared;
  }

  const note = prepared.tutorNotes.find((entry) => entry.id === noteId);
  const correction = note?.corrections.find((entry) => entry.id === correctionId);
  if (!note || !correction || correction.promotedToCard) {
    return prepared;
  }

  const nextCardId = createId("card");
  const nextState: AppState = {
    ...prepared,
    cards: [
      {
        id: nextCardId,
        promptPl: `Powiedz po hiszpansku: ${correction.text}`,
        answerEs: correction.text,
        tags: ["tutor", "today"],
        ease: 2.5,
        interval: 0,
        dueAt: now.toISOString(),
        lapses: 0,
        createdAt: now.toISOString(),
        sourceType: "tutor",
        topicId: getCurrentWeeklyFocus(prepared).id,
        utilityScore: 88,
        activationStage: "carded",
        timesSpoken: 0,
        nextUseBy: new Date(now.getTime() + 48 * 3_600_000).toISOString()
      },
      ...prepared.cards
    ],
    tutorNotes: prepared.tutorNotes.map((entry) =>
      entry.id === noteId
        ? {
            ...entry,
            promotedToCards: [...entry.promotedToCards, correction.text],
            corrections: entry.corrections.map((item) => (item.id === correctionId ? { ...item, promotedToCard: true } : item))
          }
        : entry
    )
  };

  return replaceDailyLog(nextState, { ...todayLog, newCount: todayLog.newCount + 1 });
}

export function updateLearnerProfile(state: AppState, nextProfile: Partial<LearnerProfile>, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  return {
    ...prepared,
    learnerProfile: ensureLearnerProfile({
      ...prepared.learnerProfile,
      ...nextProfile
    })
  };
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

export function startNextWeeklyFocus(state: AppState, now = new Date()): AppState {
  const prepared = ensureAppStateDefaults(state, now);
  const current = getCurrentWeeklyFocus(prepared);
  const next = prepared.weeklyFocuses.find((focus) => focus.status === "queued") ?? current;
  if (next.id === current.id) {
    return prepared;
  }

  return {
    ...prepared,
    weeklyFocuses: prepared.weeklyFocuses.map((focus) =>
      focus.id === current.id ? { ...focus, status: "completed" } : focus.id === next.id ? { ...focus, status: "active", weekOf: toDateKey(now) } : focus
    ),
    speakingMissions: prepared.speakingMissions.map((mission) => (next.missionIds.includes(mission.id) ? { ...mission, status: "planned", completedAt: undefined } : mission))
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

export function getWeeklyRecommendation(state: AppState, now = new Date()): WeeklyRecommendation {
  const weeklyLogs = getWeeklyLogs(state, now);
  const backlogBlocked = isBacklogOverloaded(state.cards, state.settings, now);
  const activatedThisWeek = weeklyLogs.reduce((sum, item) => sum + item.activatedCount, 0);
  const reusedThisWeek = weeklyLogs.reduce((sum, item) => sum + item.reusedCount, 0);
  if (backlogBlocked) {
    return "reduce_new_cards";
  }
  if (activatedThisWeek < 3 || reusedThisWeek < 2) {
    return "repeat_focus";
  }
  return "move_to_next_focus";
}

export function getDashboardSummary(state: AppState, now = new Date()): DashboardSummary {
  const weeklyLogs = getWeeklyLogs(state, now);
  const activatedThisWeek = weeklyLogs.reduce((sum, item) => sum + item.activatedCount, 0);
  const reusedThisWeek = weeklyLogs.reduce((sum, item) => sum + item.reusedCount, 0);
  const tutorConversionsThisWeek = state.tutorNotes.reduce(
    (sum, note) => sum + note.corrections.filter((correction) => correction.promotedToCard || correction.usedInMission).length,
    0
  );
  const currentFocus = getCurrentWeeklyFocus(state);
  const focusMissionIds = new Set(currentFocus.missionIds);
  const focusSessions = state.speakingSessions.filter((session) => session.missionId && focusMissionIds.has(session.missionId));
  const averageMissionMinutes = focusSessions.length === 0 ? 0 : Math.round(focusSessions.reduce((sum, session) => sum + session.durationMin, 0) / focusSessions.length);

  return {
    todayLog: getTodayLog(state, now),
    dueCards: getDueCards(state, now),
    backlogBlocked: isBacklogOverloaded(state.cards, state.settings, now),
    recycleCandidates: getRecycleCandidates(state, now),
    useTodayQueue: getTodayPlanView(state, now).useTodayQueue,
    weeklyRecommendation: getWeeklyRecommendation(state, now),
    activatedThisWeek,
    reusedThisWeek,
    tutorConversionsThisWeek,
    averageMissionMinutes
  };
}
