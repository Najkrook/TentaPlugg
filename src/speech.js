// Uppläsning med webbläsarens inbyggda talsyntes (Web Speech API). Inga nätverksanrop eller kostnader.
const JP =
  '\\u3000-\\u303f\\u3040-\\u309f\\u30a0-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef';
const RUN = new RegExp(`[A-Za-z0-9]*(?:[${JP}]+[A-Za-z0-9]*)+`, 'g');
const BLANK = /【\s*】/;
export const hasJapanese = (s) => /[\u3040-\u30ff\u3400-\u9fff\uff66-\uff9f]/.test(String(s ?? ''));

/** Plockar ut de japanska delarna ur blandad svensk/japansk text och gör den läsbar för talsyntesen. */
export function japaneseText(text) {
  const cleaned = String(text ?? '')
    .replace(/[（(][^）)]*[）)]/g, '') // läsningar och svenska förtydliganden inom parentes
    .replace(/[～〜]/g, '') // grammatikmönster som ～かったです
    .replace(/【\s*】/g, '、') // tom lucka blir en kort paus
    .replace(/【([^】]*)】/g, '$1'); // markerad partikel läses som en del av meningen
  return (cleaned.match(RUN) || [])
    .map((s) => s.replace(/^[\s、。・]+|[\s、・]+$/g, ''))
    .filter(hasJapanese)
    .reduce((out, s) => (!out ? s : /[。！？]$/.test(out) ? out + s : out + '、' + s), '')
    .replace(/、+(?=[。！？]|$)/g, '');
}

/** Text för frågan innan den besvarats. */
export const promptSpeech = (q) => japaneseText(q.prompt);

/** Text efter rättning: meningen med rätt svar ifyllt, annars svaret, frågan eller modellsvaret. */
export function answerSpeech(q) {
  const a = q.answers?.[0];
  if (q.self) {
    const model = japaneseText(q.model);
    return /[。！？]/.test(model) ? model : promptSpeech(q) || model;
  }
  if (a !== undefined && BLANK.test(q.prompt))
    return japaneseText(q.prompt.replace(BLANK, a === '×' || a === 'Ingen partikel' ? '' : a));
  if (hasJapanese(a)) return japaneseText(a);
  return promptSpeech(q) || japaneseText(q.model);
}

export const ttsSupported = () =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window;
let voice = null;
function pickVoice() {
  const voices = speechSynthesis.getVoices().filter((v) => /^ja/i.test(v.lang));
  voice =
    voices.find((v) => /natural|online/i.test(v.name)) ||
    voices.find((v) => /google/i.test(v.name)) ||
    voices[0] ||
    null;
  return speechSynthesis.getVoices().length;
}
if (ttsSupported()) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

/** Läser upp texten. Returnerar 'ok', 'no-voice' (röster finns men ingen japansk) eller 'unsupported'. */
export function speak(text, { rate = 0.9, onend } = {}) {
  if (!ttsSupported() || !text) return 'unsupported';
  speechSynthesis.cancel();
  const loaded = voice ? 1 : pickVoice();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  if (voice) u.voice = voice;
  u.rate = rate;
  u.onend = u.onerror = () => onend?.();
  speechSynthesis.speak(u);
  return !voice && loaded ? 'no-voice' : 'ok';
}
export const stopSpeech = () => {
  if (ttsSupported()) speechSynthesis.cancel();
};
