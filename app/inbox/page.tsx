"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { capturePhrase, clarifyPhrase, getCurrentWeeklyFocus, getRecycleCandidates, markPhraseSpoken, promotePhraseToCard } from "@/lib/app-state";

export default function InboxPage() {
  const { hydrated, state, updateState } = useAppStore();
  const [draft, setDraft] = useState("");
  const [draftMeaning, setDraftMeaning] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  if (!hydrated || !state) {
    return (
      <AppShell activeRoute="/inbox" title="Inbox">
        <Panel>Loading inbox...</Panel>
      </AppShell>
    );
  }

  const recycleCandidates = getRecycleCandidates(state);
  const currentFocus = getCurrentWeeklyFocus(state);

  return (
    <AppShell activeRoute="/inbox" title="Inbox">
      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <Panel className="space-y-4">
            <SectionTitle subtitle="Capture is useful only if the phrase is clarified and connected to current speaking work." title="Quick Capture" />
            <textarea className="applus-textarea min-h-32" onChange={(event) => setDraft(event.target.value)} placeholder="Np. Hoy quiero explicarlo mejor." value={draft} />
            <input className="applus-field" onChange={(event) => setDraftMeaning(event.target.value)} placeholder="Prompt / meaning po polsku" value={draftMeaning} />
            <PrimaryButton
              onClick={() => {
                updateState((current) => capturePhrase(current, draft, "inbox", { meaningOrPromptPl: draftMeaning, topicId: currentFocus.id }));
                setDraft("");
                setDraftMeaning("");
              }}
            >
              Add phrase
            </PrimaryButton>
          </Panel>

          <Panel className="space-y-4">
            <SectionTitle subtitle="These phrases should reappear quickly until they are reused in context." title="Reuse Pressure" />
            {recycleCandidates.length === 0 ? (
              <p className="text-sm text-slate-600">Brak pilnych fraz.</p>
            ) : (
              recycleCandidates.map((item) => (
                <div className="applus-soft-panel p-4" key={item.id}>
                  <p className="font-medium">{item.textEs}</p>
                  <p className="text-sm text-slate-600">
                    {item.activationStage.replaceAll("_", " ")} • {item.topicId}
                  </p>
                </div>
              ))
            )}
          </Panel>
        </div>

        <Panel className="space-y-4">
          <SectionTitle subtitle="Formal activation pipeline: captured -> clarified -> carded -> primed -> used today -> reused -> stable." title="Phrase Inbox" />
          <div className="applus-grid-table">
            {state.phraseInbox.map((item) => (
              <div className="applus-grid-row" key={item.id}>
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto]">
                  <div>
                    <p className="font-medium">{item.textEs}</p>
                    <p className="text-sm text-slate-600">
                      {item.source} • {item.topicId} • {item.activationStage.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div>
                    <input
                      className="applus-field"
                      onChange={(event) => setEditing((current) => ({ ...current, [item.id]: event.target.value }))}
                      placeholder="Prompt / meaning po polsku"
                      value={editing[item.id] ?? item.meaningOrPromptPl ?? ""}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button
                      className="border border-applus-border bg-white px-3 py-2 text-sm hover:bg-applus-muted"
                      onClick={() => updateState((current) => clarifyPhrase(current, item.id, editing[item.id] ?? item.meaningOrPromptPl ?? "", item.topicId))}
                      type="button"
                    >
                      Clarify
                    </button>
                    <button className="border border-applus-border bg-white px-3 py-2 text-sm hover:bg-applus-muted" onClick={() => updateState((current) => promotePhraseToCard(current, item.id))} type="button">
                      To SRS
                    </button>
                    <button className="border border-applus-border bg-white px-3 py-2 text-sm hover:bg-applus-muted" onClick={() => updateState((current) => markPhraseSpoken(current, item.id))} type="button">
                      Used in speech
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
