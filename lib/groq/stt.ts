import { getGroqClient } from "./client";
import { toFile } from "groq-sdk";

export async function transcribeAudio(audio: Buffer): Promise<string> {
  const groq = getGroqClient();
  const response = await groq.audio.transcriptions.create({
    file: await toFile(audio, "turn.webm"),
    model: "whisper-large-v3-turbo",
  });
  return response.text;
}
