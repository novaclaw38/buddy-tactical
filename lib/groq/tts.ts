import { getGroqClient } from "./client";

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const groq = getGroqClient();
  const response = await groq.audio.speech.create({
    model: "canopylabs/orpheus-v1-english",
    voice: "daniel",
    input: text,
    response_format: "wav",
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
