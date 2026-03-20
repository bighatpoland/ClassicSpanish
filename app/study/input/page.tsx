"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { capturePhrase, completeTodayStep } from "@/lib/app-state";
import { INPUT_LIBRARY, SPEAK_PROMPTS } from "@/lib/defaults";

export default function StudyInputPage() {
  const { hydrated, state, updateState } = useAppStore();
  const [draft, setDraft] = useState("");

  if (!hydrated || !state) {
    return (
      <AppShell activeRoute="/study/input" title="Input">
        <Panel>Loading input library...</Panel>
      </AppShell>
    );
  }

  return (
    <AppShell activeRoute="/study/input" title="Input">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="space-y-4">
          <SectionTitle subtitle="Latwe materialy, szybki capture, zero tarcia." title="Input Library" />
          {INPUT_LIBRARY.map((item) => (
            <article className="rounded border border-applus-border bg-applus-muted p-4" key={item.id}>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {item.kind} • {item.level} • {item.durationMin} min
              </p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.phrases.map((phrase) => (
                  <button
                    className="rounded border border-applus-border bg-white px-3 py-2 text-sm hover:bg-applus-muted"
                    key={phrase}
                    onClick={() => updateState((current) => capturePhrase(current, phrase, item.id))}
                    type="button"
                  >
                    Capture: {phrase}
                  </button>
                ))}
              </div>
            </article>
          ))}
          <PrimaryButton onClick={() => updateState((current) => completeTodayStep(current, "input"))}>Mark input done</PrimaryButton>
        </Panel>

        <div className="space-y-4">
          <Panel className="space-y-4">
            <SectionTitle subtitle="Ręczny capture powinien trwac sekundy, nie minuty." title="Quick Capture" />
            <textarea
              className="min-h-32 w-full rounded border border-applus-border px-3 py-3 text-base"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Wklej przydatna fraze..."
              value={draft}
            />
            <PrimaryButton
              onClick={() => {
                updateState((current) => capturePhrase(current, draft, "quick-capture"));
                setDraft("");
              }}
            >
              Add to inbox
            </PrimaryButton>
          </Panel>

          <Panel className="space-y-4">
            <SectionTitle subtitle="Tematy tygodnia do przejscia z inputu do mowienia." title="Speaking Topics" />
            {SPEAK_PROMPTS.map((prompt) => (
              <div className="rounded border border-applus-border bg-applus-muted p-4" key={prompt.id}>
                <p className="text-xs uppercase tracking-wide text-slate-500">{prompt.topic}</p>
                <p className="mt-2 font-medium">{prompt.prompt}</p>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
