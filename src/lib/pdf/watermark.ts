import type { jsPDF } from "jspdf";

/**
 * Stamps a single diagonal watermark through the center of the current page.
 * Must be called before any content is drawn on that page — jsPDF has no
 * true alpha compositing across separate draw calls, so "behind the text"
 * is simulated by painting the watermark first in light gray and letting
 * darker content overprint it.
 */
export function stampWatermark(doc: jsPDF, label = "NEPAL SEISMIC PORTAL") {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const prevSize = doc.getFontSize();
  const prevFont = doc.getFont();
  const prevColor = doc.getTextColor ? doc.getTextColor() : "#000000";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(44);
  doc.setTextColor(215, 215, 215);
  doc.text(label, pageWidth / 2, pageHeight / 2, { angle: 35, align: "center" });
  
  if (typeof prevColor === "string") {
    doc.setTextColor(prevColor);
  } else {
    doc.setTextColor(0, 0, 0);
  }
  doc.setFont(prevFont.fontName, prevFont.fontStyle);
  doc.setFontSize(prevSize);
}

export function stampFooter(doc: jsPDF, generatedAt: Date) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `Nepal Seismic Portal · Generated ${generatedAt.toLocaleDateString()} · Not a substitute for official NDRRMA guidance`,
      40,
      pageHeight - 24,
    );
    doc.text(`Page ${p} of ${pageCount}`, pageWidth - 40, pageHeight - 24, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }
}
