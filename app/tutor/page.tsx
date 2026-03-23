"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { promoteTutorCorrection, saveTutorNote, updateTutorCorrectionPin } from "@/lib/app-state";

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
      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <Panel className="space-y-4">
            <SectionTitle subtitle="Prepare one real topic, one useful chunk set, and one correction question before the lesson." title="Session Prep" />
            <ul className="applus-grid-table text-sm text-slate-600">
              <li className="applus-grid-row">Co wydarzylo sie w tym tygodniu, co warto opowiedziec spontanicznie?</li>
              <li className="applus-grid-row">Jakie 2 chunky z current focus chcesz na pewno wykorzystac z lektorem?</li>
              <li className="applus-grid-row">Jakie jedno zdanie chcesz doprowadzic do bardziej naturalnej wersji?</li>
            </ul>
          </Panel>

          <Panel className="space-y-4">
            <SectionTitle subtitle="After the lesson, convert only the corrections worth reusing in actual speech." title="Post-lesson Notes" />
            <input className="applus-field" onChange={(event) => setTopic(event.target.value)} placeholder="Temat lekcji" value={topic} />
            <textarea className="applus-textarea min-h-28" onChange={(event) => setMistakes(event.target.value)} placeholder="Bledy, po jednym w linii" value={mistakes} />
            <textarea className="applus-textarea min-h-28" onChange={(event) => setCorrected(event.target.value)} placeholder="Poprawne wersje, po jednej w linii" value={corrected} />
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
          <SectionTitle subtitle="Convert corrections into action: this week, next lesson, or SRS only." title="Tutor Notes" />
          {state.tutorNotes.map((note) => (
            <article className="border border-applus-border bg-white p-4" key={note.id}>
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
                  <p className="font-medium">Corrections to action</p>
                  <div className="mt-2 space-y-2">
                    {note.corrections.map((item) => (
                      <div className="applus-soft-panel p-3" key={item.id}>
                        <p className="text-sm">{item.text}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className={`border px-3 py-2 text-sm ${item.pin === "this_week" ? "border-applus-blue bg-blue-50 text-applus-blue" : "border-applus-border bg-white hover:bg-applus-muted"}`}
                            onClick={() => updateState((current) => updateTutorCorrectionPin(current, note.id, item.id, "this_week"))}
                            type="button"
                          >
                            This week
                          </button>
                          <button
                            className={`border px-3 py-2 text-sm ${item.pin === "next_lesson" ? "border-applus-blue bg-blue-50 text-applus-blue" : "border-applus-border bg-white hover:bg-applus-muted"}`}
                            onClick={() => updateState((current) => updateTutorCorrectionPin(current, note.id, item.id, "next_lesson"))}
                            type="button"
                          >
                            Next lesson
                          </button>
                          <button
                            className={`border px-3 py-2 text-sm ${item.pin === "srs_only" ? "border-applus-blue bg-blue-50 text-applus-blue" : "border-applus-border bg-white hover:bg-applus-muted"}`}
                            onClick={() => updateState((current) => updateTutorCorrectionPin(current, note.id, item.id, "srs_only"))}
                            type="button"
                          >
                            SRS only
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className="border border-applus-border bg-white px-3 py-2 text-sm hover:bg-applus-muted disabled:opacity-50"
                            disabled={item.promotedToCard}
                            onClick={() => updateState((current) => promoteTutorCorrection(current, note.id, item.id))}
                            type="button"
                          >
                            {item.promotedToCard ? "Already in SRS" : "Add to SRS"}
                          </button>
                          <span className="border border-applus-border bg-white px-3 py-2 text-sm text-slate-600">{item.usedInMission ? "used in mission" : "not yet used"}</span>
                        </div>
                      </div>
                    ))}
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
