import { jsPDF } from "jspdf";
import { Song } from "./types";

export function exportSongToPdf(song: Song) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 32;
  const gap = 20;
  const colWidth = (pageWidth - margin * 2 - gap) / 2;
  const bottomLimit = pageHeight - margin;

  const titleFontSize = 17;
  const metaFontSize = 9.5;
  const sectionFontSize = 10.5;
  const textFontSize = 9.5; // shared by chord row + lyric row so char widths line up
  const rowGap = 1; // gap between chord row and lyric row
  const lineGap = 3; // gap between lyric lines
  const sectionGapAfter = 7;
  const sectionGapBefore = 4;

  let col = 0; // 0 = left column, 1 = right column
  let x = margin;
  let y = margin;
  let contentStartY = margin; // y where both columns begin (below header on page 1)

  function drawHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(titleFontSize);
    doc.text(song.title || "Untitled Song", margin, y);
    y += titleFontSize + 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(metaFontSize);
    const meta = [
      song.key && `Key: ${song.key}`,
      song.tempo && `Tempo: ${song.tempo}`,
    ]
      .filter(Boolean)
      .join("      ");
    if (meta) {
      doc.text(meta, margin, y);
      y += metaFontSize + 4;
    }
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // Both columns on this page start below the header, not at the raw top margin.
    contentStartY = y;
  }

  function goToNextColumnOrPage() {
    if (col === 0) {
      col = 1;
      x = margin + colWidth + gap;
      y = contentStartY; // align with left column's starting point, below header
    } else {
      doc.addPage();
      col = 0;
      x = margin;
      contentStartY = margin; // no header on later pages
      y = margin;
    }
  }

  function ensureSpace(height: number) {
    if (y + height > bottomLimit) goToNextColumnOrPage();
  }

  drawHeader();

  for (const section of song.sections) {
    ensureSpace(sectionFontSize + sectionGapBefore + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(sectionFontSize);
    const label =
      section.type === "solo" ? `${section.name} (Solo)` : section.name;
    doc.setTextColor(60, 60, 200);
    doc.text(label, x, y);
    doc.setTextColor(0, 0, 0);
    y += sectionFontSize + sectionGapBefore;

    doc.setFont("courier", "normal");
    doc.setFontSize(textFontSize);
    const charWidth = doc.getTextWidth("0"); // Courier is monospace: constant per-char width

    for (const line of section.lines) {
      const hasChords = line.chords.length > 0;
      const chordRowHeight = hasChords ? textFontSize + rowGap : 0;
      const rowHeight = chordRowHeight + textFontSize + lineGap;
      ensureSpace(rowHeight);

      if (hasChords) {
        doc.setFont("courier", "bold");
        doc.setTextColor(40, 40, 40);
        for (const chord of line.chords) {
          doc.text(chord.symbol, x + chord.position * charWidth, y);
        }
        y += textFontSize + rowGap;
      }

      doc.setFont("courier", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(line.text || " ", x, y);
      y += textFontSize + lineGap;
    }

    y += sectionGapAfter;
  }

  const filename = `${(song.title || "chord-chart").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
  doc.save(filename);
}
  