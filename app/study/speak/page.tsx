"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle, ToggleChip } from "@/components/ui";
import { VoiceRecorder } from "@/components/voice-recorder";
import { useAppStore } from "@/hooks/use-app-store";
import { completeTodayStep, getTodayPlanView, saveSpeakingSession, setTodayMode } from "@/lib/app-state";
import { SPEAK_PROMPTS } from "@/lib/defaults";

export default function StudySpeakPage() {
  const { hydrated, state, updateState } = useAppStore();
  const [selectedPromptId, setSelectedPromptId] = useState(SPEAK_PROMPTS[0].id);
  const [audioRef, setAudioRef] = useState<string>();
  const [durationMin, setDurationMin] = useState(7);
  const [transcript, setTranscript] = useState("");
  const [aiPromptText, setAiPromptText] = useState("");
  const [aiFeedbackText, setAiFeedbackText] = useState("");
  const [scores, setScores] = useState({
    stumbles: 3,
    connectors: 3,
    clarity: 3,
    confidence: 3
  });

  if (!hydrated || !state) {
    return (
      <AppShell activeRoute="/study/speak" title="Speak">
        <Panel>Loading speaking block...</Panel>
      </AppShell>
    );
  }

  const today = getTodayPlanView(state);
  const selectedPrompt = SPEAK_PROMPTS.find((item) => item.id === selectedPromptId) ?? SPEAK_PROMPTS[0];
  const recentPhrases = state.phraseInbox.slice(0, 3).map((item) => item.textEs);

  async function handleAiPrompt() {
    const response = await fetch("/api/ai/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: selectedPrompt.topic,
        mode: today.mode,
        recentPhrases
      })
    });
    const data = (await response.json()) as { text?: string };
    setAiPromptText(data.text ?? "");
  }

  async function handleAiFeedback() {
    const response = await fetch("/api/ai/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: transcript,
        focus: "plynnosc, laczniki, zrozumialosc"
      })
    });
    const data = (await response.json()) as { text?: string };
    setAiFeedbackText(data.text ?? "");
  }

  return (
    <AppShell activeRoute="/study/speak" title="Speak">
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <Panel className="space-y-4">
            <SectionTitle subtitle="Tryb dnia zmienia formę wykonania, ale nie cel: aktywne mowienie." title="Prompt" />
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={today.mode === "quiet"} label="quiet / public" onClick={() => updateState((current) => setTodayMode(current, "quiet"))} />
              <ToggleChip active={today.mode === "voice"} label="voice / private" onClick={() => updateState((current) => setTodayMode(current, "voice"))} />
            </div>

            {SPEAK_PROMPTS.map((prompt) => (
              <button
                className={`block w-full rounded border px-4 py-4 text-left ${selectedPromptId === prompt.id ? "border-applus-blue bg-blue-50" : "border-applus-border bg-applus-muted hover:bg-white"}`}
                key={prompt.id}
                onClick={() => setSelectedPromptId(prompt.id)}
                type="button"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">{prompt.topic}</p>
                <p className="mt-2 font-medium">{prompt.prompt}</p>
              </button>
            ))}

            <div className="rounded border border-applus-border bg-applus-muted p-4">
              <p className="text-sm font-semibold">Support</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {selectedPrompt.support.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded border border-applus-border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">AI Prompt</p>
                  <p className="text-sm text-slate-600">Opcjonalne. Bez klucza srodowiskowego zwroci fallback.</p>
                </div>
                <PrimaryButton onClick={handleAiPrompt}>Generate</PrimaryButton>
              </div>
              {aiPromptText ? <div className="mt-4 whitespace-pre-wrap rounded border border-applus-border bg-applus-muted p-3 text-sm text-slate-600">{aiPromptText}</div> : null}
            </div>

            {today.mode === "voice" ? (
              <VoiceRecorder onRecordingReady={setAudioRef} />
            ) : (
              <div className="rounded border border-applus-border bg-applus-muted p-4 text-sm text-slate-600">W trybie quiet skup sie na cichym retellu lub wypowiedzi w glowie.</div>
            )}
          </Panel>
        </div>

        <Panel className="space-y-4">
          <SectionTitle subtitle="Szybki self-check po wypowiedzi lub retellu." title="Self-check" />
          <label className="grid gap-2 text-sm">
            Dlugosc bloku
            <input className="rounded border border-applus-border px-3 py-2" max={20} min={3} onChange={(event) => setDurationMin(Number(event.target.value))} type="number" value={durationMin} />
          </label>

          {[
            { key: "stumbles", label: "Zaciecia" },
            { key: "connectors", label: "Laczniki" },
            { key: "clarity", label: "Zrozumialosc" },
            { key: "confidence", label: "Pewnosc" }
          ].map((item) => (
            <label className="block rounded border border-applus-border bg-applus-muted p-4 text-sm" key={item.key}>
              {item.label}
              <input
                className="mt-3 w-full accent-[#0a70eb]"
                max={5}
                min={1}
                onChange={(event) => setScores((current) => ({ ...current, [item.key]: Number(event.target.value) }))}
                type="range"
                value={scores[item.key as keyof typeof scores]}
              />
              <span className="mt-2 block font-semibold">{scores[item.key as keyof typeof scores]}/5</span>
            </label>
          ))}

          <textarea
            className="min-h-28 w-full rounded border border-applus-border px-3 py-3 text-base"
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Wklej swoja transkrypcje, jesli chcesz AI feedback..."
            value={transcript}
          />
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={handleAiFeedback}>Get AI feedback</PrimaryButton>
            <PrimaryButton
              onClick={() =>
                updateState((current) =>
                  saveSpeakingSession(current, {
                    promptId: selectedPrompt.id,
                    mode: today.mode,
                    durationMin,
                    audioRef,
                    selfScores: scores
                  })
                )
              }
            >
              Save session
            </PrimaryButton>
            <button className="rounded border border-applus-border px-4 py-2 text-sm hover:bg-applus-muted" onClick={() => updateState((current) => completeTodayStep(current, "speak"))} type="button">
              Mark speak done
            </button>
          </div>
          {aiFeedbackText ? <div className="whitespace-pre-wrap rounded border border-applus-border bg-applus-muted p-3 text-sm text-slate-600">{aiFeedbackText}</div> : null}
        </Panel>
      </div>
    </AppShell>
  );
}
