import {
  AgentSessionEventTypes,
  ServerOptions,
  cli,
  defineAgent,
  inference,
  voice,
} from "@livekit/agents";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { createAgent } from "./agent.js";

dotenv.config({ path: "../.env" });

export default defineAgent({
  entry: async (ctx) => {
    let context: {
      role?: string;
      level?: string;
      focus?: string;
      job?: string;
      resume?: string;
      amount?: number;
    } = {};
    try {
      context = JSON.parse(ctx.job.metadata || "{}");
    } catch (error) {
      console.error("Invalid interview context:", error);
    }
    const session = new voice.AgentSession({
      stt: new inference.STT({ model: "assemblyai/universal-3-6-pro", language: "en" }),
      tts: new inference.TTS({ model: "fishaudio/s2.1-pro", voice: "fa4c9eb3dccc4806b382b40d61c6b10a" }),
      turnHandling: {
        turnDetection: new inference.TurnDetector(),
        preemptiveGeneration: { enabled: true },
      },
    });
    await session.start({ agent: createAgent(context), room: ctx.room });
    await ctx.connect();
    const publish = async (message: { role: "assistant" | "user"; content: string }) => {
      await ctx.room.localParticipant?.publishData(
        new TextEncoder().encode(JSON.stringify(message)),
        { reliable: true },
      );
    };
    session.on(AgentSessionEventTypes.UserInputTranscribed, (event) => {
      if (!event.isFinal || !event.transcript.trim()) return;
      void publish({ role: "user", content: event.transcript.trim() });
    });
    session.on(AgentSessionEventTypes.ConversationItemAdded, (event) => {
      if ("role" in event.item && event.item.role === "assistant" && event.item.content) {
        const content = event.item.textContent?.trim() || "";
        if (content) void publish({ role: "assistant", content });
      }
    });
    await session
      .generateReply({
        instructions:
          "Immediately greet the candidate and ask the first tailored interview question. Do not wait for the candidate to speak first.",
      })
      .waitForPlayout();
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: "interview-helper",
  }),
);
