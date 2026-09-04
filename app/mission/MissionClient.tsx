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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const holdStartedAtRef = useRef<number>(0);

  async function submitTurn(audioBlob: Blob | null, tapAnswer?: string) {
    const form = new FormData();
    form.append("audio", audioBlob ?? new Blob([]), "turn.webm");
    form.append("course", course);
    form.append("recentTurns", JSON.stringify(turns.slice(-6)));
    if (tapAnswer) {
      form.append("tapAnswer", tapAnswer);
    }

    const response = await fetch("/api/mission-turn", { method: "POST", body: form });
    const data: MissionTurnResponse = await response.json();

    setTurns((prev) => [...prev, { role: "orb", content: data.orb_text }]);
    setRank(data.rank);
    if (data.ranked_up) {
      setShowReboot(true);
    }

    if (data.audio_base64) {
      const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
      audio.play();
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
      {micDenied ? (
        <div className="flex gap-3">
          <button
            onClick={() => submitTurn(null, "A")}
            className="hud-frame border-[color:var(--tactical-teal)] px-4 py-2 text-[color:var(--tactical-teal)] hover:bg-[color:var(--tactical-teal-dim)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)] transition-colors"
          >
            Option A
          </button>
          <button
            onClick={() => submitTurn(null, "B")}
            className="hud-frame border-[color:var(--tactical-teal)] px-4 py-2 text-[color:var(--tactical-teal)] hover:bg-[color:var(--tactical-teal-dim)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)] transition-colors"
          >
            Option B
          </button>
        </div>
      ) : (
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={(event) => {
            event.preventDefault();
            startRecording();
          }}
          onTouchEnd={(event) => {
            event.preventDefault();
            stopRecording();
          }}
          className="hud-frame rounded-full px-8 py-4 text-[color:var(--alert-orange)] border-[color:var(--alert-orange)] hover:bg-[color:var(--tactical-teal-dim)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--alert-orange)] transition-colors active:scale-95"
        >
          Hold to Talk
        </button>
      )}
    </main>
  );
}
