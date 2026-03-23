export type StudyMode = "quiet" | "voice";

export type SessionTemplate = "standard" | "minimum";

export type ActivationStage = "captured" | "clarified" | "carded" | "primed" | "used_today" | "reused" | "stable";

export type LevelBand = "A0-A1" | "A1-A2" | "A2-B1";

export type MissionType = "retell" | "opinion" | "story" | "simulation" | "lesson-prep" | "reuse-challenge";

export type MissionStatus = "planned" | "completed";

export type WeeklyFocusStatus = "active" | "completed" | "queued";

export type TutorCorrectionPin = "this_week" | "next_lesson" | "srs_only";

export type TutorFrequency = "weekly" | "twice-weekly";

export type WeeklyIntensity = "light" | "steady" | "focused";

export type MainBarrier = "hesitation" | "confidence" | "connectors" | "sentence-length" | "repair";

export type CardSourceType = "phrase_inbox" | "tutor" | "weekly_focus";

export type PhraseStatus = "captured" | "carded" | "spoken";

export type UseTodaySource = "card" | "phrase" | "focus" | "tutor";

export type Card = {
  id: string;
  promptPl: string;
  answerEs: string;
  tags: string[];
  ease: number;
  interval: number;
  dueAt: string;
  lapses: number;
  createdAt: string;
  sourceType: CardSourceType;
  topicId: string;
  utilityScore: number;
  activationStage: ActivationStage;
  timesSpoken: number;
  lastSpokenAt?: string;
  nextUseBy?: string;
  linkedPhraseId?: string;
};

export type Review = {
  id: string;
  cardId: string;
  grade: 0 | 1 | 2 | 3 | 4 | 5;
  reviewedAt: string;
  responseMs: number;
};

export type PhraseInboxItem = {
  id: string;
  textEs: string;
  source: string;
  status: PhraseStatus;
  createdAt: string;
  lastUsedAt?: string;
  meaningOrPromptPl?: string;
  topicId: string;
  clarified: boolean;
  promotedCardId?: string;
  timesSpoken: number;
  nextReuseAt?: string;
  activationStage: ActivationStage;
};

export type SpeakingSelfScores = {
  hesitation: number;
  connectors: number;
  repair: number;
  sentenceLength: number;
  confidence: number;
};

export type SpeakingSession = {
  id: string;
  date: string;
  promptId: string;
  missionId?: string;
  mode: StudyMode;
  durationMin: number;
  audioRef?: string;
  selfScores: SpeakingSelfScores;
  usedPhraseRefs: string[];
};

export type DailyLog = {
  date: string;
  totalMin: number;
  reviewCount: number;
  newCount: number;
  spoke: boolean;
  stress: number;
  confidence: number;
  mode: StudyMode;
  completed: boolean;
  sessionTemplate: SessionTemplate;
  activatedCount: number;
  reusedCount: number;
  missionCompleted: boolean;
};

export type DailyPlanRecord = {
  date: string;
  mode: StudyMode;
  template: SessionTemplate;
  completedStepIds: string[];
};

export type TutorCorrection = {
  id: string;
  text: string;
  pin: TutorCorrectionPin;
  promotedToCard: boolean;
  usedInMission: boolean;
};

export type TutorNote = {
  id: string;
  lessonDate: string;
  topic: string;
  mistakes: string[];
  correctedForms: string[];
  promotedToCards: string[];
  corrections: TutorCorrection[];
};

export type AppSettings = {
  dailyMinutes: number;
  newCardsCap: number;
  srsMinutesCap: number;
  locale: string;
};

export type LearnerProfile = {
  levelBand: LevelBand;
  priorityContexts: string[];
  mainBarrier: MainBarrier;
  weeklyIntensity: WeeklyIntensity;
  tutorFrequency: TutorFrequency;
  preferredLessonMode: StudyMode;
};

export type StudyMaterial = {
  id: string;
  topicId: string;
  title: string;
  kind: "dialog" | "text" | "audio";
  durationMin: number;
  level: string;
  summary: string;
  purpose: string;
  keyChunks: string[];
  phrases: string[];
  noticingChecklist: string[];
  captureSuggestions: string[];
  handoffMissionType: MissionType;
};

export type SpeakingMission = {
  id: string;
  date: string;
  type: MissionType;
  topicId: string;
  prompt: string;
  requiredPhraseRefs: string[];
  durationMin: number;
  status: MissionStatus;
  completedAt?: string;
  support: string[];
  completionCriteria: string[];
};

export type WeeklyFocus = {
  id: string;
  weekOf: string;
  goal: string;
  context: string;
  levelBand: LevelBand;
  targetChunks: string[];
  inputIds: string[];
  missionIds: string[];
  status: WeeklyFocusStatus;
};

export type AppState = {
  createdAt: string;
  cards: Card[];
  reviews: Review[];
  phraseInbox: PhraseInboxItem[];
  speakingSessions: SpeakingSession[];
  dailyLogs: DailyLog[];
  dailyPlans: DailyPlanRecord[];
  tutorNotes: TutorNote[];
  weeklyFocuses: WeeklyFocus[];
  speakingMissions: SpeakingMission[];
  learnerProfile: LearnerProfile;
  settings: AppSettings;
};

export type TodayPlanStep = {
  id: "srs" | "input" | "speak";
  title: string;
  minutes: number;
  description: string;
  route: string;
};

export type UseTodayItem = {
  id: string;
  refId: string;
  text: string;
  source: UseTodaySource;
  activationStage: ActivationStage;
  topicId: string;
  reason: string;
  dueNow: boolean;
};

export type TodayPlanView = {
  date: string;
  mode: StudyMode;
  template: SessionTemplate;
  communicativeGoal: string;
  weeklyFocus: WeeklyFocus;
  mission: SpeakingMission;
  steps: Array<TodayPlanStep & { completed: boolean }>;
  completedCount: number;
  targetChunks: string[];
  useTodayQueue: UseTodayItem[];
  tutorCarryover: TutorCorrection[];
};

export type WeeklyRecommendation = "reduce_new_cards" | "repeat_focus" | "move_to_next_focus";

export type DashboardSummary = {
  todayLog: DailyLog;
  dueCards: Card[];
  backlogBlocked: boolean;
  recycleCandidates: PhraseInboxItem[];
  useTodayQueue: UseTodayItem[];
  weeklyRecommendation: WeeklyRecommendation;
  activatedThisWeek: number;
  reusedThisWeek: number;
  tutorConversionsThisWeek: number;
  averageMissionMinutes: number;
};
