"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle, ToggleChip } from "@/components/ui";
import { VoiceRecorder } from "@/components/voice-recorder";
import { useAppStore } from "@/hooks/use-app-store";
import { completeTodayStep, getTodayPlanView, saveSpeakingSession, setTodayMode } from "@/lib/app-state";

export default function StudySpeakPage() {
  const { hydrated, state, updateState } = useAppStore();
  const [audioRef, setAudioRef] = useState<string>();
  const [durationMin, setDurationMin] = useState(7);
  const [transcript, setTranscript] = useState("");
  const [aiPromptText, setAiPromptText] = useState("");
  const [aiFeedbackText, setAiFeedbackText] = useState("");
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);
  const [scores, setScores] = useState({
    hesitation: 3,
    connectors: 3,
    repair: 3,
    sentenceLength: 3,
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
  const mission = today.mission;
  const useTodayQueue = today.useTodayQueue;
  const requiredRefs = mission.requiredPhraseRefs;
  const highlightedQueue = useTodayQueue.map((item) => ({
    ...item,
    required: requiredRefs.includes(item.refId)
  }));

  async function handleAiPrompt() {
    const response = await fetch("/api/ai/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: today.weeklyFocus.context,
        mode: today.mode,
        missionType: mission.type,
        targetChunks: today.targetChunks.slice(0, 4),
        recentPhrases: highlightedQueue.slice(0, 4).map((item) => item.text)
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
        focus: "hesitation, connectors, repair, sentence length, confidence",
        missionPrompt: mission.prompt,
        targetChunks: today.targetChunks.slice(0, 4),
        recentPhrases: highlightedQueue.filter((item) => selectedRefs.includes(item.refId)).map((item) => item.text)
      })
    });
    const data = (await response.json()) as { text?: string };
    setAiFeedbackText(data.text ?? "");
  }

  function toggleRef(refId: string) {
    setSelectedRefs((current) => (current.includes(refId) ? current.filter((item) => item !== refId) : [...current, refId]));
  }

  return (
    <AppShell activeRoute="/study/speak" title="Speak">
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <Panel className="space-y-4">
            <SectionTitle subtitle="Mission-driven speaking block grounded in weekly focus and real chunk reuse." title="Speaking Mission" />
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={today.mode === "quiet"} label="quiet / public" onClick={() => updateState((current) => setTodayMode(current, "quiet"))} />
              <ToggleChip active={today.mode === "voice"} label="voice / private" onClick={() => updateState((current) => setTodayMode(current, "voice"))} />
            </div>

            <div className="applus-soft-panel p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{mission.type}</p>
              <h3 className="mt-2 text-xl font-semibold">{mission.prompt}</h3>
              <p className="mt-2 text-sm text-slate-600">{today.communicativeGoal}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="border border-applus-border bg-white p-4">
                <p className="text-sm font-semibold">Support</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {mission.support.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="applus-note p-4">
                <p className="text-sm font-semibold">Completion criteria</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {mission.completionCriteria.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border border-applus-border bg-white">
              <div className="border-b border-applus-border px-4 py-3">
                <p className="text-sm font-semibold">Use these today</p>
                <p className="text-sm text-slate-600">Zaznacz wszystko, czego faktycznie uzyjesz w tej wypowiedzi.</p>
              </div>
              <div className="applus-grid-table border-0">
                {highlightedQueue.map((item) => (
                  <label className="applus-grid-row cursor-pointer md:grid-cols-[26px_minmax(0,1fr)_140px]" key={item.refId}>
                    <input checked={selectedRefs.includes(item.refId)} onChange={() => toggleRef(item.refId)} type="checkbox" />
                    <div>
                      <p className="font-medium">
                        {item.text} {item.required ? <span className="text-applus-blue">(required)</span> : null}
                      </p>
                      <p className="text-sm text-slate-600">{item.reason}</p>
                    </div>
                    <div className="text-sm text-slate-600">
                      {item.source} • {item.activationStage.replaceAll("_", " ")}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="border border-applus-border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">AI Prompt</p>
                  <p className="text-sm text-slate-600">Optional coach. Without API key it returns a deterministic local mission coach.</p>
                </div>
                <PrimaryButton onClick={handleAiPrompt}>Generate</PrimaryButton>
              </div>
              {aiPromptText ? <div className="applus-note mt-4 whitespace-pre-wrap p-3 text-sm text-slate-600">{aiPromptText}</div> : null}
            </div>

            {today.mode === "voice" ? (
              <VoiceRecorder onRecordingReady={setAudioRef} />
            ) : (
              <div className="applus-note p-4 text-sm text-slate-600">W trybie quiet zrob najpierw cichy retell, a potem glosno powiedz tylko finalna wersje misji.</div>
            )}
          </Panel>
        </div>

        <Panel className="space-y-4">
          <SectionTitle subtitle="Self-check ma oceniac plynne uzycie, nie tylko poprawne przypomnienie." title="Mission Review" />
          <label className="grid gap-2 text-sm">
            Dlugosc bloku
            <input className="applus-field" max={20} min={3} onChange={(event) => setDurationMin(Number(event.target.value))} type="number" value={durationMin} />
          </label>

          {[
            { key: "hesitation", label: "Hesitation" },
            { key: "connectors", label: "Connectors" },
            { key: "repair", label: "Repair ability" },
            { key: "sentenceLength", label: "Sentence length" },
            { key: "confidence", label: "Confidence" }
          ].map((item) => (
            <label className="applus-soft-panel block p-4 text-sm" key={item.key}>
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
            className="applus-textarea min-h-28"
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Wklej transkrypcje lub szybkie notatki z wypowiedzi..."
            value={transcript}
          />
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={handleAiFeedback}>Get AI feedback</PrimaryButton>
            <PrimaryButton
              disabled={selectedRefs.length === 0}
              onClick={() =>
                updateState((current) =>
                  saveSpeakingSession(current, {
                    promptId: mission.id,
                    missionId: mission.id,
                    mode: today.mode,
                    durationMin,
                    audioRef,
                    selfScores: scores,
                    usedPhraseRefs: selectedRefs
                  })
                )
              }
            >
              Complete mission
            </PrimaryButton>
            <button className="border border-applus-border bg-white px-4 py-2 text-sm hover:bg-applus-muted" onClick={() => updateState((current) => completeTodayStep(current, "speak"))} type="button">
              Mark speak done
            </button>
          </div>
          {aiFeedbackText ? <div className="applus-note whitespace-pre-wrap p-3 text-sm text-slate-600">{aiFeedbackText}</div> : null}
        </Panel>
      </div>
    </AppShell>
  );
}
