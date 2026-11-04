import Image from "next/image";
import Link from "next/link";
export default function InterviewCard({
  role,
  type,
  techstack = [],
  href,
  createdAt,
  score,
  summary,
  cover = "/covers/adobe.png",
}: {
  role: string;
  type: string;
  techstack?: string[];
  href: string;
  createdAt?: string;
  score?: number;
  summary?: string;
  cover?: string;
}) {
  return (
    <div className="card-border helper-interview-card">
      <div className="card-interview">
        <span className="helper-type">{type}</span>
        <Image
          src={cover}
          alt="Interview cover"
          width={90}
          height={90}
          className="rounded-full object-cover size-[90px]"
        />
        <h3 className="mt-5 capitalize">{role} Interview</h3>
        <div className="flex flex-row flex-wrap gap-5 mt-3">
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" alt="" width={22} height={22} />
            <p>
              {createdAt
                ? new Date(createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })
                : "Practice anytime"}
            </p>
          </div>
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" alt="" width={22} height={22} />
            <p>{score ?? "---"}/100</p>
          </div>
        </div>
        <p className="line-clamp-2 mt-5">
          {summary || "You haven't taken this interview yet."}
        </p>
        <div className="helper-card-footer">
          <div className="helper-tech">
            {techstack.slice(0, 3).map((t) => (
              <span key={t} title={t}>
                {t.slice(0, 2)}
              </span>
            ))}
          </div>
          <Link href={href} className="btn-primary inline-flex items-center">
            {score !== undefined
              ? "View feedback"
              : createdAt
                ? "Continue interview"
                : "Take interview"}
          </Link>
        </div>
      </div>
    </div>
  );
}
