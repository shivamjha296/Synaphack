"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// Dummy data for wireframe/demo
interface Submission {
  id: string;
  team: string;
  project: string;
  github: string;
  deploy: string;
  description: string;
}

const submissions: Submission[] = [
  {
    id: 'a',
    team: 'Team Alpha',
    project: 'Smart Vision',
    github: 'https://github.com/teamalpha/smartvision',
    deploy: 'https://smartvision.app',
    description: 'AI-powered vision system for the visually impaired.'
  },
  {
    id: 'b',
    team: 'Team Beta',
    project: 'VoiceBot',
    github: 'https://github.com/teambeta/voicebot',
    deploy: 'https://voicebot.app',
    description: 'Conversational AI for customer support.'
  },
];


const EventSubmissionsPage = () => {
  const [scores, setScores] = useState<Record<string, string | number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const handleScoreChange = (id: string, value: string) => {
    setScores({ ...scores, [id]: value });
  };

  const handleFeedbackChange = (id: string, value: string) => {
    setFeedbacks({ ...feedbacks, [id]: value });
  };
  const handleSubmit = () => {
    // Submit scores and feedbacks to backend
    alert('Scores and feedback submitted!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 py-10 px-2 md:px-0">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard/judge" className="text-blue-400 hover:underline text-lg mb-6 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-4xl font-extrabold text-white mb-8 mt-2 tracking-tight drop-shadow">Event Submissions</h1>

        <div className="space-y-6">
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
              <div className="flex flex-col gap-2 min-w-[220px]">
                <label className="text-slate-400 text-sm font-medium">Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scores[sub.id] || ''}
                  onChange={(e) => handleScoreChange(sub.id, e.target.value)}
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Enter score"
                />
                <label className="text-slate-400 text-sm font-medium mt-2">Feedback</label>
                <textarea
                  value={feedbacks[sub.id] || ''}
                  onChange={(e) => handleFeedbackChange(sub.id, e.target.value)}
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Write feedback..."
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          className="mt-10 px-8 py-3 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold rounded-lg shadow transition"
          onClick={handleSubmit}
        >
          Submit Scores/Feedback
        </button>
      </div>
    </div>
  );
};

export default EventSubmissionsPage;
