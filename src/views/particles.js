import { html } from 'lit-html';
import { keyed } from 'lit-html/directives/keyed.js';
import {
  initialParticleState,
  isPunctuation,
  particleCharacters,
  particleChoices,
} from '../particles.js';
import { icon, languageText, speechButton, heading } from './shared.js';

export function particleSessionView(ctx, q, ratings) {
  const s = ctx.session;
  const state = s.particles?.[q.id] || initialParticleState(q);
  const done = state.stage === 'done';
  const marking = ['mark', 'marked'].includes(state.stage);
  const act = (type, props = {}) => ctx.particleAction({ type, ...props });
  const editor = state.editor;
  const placing = editor?.mode.endsWith('-position');
  const choosing = editor?.mode.endsWith('-choice');
  const selectedToken = state.tokens.find((t) => t.id === editor?.id);
  return html`
    <div class="session-top">
      <button class="text-button" @click=${ctx.exit}>${icon('ArrowLeft')} Spara & lämna</button>
      <span>Träningspass · ${s.index + 1} / ${s.ids.length}</span>
    </div>
    <div class="session-track">
      <span style="width:${((s.index + 1) / s.ids.length) * 100}%"></span>
    </div>
    ${keyed(
      q.id,
      html`<section class="question-panel particle-panel" data-question-id=${q.id}>
        <div class="question-meta">
          <span>Partiklar</span
          ><span
            >${q.exercise.adapted ? 'Bearbetad träning · Lesson5' : 'Extra träning · Lesson5'}</span
          >
        </div>
        <ol class="particle-steps" aria-label="Övningens steg">
          <li aria-current=${marking ? 'step' : 'false'}>1. Hitta partiklarna</li>
          <li aria-current=${!marking ? 'step' : 'false'}>2. Rätta meningen</li>
        </ol>
        <h1 class="question-title" tabindex="-1">
          ${marking ? 'Markera de tecken som du tror är partiklar' : 'Ändra partiklarna om det behövs'}
        </h1>
        ${q.exercise.context ? html`<p class="particle-context">${q.exercise.context}</p>` : ''}
        <p class="muted">
          ${marking ? 'Tryck på ett tecken för att markera eller avmarkera det. Rätta när du är klar.' : 'Låt meningen vara om den redan är korrekt. Tryck på en partikel för att ändra den.'}
        </p>
        ${
          marking
            ? html`
                <div
                  class="particle-sentence particle-marking"
                  lang="ja"
                  role="group"
                  aria-label="Markera partiklar i meningen"
                >
                  ${particleCharacters(q.exercise).map((c, i) => {
                    const selected = state.selected.includes(c.id);
                    const result =
                      state.stage === 'marked'
                        ? state.marking.right.includes(c.id)
                          ? 'right'
                          : state.marking.wrong.includes(c.id)
                            ? 'wrong'
                            : state.marking.missed.includes(c.id)
                              ? 'missed'
                              : ''
                        : '';
                    const label = {
                      right: 'Rätt markerad',
                      wrong: 'Fel markerad',
                      missed: 'Missad partikel',
                    }[result];
                    return isPunctuation(c.text)
                      ? html`<span>${c.text}</span>`
                      : html` <button
                          type="button"
                          class="particle-char ${selected ? 'selected' : ''} ${result}"
                          data-char-id=${c.id}
                          aria-label="${c.text}, tecken ${i + 1}${label ? `, ${label}` : ''}"
                          aria-pressed=${selected}
                          aria-disabled=${state.stage !== 'mark'}
                          @click=${() => act('toggle', { id: c.id })}
                        >
                          ${c.text}${result ? html`<span class="particle-symbol" aria-hidden="true">${result === 'right' ? '✓' : result === 'wrong' ? '×' : '!'}</span>` : ''}
                        </button>`;
                  })}
                </div>
                ${
                  state.stage === 'marked'
                    ? html`<div class="particle-mark-result" role="status">
                        <strong
                          >${state.marking.ok ? 'Du hittade alla partiklar!' : 'Jämför dina markeringar'}</strong
                        >
                        <p>
                          ✓ ${state.marking.right.length} rätt markerade · ×
                          ${state.marking.wrong.length} fel markerade · !
                          ${state.marking.missed.length} missade
                        </p>
                        <p>
                          En partikel är en partikel även när den används fel. I steg 2 får du rätta
                          själva meningen.
                        </p>
                      </div>`
                    : ''
                }
              `
            : html`
                <div
                  class="particle-sentence particle-editing"
                  lang="ja"
                  role="group"
                  aria-label="Redigera partiklar i meningen"
                >
                  ${state.tokens.map(
                    (token, index) => html`
                      ${placing ? html`<button type="button" class="particle-position" aria-label="Placera före ${token.text}, position ${index + 1}" @click=${() => act('position', { index })}>＋</button>` : ''}
                      ${
                        token.particle && !done
                          ? html`<button
                              type="button"
                              class="particle-token ${editor?.id === token.id ? 'selected' : ''}"
                              data-token-id=${token.id}
                              aria-label="Ändra ${token.text}, del ${index + 1}"
                              aria-pressed=${editor?.id === token.id}
                              @click=${() => act('select', { id: token.id })}
                            >
                              ${token.text}
                            </button>`
                          : html`<span class=${token.particle ? 'particle-final-token' : ''}
                              >${token.text}</span
                            >`
                      }
                    `,
                  )}
                </div>
                ${
                  !done
                    ? html`
                        <div class="particle-tools">
                          <button class="secondary" @click=${() => act('add')}>
                            Lägg till partikel
                          </button>
                          <button class="text-button" @click=${() => act('reset')}>
                            Återställ meningen
                          </button>
                        </div>
                        ${
                          editor
                            ? html`<div
                                class="particle-editor"
                                role="region"
                                aria-label="Partikelverktyg"
                              >
                                <p role="status">
                                  ${placing ? 'Välj ett plustecken i meningen som placering.' : choosing ? 'Välj partikel:' : html`Vald partikel: <strong lang="ja">${selectedToken?.text}</strong>`}
                                </p>
                                <div class="particle-tools">
                                  ${
                                    editor.mode === 'selected'
                                      ? html` <button
                                            class="secondary"
                                            @click=${() => act('replace', { id: editor.id })}
                                          >
                                            Byt
                                          </button>
                                          <button
                                            class="secondary"
                                            @click=${() => act('remove', { id: editor.id })}
                                          >
                                            Ta bort
                                          </button>
                                          <button
                                            class="secondary"
                                            @click=${() => act('move', { id: editor.id })}
                                          >
                                            Flytta
                                          </button>`
                                      : ''
                                  }
                                  ${choosing ? particleChoices.map((text) => html`<button class="particle-option secondary" lang="ja" @click=${() => act('choice', { text })}>${text}</button>`) : ''}
                                  <button class="text-button" @click=${() => act('cancel')}>
                                    Avbryt
                                  </button>
                                </div>
                              </div>`
                            : ''
                        }
                      `
                    : html`
                        <div
                          class="feedback ${state.marking.ok && state.correctionOk ? 'good' : 'again'}"
                          role="status"
                        >
                          <h3>
                            ${state.marking.ok && state.correctionOk ? 'Båda stegen är rätt!' : 'Jämför dina två steg'}
                          </h3>
                          <p>
                            Steg 1: ${state.marking.ok ? 'Rätt' : 'Behöver övas'} —
                            ${state.marking.right.length} rätt markerade,
                            ${state.marking.wrong.length} fel markerade,
                            ${state.marking.missed.length} missade.
                          </p>
                          <p>
                            Steg 2:
                            ${state.correctionOk ? 'Rätt mening' : 'Meningen behöver rättas'}.
                          </p>
                          <p>
                            <strong>Godtaget svar:</strong>
                            <span lang="ja">${q.answers.join(' / ')}</span>
                          </p>
                          <p>${languageText(q.explanation)}</p>
                          ${speechButton(ctx, q.answers[0], 'Lyssna på svaret')}
                        </div>
                        ${ratings()}
                      `
                }
              `
        }
        <div class="question-actions">
          ${s.index > 0 ? html`<button class="secondary" @click=${() => ctx.jump(s.index - 1)}>Föregående</button>` : html`<span></span>`}
          ${
            state.stage === 'mark'
              ? html`<button class="primary" @click=${() => act('check-mark')}>
                  Rätta ${icon('Check')}
                </button>`
              : state.stage === 'marked'
                ? html`<button class="primary" @click=${() => act('continue')}>
                    Till steg 2 ${icon('ChevronRight')}
                  </button>`
                : state.stage === 'edit'
                  ? html`<button class="primary" @click=${() => act('check-edit')}>
                      Rätta meningen ${icon('Check')}
                    </button>`
                  : html`<button class="primary" @click=${ctx.next}>
                      ${s.index === s.ids.length - 1 ? 'Visa resultat' : 'Nästa fråga'}
                      ${icon('ChevronRight')}
                    </button>`
          }
        </div>
      </section>`,
    )}
  `;
}

