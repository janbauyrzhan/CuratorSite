import {
  RAW_SVG_TEMPLATE2,
  SLOT_CENTERS,
  SLOT_NAME_Y,
  LEFT_NAME_X,
  RIGHT_NAME_X,
} from './svgTemplate2Raw.js';
import { cleanStudentName } from './utils.js';

export { SLOT_CENTERS, SLOT_NAME_Y, LEFT_NAME_X, RIGHT_NAME_X, RAW_SVG_TEMPLATE2 };

export function escapeXml(unsafe = '') {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function addMinutesToTime(timeStr = '10:00', minsToAdd = 0) {
  const parts = String(timeStr || '10:00').split(':').map(Number);
  const h = isNaN(parts[0]) ? 10 : parts[0];
  const m = isNaN(parts[1]) ? 0 : parts[1];
  const totalMins = (h * 60 + m + minsToAdd) % (24 * 60);
  const newH = Math.floor(totalMins / 60);
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function getNameFontSize(name = '') {
  const len = (name || '').length;
  if (len > 26) return 14.5;
  if (len > 20) return 15.5;
  return 17;
}

export function fillSvgTemplate2(templateStr, {
  weekText = '1-апта',
  date1Text = '15-наурыз',
  date2Text = '14-наурыз',
  intervalMinutes = 10,
  main = [],
  overflow = [],
}) {
  let result = templateStr || RAW_SVG_TEMPLATE2;

  // Header badges (strictly centered)
  result = result.replace('{{WEEK}}', escapeXml((weekText || '1-АПТА').toUpperCase()));
  result = result.replace('{{DATE_1}}', escapeXml(date1Text || ''));
  result = result.replace('{{DATE_2}}', escapeXml(date2Text || ''));

  const interval = Number(intervalMinutes) || 10;
  // Process 8 Left Slots (indices 0..7)
  for (let i = 0; i < 8; i++) {
    const sNum = i + 1;
    const row = main[i];
    const slotData = row?.seats.filter(Boolean) || [];
    const { y1, y2 } = SLOT_NAME_Y[i];

    if (row) {
      const sStart = row.time;
      const sEnd = addMinutesToTime(sStart, interval);
      const name1 = escapeXml(cleanStudentName(slotData[0]?.name || ''));
      const name2 = escapeXml(cleanStudentName(slotData[1]?.name || ''));
      const fs1 = getNameFontSize(name1);
      const fs2 = getNameFontSize(name2);

      if (slotData.length === 1) {
        // Single student: perfectly centered in row 1 with prominent size
        result = result.replace(
          `<text id="left-s${sNum}-name1" class="t2-name" x="${LEFT_NAME_X}" y="${y1}">{{L_NAME_1_${sNum}}}</text>`,
          `<text id="left-s${sNum}-name1" class="t2-name" x="${LEFT_NAME_X}" y="${y1}" font-size="${fs1 + 1.5}">${name1}</text>`
        );
        result = result.replace(`{{L_NAME_1_${sNum}}}`, name1);
        result = result.replace(`{{L_NAME_2_${sNum}}}`, '');
      } else {
        // Two students: each in their optical center row
        result = result.replace(
          `<text id="left-s${sNum}-name1" class="t2-name" x="${LEFT_NAME_X}" y="${y1}">{{L_NAME_1_${sNum}}}</text>`,
          `<text id="left-s${sNum}-name1" class="t2-name" x="${LEFT_NAME_X}" y="${y1}" font-size="${fs1}">${name1}</text>`
        );
        result = result.replace(
          `<text id="left-s${sNum}-name2" class="t2-name" x="${LEFT_NAME_X}" y="${y2}">{{L_NAME_2_${sNum}}}</text>`,
          `<text id="left-s${sNum}-name2" class="t2-name" x="${LEFT_NAME_X}" y="${y2}" font-size="${fs2}">${name2}</text>`
        );
        result = result.replace(`{{L_NAME_1_${sNum}}}`, name1);
        result = result.replace(`{{L_NAME_2_${sNum}}}`, name2);
      }

      result = result.replace(`{{L_START_${sNum}}}`, escapeXml(sStart));
      result = result.replace(`{{L_END_${sNum}}}`, sEnd);
    } else {
      // Empty slot: clean without text
      result = result.replace(`{{L_NAME_1_${sNum}}}`, '');
      result = result.replace(`{{L_NAME_2_${sNum}}}`, '');
      result = result.replace(`{{L_START_${sNum}}}`, '');
      result = result.replace(`{{L_END_${sNum}}}`, '');
    }
  }

  // Process 8 Right Slots (indices 8..15)
  for (let i = 0; i < 8; i++) {
    const sNum = i + 1;
    const row = main[8 + i];
    const slotData = row?.seats.filter(Boolean) || [];
    const { y1, y2 } = SLOT_NAME_Y[i];

    if (row) {
      const sStart = row.time;
      const sEnd = addMinutesToTime(sStart, interval);
      const name1 = escapeXml(cleanStudentName(slotData[0]?.name || ''));
      const name2 = escapeXml(cleanStudentName(slotData[1]?.name || ''));
      const fs1 = getNameFontSize(name1);
      const fs2 = getNameFontSize(name2);

      if (slotData.length === 1) {
        result = result.replace(
          `<text id="right-s${sNum}-name1" class="t2-name" x="${RIGHT_NAME_X}" y="${y1}">{{R_NAME_1_${sNum}}}</text>`,
          `<text id="right-s${sNum}-name1" class="t2-name" x="${RIGHT_NAME_X}" y="${y1}" font-size="${fs1 + 1.5}">${name1}</text>`
        );
        result = result.replace(`{{R_NAME_1_${sNum}}}`, name1);
        result = result.replace(`{{R_NAME_2_${sNum}}}`, '');
      } else {
        result = result.replace(
          `<text id="right-s${sNum}-name1" class="t2-name" x="${RIGHT_NAME_X}" y="${y1}">{{R_NAME_1_${sNum}}}</text>`,
          `<text id="right-s${sNum}-name1" class="t2-name" x="${RIGHT_NAME_X}" y="${y1}" font-size="${fs1}">${name1}</text>`
        );
        result = result.replace(
          `<text id="right-s${sNum}-name2" class="t2-name" x="${RIGHT_NAME_X}" y="${y2}">{{R_NAME_2_${sNum}}}</text>`,
          `<text id="right-s${sNum}-name2" class="t2-name" x="${RIGHT_NAME_X}" y="${y2}" font-size="${fs2}">${name2}</text>`
        );
        result = result.replace(`{{R_NAME_1_${sNum}}}`, name1);
        result = result.replace(`{{R_NAME_2_${sNum}}}`, name2);
      }

      result = result.replace(`{{R_START_${sNum}}}`, escapeXml(sStart));
      result = result.replace(`{{R_END_${sNum}}}`, sEnd);
    } else {
      result = result.replace(`{{R_NAME_1_${sNum}}}`, '');
      result = result.replace(`{{R_NAME_2_${sNum}}}`, '');
      result = result.replace(`{{R_START_${sNum}}}`, '');
      result = result.replace(`{{R_END_${sNum}}}`, '');
    }
  }

  if (overflow.length) {
    const rowHeight = 72;
    const totalHeight = 841 + overflow.length * rowHeight;
    result = result.replace(/viewBox="0 0 1828 841" width="1828" height="841"/, `viewBox="0 0 1828 ${totalHeight}" width="1828" height="${totalHeight}"`);
    result = result.replace('<image ', '<image id="exam-template-background" ');
    // Reuse the last row of the Canva background, including its time icons and connector.
    const crop = { x: 978, y: 736, width: 738, height: 68 };
    const rows = overflow.map(({ seats, time, date }, index) => {
      const y = 809 + index * rowHeight;
      const center = y + SLOT_CENTERS[7] - crop.y;
      const names = seats.filter(Boolean).map((student, seat) => {
        const name = cleanStudentName(student.name);
        const baseline = y + (seat === 0 ? SLOT_NAME_Y[7].y1 : SLOT_NAME_Y[7].y2) - crop.y;
        return `<text class="t2-name" x="${RIGHT_NAME_X}" y="${baseline}" style="font-size:${getNameFontSize(name)}px">${escapeXml(name)}</text>`;
      }).join('');
      return `
        <g>
        ${date1Text !== date2Text ? `<text class="t2-name" x="966" y="${y + 33}" style="font-size:11px" transform="rotate(-90 966 ${y + 33})">${escapeXml(date)}</text>` : ''}
        <svg x="${crop.x}" y="${y}" width="${crop.width}" height="${crop.height}"
          viewBox="${crop.x} ${crop.y} ${crop.width} ${crop.height}" overflow="hidden">
          <use href="#exam-template-background" xlink:href="#exam-template-background"/>
        </svg>
        ${names}
        <text class="t2-time" x="1441" y="${center}">${escapeXml(time)}</text>
        <text class="t2-time" x="1638" y="${center}">${addMinutesToTime(time, interval)}</text></g>`;
    }).join('');
    result = result.replace('</svg>', `<g id="exam-overflow"><rect x="0" y="841" width="1828" height="${totalHeight - 841}" fill="#f1f0f0"/>${rows}</g></svg>`);
  }

  return result;
}

export async function downloadSvg2AsPng(svgString, fileName = 'сабақ_тапсыру.png') {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const viewBox = svgString.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
        canvas.width = Number(viewBox?.[1]) || 1828;
        canvas.height = Number(viewBox?.[2]) || 841;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        const a = document.createElement('a');
        a.download = fileName;
        a.href = canvas.toDataURL('image/png');
        a.click();
        resolve();
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG2 Image render error: ' + (e?.message || 'unknown')));
    };

    img.src = url;
  });
}
