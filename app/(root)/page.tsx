import Image from "next/image";
import Link from "next/link";
import InterviewCard from "@/components/InterviewCard";
import RecentInterviews from "@/components/RecentInterviews";
import { getCurrentUser } from "@/lib/actions/auth.action";
export default async function Home() {
  const user = await getCurrentUser();
  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get interview-ready with AI</h2>
          <p className="text-lg">
            Practice real interview questions and improve your resume.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/interview"
              className="btn-primary inline-flex items-center max-sm:w-full justify-center"
            >
              Start an Interview
            </Link>
            <Link
              href="/resume"
              className="btn-secondary inline-flex items-center max-sm:w-full justify-center"
            >
              Improve Resume
            </Link>
          </div>
        </div>
        <Image
          src="/robot.png"
          alt="robot"
          width={400}
          height={400}
          className="max-sm:hidden"
          priority
        />
      </section>
      {user && (
        <section className="helper-section mt-8">
          <div className="helper-section-heading">
            <h2>Your interviews</h2>
            <Link href="/history">View all →</Link>
          </div>
          <RecentInterviews />
        </section>
      )}
      <section className="helper-section mt-8">
        <h2>Take an interview</h2>
        <div className="interviews-section">
          <InterviewCard
            role="Frontend Developer"
            type="Technical"
            techstack={["React", "TypeScript", "Next.js"]}
            href="/interview?role=Frontend%20Developer&focus=technical"
          />
          <InterviewCard
            role="Full Stack Developer"
            type="Mixed"
            techstack={["Node.js", "Express", "MongoDB"]}
            href="/interview?role=Full%20Stack%20Developer"
            cover="/covers/amazon.png"
          />
        </div>
      </section>
    </>
  );
}
