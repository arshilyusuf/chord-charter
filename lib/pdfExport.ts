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

  const titleFontSize = 20;
  const metaFontSize = 9.5;
  const sectionFontSize = 10.5;
  const textFontSize = 10; // shared by chord row + lyric row so char widths line up
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
    const charWidth = doc.getTextWidth("0"); // Constant per-char width
    const maxChars = Math.floor(colWidth / charWidth); // Max characters per column

    for (const originalLine of section.lines) {
      let text = originalLine.text || "";

      // 1. If chords are placed after the lyrics end, pad the string with spaces
      // so our wrapping logic doesn't cut off dangling chords.
      let maxChordPos = 0;
      if (originalLine.chords && originalLine.chords.length > 0) {
        maxChordPos = Math.max(...originalLine.chords.map((c) => c.position));
      }
      if (text.length <= maxChordPos) {
        text = text.padEnd(maxChordPos + 1, " ");
      }

      // 2. Break the original line into sub-lines that fit the column width
      const subLines: { text: string; chords: typeof originalLine.chords }[] =
        [];

      if (text.length === 0) {
        subLines.push({ text: " ", chords: originalLine.chords });
      } else {
        let startIndex = 0;
        while (startIndex < text.length) {
          let endIndex = startIndex + maxChars;

          // Try to break at the last space to avoid cutting words in half
          if (endIndex < text.length) {
            const lastSpace = text.lastIndexOf(" ", endIndex);
            if (lastSpace > startIndex) {
              endIndex = lastSpace;
            }
          }

          // Extract text for this wrapped line
          const subText = text.substring(startIndex, endIndex);

          // Find chords that belong to this wrapped line and adjust their positions
          const subChords = originalLine.chords
            .filter((c) => c.position >= startIndex && c.position < endIndex)
            .map((c) => ({
              ...c,
              position: c.position - startIndex, // Shift position to start of new line
            }));

          subLines.push({ text: subText, chords: subChords });
          startIndex = endIndex;
        }
      }

      // 3. Render the newly wrapped sub-lines
      for (const line of subLines) {
        const hasChords = line.chords && line.chords.length > 0;
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
    }

    y += sectionGapAfter;
  }

  const filename = `${(song.title || "chord-chart").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;

  // 1. Output the PDF as a Blob
  const pdfBlob = doc.output("blob");

  // 2. Wrap it in a new Blob with a generic octet-stream MIME type
  const forceDownloadBlob = new Blob([pdfBlob], {
    type: "application/octet-stream",
  });
  const blobUrl = URL.createObjectURL(forceDownloadBlob);

  // 3. Create a temporary anchor tag to trigger the download
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 4. Clean up the URL object from memory
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
}