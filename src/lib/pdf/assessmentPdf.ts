import type { Question } from "@/data/quiz";
import { stampFooter, stampWatermark } from "./watermark";

const MARGIN = 40;
const PAGE_BOTTOM = 780;

type AssessmentPdfInput = {
  name: string;
  score: number;
  total: number;
  pct: number;
  ratingLabel: string;
  breakdown: Record<string, { correct: number; total: number }>;
  questions: Question[];
  answers: number[];
};

export async function downloadAssessmentPdf({
  name,
  score,
  total,
  pct,
  ratingLabel,
  breakdown,
  questions,
  answers,
}: AssessmentPdfInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const generatedAt = new Date();
  let y = MARGIN;

  const newPage = () => {
    doc.addPage();
    stampWatermark(doc);
    y = MARGIN;
  };

  const wrap = (text: string, x: number, maxWidth: number, lineHeight = 13) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      if (y > PAGE_BOTTOM) newPage();
      doc.text(line, x, y);
      y += lineHeight;
    }
  };

  stampWatermark(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text("Earthquake Preparedness Assessment", MARGIN, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(
    "Nepal Seismic Portal — 20 questions, Nepal-specific scenarios, aligned with international (NDRRMA / Sphere / WHO) standards",
    MARGIN,
    y,
  );
  y += 14;
  doc.text(
    `Respondent: ${name.trim() || "Anonymous"}  ·  Generated ${generatedAt.toLocaleString()}`,
    MARGIN,
    y,
  );
  y += 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(`Score: ${score} / ${total} (${Math.round(pct)}%)`, MARGIN, y);
  y += 18;
  doc.setFontSize(13);
  doc.text(`Rating: ${ratingLabel}`, MARGIN, y);
  y += 20;
  doc.setDrawColor(210, 210, 210);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Category Breakdown", MARGIN, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  for (const [cat, v] of Object.entries(breakdown)) {
    if (y > PAGE_BOTTOM) newPage();
    doc.text(`${cat}: ${v.correct} / ${v.total}`, MARGIN, y);
    y += 16;
  }
  y += 10;

  if (y > PAGE_BOTTOM - 60) newPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text("Question-by-Question Results", MARGIN, y);
  y += 18;

  doc.setFontSize(10);
  questions.forEach((q, idx) => {
    if (y > PAGE_BOTTOM - 20) newPage();
    const chosenIdx = answers[idx];
    const isCorrect = chosenIdx === q.answer;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(isCorrect ? 20 : 160, isCorrect ? 130 : 40, isCorrect ? 60 : 40);
    doc.text(`${idx + 1}. [${isCorrect ? "Correct" : "Incorrect"}] (${q.category})`, MARGIN, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    wrap(q.q, MARGIN, pageWidth - MARGIN * 2);
    doc.setTextColor(90, 90, 90);
    wrap(
      `Chosen: ${chosenIdx != null ? q.options[chosenIdx] : "—"}`,
      MARGIN,
      pageWidth - MARGIN * 2,
    );
    if (!isCorrect) {
      wrap(`Correct answer: ${q.options[q.answer]}`, MARGIN, pageWidth - MARGIN * 2);
    }
    y += 8;
  });

  stampFooter(doc, generatedAt);
  doc.save("nepal-seismic-preparedness-assessment.pdf");
}
