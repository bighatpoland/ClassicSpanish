import { addDays, toDateKey } from "@/lib/date";
import type {
  AppSettings,
  Card,
  DailyLog,
  DailyPlanRecord,
  LearnerProfile,
  MissionType,
  PhraseInboxItem,
  SpeakingMission,
  SpeakingSession,
  StudyMaterial,
  TutorCorrection,
  TutorNote,
  WeeklyFocus
} from "@/lib/types";

type WeeklyFocusTemplate = {
  id: string;
  goal: string;
  context: string;
  targetChunks: string[];
  inputIds: string[];
  missions: Array<{
    id: string;
    type: MissionType;
    prompt: string;
    durationMin: number;
    requiredPhraseRefs: string[];
    support: string[];
    completionCriteria: string[];
  }>;
};

export const DEFAULT_SETTINGS: AppSettings = {
  dailyMinutes: 20,
  newCardsCap: 3,
  srsMinutesCap: 8,
  locale: "es-ES"
};

export const DEFAULT_LEARNER_PROFILE: LearnerProfile = {
  levelBand: "A2-B1",
  priorityContexts: ["rutina", "trabajo", "planes"],
  mainBarrier: "hesitation",
  weeklyIntensity: "steady",
  tutorFrequency: "weekly",
  preferredLessonMode: "voice"
};

export const INPUT_LIBRARY: StudyMaterial[] = [
  {
    id: "input-rutina-dialog",
    topicId: "focus-rutina",
    title: "Mi manana realista",
    kind: "dialog",
    durationMin: 4,
    level: "A2",
    summary: "Dialog z codziennej rutyny z chunkami do natychmiastowego reuse.",
    purpose: "Zlap naturalne laczniki i opis sekwencji dnia roboczego.",
    keyChunks: ["normalmente", "primero", "luego", "antes de salir", "al final"],
    phrases: ["Normalmente empiezo con un cafe.", "Luego reviso mi agenda.", "Antes de salir, preparo todo."],
    noticingChecklist: ["Zaznacz 2 laczniki czasu.", "Zlap jedno zdanie o rutynie i jedno o opinii.", "Poszukaj prostego kontrastu z pero."],
    captureSuggestions: ["Normalmente...", "Luego...", "Antes de salir..."],
    handoffMissionType: "retell"
  },
  {
    id: "input-trabajo-audio",
    topicId: "focus-trabajo",
    title: "Un dia complicado en el trabajo",
    kind: "audio",
    durationMin: 5,
    level: "A2-B1",
    summary: "Krotki material o pracy, opoznieniach i planach na reszte dnia.",
    purpose: "Ćwicz problem-solution language i wyjasnianie sytuacji po hiszpansku.",
    keyChunks: ["esta semana", "tengo que", "me cuesta", "por eso", "al final"],
    phrases: ["Esta semana voy un poco perdida.", "Tengo que terminar una tarea importante.", "Por eso hoy necesito hablar claro."],
    noticingChecklist: ["Zaznacz jedno zdanie o problemie.", "Zlap jedno wyjasnienie z por eso.", "Zanotuj jedna fraze do lekcji z lektorem."],
    captureSuggestions: ["Esta semana...", "Tengo que...", "Por eso..."],
    handoffMissionType: "opinion"
  },
  {
    id: "input-planes-text",
    topicId: "focus-planes",
    title: "Planes y cambios de plan",
    kind: "text",
    durationMin: 4,
    level: "A2",
    summary: "Mini tekst o planach, zmianie zdania i umawianiu sie.",
    purpose: "Przejdz od inputu do mowienia o planach i preferencjach.",
    keyChunks: ["este fin de semana", "me gustaria", "si puedo", "al final", "prefiero"],
    phrases: ["Este fin de semana me gustaria descansar.", "Si puedo, saldre a caminar.", "Al final prefiero algo tranquilo."],
    noticingChecklist: ["Wybierz jedno zdanie o planie.", "Wybierz jedno zdanie o preferencji.", "Dodaj jeden chunk warunkowy."],
    captureSuggestions: ["Me gustaria...", "Si puedo...", "Prefiero..."],
    handoffMissionType: "story"
  },
  {
    id: "input-social-dialog",
    topicId: "focus-social",
    title: "Quedar con alguien despues del trabajo",
    kind: "dialog",
    durationMin: 3,
    level: "A2",
    summary: "Krótki dialog o umawianiu sie i reagowaniu na propozycje.",
    purpose: "Ćwicz naturalne odpowiedzi i mikrorozmowe.",
    keyChunks: ["te parece", "me viene bien", "prefiero", "si quieres", "nos vemos"],
    phrases: ["Te parece bien manana?", "Me viene bien despues del trabajo.", "Si quieres, nos vemos alli."],
    noticingChecklist: ["Zlap jedna propozycje.", "Zlap jedna reakcje pozytywna.", "Zlap jedno zamkniecie rozmowy."],
    captureSuggestions: ["Te parece...?", "Me viene bien...", "Nos vemos..."],
    handoffMissionType: "simulation"
  }
];

