import {
  completeSpeakingMission,
  createSeedState,
  getTodayPlanView,
  getWeeklyRecommendation,
  promotePhraseToCard,
  updateTutorCorrectionPin
} from "@/lib/app-state";

describe("activation loop", () => {
  it("promotes clarified phrase to a card and links the pipeline", () => {
    const now = new Date("2026-03-20T10:00:00.000Z");
    const state = createSeedState(now);
    const phrase = state.phraseInbox.find((item) => item.activationStage === "clarified");
    expect(phrase).toBeDefined();

    const next = promotePhraseToCard(state, phrase!.id, now);
    const promotedPhrase = next.phraseInbox.find((item) => item.id === phrase!.id);
    const promotedCard = next.cards.find((card) => card.linkedPhraseId === phrase!.id);

    expect(promotedPhrase?.activationStage).toBe("carded");
    expect(promotedPhrase?.promotedCardId).toBe(promotedCard?.id);
    expect(promotedCard?.activationStage).toBe("carded");
  });

  it("marks used phrases as activated and then reused across missions", () => {
    const now = new Date("2026-03-20T10:00:00.000Z");
    const state = createSeedState(now);
    const phrase = state.phraseInbox[0];
    const mission = getTodayPlanView(state, now).mission;

    const afterFirstUse = completeSpeakingMission(
      state,
      mission.id,
      {
        promptId: mission.id,
        missionId: mission.id,
        mode: "voice",
        durationMin: 7,
        selfScores: {
          hesitation: 3,
          connectors: 4,
          repair: 3,
          sentenceLength: 3,
          confidence: 4
        },
        usedPhraseRefs: [`phrase:${phrase.id}`]
      },
      now
    );

    expect(afterFirstUse.phraseInbox.find((item) => item.id === phrase.id)?.activationStage).toBe("used_today");
    expect(afterFirstUse.dailyLogs[0]?.activatedCount).toBe(1);

    const afterSecondUse = completeSpeakingMission(
      afterFirstUse,
      mission.id,
      {
        promptId: mission.id,
        missionId: mission.id,
        mode: "voice",
        durationMin: 5,
        selfScores: {
          hesitation: 2,
          connectors: 4,
          repair: 4,
          sentenceLength: 4,
          confidence: 4
        },
        usedPhraseRefs: [`phrase:${phrase.id}`]
      },
      new Date("2026-03-21T10:00:00.000Z")
    );

    expect(afterSecondUse.phraseInbox.find((item) => item.id === phrase.id)?.activationStage).toBe("reused");
  });
});

describe("weekly focus and tutor carryover", () => {
  it("builds a mission-based today plan with use-today queue", () => {
    const state = createSeedState(new Date("2026-03-20T10:00:00.000Z"));
    const today = getTodayPlanView(state, new Date("2026-03-20T10:00:00.000Z"));

    expect(today.communicativeGoal.length).toBeGreaterThan(10);
    expect(today.mission.requiredPhraseRefs.length).toBeGreaterThan(0);
    expect(today.useTodayQueue.length).toBeGreaterThan(0);
    expect(today.tutorCarryover.length).toBeGreaterThan(0);
  });

  it("lets tutor corrections be pinned to this week and influence recommendation logic", () => {
    const state = createSeedState(new Date("2026-03-20T10:00:00.000Z"));
    const note = state.tutorNotes[0];
    const correction = note.corrections[1];

    const pinned = updateTutorCorrectionPin(state, note.id, correction.id, "this_week");
    expect(pinned.tutorNotes[0]?.corrections.find((item) => item.id === correction.id)?.pin).toBe("this_week");
    expect(getWeeklyRecommendation(pinned, new Date("2026-03-20T10:00:00.000Z"))).toBe("repeat_focus");
  });
});
