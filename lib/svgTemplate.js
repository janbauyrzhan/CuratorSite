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

  return result;
}

export async function downloadSvgAsPng(svgString, fileName = 'poster.png') {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1702;
        canvas.height = 988;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1702, 988);
        ctx.drawImage(img, 0, 0, 1702, 988);

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
