"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle, StatBox } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { completeTodayStep, getDueCards, getTodayLog, getTodayPlanView, promotePhraseToCard, recordReview } from "@/lib/app-state";
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
  const today = getTodayPlanView(state);
  const todayLog = getTodayLog(state);
  const canAddNew = canCreateNewCards(state.cards, state.settings, todayLog.newCount);
  const captured = state.phraseInbox.filter((item) => item.activationStage === "clarified" || item.activationStage === "captured").slice(0, 4);

  return (
    <AppShell activeRoute="/study/srs" title="SRS">
      <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <Panel className="space-y-4">
          <SectionTitle subtitle="Review now serves memory, but successful cards should move toward active reuse." title="Memory Review" />
          <div className="grid grid-cols-4 gap-3">
            <StatBox label="due" tone="warm" value={dueCards.length} />
            <StatBox label="new today" value={todayLog.newCount} />
            <StatBox label="review today" tone="accent" value={todayLog.reviewCount} />
            <StatBox label="use today" value={today.useTodayQueue.length} />
          </div>

          {currentCard ? (
            <div className="applus-soft-panel p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Prompt PL</p>
              <h3 className="mt-2 text-xl font-semibold">{currentCard.promptPl}</h3>
              <p className="mt-2 text-sm text-slate-600">
                Activation stage: <strong>{currentCard.activationStage.replaceAll("_", " ")}</strong> • utility {currentCard.utilityScore}
              </p>

              {revealed ? (
                <div className="mt-4 border border-applus-border bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Answer ES</p>
                  <p className="mt-2 text-lg font-semibold">{currentCard.answerEs}</p>
                  <p className="mt-2 text-sm text-slate-600">Jesli recall jest dobry, ta karta przejdzie w stan primed i powinna trafic do realnego uzycia w mission flow.</p>
                </div>
              ) : (
                <div className="mt-4">
                  <PrimaryButton onClick={() => setRevealed(true)}>Show answer</PrimaryButton>
                </div>
              )}

              {revealed ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-slate-600">Ocen recall dla pamieci. Dopiero speaking mission potwierdzi realne uzycie.</p>
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                    {[0, 1, 2, 3, 4, 5].map((grade) => (
                      <button
                        className="border border-applus-border bg-white px-3 py-3 text-sm font-medium hover:bg-applus-muted"
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
            <div className="border border-dashed border-applus-border bg-white p-4 text-sm text-slate-600">Brak kart due. Mozesz zakonczyc blok albo dodac kilka nowych kart, ktore rzeczywiscie wejda do dzisiejszej misji.</div>
          )}

          <PrimaryButton onClick={() => updateState((current) => completeTodayStep(current, "srs"))}>Mark SRS done</PrimaryButton>
        </Panel>

        <div className="space-y-4">
          <Panel className="space-y-4">
            <SectionTitle subtitle="Only clarify-and-promote phrases that are relevant for this week's communicative goal." title="Promote from Activation Queue" />
            <p className="text-sm text-slate-600">
              {canAddNew ? `Mozesz jeszcze dodac ${Math.max(state.settings.newCardsCap - todayLog.newCount, 0)} kart(y).` : "Nowe karty sa zablokowane przez backlog lub dzienny limit."}
            </p>
            {captured.length === 0 ? (
              <p className="text-sm text-slate-600">Brak clarified phrases do promocji.</p>
            ) : (
              captured.map((phrase) => (
                <div className="applus-soft-panel p-4" key={phrase.id}>
                  <p className="font-medium">{phrase.textEs}</p>
                  <p className="mt-1 text-sm text-slate-600">{phrase.meaningOrPromptPl || "Dodaj prompt/meaning w Inboxie, aby lepiej przygotowac karte produkcyjna."}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {phrase.topicId} • {phrase.activationStage.replaceAll("_", " ")}
                  </p>
                  <button
                    className="mt-3 border border-applus-border bg-white px-3 py-2 text-sm hover:bg-applus-muted disabled:opacity-50"
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

          <Panel className="space-y-4">
            <SectionTitle subtitle="Today's use queue shows what should move from memory into actual speech." title="Activation for Use" />
            <div className="applus-grid-table">
              {today.useTodayQueue.map((item) => (
                <div className="applus-grid-row md:grid-cols-[minmax(0,1fr)_140px]" key={item.id}>
                  <div>
                    <p className="font-medium">{item.text}</p>
                    <p className="text-sm text-slate-600">{item.reason}</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    {item.source} • {item.activationStage.replaceAll("_", " ")}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