export const WEEKLY_FOCUS_TEMPLATES: WeeklyFocusTemplate[] = [
  {
    id: "focus-rutina",
    goal: "Opowiedziec naturalnie o swoim dniu i przejsc od rutyny do planu dnia.",
    context: "rutina diaria",
    targetChunks: ["normalmente", "primero", "luego", "antes de salir", "por la tarde", "al final"],
    inputIds: ["input-rutina-dialog", "input-planes-text"],
    missions: [
      {
        id: "mission-rutina-retell",
        type: "retell",
        prompt: "Opowiedz swoj zwykly poranek tak, jakbys mowila to lektorowi lub znajomej osobie.",
        durationMin: 7,
        requiredPhraseRefs: ["focus:focus-rutina:0", "focus:focus-rutina:1", "phrase:phrase-1"],
        support: ["Zacznij od Normalmente...", "Dodaj sekwencje dnia.", "Na koniec dodaj jedna opinie o tempie dnia."],
        completionCriteria: ["Uzyj co najmniej 2 target chunks.", "Powiedz minimum 4 zdania.", "Dodaj jedno przejscie czasu."]
      },
      {
        id: "mission-rutina-opinion",
        type: "opinion",
        prompt: "Powiedz, co w twojej rutynie dziala dobrze, a co chcesz zmienic.",
        durationMin: 6,
        requiredPhraseRefs: ["focus:focus-rutina:2", "focus:focus-rutina:5"],
        support: ["Uzyj me gusta / no me gusta.", "Dodaj ale lub dlatego.", "Zakoncz malym planem zmiany."],
        completionCriteria: ["Uzyj kontrastu.", "Powiedz jedno zdanie o planie.", "Mow bez czytania przez minimum 45 sekund."]
      },
      {
        id: "mission-rutina-lesson",
        type: "lesson-prep",
        prompt: "Przygotuj 3 rzeczy, ktore chcesz dzis powiedziec lektorowi o swoim tygodniu.",
        durationMin: 7,
        requiredPhraseRefs: ["phrase:phrase-2", "focus:focus-rutina:4"],
        support: ["Zacznij od Hoy quiero hablar de...", "Dodaj jedno pytanie do korekty.", "Uzyj jednej frazy z inboxu."],
        completionCriteria: ["Powiedz 3 punkty.", "Dodaj jedno pytanie.", "Wykorzystaj jedna nowa fraze."]
      }
    ]
  },
  {
    id: "focus-trabajo",
    goal: "Wyjasniac problem w pracy, mowic o obciazeniu i planach na reszte dnia.",
    context: "trabajo y tareas",
    targetChunks: ["esta semana", "tengo que", "me cuesta", "por eso", "de momento", "al final"],
    inputIds: ["input-trabajo-audio", "input-social-dialog"],
    missions: [
      {
        id: "mission-trabajo-story",
        type: "story",
        prompt: "Opowiedz o jednym trudniejszym dniu w pracy i jak sobie poradzilas.",
        durationMin: 7,
        requiredPhraseRefs: ["focus:focus-trabajo:0", "focus:focus-trabajo:3"],
        support: ["Uzyj ramy czasowej.", "Powiedz, co bylo trudne.", "Na koniec dodaj rezultat."],
        completionCriteria: ["Opowiedz poczatek, srodek i koniec.", "Uzyj por eso.", "Dodaj refleksje na koniec."]
      },
      {
        id: "mission-trabajo-simulation",
        type: "simulation",
        prompt: "Wyobraz sobie, ze wyjasniasz spoznienie lub opoznienie zadania po hiszpansku.",
        durationMin: 6,
        requiredPhraseRefs: ["focus:focus-trabajo:1", "focus:focus-trabajo:2"],
        support: ["Powiedz problem.", "Powiedz, co zrobisz dalej.", "Zakoncz uprzejmie."],
        completionCriteria: ["Powiedz minimum 3 zdania.", "Uzyj tengo que.", "Zaproponuj kolejny krok."]
      },
      {
        id: "mission-trabajo-reuse",
        type: "reuse-challenge",
        prompt: "Uzyj dwoch fraz z lekcji lub inboxu, opowiadajac o tym tygodniu.",
        durationMin: 7,
        requiredPhraseRefs: ["phrase:phrase-1", "phrase:phrase-2"],
        support: ["Nie czytaj fraz doslownie.", "Wplec je w swoj komunikat.", "Dodaj jedno zdanie wlasnymi slowami."],
        completionCriteria: ["Uzyj 2 fraz w kontekscie.", "Dodaj jedno zdanie wlasne.", "Mow minimum minute."]
      }
    ]
  },
  {
    id: "focus-planes",
    goal: "Mowic o planach, preferencjach i zmianie planow w naturalnej rozmowie.",
    context: "planes y vida social",
    targetChunks: ["este fin de semana", "me gustaria", "si puedo", "prefiero", "te parece", "nos vemos"],
    inputIds: ["input-planes-text", "input-social-dialog"],
    missions: [
      {
        id: "mission-planes-opinion",
        type: "opinion",
        prompt: "Powiedz, jak chcesz spedzic weekend i czego raczej nie chcesz robic.",
        durationMin: 7,
        requiredPhraseRefs: ["focus:focus-planes:0", "focus:focus-planes:3"],
        support: ["Powiedz plan pozytywny.", "Dodaj jedna preferencje.", "Dodaj kontrast z pero."],
        completionCriteria: ["Uzyj me gustaria.", "Uzyj prefiero.", "Powiedz przynajmniej 4 zdania."]
      },
      {
        id: "mission-planes-simulation",
        type: "simulation",
        prompt: "Zasymuluj umawianie sie z kims po pracy lub w weekend.",
        durationMin: 6,
        requiredPhraseRefs: ["focus:focus-planes:4", "focus:focus-planes:5"],
        support: ["Zaproponuj termin.", "Zareaguj na propozycje.", "Zakoncz ustaleniem."],
        completionCriteria: ["Zadawaj pytanie.", "Zaproponuj alternatywe.", "Domknij rozmowe."]
      },
      {
        id: "mission-planes-retell",
        type: "retell",
        prompt: "Najpierw przeczytaj input o planach, a potem z pamieci opowiedz swoja wersje.",
        durationMin: 7,
        requiredPhraseRefs: ["focus:focus-planes:1", "focus:focus-planes:2"],
        support: ["Zmien detale na swoje.", "Zachowaj dwa kluczowe chunky.", "Na koniec dodaj plan B."],
        completionCriteria: ["Retell bez patrzenia w tekst.", "Uzyj 2 chunky.", "Dodaj plan alternatywny."]
      }
    ]
  }
];

