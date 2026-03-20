"use client";

import { useEffect, useRef, useState } from "react";

import { PrimaryButton } from "@/components/ui";

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

export function VoiceRecorder({ onRecordingReady }: { onRecordingReady: (audioRef?: string) => void }) {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [audioRef, setAudioRef] = useState<string>();
  const [error, setError] = useState("");

  useEffect(() => {
    onRecordingReady(audioRef);
  }, [audioRef, onRecordingReady]);

  async function startRecording() {
    setError("");
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Nagrywanie nie jest dostepne w tej przegladarce.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        void blobToDataUrl(blob).then((url) => {
          setAudioRef(url);
          stream.getTracks().forEach((track) => track.stop());
        });
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError("Nie udalo sie uruchomic mikrofonu.");
    }
  }

  function stopRecording() {
    mediaRecorder.current?.stop();
    setRecording(false);
  }

  return (
    <div className="space-y-3 rounded border border-applus-border bg-applus-muted p-4">
      <p className="text-sm text-applus-text">Lokalne nagranie zostaje tylko na tym urzadzeniu.</p>
      <div className="flex flex-wrap gap-3">
        {recording ? <PrimaryButton onClick={stopRecording}>Zatrzymaj</PrimaryButton> : <PrimaryButton onClick={startRecording}>Nagraj</PrimaryButton>}
        <button className="rounded border border-applus-border px-4 py-2 text-sm" onClick={() => setAudioRef(undefined)} type="button">
          Wyczysc
        </button>
      </div>
      {audioRef ? <audio className="w-full" controls src={audioRef} /> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
