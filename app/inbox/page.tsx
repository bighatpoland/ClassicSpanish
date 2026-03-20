"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { capturePhrase, getRecycleCandidates, markPhraseSpoken, promotePhraseToCard } from "@/lib/app-state";

export default function InboxPage() {
  const { hydrated, state, updateState } = useAppStore();
  const [draft, setDraft] = useState("");

  if (!hydrated || !state) {
    return (
      <AppShell activeRoute="/inbox" title="Inbox">
        <Panel>Loading inbox...</Panel>
      </AppShell>
    );
  }

  const recycleCandidates = getRecycleCandidates(state);

  return (
    <AppShell activeRoute="/inbox" title="Inbox">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Panel className="space-y-4">
            <SectionTitle subtitle="Notice -> Capture powinno trwac kilka sekund." title="Quick Capture" />
            <textarea className="min-h-32 w-full rounded border border-applus-border px-3 py-3 text-base" onChange={(event) => setDraft(event.target.value)} placeholder="Np. Hoy quiero hablar un poco mas despacio." value={draft} />
            <PrimaryButton
              onClick={() => {
                updateState((current) => capturePhrase(current, draft, "inbox"));
                setDraft("");
              }}
            >
              Add phrase
            </PrimaryButton>
          </Panel>

          <Panel className="space-y-4">
            <SectionTitle subtitle="Frazy do uzycia glosowo w ciagu 48h." title="Recycle Task" />
            {recycleCandidates.length === 0 ? (
              <p className="text-sm text-slate-600">Brak pilnych fraz.</p>
            ) : (
              recycleCandidates.map((item) => (
                <div className="rounded border border-applus-border bg-applus-muted p-4" key={item.id}>
                  <p className="font-medium">{item.textEs}</p>
                  <p className="text-sm text-slate-600">{item.status}</p>
                </div>
              ))
            )}
          </Panel>
        </div>

        <Panel className="space-y-4">
          <SectionTitle subtitle="Pipeline: captured -> carded -> spoken." title="Phrase Inbox" />
          {state.phraseInbox.map((item) => (
            <div className="rounded border border-applus-border bg-white p-4" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.textEs}</p>
                  <p className="text-sm text-slate-600">
                    {item.source} • {item.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="rounded border border-applus-border px-3 py-2 text-sm hover:bg-applus-muted" onClick={() => updateState((current) => promotePhraseToCard(current, item.id))} type="button">
                    To SRS
                  </button>
                  <button className="rounded border border-applus-border px-3 py-2 text-sm hover:bg-applus-muted" onClick={() => updateState((current) => markPhraseSpoken(current, item.id))} type="button">
                    Mark spoken
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </AppShell>
  );
}
