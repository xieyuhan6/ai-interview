import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  user: { id: "alice", name: "Alice", email: "alice@example.com" } as {
    id: string;
    name: string;
    email: string;
  } | null,
  counter: 0,
  queue: Promise.resolve() as Promise<unknown>,
}));
vi.mock("@/firebase/admin", () => {
  const doc = (key: string) => ({
    key,
    id: key.split("/")[1],
    get: async () => ({
      exists: state.docs.has(key),
      data: () => structuredClone(state.docs.get(key)),
    }),
    set: async (data: Record<string, unknown>) => {
      state.docs.set(key, structuredClone(data));
    },
  });
  return {
    getAdmin: () => ({
      db: {
        collection: (name: string) => ({
          doc: (id: string) => doc(`${name}/${id}`),
          add: async (data: Record<string, unknown>) => {
            const ref = doc(`${name}/${++state.counter}`);
            await ref.set(data);
            return ref;
          },
          where: (_field: string, _op: string, uid: string) => ({
            orderBy: () => ({
              limit: () => ({
                get: async () => ({
                  docs: [...state.docs.entries()]
                    .filter(
                      ([key, d]) =>
                        key.startsWith(name + "/") && d.userId === uid,
                    )
                    .map(([key, data]) => ({
                      id: key.split("/")[1],
                      data: () => data,
                    })),
                }),
              }),
            }),
          }),
        }),
        runTransaction: (fn: (tx: unknown) => unknown) => {
          const result = state.queue.then(() =>
            fn({
              get: (ref: ReturnType<typeof doc>) => ref.get(),
              set: (
                ref: ReturnType<typeof doc>,
                data: Record<string, unknown>,
              ) => ref.set(data),
            }),
          );
          state.queue = result.catch(() => {});
          return result;
        },
      },
    }),
  };
});
vi.mock("@/lib/actions/auth.action", () => ({
  getCurrentUser: async () => state.user,
}));
vi.mock("@ai-sdk/google", () => ({ google: () => "mock-model" }));
vi.mock("ai", () => ({
  generateText: vi.fn(async () => ({
    text: "Describe a recent project and your responsibilities.",
  })),
  generateObject: vi.fn(),
}));
import { generateText, generateObject } from "ai";
import { perform } from "@/lib/helper-server";
import { feedbackSchema, inputSchema, scoreReport } from "@/lib/helper-schema";
import { GET, POST } from "@/app/api/helper/route";
import { GET as legacyGet } from "@/app/api/vapi/transcript/route";
const start = {
  action: "start",
  role: "Frontend Developer",
  level: "Mid-level",
  focus: "Mixed",
  language: "English",
  amount: 3,
  job: "",
  resume: "",
};
const feedback = {
  categories: [
    "Technical Skills",
    "Communication",
    "Problem Solving",
    "Role Fit",
  ].map((name, i) => ({
    name,
    score: 70 + i * 5,
    evidence: "The candidate described their project",
    advice: "Add specific outcomes",
  })),
  strengths: ["Clear structure"],
  improvements: ["Add outcomes"],
  summary: "Continue interview",
};
beforeEach(() => {
  state.docs.clear();
  state.counter = 0;
  state.queue = Promise.resolve();
  state.user = { id: "alice", name: "Alice", email: "alice@example.com" };
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-only";
  vi.clearAllMocks();
});
describe("session persistence and scoring", () => {
  it("persists all turns and feedback; completing again is idempotent", async () => {
    const s = await perform("alice", start);
    expect(s).toMatchObject({ userId: "alice", status: "active", revision: 0 });
    for (let revision = 0; revision < 3; revision++)
      await perform("alice", {
        action: "answer",
        id: s.id,
        answer: `This is answer ${revision + 1}`,
        revision,
      });
    const saved = state.docs.get(`sessions/${s.id}`)!;
    expect(saved.messages).toHaveLength(6);
    expect(generateText).toHaveBeenCalledTimes(3);
    vi.mocked(generateObject).mockResolvedValue({ object: feedback } as never);
    const done = await perform("alice", { action: "finish", id: s.id });
    expect(done).toMatchObject({
      status: "completed",
      feedback: { totalScore: 78 },
    });
    await perform("alice", { action: "finish", id: s.id });
    expect(generateObject).toHaveBeenCalledTimes(1);
    await expect(
      perform("alice", {
        action: "answer",
        id: s.id,
        answer: "extra",
        revision: 3,
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("rejects cross-user reads, writes, and scoring", async () => {
    const s = await perform("alice", start);
    await expect(
      perform("bob", {
        action: "answer",
        id: s.id,
        answer: "hijack",
        revision: 0,
      }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      perform("bob", { action: "finish", id: s.id }),
    ).rejects.toMatchObject({ status: 404 });
    state.user = { id: "bob", name: "Bob", email: "bob@example.com" };
    expect(
      (await GET(new Request(`http://localhost/api/helper?id=${s.id}`))).status,
    ).toBe(404);
    expect(
      await (await GET(new Request("http://localhost/api/helper"))).json(),
    ).toEqual([]);
  });
  it("rejects conflicting concurrent answers without losing or duplicating turns", async () => {
    const s = await perform("alice", start);
    const results = await Promise.allSettled(
      [1, 2].map((n) =>
        perform("alice", {
          action: "answer",
          id: s.id,
          answer: `answer ${n}`,
          revision: 0,
        }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(state.docs.get(`sessions/${s.id}`)?.messages).toHaveLength(3);
  });
  it("preserves saved transcript if scoring fails and allows retry", async () => {
    const s = await perform("alice", start);
    await perform("alice", {
      action: "answer",
      id: s.id,
      answer: "An answer based on actual experience",
      revision: 0,
    });
    vi.mocked(generateObject).mockRejectedValueOnce(
      new Error("Provider unavailable"),
    );
    await expect(
      perform("alice", { action: "finish", id: s.id }),
    ).rejects.toThrow("Provider unavailable");
    expect(state.docs.get(`sessions/${s.id}`)).toMatchObject({
      status: "active",
      revision: 1,
    });
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: feedback,
    } as never);
    await expect(
      perform("alice", { action: "finish", id: s.id }),
    ).resolves.toMatchObject({ status: "completed" });
  });
  it("refuses empty-session scores and invalid input", async () => {
    const s = await perform("alice", start);
    await expect(
      perform("alice", { action: "finish", id: s.id }),
    ).rejects.toMatchObject({ status: 400 });
    expect(inputSchema.safeParse({ ...start, amount: 500 }).success).toBe(
      false,
    );
    expect(
      inputSchema.safeParse({
        action: "answer",
        id: "../../other",
        answer: "test",
        revision: 0,
      }).success,
    ).toBe(false);
    expect(
      inputSchema.safeParse({
        action: "answer",
        id: "one",
        answer: " ",
        revision: 0,
      }).success,
    ).toBe(false);
  });
});
describe("routes and model boundaries", () => {
  it("requires a session and same-origin mutation, retires shared legacy transcript", async () => {
    state.user = null;
    expect((await GET(new Request("http://localhost/api/helper"))).status).toBe(
      401,
    );
    expect(
      (
        await POST(
          new Request("http://localhost/api/helper", {
            method: "POST",
            headers: { origin: "http://localhost" },
            body: JSON.stringify(start),
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await POST(
          new Request("http://localhost/api/helper", {
            method: "POST",
            headers: { origin: "https://attacker.example" },
            body: JSON.stringify(start),
          }),
        )
      ).status,
    ).toBe(403);
    expect(legacyGet().status).toBe(410);
  });
  it("handles malformed input without exposing internals", async () => {
    expect(
      (
        await POST(
          new Request("http://localhost/api/helper", {
            method: "POST",
            headers: { origin: "http://localhost" },
            body: "{",
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("enforces daily usage quota", async () => {
    state.docs.set(`usage/alice_${new Date().toISOString().slice(0, 10)}`, {
      count: 100,
    });
    await expect(perform("alice", start)).rejects.toMatchObject({
      status: 429,
    });
    expect(generateText).not.toHaveBeenCalled();
  });
  it("requires distinct scoring categories and computes equal-weight average", () => {
    const valid = feedbackSchema.parse(feedback);
    expect(scoreReport(valid).totalScore).toBe(78);
    expect(
      feedbackSchema.safeParse({
        ...feedback,
        categories: Array(4).fill(feedback.categories[0]),
      }).success,
    ).toBe(false);
  });
  it("saves resume source, job context and revision under authenticated user", async () => {
    const report = {
      summary: "The wording could be more concise",
      strengths: ["Authentic experience"],
      suggestions: [],
      keywords: ["React"],
      revisedResume: "Actual experience, outcomes [To complete]",
    };
    vi.mocked(generateObject).mockResolvedValue({ object: report } as never);
    const result = await perform("alice", {
      action: "resume",
      role: "Frontend Developer",
      job: "React",
      resume: "Actual resume content".repeat(30),
    });
    expect(state.docs.get(`resumes/${result.id}`)).toMatchObject({
      userId: "alice",
      report,
      job: "React",
    });
  });
});

import { POST as extract } from "@/app/api/resume/extract/route";
function upload(file: File) {
  const form = new FormData();
  form.set("file", file);
  return new Request("http://localhost/api/resume/extract", {
    method: "POST",
    headers: { origin: "http://localhost" },
    body: form,
  });
}
describe("resume uploads", () => {
  it("extracts UTF-8 TXT and rejects scans/unsupported files", async () => {
    const text =
      "Candidate resume: frontend developer, React, TypeScript, project delivery. ".repeat(
        3,
      );
    const response = await extract(upload(new File([text], "resume.txt")));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ text });
    expect(
      (await extract(upload(new File(["short"], "resume.txt")))).status,
    ).toBe(400);
    expect((await extract(upload(new File([text], "resume.exe")))).status).toBe(
      400,
    );
    expect((await extract(upload(new File([text], "fake.pdf")))).status).toBe(
      400,
    );
  });
  it("rejects unauthenticated and oversized uploads", async () => {
    expect(
      (
        await extract(
          upload(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.txt")),
        )
      ).status,
    ).toBe(400);
    state.user = null;
    expect(
      (await extract(upload(new File(["text"], "resume.txt")))).status,
    ).toBe(401);
  });
});

it("extracts text from a real one-page PDF", async () => {
  const text =
    "Experienced frontend developer working with React and TypeScript. Delivered accessible components and tested user-facing workflows.";
  const stream = `BT /F1 12 Tf 40 700 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1200 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const check = await upload(new File([pdf], "resume.pdf")).formData();
  expect(await (check.get("file") as File).text()).toBe(pdf);
  const response = await extract(
    upload(new File([pdf], "resume.pdf", { type: "application/pdf" })),
  );
  expect(response.status).toBe(200);
  expect((await response.json()).text).toContain(text);
});
