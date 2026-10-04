function relLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const toLin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function ratio(c1, c2) {
  const l1 = relLuminance(c1),
    l2 = relLuminance(c2);
  const max = Math.max(l1, l2),
    min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

const pairs = [
  ['Sakura body text vs pastel bg', '#3b1d28', '#fff5f8'],
  ['Sakura body text vs white', '#3b1d28', '#ffffff'],
  ['Classic body text vs bg', '#243e36', '#f8faf8'],
  ['Classic body text vs white', '#243e36', '#ffffff'],
  ['Sakura primary btn text vs bg', '#ffffff', '#b82763'],
  ['Sakura primary btn bg vs page bg', '#b82763', '#fff5f8'],
  ['Classic primary btn text vs bg', '#ffffff', '#183f37'],
  ['Sakura focus panel primary btn text vs btn bg', '#8a1746', '#ffe5f0'],
  ['Sakura secondary btn text vs bg', '#8a1f4b', '#ffffff'],
  ['Sakura secondary btn hover text vs bg', '#8a1f4b', '#fff0f5'],
  ['Sakura focus ring vs page bg', '#b82763', '#fff5f8'],
  ['Sakura focus ring vs white bg', '#b82763', '#ffffff'],
  ['Classic focus ring vs page bg', '#265943', '#f8faf8'],
  ['Classic focus ring vs white bg', '#265943', '#ffffff'],
  ['Sakura muted text vs pastel bg', '#784f60', '#fff5f8'],
  ['Sakura muted text vs white bg', '#784f60', '#ffffff'],
  ['Sakura feedback good heading vs bg', '#14532d', '#f0fdf4'],
  ['Sakura feedback again heading vs bg', '#881337', '#fff1f2'],
  ['Sakura theme toggle text vs bg', '#9c1f52', '#fff0f5'],
  ['Classic theme toggle text vs bg', '#183f37', '#ffffff'],
  ['Rating again text vs bg', '#ad3b24', '#fff8f5'],
  ['Rating hard text vs bg', '#8c5d0f', '#fdfaf2'],
  ['Rating good text vs bg', '#236319', '#f4faf0'],
  ['Rating easy text vs bg', '#175c74', '#f0f8fa'],
  ['Sakura contrastive wrong chip vs bg', '#9f1239', '#ffe4e6'],
  ['Sakura contrastive correct chip vs bg', '#065f46', '#ecfdf5'],
  ['Sakura contrastive guide btn vs box bg', '#b82763', '#fff8fb'],
  ['Sakura focus panel text vs panel gradient dark', '#fce7f3', '#78204d'],
  ['Sakura focus label vs panel gradient dark', '#ffd6e7', '#78204d'],
];

console.log('--- WCAG AA Contrast Evaluation ---');
let allPass = true;
for (const [name, c1, c2] of pairs) {
  const r = ratio(c1, c2);
  const isNonText = name.toLowerCase().includes('ring') || name.toLowerCase().includes('btn bg vs page');
  const target = isNonText ? 3.0 : 4.5;
  const pass = r >= target;
  if (!pass) allPass = false;
  console.log(
    `${pass ? 'PASS' : 'FAIL'} | ${r.toFixed(2)}:1 (req >=${target}:1) | ${name} (${c1} on ${c2})`,
  );
}
console.log('--- Overall Contrast Result:', allPass ? 'ALL PASSED' : 'SOME FAILED', '---');
