"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import InterviewParticipants from "@/components/InterviewParticipants";
import LiveKitVoiceInterview from "@/components/LiveKitVoiceInterview";
import { useRouter } from "next/navigation";
import {
  AudioLines,
  FileText,
  ArrowRight,
  Download,
} from "lucide-react";
import type {
  Session,
  ResumeRecord,
  ResumeReport,
  Report,
} from "@/lib/helper-schema";
async function api(path: string, body?: unknown) {
  const response = await fetch(path, {
    ...(body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    const detail =
      process.env.NODE_ENV === "development" && data.detail
        ? ` ${data.detail}`
        : "";
    throw new Error(
      `${data.error || "Request failed. Please try again."}${detail}`,
    );
  }
  return data;
}
function download(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function time(value: string) {
  return new Date(value).toLocaleString("en-US");
}
function Feedback({ report }: { report: Report }) {
  return (
    <section className="feedback">
      <div className="score-heading">
        <div>
          <div className="eyebrow">YOUR FEEDBACK</div>
          <h2>Your interview feedback</h2>
          <p>{report.summary}</p>
        </div>
        <div className="score-circle">
          {report.totalScore}
          <small>/ 100</small>
        </div>
      </div>
      <p className="muted">
        AI practice score · Four equally weighted categories · Based only on
        your answers
      </p>
      <div className="rubric-grid">
        {report.categories.map((c) => (
          <article className="panel" key={c.name}>
            <h3>
              {c.name}
              <span>{c.score}</span>
            </h3>
            <progress value={c.score} max={100} />
            <p>
              <b>Evidence: </b>
              {c.evidence}
            </p>
            <p>
              <b>Try next: </b>
              {c.advice}
            </p>
          </article>
        ))}
      </div>
      <div className="two-col">
        <div className="panel">
          <h3>Strengths</h3>
          <ul>
            {report.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>What to practice next</h3>
          <ul>
            {report.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
function ResumeOutput({
  report,
  setReport,
  onPractice,
}: {
  report: ResumeReport;
  setReport: (r: ResumeReport) => void;
  onPractice: () => void;
}) {
  return (
    <div className="stack">
      <div className="panel">
        <div className="eyebrow">RESUME REVIEW</div>
        <div className="score-heading">
          <div>
            <h2>Make your experience stand out</h2>
            <p>{report.summary}</p>
          </div>
          <div className="score-circle" aria-label={`Resume match score: ${report.matchScore} out of 100`}>
            {report.matchScore}
            <small>/ 100</small>
          </div>
        </div>
        <p className="muted">
          Resume match score based on the target role and job description.
        </p>
        <h3>Keep these strengths</h3>
        <ul>
          {report.strengths.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
      <div className="panel">
        <h3>Suggested improvements</h3>
        {report.suggestions.map((s, i) => (
          <div className="suggestion" key={i}>
            <b>{s.section}</b>
            <p>{s.issue}</p>
            <p className="accent-text">{s.suggestion}</p>
          </div>
        ))}
        <h3>Job keywords</h3>
        <div className="tags">
          {report.keywords.map((s, i) => (
            <span key={i}>{s}</span>
          ))}
        </div>
        <p className="muted">
          Only include these keywords when they reflect your actual experience.
        </p>
      </div>
      <div className="panel">
        <h3>Your revised resume</h3>
        <p>
          Check the facts and fill in [To complete] before using this draft.
          Edits below apply to this export and interview; history keeps the
          original AI draft.
        </p>
        <textarea
          aria-label="Revised resume"
          rows={18}
          value={report.revisedResume}
          onChange={(e) =>
            setReport({ ...report, revisedResume: e.target.value })
          }
        />
        <div className="actions">
          <button
            className="secondary"
            onClick={() =>
              download("improved-resume.txt", report.revisedResume)
            }
          >
            <Download size={16} /> Download draft
          </button>
          <button className="primary" onClick={onPractice}>
            Practice with this resume <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
export function InterviewSetup({
  initialRole = "",
  initialFocus = "Mixed",
  userName = "You",
}: {
  initialRole?: string;
  initialFocus?: string;
  userName?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [draft, setDraft] = useState({
    role: initialRole,
    job: "",
    resume: "",
  });
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("interview-draft");
      if (raw) {
        // Hydrate browser-only, per-tab resume transfer after SSR.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft(JSON.parse(raw));
        sessionStorage.removeItem("interview-draft");
      }
    } catch {}
  }, []);
  return (
    <>
      <PageTitle
        kicker="PRACTICE ROOM"
        title="Interview Generation"
        text="Choose a target role for questions tailored to your experience. Answers are saved after each successful submission, so you can return and continue."
      />
      <InterviewParticipants userName={userName} />
      <div className="workspace-grid">
        <form
          className="panel stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const f = new FormData(e.currentTarget);
            try {
              const s: Session = await api("/api/helper", {
                action: "start",
                ...draft,
                level: f.get("level"),
                focus: f.get("focus"),
                language: f.get("language"),
                amount: 10,
                voice: true,
              });
              router.push(`/interview/${s.id}`);
            } catch (e) {
              setError((e as Error).message);
              setBusy(false);
            }
          }}
        >
          <h2>Set up your interview</h2>
          <label>
            Target role
            <input
              required
              minLength={2}
              maxLength={120}
              placeholder="e.g. Frontend Developer"
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            />
          </label>
          <div className="two-col">
            <label>
              Experience level
              <select name="level">
                <option>Graduate</option>
                <option>Junior</option>
                <option>Mid-level</option>
                <option>Senior</option>
              </select>
            </label>
            <label>
              Interview focus
              <select name="focus" defaultValue={initialFocus}>
                <option>Mixed</option>
                <option>Technical</option>
                <option>Behavioral</option>
              </select>
            </label>
            <label>
              Interview language
              <select name="language">
                <option>English</option>
              </select>
            </label>
          </div>
          <label>
            Job description (optional)
            <textarea
              rows={4}
              maxLength={8000}
              placeholder="Paste a job description to tailor the questions to your target role"
              value={draft.job}
              onChange={(e) => setDraft({ ...draft, job: e.target.value })}
            />
          </label>
          <label>
            Resume content (optional)
            <textarea
              rows={6}
              maxLength={30000}
              placeholder="You can also bring a revised draft from Resume Helper"
              value={draft.resume}
              onChange={(e) => setDraft({ ...draft, resume: e.target.value })}
            />
          </label>
          <ErrorMessage error={error} />
          <button className="primary" disabled={busy}>
            {busy ? "Preparing your first question…" : "Enter interview →"}
          </button>
        </form>
        <aside className="panel tip-panel">
          <AudioLines size={32} />
          <h3>A place to practice.</h3>
          <p>
            AI asks one question at a time and follows up based on your answers.
          </p>
          <ol>
            <li>Type your answer or use browser voice input</li>
            <li>Your conversation is saved after each successful submission</li>
            <li>
              Finish to receive four category scores and actionable advice
            </li>
          </ol>
          <p className="muted">
            Questions can be read aloud. Voice features depend on your browser;
            text input is always available. Your resume and answers are sent to
            the configured AI service for analysis.
          </p>
        </aside>
      </div>
    </>
  );
}
export function InterviewRoom({
  id,
  userName = "You",
}: {
  id: string;
  userName?: string;
}) {
  const [session, setSession] = useState<Session | null>(null),
  [error, setError] = useState("");
  useEffect(() => {
  api(`/api/helper?id=${encodeURIComponent(id)}`)
    .then(setSession)
    .catch((e) => setError(e.message));
  return () => {
    window.speechSynthesis?.cancel();
  };
  }, [id]);
  async function finishInterview() {
  if (!session) return;
  setError("");
  try {
    const s = await api("/api/helper", {
      action: "finish",
      id,
    });
    setSession(s);
  } catch (e) {
    setError((e as Error).message);
  }
  }
  if (!session)
    return (
      <div className="panel">
        <ErrorMessage error={error} />
        {error ? (
          <button
            className="secondary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        ) : (
          "Loading your interview…"
        )}
      </div>
    );
  return (
    <>
      <PageTitle
        kicker="INTERVIEW SESSION"
        title={session.role}
        text={`${session.level} · ${session.focus} · ${session.status === "completed" ? "Completed" : "In progress"}`}
      />
      <InterviewParticipants userName={userName} />
      <div className="session-toolbar">
        <Link href="/history">← My interview history</Link>
        <button
          className="secondary"
          onClick={() =>
            download(
              `interview-transcript-${id}.txt`,
              `${session.role}
${time(session.createdAt)}

` +
                session.messages
                  .map(
                    (
                      m,
                    ) => `${m.role === "assistant" ? "AI interviewer" : "Me"} · ${time(m.at)}
${m.content}`,
                  )
                  .join("\n\n") +
                (session.feedback
                  ? `

Feedback report
${JSON.stringify(session.feedback, null, 2)}`
                  : ""),
            )
          }
        >
          <Download size={16} /> Export transcript and feedback
        </button>
      </div>
      <LiveKitVoiceInterview
        roomName={`interview-${id}`}
        context={{
          role: session.role,
          level: session.level,
          focus: session.focus,
          job: session.job,
          resume: session.resume,
          amount: session.amount,
        }}
        onMessage={(message) => {
          void (async () => {
            try {
              const next = await api("/api/helper", {
                action: "voice-message",
                id,
                ...message,
              });
              setSession(next);
            } catch (cause) {
              setError((cause as Error).message);
            }
          })();
        }}
        onConnectionChange={() => undefined}
        onEnd={() => {
          void finishInterview();
        }}
      />
      <ErrorMessage error={error} />
      {session.feedback && <Feedback report={session.feedback} />}
    </>
  );
}
export function ResumeWorkspace() {
  const router = useRouter();
  const [role, setRole] = useState(""),
    [job, setJob] = useState(""),
    [resume, setResume] = useState(""),
    [report, setReport] = useState<ResumeReport | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <PageTitle
        kicker="RESUME STUDIO"
        title="Resume Helper"
        text="Identify strengths and gaps in your resume, with improvements tailored to your target role."
      />
      <div className="workspace-grid">
        <form
          className="panel stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const record: ResumeRecord = await api("/api/helper", {
                action: "resume",
                role,
                job,
                resume,
              });
              setReport(record.report);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>Start with your target role</h2>
          <label>
            Target role
            <input
              required
              minLength={2}
              maxLength={120}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Product Manager"
            />
          </label>
          <label>
            Job description (optional)
            <textarea
              rows={4}
              maxLength={8000}
              value={job}
              onChange={(e) => setJob(e.target.value)}
              placeholder="Paste the job requirements for more specific recommendations"
            />
          </label>
          <label className="upload">
            <FileText size={28} />
            <strong>Upload a PDF / TXT resume</strong>
            <span>Up to 5 MB · First 20 pages of text-based PDFs</span>
            <input
              type="file"
              accept=".pdf,.txt"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  setError("Files must be 5 MB or smaller");
                  return;
                }
                setBusy(true);
                setError("");
                try {
                  const f = new FormData();
                  f.set("file", file);
                  const response = await fetch("/api/resume/extract", {
                    method: "POST",
                    body: f,
                  });
                  const data = await response.json();
                  if (!response.ok) {
                    const detail =
                      process.env.NODE_ENV === "development" && data.detail
                        ? ` ${data.detail}`
                        : "";
                    throw new Error(`${data.error || "Upload failed."}${detail}`);
                  }
                  setResume(data.text);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          <label>
            Resume content (paste or edit)
            <textarea
              rows={12}
              required
              minLength={80}
              maxLength={30000}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="At least 80 characters. Only extracted text and analysis are saved, not the original file."
            />
          </label>
          <ErrorMessage error={error} />
          <button className="primary" disabled={busy}>
            {busy ? "Processing. Please wait…" : "Analyze and improve resume →"}
          </button>
        </form>
        <aside className="panel tip-panel">
          <FileText size={32} />
          <h3>True to your experience.</h3>
          <p>
            Review clarity, skills presentation, experience descriptions, and
            fit for the role.
          </p>
          <p>
            AI preserves your facts and marks missing details as [To complete]
            for you to verify and fill in.
          </p>
          <p>
            Export your revised draft or bring it into a practice interview.
          </p>
          <Link href="/history">View previous resume reviews →</Link>
        </aside>
      </div>
      {report && (
        <ResumeOutput
          report={report}
          setReport={setReport}
          onPractice={() => {
            sessionStorage.setItem(
              "interview-draft",
              JSON.stringify({ role, job, resume: report.revisedResume }),
            );
            router.push("/interview");
          }}
        />
      )}
    </>
  );
}
type SessionSummary = Pick<
  Session,
  "id" | "role" | "createdAt" | "status" | "feedback" | "level" | "amount"
>;
export function HistoryWorkspace() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]),
    [resumes, setResumes] = useState<ResumeRecord[]>([]),
    [selected, setSelected] = useState<ResumeRecord | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState("interviews");
  useEffect(() => {
    Promise.all([api("/api/helper"), api("/api/helper?kind=resumes")])
      .then(([s, r]) => {
        setSessions(s);
        setResumes(r);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const completed = sessions.filter((s) => s.feedback);
  const average = completed.length
    ? Math.round(
        completed.reduce((a, s) => a + s.feedback!.totalScore, 0) /
          completed.length,
      )
    : null;
  return (
    <>
      <PageTitle
        kicker="YOUR PROGRESS"
        title="Your records"
        text="Review transcripts, understand your scores, and apply the feedback next time. Shows your latest 100 interviews and 100 resume reviews."
      />
      <div className="stats">
        <div>
          <span>Interview sessions</span>
          <strong>
            {sessions.length}
            <small>sessions</small>
          </strong>
        </div>
        <div>
          <span>Scored sessions</span>
          <strong>
            {completed.length}
            <small>sessions</small>
          </strong>
        </div>
        <div>
          <span>Average score</span>
          <strong>
            {average ?? "—"}
            <small>/ 100</small>
          </strong>
        </div>
        <div>
          <span>Resume reviews</span>
          <strong>
            {resumes.length}
            <small>reviews</small>
          </strong>
        </div>
      </div>
      <div className="tabs">
        <button
          className={tab === "interviews" ? "active" : ""}
          onClick={() => setTab("interviews")}
        >
          Interview history
        </button>
        <button
          className={tab === "resumes" ? "active" : ""}
          onClick={() => setTab("resumes")}
        >
          Resume reviews
        </button>
      </div>
      <ErrorMessage error={error} />
      {loading ? (
        <div className="empty">Loading your records…</div>
      ) : error ? (
        <button className="secondary" onClick={() => window.location.reload()}>
          Reload
        </button>
      ) : tab === "interviews" ? (
        sessions.length ? (
          <div className="history-list">
            {sessions.map((s) => (
              <Link
                className="history-row"
                href={`/interview/${s.id}`}
                key={s.id}
              >
                <span className="feature-icon violet">
                  <AudioLines />
                </span>
                <div>
                  <h3>{s.role}</h3>
                  <p>
                    {time(s.createdAt)} · {s.level} · {s.amount} questions
                  </p>
                </div>
                <span className="history-score">
                  {s.feedback
                    ? `${s.feedback.totalScore} / 100`
                    : "In progress"}
                </span>
                <span>
                  {s.status === "completed"
                    ? "View feedback"
                    : "Continue interview"}{" "}
                  →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            <AudioLines />
            <h3>Your first interview starts here.</h3>
            <p>
              Your transcripts and feedback will appear here after you practice.
            </p>
            <Link className="primary" href="/interview">
              Start an interview →
            </Link>
          </div>
        )
      ) : (
        <>
          {resumes.length ? (
            <div className="history-list">
              {resumes.map((r) => (
                <button
                  className="history-row"
                  key={r.id}
                  onClick={() => setSelected(r)}
                >
                  <span className="feature-icon peach">
                    <FileText />
                  </span>
                  <div>
                    <h3>{r.role}</h3>
                    <p>{time(r.createdAt)}</p>
                  </div>
                  <span>View review →</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">
              <FileText />
              <h3>Start with a stronger resume.</h3>
              <Link className="primary" href="/resume">
                Improve resume →
              </Link>
            </div>
          )}
          {selected && (
            <ResumeOutput
              report={selected.report}
              setReport={(report) => setSelected({ ...selected, report })}
              onPractice={() => {
                sessionStorage.setItem(
                  "interview-draft",
                  JSON.stringify({
                    role: selected.role,
                    job: selected.job,
                    resume: selected.report.revisedResume,
                  }),
                );
                router.push("/interview");
              }}
            />
          )}
        </>
      )}
    </>
  );
}
function ErrorMessage({ error }: { error: string }) {
  return error ? (
    <p className="error" role="alert">
      {error}
    </p>
  ) : null;
}
function PageTitle({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text: string;
}) {
  return (
    <section className="page-title">
      <span className="sr-only">{kicker}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  );
}
