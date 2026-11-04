"use client";
import { useEffect, useState } from "react";
import InterviewCard from "@/components/InterviewCard";
import type { Session } from "@/lib/helper-schema";
export default function RecentInterviews() {
  const [items, setItems] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch("/api/helper", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <p>Loading your interviews…</p>;
  if (error)
    return (
      <p role="alert">
        Unable to load interviews. Please try again from My Records.
      </p>
    );
  if (!items.length) return <p>You haven&apos;t taken any interviews yet.</p>;
  return (
    <div className="interviews-section">
      {items.slice(0, 3).map((s) => (
        <InterviewCard
          key={s.id}
          role={s.role}
          type={s.status === "completed" ? "Completed" : "In progress"}
          href={`/interview/${s.id}`}
          createdAt={s.createdAt}
          score={s.feedback?.totalScore}
          summary={s.feedback?.summary || "Continue your saved interview."}
        />
      ))}
    </div>
  );
}
