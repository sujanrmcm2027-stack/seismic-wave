import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { SectionLabel } from "@/components/site/SectionLabel";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { QUESTIONS } from "@/data/quiz";
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Download } from "lucide-react";
import { downloadAssessmentPdf } from "@/lib/pdf/assessmentPdf";
import { preloadJsPdf } from "@/lib/pdf/preload";

export const Route = createFileRoute("/test-yourself")({
  head: () => ({
    meta: [
      { title: "Earthquake Preparedness Assessment: Nepal Seismic" },
      {
        name: "description",
        content:
          "20-question Nepal-specific earthquake preparedness assessment with personalised recommendations.",
      },
    ],
  }),
  component: Quiz,
});

// Google Apps Script Web App URL that appends each result to a Google Sheet in
// your Drive. Deploy google-apps-script/quiz-to-drive.gs (Deploy ▸ Web app ▸
// Anyone) and set VITE_QUIZ_WEBHOOK_URL to its /exec URL in .env.local.
const QUIZ_WEBHOOK_URL = import.meta.env.VITE_QUIZ_WEBHOOK_URL ?? "";

function Quiz() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const q = QUESTIONS[i];
  const score = answers.reduce((s, a, idx) => s + (a === QUESTIONS[idx].answer ? 1 : 0), 0);
  const progress = ((done ? QUESTIONS.length : i) / QUESTIONS.length) * 100;

  useEffect(() => {
    if (done) preloadJsPdf();
  }, [done]);

  const next = () => {
    const newAns = [...answers, picked!];
    setAnswers(newAns);
    setPicked(null);
    setSubmitted(false);
    if (i + 1 >= QUESTIONS.length) setDone(true);
    else setI(i + 1);
  };

  const reset = () => {
    setI(0);
    setAnswers([]);
    setPicked(null);
    setSubmitted(false);
    setDone(false);
    setName("");
    setSaveState("idle");
  };

  const downloadPdf = async () => {
    try {
      await downloadAssessmentPdf({
        name,
        score,
        total: QUESTIONS.length,
        pct,
        ratingLabel: rating.label,
        breakdown,
        questions: QUESTIONS,
        answers,
      });
      toast.success("Assessment PDF downloaded");
    } catch {
      toast.error("Couldn't generate the PDF. Please try again.");
    }
  };

  const breakdown = useMemo(() => {
    const cats: Record<string, { correct: number; total: number }> = {};
    QUESTIONS.forEach((qu, idx) => {
      cats[qu.category] ||= { correct: 0, total: 0 };
      cats[qu.category].total++;
      if (answers[idx] === qu.answer) cats[qu.category].correct++;
    });
    return cats;
  }, [answers]);

  const pct = (score / QUESTIONS.length) * 100;
  const rating =
    pct >= 85
      ? { label: "Excellent: Highly Prepared", color: "var(--color-chart-3)" }
      : pct >= 65
        ? { label: "Good: Mostly Prepared", color: "var(--color-chart-4)" }
        : pct >= 40
          ? { label: "Fair: Important Gaps", color: "var(--color-chart-1)" }
          : { label: "At Risk: Immediate Action Needed", color: "var(--color-destructive)" };

  const saveResult = async () => {
    if (!QUIZ_WEBHOOK_URL) {
      setSaveState("error");
      return;
    }
    setSaveState("saving");
    const payload = {
      name: name.trim() || "Anonymous",
      score,
      total: QUESTIONS.length,
      percent: Math.round(pct),
      rating: rating.label,
      breakdown: Object.fromEntries(
        Object.entries(breakdown).map(([cat, v]) => [cat, `${v.correct}/${v.total}`]),
      ),
      answers: QUESTIONS.map((qu, idx) => ({
        question: qu.q,
        category: qu.category,
        chosen: answers[idx] != null ? qu.options[answers[idx]] : null,
        correct: qu.options[qu.answer],
        isCorrect: answers[idx] === qu.answer,
      })),
      submittedAt: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    };
    try {
      // No custom headers → text/plain, which avoids a CORS preflight that
      // Apps Script Web Apps don't answer. The script reads e.postData.contents.
      const res = await fetch(QUIZ_WEBHOOK_URL, { method: "POST", body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  return (
    <Layout>
      <section className="border-b border-border bg-surface/40">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-16">
          <SectionLabel number="07" label="SELF-ASSESSMENT" />
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4">
            Earthquake Preparedness Assessment
          </h1>
          <p className="text-muted-foreground text-lg">
            20 questions · Nepal-specific scenarios · International standards
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        {!done ? (
          <>
            <div className="flex justify-between text-sm font-mono mb-3">
              <span className="text-foreground">
                Question {i + 1} of {QUESTIONS.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="inline-block font-mono text-xs text-primary border border-primary/40 rounded px-2 py-1 mb-5">
              {q.category}
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 md:p-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6 text-foreground">
                {q.q}
              </h2>
              <div className="space-y-3">
                {q.options.map((opt, idx) => {
                  const correct = idx === q.answer;
                  const chosen = picked === idx;
                  const stateClass = submitted
                    ? correct
                      ? "border-chart-3 bg-chart-3/10"
                      : chosen
                        ? "border-destructive bg-destructive/10"
                        : "border-border"
                    : chosen
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40";
                  return (
                    <button
                      key={idx}
                      onClick={() => !submitted && setPicked(idx)}
                      disabled={submitted}
                      className={`w-full text-left flex items-center gap-4 px-5 py-4 rounded-md border transition ${stateClass}`}
                      style={
                        submitted && correct ? { borderColor: "var(--color-chart-3)" } : undefined
                      }
                    >
                      <span className="font-mono text-xs text-muted-foreground w-6">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="text-foreground/90 flex-1">{opt}</span>
                      {submitted && correct && (
                        <CheckCircle2
                          className="w-5 h-5"
                          style={{ color: "var(--color-chart-3)" }}
                        />
                      )}
                      {submitted && chosen && !correct && (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Score so far:{" "}
                <span className="font-mono text-foreground">
                  {score}/{answers.length}
                </span>
              </div>
              {!submitted ? (
                <button
                  onClick={() => setSubmitted(true)}
                  disabled={picked === null}
                  className="px-6 py-3 rounded-md bg-surface-2 border border-border text-foreground hover:bg-surface disabled:opacity-40"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={next}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
                >
                  {i + 1 >= QUESTIONS.length ? "See Results" : "Next Question"}{" "}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div>
            <div className="bg-surface border border-border rounded-lg p-8 text-center">
              <div className="font-mono text-xs tracking-widest text-muted-foreground mb-3">
                YOUR RESULT
              </div>
              <div
                className="font-serif text-6xl md:text-7xl font-bold"
                style={{ color: rating.color }}
              >
                {score}
                <span className="text-muted-foreground/50">/{QUESTIONS.length}</span>
              </div>
              <div className="mt-3 font-semibold text-xl text-foreground">{rating.label}</div>
              <div className="mt-2 text-muted-foreground">{Math.round(pct)}% correct</div>
            </div>

            <div className="mt-8">
              <h3 className="font-serif text-2xl font-bold mb-4">Category Breakdown</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {Object.entries(breakdown).map(([cat, v]) => {
                  const p = (v.correct / v.total) * 100;
                  return (
                    <div key={cat} className="bg-surface border border-border rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-foreground/90 text-sm">{cat}</span>
                        <span className="font-mono text-sm text-muted-foreground">
                          {v.correct}/{v.total}
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 bg-surface border border-border rounded-lg p-6">
              <h3 className="font-serif text-2xl font-bold mb-4">Personalised Recommendations</h3>
              <ul className="space-y-3 text-foreground/85">
                {Object.entries(breakdown)
                  .filter(([, v]) => v.correct / v.total < 0.75)
                  .map(([cat]) => (
                    <li key={cat} className="flex gap-3">
                      <span className="text-primary">→</span> Strengthen your <strong>{cat}</strong>
                      , review the Preparedness page section.
                    </li>
                  ))}
                {Object.values(breakdown).every((v) => v.correct / v.total >= 0.75) && (
                  <li className="flex gap-3">
                    <span className="text-primary">→</span> Excellent baseline. Share this
                    assessment with your household and community.
                  </li>
                )}
                <li className="flex gap-3">
                  <span className="text-primary">→</span> Schedule a Drop-Cover-Hold-On drill within
                  the next 7 days.
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">→</span> Audit your 72-hour kit against the
                  checklist.
                </li>
              </ul>
            </div>

            <div className="mt-8 bg-surface border border-border rounded-lg p-6">
              <h3 className="font-serif text-2xl font-bold mb-2">Save Your Result</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Keep a record of this assessment. Your result is saved to our Google Drive.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="flex-1 bg-surface-2 border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
                <button
                  onClick={saveResult}
                  disabled={saveState === "saving" || saveState === "saved"}
                  className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {saveState === "saving"
                    ? "Saving…"
                    : saveState === "saved"
                      ? "Saved ✓"
                      : "Save to Google Drive"}
                </button>
              </div>
              {saveState === "saved" && (
                <p className="mt-3 text-sm text-primary">Your result has been saved. Thank you!</p>
              )}
              {saveState === "error" && (
                <p className="mt-3 text-sm text-destructive">
                  Couldn't save your result right now. Please try again later.
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={downloadPdf}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
              >
                <Download className="w-4 h-4" /> Download PDF (watermarked)
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-surface-2 border border-border text-foreground hover:bg-surface"
              >
                <RotateCcw className="w-4 h-4" /> Retake Assessment
              </button>
              <Link
                to="/preparedness"
                className="px-6 py-3 rounded-md bg-surface-2 border border-border text-foreground hover:bg-surface"
              >
                View Preparedness Guide
              </Link>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
