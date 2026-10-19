"use client";

import { useState } from "react";

export default function Home() {
  const [isIdeaOpen, setIsIdeaOpen] = useState(false);
  const [ideaText, setIdeaText] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const roadmap = [
    {
      stage: "Now",
      title: "Current",
      description: "Core PersonalHub is live and actively evolving.",
    },
    {
      stage: "Next",
      title: "Notion-Like Feature",
      description:
        "Add rich block-style writing and organization for flexible notes/workspaces.",
    },
    {
      stage: "After That",
      title: "Language Learning Subapp",
      description:
        "Integrate learning flows and tools as a dedicated language module.",
    },
    {
      stage: "Then",
      title: "Community-Driven Ideas",
      description:
        "Users can submit product suggestions directly through Add Idea.",
    },
  ];

  const submitIdea = async () => {
    if (ideaText.trim().length < 5) {
      setSubmitMessage("Please add a longer idea (at least 5 characters).");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea: ideaText,
          email: senderEmail || undefined,
          page: "welcome-roadmap",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit your idea.");
      }

      setSubmitMessage("Your idea has been sent. Thank you.");
      setIdeaText("");
      setSenderEmail("");
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : "Failed to submit your idea."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-12">
      <main className="mx-auto max-w-4xl">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 text-center">
          Welcome to my Realm
        </h1>

        <p className="mt-4 text-center text-slate-600 text-lg">
          Product Roadmap
        </p>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="space-y-6">
            {roadmap.map((item, index) => (
              <article
                key={item.title}
                className="grid grid-cols-[120px_1fr] gap-4 items-start"
              >
                <div>
                  <span className="inline-flex rounded-full bg-slate-900 text-white text-xs px-3 py-1">
                    {item.stage}
                  </span>
                </div>

                <div className="relative pl-5">
                  <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-slate-700" />
                  {index < roadmap.length - 1 && (
                    <span className="absolute left-[3px] top-4 h-[calc(100%+20px)] w-px bg-slate-200" />
                  )}
                  <h2 className="text-xl font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-1 text-slate-600">{item.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-slate-600">
              Have a suggestion to develop? Press the button and send your idea.
            </p>
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
              onClick={() => {
                setIsIdeaOpen(true);
                setSubmitMessage("");
              }}
            >
              Add Idea
            </button>
          </div>
        </section>
      </main>

      {isIdeaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-semibold text-slate-900">Add Your Idea</h3>
            <p className="mt-1 text-sm text-slate-600">
              Your submission will be sent to the owner email through the backend.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Your Email (optional)
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(event) => setSenderEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Idea
                </label>
                <textarea
                  value={ideaText}
                  onChange={(event) => setIdeaText(event.target.value)}
                  placeholder="Describe your feature idea..."
                  rows={6}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                />
              </div>
            </div>

            {submitMessage && (
              <p className="mt-3 text-sm text-slate-700">{submitMessage}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700"
                onClick={() => setIsIdeaOpen(false)}
                disabled={isSubmitting}
              >
                Close
              </button>
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-5 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                onClick={submitIdea}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Idea"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
