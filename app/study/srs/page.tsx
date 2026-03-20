"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle, StatBox } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { completeTodayStep, getDueCards, getTodayLog, promotePhraseToCard, recordReview } from "@/lib/app-state";
import { canCreateNewCards } from "@/lib/srs";

export default function StudySrsPage() {
  const { hydrated, state, updateState } = useAppStore();
  const [revealed, setRevealed] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => {
    setRevealed(false);
    setStartedAt(Date.now());
  }, [state?.reviews.length]);

  if (!hydrated || !state) {
    return (
      <AppShell activeRoute="/study/srs" title="SRS">
        <Panel>Loading review queue...</Panel>
      </AppShell>
    );
  }

  const dueCards = getDueCards(state);
  const currentCard = dueCards[0];
  const todayLog = getTodayLog(state);
  const canAddNew = canCreateNewCards(state.cards, state.settings, todayLog.newCount);
  const captured = state.phraseInbox.filter((item) => item.status === "captured").slice(0, 3);

  return (
    <AppShell activeRoute="/study/srs" title="SRS">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="space-y-4">
          <SectionTitle subtitle="Prompt produkcyjny PL -> ES, bez recognition-only workflow." title="Review Queue" />
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="due" tone="warm" value={dueCards.length} />
            <StatBox label="new today" value={todayLog.newCount} />
            <StatBox label="review today" tone="accent" value={todayLog.reviewCount} />
          </div>

          {currentCard ? (
            <div className="rounded border border-applus-border bg-applus-muted p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Prompt PL</p>
              <h3 className="mt-2 text-xl font-semibold">{currentCard.promptPl}</h3>

              {revealed ? (
                <div className="mt-4 rounded border border-applus-border bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Answer ES</p>
                  <p className="mt-2 text-lg font-semibold">{currentCard.answerEs}</p>
                </div>
              ) : (
                <div className="mt-4">
                  <PrimaryButton onClick={() => setRevealed(true)}>Show answer</PrimaryButton>
                </div>
              )}

              {revealed ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-slate-600">Oceń, na ile swobodnie przyszła ci produkcja.</p>
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                    {[0, 1, 2, 3, 4, 5].map((grade) => (
                      <button
                        className="rounded border border-applus-border bg-white px-3 py-3 text-sm font-medium hover:bg-applus-muted"
                        key={grade}
                        onClick={() => updateState((current) => recordReview(current, currentCard.id, grade as 0 | 1 | 2 | 3 | 4 | 5, Date.now() - startedAt))}
                        type="button"
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded border border-dashed border-applus-border bg-white p-4 text-sm text-slate-600">Brak kart due. Mozesz zakonczyc blok albo dodac kilka nowych kart z Inboxu.</div>
          )}

          <PrimaryButton onClick={() => updateState((current) => completeTodayStep(current, "srs"))}>Mark SRS done</PrimaryButton>
        </Panel>

        <Panel className="space-y-4">
          <SectionTitle subtitle="Nowe karty tylko wtedy, gdy backlog jest pod kontrola." title="Promote from Inbox" />
          <p className="text-sm text-slate-600">
            {canAddNew ? `Mozesz jeszcze dodac ${Math.max(state.settings.newCardsCap - todayLog.newCount, 0)} kart(y).` : "Nowe karty sa zablokowane przez backlog lub dzienny limit."}
          </p>
          {captured.length === 0 ? (
            <p className="text-sm text-slate-600">Brak captured phrases.</p>
          ) : (
            captured.map((phrase) => (
              <div className="rounded border border-applus-border bg-applus-muted p-4" key={phrase.id}>
                <p className="font-medium">{phrase.textEs}</p>
                <p className="text-sm text-slate-600">{phrase.source}</p>
                <button
                  className="mt-3 rounded border border-applus-border px-3 py-2 text-sm hover:bg-white disabled:opacity-50"
                  disabled={!canAddNew}
                  onClick={() => updateState((current) => promotePhraseToCard(current, phrase.id))}
                  type="button"
                >
                  Promote to card
                </button>
              </div>
            ))
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
