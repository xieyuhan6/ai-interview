import { AccessToken, AgentDispatchClient } from "livekit-server-sdk";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { ApiError, apiError } from "@/lib/helper-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ApiError(401, "Please sign in first.");
    if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET)
      throw new ApiError(503, "LiveKit is not configured on the server.");

    const body = await req.json();
    const room = typeof body.room === "string" ? body.room.trim() : "";
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(room))
      throw new ApiError(400, "Invalid LiveKit room name.");
    const context = {
      role: typeof body.role === "string" ? body.role.slice(0, 120) : "",
      level: typeof body.level === "string" ? body.level.slice(0, 40) : "",
      focus: typeof body.focus === "string" ? body.focus.slice(0, 40) : "",
      amount: typeof body.amount === "number" ? Math.min(Math.max(body.amount, 3), 10) : 3,
      job: typeof body.job === "string" ? body.job.slice(0, 8000) : "",
      resume: typeof body.resume === "string" ? body.resume.slice(0, 30000) : "",
    };

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity: `candidate-${user.id}`, ttl: "2h" },
    );
    token.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    await new AgentDispatchClient(
      process.env.LIVEKIT_URL.replace(/^wss:/, "https:"),
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
    ).createDispatch(room, process.env.LIVEKIT_AGENT_NAME || "interview-helper", {
      metadata: JSON.stringify(context),
    });
    return Response.json({
      token: await token.toJwt(),
      url: process.env.LIVEKIT_URL,
    });
  } catch (error) {
    return apiError(error);
  }
}