function createWeeklyFocusFromTemplate(template: WeeklyFocusTemplate, weekOf: string): WeeklyFocus {
  return {
    id: template.id,
    weekOf,
    goal: template.goal,
    context: template.context,
    levelBand: "A2-B1",
    targetChunks: template.targetChunks,
    inputIds: template.inputIds,
    missionIds: template.missions.map((mission) => mission.id),
    status: "active"
  };
}

export function createWeeklyFocuses(now = new Date()): WeeklyFocus[] {
  const weekOf = toDateKey(now);
  return WEEKLY_FOCUS_TEMPLATES.map((template, index) => ({
    ...createWeeklyFocusFromTemplate(template, weekOf),
    status: index === 0 ? "active" : "queued"
  }));
}

export function createSpeakingMissions(now = new Date()): SpeakingMission[] {
  const date = now.toISOString();
  return WEEKLY_FOCUS_TEMPLATES.flatMap((template) =>
    template.missions.map((mission) => ({
      id: mission.id,
      date,
      type: mission.type,
      topicId: template.id,
      prompt: mission.prompt,
      requiredPhraseRefs: mission.requiredPhraseRefs,
      durationMin: mission.durationMin,
      status: "planned",
      support: mission.support,
      completionCriteria: mission.completionCriteria
    }))
  );
}

