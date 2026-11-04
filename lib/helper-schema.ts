import { z } from "zod";
export const messageSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string(),
  at: z.string(),
});
export const rubricNames = [
  "Technical Skills",
  "Communication",
  "Problem Solving",
  "Role Fit",
] as const;
export const feedbackSchema = z.object({
  categories: z
    .array(
      z.object({
        name: z.enum(rubricNames),
        score: z.number().int().min(0).max(100),
        evidence: z.string(),
        advice: z.string(),
      }),
    )
    .length(4)
    .refine((a) => new Set(a.map((x) => x.name)).size === 4),
  strengths: z.array(z.string()).min(1).max(5),
  improvements: z.array(z.string()).min(1).max(5),
  summary: z.string(),
});
export const resumeSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()),
  suggestions: z.array(
    z.object({
      section: z.string(),
      issue: z.string(),
      suggestion: z.string(),
    }),
  ),
  keywords: z.array(z.string()),
  revisedResume: z.string(),
});
export type Report = z.infer<typeof feedbackSchema> & { totalScore: number };
export type ResumeReport = z.infer<typeof resumeSchema>;
export type Session = {
  id: string;
  userId: string;
  role: string;
  level: string;
  focus: string;
  language: string;
  job: string;
  resume: string;
  amount: number;
  status: "active" | "completed";
  revision: number;
  createdAt: string;
  updatedAt: string;
  messages: z.infer<typeof messageSchema>[];
  feedback?: Report;
};
export type ResumeRecord = {
  id: string;
  role: string;
  job: string;
  createdAt: string;
  report: ResumeReport;
};
export const inputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    role: z.string().trim().min(2).max(120),
    level: z.enum(["Graduate", "Junior", "Mid-level", "Senior"]),
    focus: z.enum(["Mixed", "Technical", "Behavioral"]),
    language: z.literal("English"),
    amount: z.number().int().min(3).max(10),
    voice: z.boolean().optional(),
    job: z.string().max(8000).default(""),
    resume: z.string().max(30000).default(""),
  }),
  z.object({
    action: z.literal("answer"),
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
    answer: z.string().trim().min(1).max(6000),
    revision: z.number().int().nonnegative(),
    voice: z.literal(true).optional(),
  }),
  z.object({
    action: z.literal("voice-message"),
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
    role: z.enum(["assistant", "user"]),
    content: z.string().trim().min(1).max(6000),
  }),
  z.object({
    action: z.literal("finish"),
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
  }),
  z.object({
    action: z.literal("resume"),
    role: z.string().trim().min(2).max(120),
    job: z.string().max(8000).default(""),
    resume: z.string().trim().min(80).max(30000),
  }),
]);
export function scoreReport(report: z.infer<typeof feedbackSchema>): Report {
  return {
    ...report,
    totalScore: Math.round(
      report.categories.reduce((a, c) => a + c.score, 0) / 4,
    ),
  };
}
export function ownedSession(
  data: Session | undefined,
  uid: string,
): data is Session {
  return !!data && data.userId === uid;
}
