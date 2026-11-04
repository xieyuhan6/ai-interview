// Isolated browser test harness, never included in Next.js application routes.
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  InterviewSetup,
  InterviewRoom,
  ResumeWorkspace,
  HistoryWorkspace,
} from "../../components/HelperWorkspace";
import "../../app/globals.css";
function App() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const on = () => setPath(location.pathname);
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  return (
    <div className="root-layout">
      <main className="helper-content">
        {path === "/resume" ? (
          <ResumeWorkspace />
        ) : path === "/history" ? (
          <HistoryWorkspace />
        ) : path.startsWith("/interview/") ? (
          <InterviewRoom id={path.split("/")[2]} />
        ) : (
          <InterviewSetup />
        )}
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