const PARTICLE_GUIDE_DATA = [
  {
    char: 'は',
    romaji: 'wa',
    name: 'Tema & Ämne',
    description:
      'Markerar samtalsämnet – det som satsen handlar om ("Vad gäller X..."). Ersätter ofta が och を i nekade satser för att skapa kontrast.',
    contrast: 'は (känd information / tema) vs が (ny information / specifikt subjekt)',
    exampleJp: 'わたしは がくせいです。',
    exampleSv: 'Jag är student.',
  },
  {
    char: 'が',
    romaji: 'ga',
    name: 'Grammatiskt subjekt & Fokus',
    description:
      'Markerar det grammatiska subjektet som utför handlingen eller introduceras som ny information. Används obligatoriskt med adjektiv för tycke/kunskap (好き, 上手) och existensverb (ある, いる).',
    contrast:
      'が markerar vem eller vad som finns/agerar; を markerar vad som utsätts för handlingen.',
    exampleJp: 'あそこに ねこが います。',
    exampleSv: 'Det finns en katt där borta.',
  },
  {
    char: 'を',
    romaji: 'o',
    name: 'Direkt objekt',
    description:
      'Markerar det direkta objektet som påverkas av ett transitivt verb (läsa, äta, köpa). Skrivs med hiragana を men uttalas "o".',
    contrast:
      'Står alltid före transitiva verb. Vid rörelseverb kan を ange platsen man passerar (t.ex. korsa gatan).',
    exampleJp: 'ほんを よみます。',
    exampleSv: 'Jag läser en bok.',
  },
  {
    char: 'に',
    romaji: 'ni',
    name: 'Tid, Destination & Existens',
    description:
      'Anger en exakt tidpunkt (klockslag, datum), destination för en rörelse (åka till) eller platsen för existens med ある/いる.',
    contrast:
      'に anger stillastående existens eller tidpunkt; で anger plats för en aktiv handling.',
    exampleJp: '7じに おきて、がっこうに いきます。',
    exampleSv: 'Jag vaknar klockan 7 och åker till skolan.',
  },
  {
    char: 'で',
    romaji: 'de',
    name: 'Handlingsplats, Medel & Verktyg',
    description:
      'Markerar platsen där en aktivitet utspelar sig, samt färdmedel (tåg, buss) eller verktyg/språk (papper, japanska).',
    contrast:
      'で markerar var aktiviteten sker; に anger var någon befinner sig eller destination.',
    exampleJp: 'としょかんで にほんごを べんきょうします。',
    exampleSv: 'Jag studerar japanska på biblioteket.',
  },
  {
    char: 'へ',
    romaji: 'e',
    name: 'Riktning',
    description:
      'Betonar förflyttningens riktning ("mot / i riktning mot"). Skrivs med hiragana へ men uttalas "e".',
    contrast: 'へ betonar färdriktningen; に betonar ankomsten och slutdestinationen.',
    exampleJp: 'きょうは うちへ かえります。',
    exampleSv: 'Idag åker jag hemåt.',
  },
  {
    char: 'と',
    romaji: 'to',
    name: 'Sällskap & Och',
    description:
      'Markerar den person eller part man utför något tillsammans med ("med"), samt fullständig uppräkning av substantiv.',
    contrast:
      'と räknar upp allt ("A och B"); や används vid ofullständig uppräkning ("bland annat A och B").',
    exampleJp: 'ともだちと えいがを みました。',
    exampleSv: 'Jag såg en film tillsammans med en vän.',
  },
  {
    char: 'も',
    romaji: 'mo',
    name: 'Också & Även',
    description:
      'Ersätter partiklarna は, が och を för att betyda "också". Kombineras efter に eller で (t.ex. にも, でも).',
    contrast: 'Ersätter は/が/を direkt utan att dubbleras (inte *はも).',
    exampleJp: 'わたしも がくせいです。',
    exampleSv: 'Jag är också student.',
  },
  {
    char: 'の',
    romaji: 'no',
    name: 'Ägande & Modifierare',
    description:
      'Knyter samman två substantiv: N1 の N2, där N1 beskriver eller äger N2 (min bok, japansk lärare, bilens färg).',
    contrast: 'Det bestämmande/beskrivande ordet står alltid före の.',
    exampleJp: 'これは わたしの ほんです。',
    exampleSv: 'Det här är min bok.',
  },
  {
    char: 'から · まで',
    romaji: 'kara / made',
    name: 'Från och Till',
    description:
      'Anger startpunkt (から, från) och slutpunkt (まで, till) i tid, rum eller omfång.',
    contrast: 'Kan användas som ett sammansatt par (9:00 till 17:00) eller var och en för sig.',
    exampleJp: 'くじから ごじまで はたらきます。',
    exampleSv: 'Jag arbetar från klockan nio till klockan fem.',
  },
];

