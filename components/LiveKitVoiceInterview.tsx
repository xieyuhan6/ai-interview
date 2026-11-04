"use client";

import { useEffect, useRef, useState } from "react";
import { ParticipantKind, Room, RoomEvent, Track } from "livekit-client";

export default function LiveKitVoiceInterview({
  roomName,
  context,
  onMessage,
  onConnectionChange,
  onEnd,
}: {
  roomName: string;
  context?: {
    role: string;
    level: string;
    focus: string;
    job: string;
    resume: string;
    amount: number;
  };
  onMessage?: (message: { role: "assistant" | "user"; content: string }) => void;
  onConnectionChange?: (connected: boolean) => void;
  onEnd?: () => void;
}) {
  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const [connected, setConnected] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      setAgentConnected(false);
    };
  }, []);

  async function toggleVoice() {
    if (connected) {
      await roomRef.current?.disconnect();
      roomRef.current = null;
      setConnected(false);
      setAgentConnected(false);
      onConnectionChange?.(false);
      onEnd?.();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomName, ...context }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start voice interview.");
      const room = new Room();
      room.on(RoomEvent.DataReceived, (payload) => {
        try {
          const message = JSON.parse(new TextDecoder().decode(payload));
          if (
            (message.role === "assistant" || message.role === "user") &&
            typeof message.content === "string"
          )
            onMessage?.(message);
        } catch {
          setError("Received an invalid voice transcript from the AI interviewer.");
        }
      });
      const updateAgent = () =>
        setAgentConnected(
          [...room.remoteParticipants.values()].some(
            (participant) => participant.kind === ParticipantKind.AGENT,
          ),
        );
      room.on(RoomEvent.ParticipantConnected, updateAgent);
      room.on(RoomEvent.ParticipantDisconnected, updateAgent);
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const element = track.attach();
          element.autoplay = true;
          audioRef.current?.appendChild(element);
        }
      });
      await room.connect(data.url, data.token);
      updateAgent();
      await room.localParticipant.setMicrophoneEnabled(true);
      roomRef.current = room;
      setConnected(true);
      onConnectionChange?.(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start voice interview.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel voice-panel">
      <div>
        <h3>Voice mock interview</h3>
        <p className="muted">
          Join a LiveKit room and speak with the AI interviewer.
        </p>
      </div>
      <button className="secondary" disabled={busy} onClick={toggleVoice}>
        {busy ? "Connecting…" : connected ? "End interview" : "Start interview"}
      </button>
      {error && <p className="error">{error}</p>}
      {connected && (
        <p className="muted">
          {agentConnected
            ? "AI interviewer connected. Speak naturally."
            : "Microphone on. Waiting for the AI interviewer to join…"}
        </p>
      )}
      <div ref={audioRef} hidden />
    </div>
  );
}
