"use client";
import Link from "next/link";

export default function JudgeDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-extrabold text-white mb-6">Judge Dashboard</h1>
      <p className="text-slate-300 mb-8 text-lg text-center max-w-xl">
        Welcome to the Judge Dashboard! Here you can review event submissions, score projects, and provide feedback to participants.
      </p>
      <Link
        href="/dashboard/judge/submissions"
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg shadow transition"
      >
        Go to Event Submissions
      </Link>
    </div>
  );
}
