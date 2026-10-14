import { RAW_SVG_TEMPLATE, ROW_CENTERS } from './svgTemplateRaw.js';

export { ROW_CENTERS, RAW_SVG_TEMPLATE };

export function escapeXml(unsafe = '') {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getNameFontSize(name = '') {
  const len = name.length;
  if (len > 25) return 12;
  if (len > 19) return 14;
  return 15;
}

function getSubjFontSize(subj = '') {
  const len = subj.length;
  if (len > 22) return 15;
  if (len > 15) return 18;
  return 21;
}

export function fillSvgTemplate(templateStr, { weekText = '', subjectText = '', pairs = [] }) {
  let result = templateStr || RAW_SVG_TEMPLATE;

  // 1. Week badge
  const cleanWeek = escapeXml((weekText || '1-АПТА').toUpperCase());
  result = result.replace('{{WEEK}}', cleanWeek);

  // 2. Subject badge with adaptive font size
  const cleanSubj = escapeXml(subjectText || 'Жұптық жұмыс');
  const subjFontSize = getSubjFontSize(cleanSubj);
  result = result.replace(
    '<text id="text-subject" class="badge-subj" x="640" y="85">{{SUBJECT}}</text>',
    `<text id="text-subject" class="badge-subj" x="640" y="85" font-size="${subjFontSize}">${cleanSubj}</text>`
  );
  // Fallback if exact tag not matched
  result = result.replace('{{SUBJECT}}', cleanSubj);

  // 3. Process 17 rows
  for (let i = 1; i <= 17; i++) {
    const pair = pairs[i - 1];
    const y = ROW_CENTERS[i - 1];

    if (!pair || pair.length === 0) {
      // Empty row
      result = result.replace(`{{NAME_1_${i}}}`, '');
      result = result.replace(`{{PHONE_1_${i}}}`, '');
      result = result.replace(`{{NAME_2_${i}}}`, '');
      result = result.replace(`{{PHONE_2_${i}}}`, '');
    } else if (pair.length === 1 || !pair[1]) {
      // Odd student logic (Prompt requirement 4):
      // Placed on next row (e.g. row 15)
      // Left cell: student name & phone in standard font
      // Right cell: completely empty
      const name1 = escapeXml(pair[0].name);
      const phone1 = escapeXml(pair[0].phone || '');
      const fs1 = getNameFontSize(name1);

      result = result.replace(
        `<text id="left-name-${i}" class="name-txt" x="115" y="${y}">{{NAME_1_${i}}}</text>`,
        `<text id="left-name-${i}" class="name-txt" x="115" y="${y}" font-size="${fs1}">${name1}</text>`
      );
      result = result.replace(`{{NAME_1_${i}}}`, name1);
      result = result.replace(`{{PHONE_1_${i}}}`, phone1);

      result = result.replace(
        `<text id="right-name-${i}" class="name-txt" x="975" y="${y}">{{NAME_2_${i}}}</text>`,
        `<text id="right-name-${i}" class="name-txt" x="975" y="${y}"></text>`
      );
      result = result.replace(`{{NAME_2_${i}}}`, '');
      result = result.replace(`{{PHONE_2_${i}}}`, '');
    } else {
      // Standard pair (1 student left, 1 student right)
      const name1 = escapeXml(pair[0].name);
      const phone1 = escapeXml(pair[0].phone || '');
      const name2 = escapeXml(pair[1].name);
      const phone2 = escapeXml(pair[1].phone || '');
      const fs1 = getNameFontSize(name1);
      const fs2 = getNameFontSize(name2);

      result = result.replace(
        `<text id="left-name-${i}" class="name-txt" x="115" y="${y}">{{NAME_1_${i}}}</text>`,
        `<text id="left-name-${i}" class="name-txt" x="115" y="${y}" font-size="${fs1}">${name1}</text>`
      );
      result = result.replace(`{{NAME_1_${i}}}`, name1);
      result = result.replace(`{{PHONE_1_${i}}}`, phone1);

      result = result.replace(
        `<text id="right-name-${i}" class="name-txt" x="975" y="${y}">{{NAME_2_${i}}}</text>`,
        `<text id="right-name-${i}" class="name-txt" x="975" y="${y}" font-size="${fs2}">${name2}</text>`
      );
      result = result.replace(`{{NAME_2_${i}}}`, name2);
      result = result.replace(`{{PHONE_2_${i}}}`, phone2);
    }
  }

  // 4. Dynamic expansion ONLY when pairs count > 17 (e.g. 18 or 19 pairs / up to 38-40 students)
  if (pairs && pairs.length > 17) {
    const totalRows = Math.min(20, pairs.length);
    const lastY = ROW_CENTERS[totalRows - 1];
    const cardBottom = lastY + 21;
    const newHeight = cardBottom + 22;

    // Expand SVG viewBox and height
    result = result.replace(
      /viewBox=["']0 0 1702 \d+["']/i,
      `viewBox="0 0 1702 ${newHeight}"`
    );
    result = result.replace(
      /height=["']\d+["']/i,
      `height="${newHeight}"`
    );

    // 1) Extension background & cards (CRITICAL: MUST be placed BEFORE <g id="table-rows"> so they render BEHIND row 17 text & numbers)
    let cardBgSvg = '\n  <!-- Dynamic Extension Background & Cards (rendered behind table rows) -->\n';
    cardBgSvg += `  <rect id="ext-bg" x="0" y="960" width="1702" height="${newHeight - 960}" fill="#f1f0f0" />\n`;
    cardBgSvg += '  <g id="ext-cards">\n';
    cardBgSvg += `    <rect x="48" y="960" width="746" height="${cardBottom - 960}" rx="16" fill="#ffffff" />\n`;
    cardBgSvg += `    <rect x="48" y="960" width="746" height="20" fill="#ffffff" />\n`;
    cardBgSvg += `    <rect x="908" y="960" width="746" height="${cardBottom - 960}" rx="16" fill="#ffffff" />\n`;
    cardBgSvg += `    <rect x="908" y="960" width="746" height="20" fill="#ffffff" />\n`;
    cardBgSvg += `    <line x1="412" y1="960" x2="412" y2="${cardBottom - 6}" stroke="#a4a4a4" stroke-width="1" />\n`;
    cardBgSvg += `    <line x1="1272" y1="960" x2="1272" y2="${cardBottom - 6}" stroke="#a4a4a4" stroke-width="1" />\n`;
    cardBgSvg += '  </g>\n\n';

    if (result.includes('<g id="table-rows">')) {
      result = result.replace('<g id="table-rows">', `${cardBgSvg}  <g id="table-rows">`);
    } else {
      result = result.replace('</svg>', `${cardBgSvg}</svg>`);
    }

    // 2) Extension rows 18+ (dividers, row numbers, student text)
    let extraRowsSvg = '\n  <!-- Dynamic Extension for Rows 18+ -->\n';
    extraRowsSvg += '  <g id="ext-rows">\n';
    for (let r = 18; r <= totalRows; r++) {
      const pair = pairs[r - 1];
      const y = ROW_CENTERS[r - 1];
      const prevY = ROW_CENTERS[r - 2];
      const divY = Math.round((prevY + y) / 2);

      // Horizontal dividers
      extraRowsSvg += `    <line x1="48" y1="${divY}" x2="794" y2="${divY}" stroke="#a4a4a4" stroke-width="1" />\n`;
      extraRowsSvg += `    <line x1="908" y1="${divY}" x2="1654" y2="${divY}" stroke="#a4a4a4" stroke-width="1" />\n`;

      // Row numbers
      extraRowsSvg += `    <text class="row-num" x="77" y="${y}">${r}</text>\n`;
      extraRowsSvg += `    <text class="row-num" x="937" y="${y}">${r}</text>\n`;

      if (pair && pair.length > 0) {
        const name1 = escapeXml(pair[0].name);
        const phone1 = escapeXml(pair[0].phone || '');
        const fs1 = getNameFontSize(name1);
        extraRowsSvg += `    <text id="left-name-${r}" class="name-txt" x="115" y="${y}" font-size="${fs1}">${name1}</text>\n`;
        extraRowsSvg += `    <text id="left-phone-${r}" class="phone-txt" x="430" y="${y}">${phone1}</text>\n`;

        if (pair.length > 1 && pair[1]) {
          const name2 = escapeXml(pair[1].name);
          const phone2 = escapeXml(pair[1].phone || '');
          const fs2 = getNameFontSize(name2);
          extraRowsSvg += `    <text id="right-name-${r}" class="name-txt" x="975" y="${y}" font-size="${fs2}">${name2}</text>\n`;
          extraRowsSvg += `    <text id="right-phone-${r}" class="phone-txt" x="1290" y="${y}">${phone2}</text>\n`;
        }
      }
    }
    extraRowsSvg += '  </g>\n';

    result = result.replace('</svg>', `${extraRowsSvg}</svg>`);
  }

  return result;
}

export async function downloadSvgAsPng(svgString, fileName = 'poster.png') {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      try {
        const vbMatch = svgString.match(/viewBox=["']\s*0\s+0\s+(\d+)\s+(\d+)\s*["']/i);
        const w = vbMatch ? parseInt(vbMatch[1], 10) : 1702;
        const h = vbMatch ? parseInt(vbMatch[2], 10) : 988;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            reject(new Error('Canvas export failed'));
            return;
          }
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(url);
          resolve();
        }, 'image/png', 1.0);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };

    img.src = url;
  });
}