export function createSeedCards(now = new Date()): Card[] {
  return [
    {
      id: "card-rutina",
      promptPl: "Powiedz po hiszpansku: Zwykle zaczynam od kawy.",
      answerEs: "Normalmente empiezo con un cafe.",
      tags: ["today", "routine"],
      ease: 2.5,
      interval: 2,
      dueAt: addDays(now, -1).toISOString(),
      lapses: 0,
      createdAt: addDays(now, -8).toISOString(),
      sourceType: "weekly_focus",
      topicId: "focus-rutina",
      utilityScore: 92,
      activationStage: "primed",
      timesSpoken: 1,
      lastSpokenAt: addDays(now, -3).toISOString(),
      nextUseBy: addDays(now, 1).toISOString()
    },
    {
      id: "card-clase",
      promptPl: "Powiedz po hiszpansku: Dzis po poludniu mam lekcje.",
      answerEs: "Hoy por la tarde tengo clase.",
      tags: ["today", "tutor"],
      ease: 2.3,
      interval: 3,
      dueAt: addDays(now, -2).toISOString(),
      lapses: 1,
      createdAt: addDays(now, -12).toISOString(),
      sourceType: "tutor",
      topicId: "focus-rutina",
      utilityScore: 84,
      activationStage: "carded",
      timesSpoken: 0
    },
    {
      id: "card-cafe",
      promptPl: "Powiedz po hiszpansku: Poprosze kawe z mlekiem na wynos.",
      answerEs: "Queria un cafe con leche para llevar.",
      tags: ["survival"],
      ease: 2.4,
      interval: 5,
      dueAt: addDays(now, 1).toISOString(),
      lapses: 0,
      createdAt: addDays(now, -10).toISOString(),
      sourceType: "weekly_focus",
      topicId: "focus-planes",
      utilityScore: 60,
      activationStage: "reused",
      timesSpoken: 2,
      lastSpokenAt: addDays(now, -5).toISOString()
    },
    {
      id: "card-weekend",
      promptPl: "Powiedz po hiszpansku: W sobote chce odpoczac.",
      answerEs: "El sabado quiero descansar.",
      tags: ["today", "weekend"],
      ease: 2.6,
      interval: 4,
      dueAt: addDays(now, -3).toISOString(),
      lapses: 0,
      createdAt: addDays(now, -6).toISOString(),
      sourceType: "weekly_focus",
      topicId: "focus-planes",
      utilityScore: 78,
      activationStage: "used_today",
      timesSpoken: 1,
      lastSpokenAt: addDays(now, -1).toISOString(),
      nextUseBy: addDays(now, 1).toISOString()
    }
  ];
}

export function createSeedPhraseInbox(now = new Date()): PhraseInboxItem[] {
  return [
    {
      id: "phrase-1",
      textEs: "Voy poco a poco, pero sigo hablando.",
      source: "lesson",
      status: "captured",
      createdAt: addDays(now, -1).toISOString(),
      meaningOrPromptPl: "Powiedz, ze idzie ci powoli, ale nadal mowisz.",
      topicId: "focus-rutina",
      clarified: true,
      timesSpoken: 0,
      nextReuseAt: addDays(now, 1).toISOString(),
      activationStage: "clarified"
    },
    {
      id: "phrase-2",
      textEs: "Me cuesta, pero lo entiendo mejor.",
      source: "input",
      status: "carded",
      createdAt: addDays(now, -1).toISOString(),
      meaningOrPromptPl: "Powiedz, ze to trudne, ale rozumiesz coraz lepiej.",
      topicId: "focus-trabajo",
      clarified: true,
      promotedCardId: "card-clase",
      timesSpoken: 0,
      nextReuseAt: addDays(now, 1).toISOString(),
      activationStage: "carded"
    },
    {
      id: "phrase-3",
      textEs: "Hoy quiero practicar conectores basicos.",
      source: "self",
      status: "spoken",
      createdAt: addDays(now, -2).toISOString(),
      lastUsedAt: addDays(now, -1).toISOString(),
      meaningOrPromptPl: "Powiedz, ze chcesz cwiczyc laczniki.",
      topicId: "focus-rutina",
      clarified: true,
      timesSpoken: 2,
      nextReuseAt: addDays(now, 2).toISOString(),
      activationStage: "reused"
    }
  ];
}

function createTutorCorrections(): TutorCorrection[] {
  return [
    {
      id: "correction-1",
      text: "Voy al trabajo a las ocho.",
      pin: "this_week",
      promotedToCard: false,
      usedInMission: false
    },
    {
      id: "correction-2",
      text: "Me gusta practicar aunque sea dificil.",
      pin: "srs_only",
      promotedToCard: false,
      usedInMission: false
    }
  ];
}

export function createSeedTutorNotes(now = new Date()): TutorNote[] {
  const corrections = createTutorCorrections();
  return [
    {
      id: "tutor-1",
      lessonDate: addDays(now, -2).toISOString(),
      topic: "Rutina y conectores",
      mistakes: ["*Yo voy a trabajo a las ocho.*", "*Me gusta mucho practicar, porque es dificil pero quiero.*"],
      correctedForms: corrections.map((item) => item.text),
      promotedToCards: [],
      corrections
    }
  ];
}

export function createDefaultDailyLog(date = toDateKey(new Date())): DailyLog {
  return {
    date,
    totalMin: 0,
    reviewCount: 0,
    newCount: 0,
    spoke: false,
    stress: 3,
    confidence: 3,
    mode: "quiet",
    completed: false,
    sessionTemplate: "standard",
    activatedCount: 0,
    reusedCount: 0,
    missionCompleted: false
  };
}

export function createDefaultDailyPlan(date = toDateKey(new Date())): DailyPlanRecord {
  return {
    date,
    mode: "quiet",
    template: "standard",
    completedStepIds: []
  };
}

export function createSeedSpeakingSessions(): SpeakingSession[] {
  return [];
}
