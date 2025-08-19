"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Submission {
  id: string;
  team: string;
  project: string;
  github: string;
  deploy: string;
  description: string;
}

export default function EventSubmissionsRedirect({ params }: { params: { eventId: string } }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate fetching submissions for the event
    setLoading(true);
    setTimeout(() => {
      // Replace this with real fetch logic
      if (params.eventId === "hackrx") {
        setSubmissions([
          {
            id: "1",
            team: "Team Alpha",
            project: "Smart Vision",
            github: "https://github.com/teamalpha/smartvision",
            deploy: "https://smartvision.app",
            description: "AI-powered vision system for the visually impaired."
          }
        ]);
      } else {
        setSubmissions([]);
      }
      setLoading(false);
    }, 500);
  }, [params.eventId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-8">Submissions for event: {params.eventId}</h1>
      {loading ? (
        <div className="text-lg text-slate-300">Loading...</div>
      ) : submissions.length === 0 ? (
        <div className="text-2xl text-slate-400 font-semibold">No submissions yet</div>
      ) : (
        <div className="w-full max-w-3xl space-y-6">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-slate-800/90 rounded-xl shadow-lg border border-slate-700 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:border-blue-500 transition-colors">
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mb-2">
                  <span className="text-lg font-semibold text-blue-300">{sub.team}</span>
                  <span className="text-md font-medium text-slate-200">{sub.project}</span>
                </div>
                <div className="flex flex-wrap gap-4 mb-2">
                  <a href={sub.github} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-medium">GitHub</a>
                  <a href={sub.deploy} target="_blank" rel="noopener noreferrer" className="text-green-400 underline font-medium">Demo</a>
                </div>
                <p className="text-slate-300 text-sm mb-2 max-w-xl">{sub.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
