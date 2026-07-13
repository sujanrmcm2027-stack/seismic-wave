import { stampFooter, stampWatermark } from "./watermark";

const MARGIN = 40;
const PAGE_BOTTOM = 780;

export async function downloadKitChecklistPdf(items: string[], checked: Record<string, boolean>) {
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

  stampWatermark(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text("72-Hour Emergency Kit Checklist", MARGIN, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(
    "Nepal Seismic Portal - Nepal-specific guidance aligned with NDRRMA, Sphere Standards, and WHO/PAHO",
    MARGIN,
    y,
  );
  y += 14;
  doc.text(
    `household emergency-supply recommendations. Generated ${generatedAt.toLocaleString()}.`,
    MARGIN,
    y,
  );
  y += 26;

  const packed = items.filter((i) => checked[i]).length;
  const pct = Math.round((packed / items.length) * 100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(`Readiness: ${packed} / ${items.length} items packed (${pct}%)`, MARGIN, y);
  y += 12;
  doc.setDrawColor(210, 210, 210);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 22;

  doc.setFontSize(11);
  for (const item of items) {
    if (y > PAGE_BOTTOM) newPage();
    const isChecked = !!checked[item];

    doc.setDrawColor(60, 60, 60);
    doc.setFillColor(isChecked ? 30 : 255, isChecked ? 120 : 255, isChecked ? 60 : 255);
    doc.rect(MARGIN, y - 9, 11, 11, isChecked ? "FD" : "D");
    if (isChecked) {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1.3);
      doc.line(MARGIN + 2, y - 4, MARGIN + 4.5, y - 1.5);
      doc.line(MARGIN + 4.5, y - 1.5, MARGIN + 9, y - 8);
      doc.setLineWidth(0.75);
    }

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(item, MARGIN + 20, y);
    y += 20;
  }

  y += 10;
  if (y > PAGE_BOTTOM - 40) newPage();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(
    "Store the kit near the main exit. Review and refresh water, food, and medications every 6 months.",
    MARGIN,
    y,
  );

  stampFooter(doc, generatedAt);
  doc.save("nepal-seismic-72hr-emergency-kit-checklist.pdf");
}
