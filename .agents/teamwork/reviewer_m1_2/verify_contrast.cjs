function luminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}
function ratio(hex1, hex2) {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const tests = [
  ['#243e36', '#ffffff', 'Text on callout bg'],
  ['#991b1b', '#fde8e8', 'Chip wrong text on chip bg'],
  ['#137333', '#e6f4ea', 'Chip correct text on chip bg'],
  ['#4b5563', '#fde8e8', 'Chip small label on wrong chip bg'],
  ['#4b5563', '#e6f4ea', 'Chip small label on correct chip bg'],
  ['#ffffff', '#183f37', 'Button text on green btn bg'],
  ['#6b7280', '#ffffff', 'contrastive-vs text on callout bg'],
  ['#183f37', '#d7f296', 'guide-badge text on lime badge bg'],
  ['#183f37', '#f2f5f0', 'guide modal close btn text on btn bg'],
  ['#183f37', '#ffffff', 'guide modal header h2 on modal bg'],
  ['#d7f296', '#ffffff', 'focus outline lime on callout white bg (non-text)'],
  ['#529574', '#ffffff', 'focus outline green on white bg (non-text)'],
  ['#d7f296', '#183f37', 'focus outline lime on dark green button'],
];

tests.forEach(([c1, c2, desc]) => {
  const r = ratio(c1, c2);
  console.log(`${desc}: ${c1} on ${c2} = ${r.toFixed(2)}:1 (passes AA text 4.5:1? ${r >= 4.5}, passes UI 3:1? ${r >= 3.0})`);
});
