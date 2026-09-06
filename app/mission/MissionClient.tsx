"use client";

import { useRef, useState } from "react";
import { CommandOrb } from "@/components/CommandOrb";
import { MissionTranscript } from "@/components/MissionTranscript";

const MIN_HOLD_MS = 300;

interface Turn {
  role: "child" | "orb";
  content: string;
}

interface MissionTurnResponse {
  transcript: string | null;
  orb_text: string;
  audio_base64: string | null;
  rank: number;
  ranked_up: boolean;
  mission_complete: boolean;
}

export function MissionClient({ childName, course }: { childName: string; course: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [amplitude, setAmplitude] = useState(0);
  const [micDenied, setMicDenied] = useState(false);
  const [showReboot, setShowReboot] = useState(false);
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const holdStartedAtRef = useRef<number>(0);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isHoldingRef = useRef(false);

  async function submitTurn(audioBlob: Blob | null, tapAnswer?: string) {
    if (isSubmittingTurn) {
      return;
    }
    setIsSubmittingTurn(true);

    const form = new FormData();
    form.append("audio", audioBlob ?? new Blob([]), "turn.webm");
    form.append("course", course);
    form.append("recentTurns", JSON.stringify(turns.slice(-6)));
    if (tapAnswer) {
      form.append("tapAnswer", tapAnswer);
    }

    try {
      const response = await fetch("/api/mission-turn", { method: "POST", body: form });
      const data: MissionTurnResponse = await response.json();

      setTurns((prev) => [
        ...prev,
        ...(data.transcript ? [{ role: "child" as const, content: data.transcript }] : []),
        { role: "orb" as const, content: data.orb_text },
      ]);
      setRank(data.rank);
      if (data.ranked_up) {
        setShowReboot(true);
      }

      currentAudioRef.current?.pause();
      if (data.audio_base64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
        currentAudioRef.current = audio;
        setIsAudioPlaying(true);
        audio.onended = () => setIsAudioPlaying(false);
        audio.play().catch(() => setIsAudioPlaying(false));
      } else {
        currentAudioRef.current = null;
      }
    } finally {
      setIsSubmittingTurn(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      holdStartedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const heldMs = Date.now() - holdStartedAtRef.current;
        if (heldMs < MIN_HOLD_MS) {
          return;
        }
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        submitTurn(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setAmplitude(0.6);
    } catch {
      setMicDenied(true);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setAmplitude(0);
  }

  function stopAudio() {
    currentAudioRef.current?.pause();
    setIsAudioPlaying(false);
  }

  function handleTalkKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    if (isHoldingRef.current) {
      return;
    }
    isHoldingRef.current = true;
    startRecording();
  }

  function handleTalkKeyUp(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    isHoldingRef.current = false;
    stopRecording();
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      {showReboot && (
        <div
          className="system-reboot-overlay"
          onAnimationEnd={() => setShowReboot(false)}
          aria-hidden="true"
        />
      )}
      <h1 className="text-xl tracking-[-0.02em]">
        Cadet {childName}
        {rank !== null ? ` — Rank ${rank}` : ""}
      </h1>
      <CommandOrb amplitude={amplitude} />
      <MissionTranscript turns={turns} />
      {isAudioPlaying && (
        <button
          type="button"
          onClick={stopAudio}
          className="hud-frame border-[color:var(--tactical-teal)] px-3 py-1 text-sm text-[color:var(--tactical-teal)] hover:bg-[color:var(--tactical-teal-dim)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)] transition-colors"
        >
          Stop Commander Audio
        </button>
      )}
      {micDenied ? (
        <div className="flex gap-3">
          <button
            onClick={() => submitTurn(null, "A")}
            disabled={isSubmittingTurn}
            className="hud-frame border-[color:var(--tactical-teal)] px-4 py-2 text-[color:var(--tactical-teal)] hover:bg-[color:var(--tactical-teal-dim)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)] transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            Option A
          </button>
          <button
            onClick={() => submitTurn(null, "B")}
            disabled={isSubmittingTurn}
            className="hud-frame border-[color:var(--tactical-teal)] px-4 py-2 text-[color:var(--tactical-teal)] hover:bg-[color:var(--tactical-teal-dim)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)] transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            Option B
          </button>
        </div>
      ) : (
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={(event) => {
            event.preventDefault();
            startRecording();
          }}
          onTouchEnd={(event) => {
            event.preventDefault();
            stopRecording();
          }}
          onKeyDown={handleTalkKeyDown}
          onKeyUp={handleTalkKeyUp}
          disabled={isSubmittingTurn}
          className="hud-frame rounded-full px-8 py-4 text-[color:var(--alert-orange)] border-[color:var(--alert-orange)] hover:bg-[color:var(--tactical-teal-dim)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--tactical-teal)] transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
        >
          {isSubmittingTurn ? "Transmitting…" : "Hold to Talk"}
        </button>
      )}
    </main>
  );
}