export function particlesView(ctx) {
  const isSakura = ctx.theme === 'sakura';

  return html`
    <div class="view-breadcrumb">
      <button class="text-button" @click=${() => ctx.navigate('home')}>
        ${icon('ArrowLeft')} Tillbaka till studierummet
      </button>
      <button class="text-button" @click=${() => ctx.navigate('vocabulary')}>
        Genki Ordförråd ${icon('ChevronRight')}
      </button>
    </div>

    ${heading(
      'PARTIKLAR · 助詞',
      'Partikelguide & Träning',
      'Översikt över alla japanska partiklar med regler, kontraster och interaktiva övningar.',
    )}
    ${
      isSakura
        ? html`
            <div class="anime-figure particle-anime-banner-card" aria-hidden="true">
              <img src="/anime/mascot_peek.jpg" alt="Mascot peek" loading="lazy" />
              <div class="particle-anime-copy">
                <span class="particle-anime-badge">🌸 助詞完全攻略 · JOSHI MASTER 🌸</span>
                <span class="particle-anime-omamori">助詞マスター ✨</span>
                <h3>助詞を制する者は日本語を制す！💮✨</h3>
                <p>
                  助詞のニュアンス、いっしょにマスターしようね！🎀 Bemästra partiklarnas magiska
                  nyanser! 💕
                </p>
              </div>
            </div>
            <div class="kawaii-particle-tip kawaii-tip-callout" role="note">
              <div class="kawaii-tip-header">
                <span class="kawaii-tip-icon" aria-hidden="true">🎀</span>
                <strong>Kawaii Grammatiktips · に vs で ✨</strong>
              </div>
              <p>
                Lätt att blanda ihop! Använd <code>に</code> för <em>tidpunkt</em> (klockslag,
                dagar) och <em>destination/existens</em>. Använd <code>で</code> för
                <em>plats där en handling sker</em> eller <em>färdmedel/verktyg</em>. Kämpa på,
                senpai! Små tecken gör hela skillnaden! (ง •̀_•́)ง 💕
              </p>
            </div>
          `
        : html`
            <div class="notice">
              ${icon('CircleHelp')}
              <p>
                Partiklar (助詞, joshi) är grammatiska markörer som visar ordens relationer i en
                mening. Klicka på en partikel för att läsa regler och exempel.
              </p>
            </div>
          `
    }

    <section class="particle-launch-box">
      <div class="particle-launch-copy">
        <h2>Träna partiklar i praktiken</h2>
        <p>Ge partiklarna en genomgång med 10 frågor och kontrastiv förklaring vid vanliga fel.</p>
      </div>
      <div class="particle-launch-actions">
        <button class="primary" @click=${() => ctx.start('Partiklar')}>
          Starta partikelpass ${icon('ChevronRight')}
        </button>
        <button class="secondary" @click=${() => ctx.openGuideModal?.('particles')}>
          ${icon('Library')} Snabbguide för partiklar
        </button>
      </div>
    </section>

    <section class="particle-cards-section" aria-label="Partikelöversikt">
      <div class="section-title">
        <h2>Alla kursens partiklar</h2>
        <span class="muted">${PARTICLE_GUIDE_DATA.length} grundpartiklar</span>
      </div>

      <div class="particle-cards-grid">
        ${PARTICLE_GUIDE_DATA.map(
          (p) => html`
            <article class="particle-card" data-particle="${p.char}">
              <div class="particle-card-top">
                <span class="particle-char-chip" lang="ja">${p.char}</span>
                <div class="particle-card-titles">
                  <h3>${p.name}</h3>
                  <span class="particle-romaji">${p.romaji}</span>
                </div>
              </div>
              <p class="particle-desc">${p.description}</p>
              <div class="particle-contrast-note">
                <span class="contrast-badge">Skillnad:</span>
                <span>${p.contrast}</span>
              </div>
              <div class="particle-example-box">
                <div class="example-jp" lang="ja">${p.exampleJp}</div>
                <div class="example-sv muted">${p.exampleSv}</div>
                <div class="card-footer-actions">${speechButton(ctx, p.exampleJp, 'Lyssna')}</div>
              </div>
            </article>
          `,
        )}
      </div>
    </section>
  `;
}
