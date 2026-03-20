"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { promoteTutorCorrection, saveTutorNote } from "@/lib/app-state";

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function TutorPage() {
  const { hydrated, state, updateState } = useAppStore();
  const [topic, setTopic] = useState("");
  const [mistakes, setMistakes] = useState("");
  const [corrected, setCorrected] = useState("");

  if (!hydrated || !state) {
    return (
      <AppShell activeRoute="/tutor" title="Tutor">
        <Panel>Loading tutor notes...</Panel>
      </AppShell>
    );
  }

  return (
    <AppShell activeRoute="/tutor" title="Tutor">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Panel className="space-y-4">
            <SectionTitle subtitle="Przed lekcja przygotuj 2-3 tematy i jedno pytanie o korekte." title="Session Prep" />
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Co chcesz opowiedziec o swoim tygodniu?</li>
              <li>• Jakie zdanie chcesz powiedziec naturalniej?</li>
              <li>• Jakie laczniki chcesz dzis przetestowac?</li>
            </ul>
          </Panel>

          <Panel className="space-y-4">
            <SectionTitle subtitle="Po lekcji zapisujesz tylko rzeczy warte przejscia do pipeline." title="Post-lesson Notes" />
            <input className="w-full rounded border border-applus-border px-3 py-2" onChange={(event) => setTopic(event.target.value)} placeholder="Temat lekcji" value={topic} />
            <textarea className="min-h-28 w-full rounded border border-applus-border px-3 py-3" onChange={(event) => setMistakes(event.target.value)} placeholder="Bledy, po jednym w linii" value={mistakes} />
            <textarea className="min-h-28 w-full rounded border border-applus-border px-3 py-3" onChange={(event) => setCorrected(event.target.value)} placeholder="Poprawne wersje, po jednej w linii" value={corrected} />
            <PrimaryButton
              onClick={() => {
                updateState((current) => saveTutorNote(current, topic || "Lekcja", splitLines(mistakes), splitLines(corrected)));
                setTopic("");
                setMistakes("");
                setCorrected("");
              }}
            >
              Save note
            </PrimaryButton>
          </Panel>
        </div>

        <Panel className="space-y-4">
          <SectionTitle subtitle="Dobre poprawki powinny jednym kliknieciem trafic do dalszej praktyki." title="Tutor Notes" />
          {state.tutorNotes.map((note) => (
            <article className="rounded border border-applus-border bg-white p-4" key={note.id}>
              <p className="text-xs uppercase tracking-wide text-slate-500">{note.topic}</p>
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div>
                  <p className="font-medium">Mistakes</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {note.mistakes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Correct forms</p>
                  <div className="mt-2 space-y-2">
                    {note.correctedForms.map((item) => {
                      const promoted = note.promotedToCards.includes(item);
                      return (
                        <div className="rounded border border-applus-border bg-applus-muted p-3" key={item}>
                          <p className="text-sm">{item}</p>
                          <button
                            className="mt-2 rounded border border-applus-border px-3 py-2 text-sm hover:bg-white disabled:opacity-50"
                            disabled={promoted}
                            onClick={() => updateState((current) => promoteTutorCorrection(current, note.id, item))}
                            type="button"
                          >
                            {promoted ? "Already in SRS" : "Add to SRS"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </Panel>
      </div>
    </AppShell>
  );
}
