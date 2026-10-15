import { jsPDF } from "jspdf";
import { Song } from "./types";

async function loadPdfFont(
  doc: jsPDF,
  url: string,
  fileName: string,
  fontName: string,
) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load the PDF font: ${url}`);

  const fontData = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let index = 0; index < fontData.length; index += 1) {
    binary += String.fromCharCode(fontData[index]);
  }

  doc.addFileToVFS(fileName, btoa(binary));
  doc.addFont(fileName, fontName, "normal");
}

async function loadPdfImage(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load the PDF image: ${url}`);

  const imageData = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let index = 0; index < imageData.length; index += 1) {
    binary += String.fromCharCode(imageData[index]);
  }

  return `data:image/png;base64,${btoa(binary)}`;
}

export async function exportSongToPdf(song: Song) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const [, , , , logoData] = await Promise.all([
    loadPdfFont(
      doc,
      "/ClashGrotesk-Bold.ttf",
      "ClashGrotesk-Bold.ttf",
      "ClashGroteskBold",
    ),
    loadPdfFont(
      doc,
      "/ClashGrotesk-Medium.ttf",
      "ClashGrotesk-Medium.ttf",
      "ClashGroteskMedium",
    ),
    loadPdfFont(
      doc,
      "/ClashGrotesk-Light.ttf",
      "ClashGrotesk-Light.ttf",
      "ClashGroteskLight",
    ),
    loadPdfFont(
      doc,
      "/IBM_Plex_Mono/IBMPlexMono-Bold.ttf",
      "IBMPlexMono-Bold.ttf",
      "IBMPlexMonoBold",
    ),
    loadPdfImage("/Shruti26%20Profile%20Picture-15.png"),
  ]);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 32;
  const gap = 20;
  const colWidth = (pageWidth - margin * 2 - gap) / 2;
  const bottomLimit = pageHeight - margin;

  const titleFontSize = 20;
  const creditFontSize = 12;
  const metaFontSize = 9.5;
  const sectionFontSize = 10.5;
  const textFontSize = 10; // shared by chord row + lyric row so char widths line up
  const rowGap = 1; // gap between chord row and lyric row
  const lineGap = 3; // gap between lyric lines
  const sectionGapAfter = 7;
  const sectionGapBefore = 4;
  const logoSize = 64;

  let col = 0; // 0 = left column, 1 = right column
  let x = margin;
  let y = margin;
  let contentStartY = margin; // y where both columns begin (below header on page 1)

  function drawHeader() {
    doc.setFont("ClashGroteskBold", "normal");
    doc.setFontSize(titleFontSize);
    doc.text(song.title || "Untitled Song", margin, y);
    y += titleFontSize + 4;

    doc.setFont("ClashGroteskMedium", "normal");
    doc.setFontSize(creditFontSize);
    doc.text("Shruti'26", margin, y);
    y += creditFontSize + 1;

    doc.setFont("ClashGroteskMedium", "normal");
    doc.setFontSize(metaFontSize);
    const meta = [
      song.key && `Key: ${song.key}`,
      song.tempo && `Tempo: ${song.tempo}`,
    ]
      .filter(Boolean)
      .join("      ");
    if (meta) {
      doc.text(meta, margin, y);
      y += metaFontSize + 6;
    }
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    doc.addImage(
      logoData,
      "PNG",
      pageWidth - margin - logoSize,
      margin - logoSize / 2,
      logoSize,
      logoSize,
    );
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
    doc.setFont("ClashGroteskMedium", "normal");
    doc.setFontSize(sectionFontSize);
    const label =
      section.type === "solo" ? `${section.name} (Solo)` : section.name;
    doc.setTextColor(60, 60, 200);
    doc.text(label, x, y);
    doc.setTextColor(0, 0, 0);
    y += sectionFontSize + sectionGapBefore;

    doc.setFont("ClashGroteskMedium", "normal");
    doc.setFontSize(textFontSize);
    const charWidth = doc.getTextWidth("0"); // Chord positions use the monospace grid.
    const maxTextWidth = colWidth - 4; // Keep only a small breathing room at the column edge.

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

      // 2. Break the original line into sub-lines that fit the column width.
      const subLines: { text: string; chords: typeof originalLine.chords }[] =
        [];

      if (text.length === 0) {
        subLines.push({ text: " ", chords: originalLine.chords });
      } else {
        let startIndex = 0;
        while (startIndex < text.length) {
          let endIndex = startIndex;
          while (
            endIndex < text.length &&
            doc.getTextWidth(text.substring(startIndex, endIndex + 1)) <=
              maxTextWidth
          ) {
            endIndex += 1;
          }

          if (endIndex === startIndex) {
            endIndex += 1;
          } else if (endIndex < text.length) {
            const lastSpace = text.lastIndexOf(" ", endIndex - 1);
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
          doc.setFont("IBMPlexMonoBold", "normal");
          doc.setFillColor(254, 226, 226);
          doc.setTextColor(153, 27, 27);
          const chordBadges = line.chords.map((chord) => {
            const chordX = x + chord.position * charWidth;
            const chordWidth = doc.getTextWidth(chord.symbol);
            return { chord, chordX, chordWidth };
          });

          for (const { chordX, chordWidth } of chordBadges) {
            doc.roundedRect(
              chordX - 2,
              y - textFontSize + 1,
              chordWidth + 4,
              textFontSize + 2,
              2,
              2,
              "F",
            );
          }

          doc.setTextColor(153, 27, 27);
          for (const { chord, chordX } of chordBadges) {
            doc.text(chord.symbol, chordX, y);
          }
          y += textFontSize + rowGap;
        }

        doc.setFont("ClashGroteskMedium", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(line.text || " ", x, y);
        y += textFontSize + lineGap;
      }
    }

    y += sectionGapAfter;
  }

  const filename = `${song.title || "chord-chart"}.pdf`;

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