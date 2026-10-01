const fs = require('fs');

const SLOT_CENTERS = [ 283.5, 352, 423, 494, 560.5, 631, 698, 768.5 ];
const imgBase64 = fs.readFileSync('public/template2_img_1.png').toString('base64');
const imgSrc = 'data:image/png;base64,' + imgBase64;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1828 841" width="1828" height="841" style="width: 100%; height: auto; display: block;">
  <defs>
    <style>
      .t2-week  { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 800; fill: #ffffff; text-anchor: middle; dominant-baseline: central; font-size: 24px; letter-spacing: 0.5px; }
      .t2-date  { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 800; fill: #ffffff; text-anchor: middle; dominant-baseline: central; font-size: 21px; letter-spacing: 0.5px; }
      .t2-name  { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 800; fill: #0f172a; text-anchor: middle; dominant-baseline: central; font-size: 16.5px; }
      .t2-time  { font-family: 'Inter', monospace, sans-serif; font-weight: 800; fill: #1f2937; text-anchor: middle; dominant-baseline: central; font-size: 18px; letter-spacing: 0.5px; }
    </style>
  </defs>

  <image x="0" y="0" width="1828" height="841" xlink:href="${imgSrc}" preserveAspectRatio="xMidYMid meet"/>

  <text id="t2-week" class="t2-week" x="271.5" y="80.5">{{WEEK}}</text>

  <text id="t2-date-1" class="t2-date" x="216" y="217">{{DATE_1}}</text>
  <text id="t2-date-2" class="t2-date" x="1088" y="217">{{DATE_2}}</text>

  <g id="left-slots">
`;

for (let i = 0; i < 8; i++) {
  const sNum = i + 1;
  const y = SLOT_CENTERS[i];
  svg += `    <g id="left-slot-${sNum}">
      <text id="left-s${sNum}-name1" class="t2-name" x="245" y="${y - 11.5}">{{L_NAME_1_${sNum}}}</text>
      <text id="left-s${sNum}-name2" class="t2-name" x="245" y="${y + 12.5}">{{L_NAME_2_${sNum}}}</text>
      <text id="left-s${sNum}-start" class="t2-time" x="573" y="${y}">{{L_START_${sNum}}}</text>
      <text id="left-s${sNum}-end" class="t2-time" x="770" y="${y}">{{L_END_${sNum}}}</text>
    </g>\n`;
}

svg += `  </g>
  <g id="right-slots">
`;

for (let i = 0; i < 8; i++) {
  const sNum = i + 1;
  const y = SLOT_CENTERS[i];
  svg += `    <g id="right-slot-${sNum}">
      <text id="right-s${sNum}-name1" class="t2-name" x="1110" y="${y - 11.5}">{{R_NAME_1_${sNum}}}</text>
      <text id="right-s${sNum}-name2" class="t2-name" x="1110" y="${y + 12.5}">{{R_NAME_2_${sNum}}}</text>
      <text id="right-s${sNum}-start" class="t2-time" x="1441" y="${y}">{{R_START_${sNum}}}</text>
      <text id="right-s${sNum}-end" class="t2-time" x="1638" y="${y}">{{R_END_${sNum}}}</text>
    </g>\n`;
}

svg += `  </g>
</svg>`;

fs.writeFileSync('public/template2.svg', svg);

const rawContent = `export const SLOT_CENTERS = [ 283.5, 352, 423, 494, 560.5, 631, 698, 768.5 ];

export const RAW_SVG_TEMPLATE2 = ${JSON.stringify(svg)};
`;

fs.writeFileSync('lib/svgTemplate2Raw.js', rawContent);
console.log('Successfully written public/template2.svg and lib/svgTemplate2Raw.js');
