import { recordReview } from "@/lib/app-state";
import { DEFAULT_SETTINGS, createSeedCards } from "@/lib/defaults";
import { applySm2Review, canCreateNewCards, isBacklogOverloaded } from "@/lib/srs";

describe("SRS scheduling", () => {
  it("moves successful review forward", () => {
    const [card] = createSeedCards(new Date("2026-03-20T10:00:00.000Z"));
    const reviewed = applySm2Review(card, 5, new Date("2026-03-20T10:00:00.000Z"));

    expect(reviewed.interval).toBeGreaterThan(card.interval);
    expect(reviewed.ease).toBeGreaterThan(card.ease);
    expect(new Date(reviewed.dueAt).getTime()).toBeGreaterThan(new Date(card.dueAt).getTime());
  });

  it("resets interval on low grade", () => {
    const [card] = createSeedCards(new Date("2026-03-20T10:00:00.000Z"));
    const reviewed = applySm2Review(card, 1, new Date("2026-03-20T10:00:00.000Z"));

    expect(reviewed.interval).toBe(1);
    expect(reviewed.lapses).toBe(card.lapses + 1);
  });
});

describe("new card limits and priming", () => {
  it("blocks new cards when backlog is overloaded", () => {
    const now = new Date("2026-03-20T10:00:00.000Z");
    const cards = Array.from({ length: 24 }, (_, index) => ({
      id: `card-${index}`,
      promptPl: `Prompt ${index}`,
      answerEs: `Respuesta ${index}`,
      tags: ["today"],
      ease: 2.5,
      interval: 1,
      dueAt: new Date("2026-03-19T10:00:00.000Z").toISOString(),
      lapses: 0,
      createdAt: now.toISOString(),
      sourceType: "weekly_focus" as const,
      topicId: "focus-rutina",
      utilityScore: 80,
      activationStage: "carded" as const,
      timesSpoken: 0
    }));

    expect(isBacklogOverloaded(cards, DEFAULT_SETTINGS, now)).toBe(true);
    expect(canCreateNewCards(cards, DEFAULT_SETTINGS, 0, now)).toBe(false);
  });

  it("turns successful review into a primed card for later speaking use", () => {
    const now = new Date("2026-03-20T10:00:00.000Z");
    const state = {
      createdAt: now.toISOString(),
      cards: createSeedCards(now),
      reviews: [],
      phraseInbox: [],
      speakingSessions: [],
      dailyLogs: [],
      dailyPlans: [],
      tutorNotes: [],
      weeklyFocuses: [],
      speakingMissions: [],
      learnerProfile: {
        levelBand: "A2-B1" as const,
        priorityContexts: ["rutina"],
        mainBarrier: "hesitation" as const,
        weeklyIntensity: "steady" as const,
        tutorFrequency: "weekly" as const,
        preferredLessonMode: "voice" as const
      },
      settings: DEFAULT_SETTINGS
    };

    const next = recordReview(state as any, state.cards[1]!.id, 4, 1800, now);
    expect(next.cards.find((card) => card.id === state.cards[1]!.id)?.activationStage).toBe("primed");
  });
});
