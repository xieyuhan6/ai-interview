import { getAdmin } from "@/firebase/admin";
import {
  apiError,
  ApiError,
  perform,
  requireUser,
  sameOrigin,
} from "@/lib/helper-server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const user = await requireUser();
    const text = await req.text();
    if (text.length > 65000) throw new ApiError(413, "Input is too long.");
    return Response.json(await perform(user.id, JSON.parse(text)));
  } catch (e) {
    if (e instanceof SyntaxError)
      return Response.json({ error: "Invalid JSON." }, { status: 400 });
    return apiError(e);
  }
}
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { db } = getAdmin();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (id) {
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id))
        throw new ApiError(400, "Invalid record ID.");
      const doc = await db.collection("sessions").doc(id).get();
      if (!doc.exists || doc.data()?.userId !== user.id)
        throw new ApiError(404, "Interview not found.");
      return Response.json(
        { ...doc.data(), id: doc.id },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const kind =
      url.searchParams.get("kind") === "resumes" ? "resumes" : "sessions";
    const page = await db
      .collection(kind)
      .where("userId", "==", user.id)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    return Response.json(
      page.docs.map((d) =>
        kind === "sessions"
          ? {
              id: d.id,
              role: d.data().role,
              createdAt: d.data().createdAt,
              status: d.data().status,
              feedback: d.data().feedback || null,
              level: d.data().level,
              amount: d.data().amount,
            }
          : {
              id: d.id,
              role: d.data().role,
              job: d.data().job,
              createdAt: d.data().createdAt,
              report: d.data().report,
            },
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
