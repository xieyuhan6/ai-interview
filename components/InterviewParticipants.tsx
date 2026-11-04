import Image from "next/image";
export default function InterviewParticipants({
  userName = "You",
}: {
  userName?: string;
}) {
  return (
    <div className="call-view">
      <div className="card-interviewer">
        <div className="avatar">
          <Image
            src="/ai-avatar.png"
            alt="AI interviewer"
            width={65}
            height={54}
            className="object-cover"
          />
        </div>
        <h3>AI interviewer</h3>
      </div>
      <div className="card-border">
        <div className="card-content">
          <Image
            src="/user-avatar.png"
            alt="Your avatar"
            width={540}
            height={540}
            className="rounded-full object-cover size-[120px]"
          />
          <h3>{userName}</h3>
        </div>
      </div>
    </div>
  );
}
