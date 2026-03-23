import type { MissionType, StudyMode } from "@/lib/types";

export type AiPromptRequest = {
  topic?: string;
  mode?: StudyMode;
  missionType?: MissionType;
  targetChunks?: string[];
  recentPhrases?: string[];
};

export type AiFeedbackRequest = {
  text?: string;
  focus?: string;
  missionPrompt?: string;
  targetChunks?: string[];
  recentPhrases?: string[];
};

function getAiConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL
  };
}

export function isAiEnabled(): boolean {
  return Boolean(getAiConfig().apiKey);
}

async function requestOpenAi(instructions: string, input: string): Promise<string> {
  const { apiKey, model } = getAiConfig();
  if (!apiKey) {
    throw new Error("AI_DISABLED");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model ?? "gpt-4.1-mini",
      instructions,
      input
    })
  });

  if (!response.ok) {
    throw new Error("AI_REQUEST_FAILED");
  }

  const data = (await response.json()) as { output_text?: string };
  return data.output_text?.trim() ?? "";
}

function buildLocalPromptFallback(payload: AiPromptRequest): string {
  const missionTypeLabel = payload.missionType ?? "retell";
  const chunks = (payload.targetChunks ?? []).slice(0, 3);
  const phrases = (payload.recentPhrases ?? []).slice(0, 2);

  return [
    "AI jest wylaczone. Uzyj lokalnego coachingu:",
    `Misja: ${missionTypeLabel}. Temat: ${payload.topic ?? "codziennosc"}. Tryb: ${payload.mode ?? "voice"}.`,
    `Cel: uzyj ${chunks.length > 0 ? chunks.join(", ") : "2 target chunks"} w jednej krotkiej wypowiedzi.`,
    `Wplec takze ${phrases.length > 0 ? phrases.join(" / ") : "jedna niedawno zlapana fraze"}.`,
    "Plan: 1) otworz wypowiedz jednym zdaniem, 2) dodaj problem/opinie, 3) zakoncz malym planem lub pytaniem."
  ].join("\n");
}

function buildLocalFeedbackFallback(payload: AiFeedbackRequest): string {
  const chunks = (payload.targetChunks ?? []).slice(0, 3);
  const phrases = (payload.recentPhrases ?? []).slice(0, 2);

  return [
    "AI jest wylaczone. Uzyj lokalnej analizy:",
    `Misja: ${payload.missionPrompt ?? "wypowiedz speaking-first"}.`,
    `Sprawdz: ${payload.focus ?? "hesitation, connectors, repair, sentence length, confidence"}.`,
    `Czy wykorzystales: ${chunks.length > 0 ? chunks.join(", ") : "co najmniej 2 target chunks"}?`,
    `Czy wplotlas: ${phrases.length > 0 ? phrases.join(" / ") : "co najmniej jedna fraze z use today"}?`,
    "Poprawka: powiedz jeszcze raz ta sama wypowiedz, ale z wolniejszym startem i jednym dodatkowym lacznikiem."
  ].join("\n");
}

export async function generateSpeakingPrompt(payload: AiPromptRequest): Promise<{ enabled: boolean; text: string }> {
  if (!isAiEnabled()) {
    return {
      enabled: false,
      text: buildLocalPromptFallback(payload)
    };
  }

  const text = await requestOpenAi(
    "You generate one short speaking mission for an adult A2-B1 Spanish learner. Return in Polish. Include one mission brief, three support bullets, and explicitly mention 2-3 target chunks to reuse.",
    `Temat: ${payload.topic ?? "codziennosc"}.
Tryb: ${payload.mode ?? "voice"}.
Typ misji: ${payload.missionType ?? "retell"}.
Target chunks: ${(payload.targetChunks ?? []).join("; ")}.
Ostatnie frazy: ${(payload.recentPhrases ?? []).join("; ")}.`
  );

  return {
    enabled: true,
    text
  };
}

export async function generateTextFeedback(payload: AiFeedbackRequest): Promise<{ enabled: boolean; text: string }> {
  if (!isAiEnabled()) {
    return {
      enabled: false,
      text: buildLocalFeedbackFallback(payload)
    };
  }

  const text = await requestOpenAi(
    "You provide concise supportive feedback for an adult Spanish learner. Return in Polish with: one encouragement sentence, three observations linked to fluency and chunk reuse, and one tiny retry task.",
    `Tekst uczennicy: ${payload.text ?? ""}
Fokus: ${payload.focus ?? "hesitation, connectors, repair, sentence length, confidence"}
Misja: ${payload.missionPrompt ?? "speaking mission"}
Target chunks: ${(payload.targetChunks ?? []).join("; ")}
Recent phrases: ${(payload.recentPhrases ?? []).join("; ")}`
  );

  return {
    enabled: true,
    text
  };
}
