import { html } from 'lit-html';
import { unsafeSVG } from 'lit-html/directives/unsafe-svg.js';
import {
  BookOpen,
  CircleCheck,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  ChartNoAxesCombined,
  LogIn,
  LogOut,
  RotateCcw,
  Target,
  CalendarDays,
  Library,
  Check,
  CircleHelp,
  Volume2,
} from 'lucide';
const icons = {
  BookOpen,
  CircleCheck,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  ChartNoAxesCombined,
  LogIn,
  LogOut,
  RotateCcw,
  Target,
  CalendarDays,
  Library,
  Check,
  CircleHelp,
  Volume2,
};
const markup = ([tag, attrs, children = []]) =>
  `<${tag} ${Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')}>${children.map(markup).join('')}</${tag}>`;
const iconMarkup = Object.fromEntries(Object.entries(icons).map(([k, v]) => [k, markup(v)]));
export const icon = (name) =>
  html`<span class="icon" aria-hidden="true">${unsafeSVG(iconMarkup[name] || '')}</span>`;
// Only Japanese runs receive ja; surrounding prose keeps the parent language.
export function languageText(text) {
  return String(text ?? '')
    .split(
      /([\u3000-\u30ff\u3400-\u9fff\uff66-\uff9f]+(?:[０-９0-9]+[\u3000-\u30ff\u3400-\u9fff\uff66-\uff9f]+)*)/g,
    )
    .map((part, i) => (i % 2 ? html`<span lang="ja">${part}</span>` : part));
}
export const dateText = (date) =>
  new Date(date + 'T12:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
export const heading = (eyebrow, title, text) =>
  html`<div class="page-heading">
    <div>
      <p class="overline">${eyebrow}</p>
      <h1 tabindex="-1">${title}</h1>
      <p>${text}</p>
    </div>
  </div>`;
export const speechButton = (ctx, text, label = 'Lyssna') =>
  ctx.tts && text
    ? html`<button
        type="button"
        class="speak"
        aria-label="${label} på japanska"
        @click=${(e) => ctx.speak(text, e.currentTarget)}
      >
        ${icon('Volume2')}<span>${label}</span>
      </button>`
    : '';
