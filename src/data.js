import { EXERCISE_REFERENCE_DATE } from './config.js';
import { extraQuestions } from './extra-content.js';
import { l1l5Questions } from './l1l5-data.js';
import { calendarDayQuestions } from './calendar-days.js';
import { enrichQuestion } from './pedagogy.js';
import { hayashiExams, hayashiQuestions } from './hayashi-data.js';
export { l1l5Questions, calendarDayQuestions };
export const topics = [
  'Partiklar',
  'Böjningar',
  'Ord & kanji',
  'Grammatikteori',
  'Läsförståelse',
  'Moror & stavelser',
  'Ordföljd',
  'Kana',
  'Dagar',
];
export const questions = [];
const add = (id, topic, prompt, answer, explanation, extra = {}) =>
  questions.push({
    id,
    topic,
    prompt,
    answers: Array.isArray(answer) ? answer : [answer],
    explanation,
    source: 'Kompletterande övning',
    ...extra,
  });
const lesson = [
  [
    'しゅうまつひとりで【　】うみでおよぎました。',
    '×',
    'Luckan står efter ひとりで (ensam). Uttrycket har redan で och behöver ingen extra partikel. うみで anger sedan var simningen sker.',
  ],
  [
    'しゅうまつひとりでうみ【　】およぎました。',
    'で',
    'で markerar platsen där handlingen att simma sker.',
  ],
  [
    'いっしょに【　】だいがくでべんきょうしましょう。',
    '×',
    'いっしょに är redan ett färdigt adverbial.',
  ],
  [
    'いっしょにだいがく【　】べんきょうしましょう。',
    'で',
    'Studierna sker på universitetet: handlingsplats + で.',
  ],
  [
    'あした【　】としょかんでともだちにあいます。',
    '×',
    'Relativa tidsord som あした brukar stå utan に.',
  ],
  ['あしたとしょかん【　】ともだちにあいます。', 'で', 'Biblioteket är platsen för mötet.'],
  ['あしたとしょかんでともだち【　】あいます。', 'に', 'Personen man träffar markeras här med に.'],
  ['Tシャツ【　】いちまいください。', 'を', 'を markerar det man ber att få.'],
  [
    'Tシャツをいちまい【　】ください。',
    '×',
    'Räkneuttrycket いちまい behöver ingen extra partikel.',
  ],
  ['こうえん【　】いきませんか。', 'に', 'に anger målet för förflyttningen. へ fungerar också.'],
  ['ごぜん９じ【　】バスにのります。', 'に', 'En bestämd tidpunkt markeras med に.'],
  [
    'ごぜん９じにバス【　】のります。',
    'に',
    'Fordonet man stiger på markeras med に tillsammans med のります.',
  ],
  [
    'こうこう【　】とき、あまりデートをしませんでした。',
    'の',
    'Substantiv + の + とき: under gymnasietiden.',
  ],
  [
    'こうこうのとき、あまり【　】デートをしませんでした。',
    '×',
    'あまり är ett adverb och behöver ingen partikel.',
  ],
  ['こうこうのとき、あまりデート【　】しませんでした。', 'を', 'デートをする: gå på dejt.'],
  [
    'ソラさん【　】えいごとにほんごがわかります。',
    'は',
    'は presenterar Sora som ämne för meningen.',
  ],
  [
    'ソラさんはえいご【　】にほんごがわかります。',
    'と',
    'と räknar upp två substantiv: engelska och japanska.',
  ],
  [
    'ソラさんはえいごとにほんご【　】わかります。',
    'が',
    'Det som förstås markeras med が vid わかります.',
  ],
  [
    'しゅくだいはとても【　】むずかしかったです。',
    '×',
    'とても modifierar adjektivet utan partikel.',
  ],
  [
    'きのう【　】せんせいにききました。',
    '×',
    'きのう är en relativ tidsangivelse och står normalt utan に.',
  ],
  ['きのうせんせい【　】ききました。（frågade）', 'に', 'に markerar personen som får frågan.'],
  ['まいにち【　】たいてい７じごろにおきます。', '×', 'まいにち används utan tidspartikeln に.'],
  ['まいにちたいてい【　】７じごろにおきます。', '×', 'たいてい är ett adverb.'],
  [
    'まいにちたいてい７じごろ【　】おきます。',
    'に',
    'Facit använder に efter den ungefärliga klocktiden.',
  ],
  ['ソラさんはいぬ【　】だいきらいです。', 'が', 'Det man ogillar markeras med が vid きらい.'],
  ['げつようび【　】きんようびはいそがしいです。', 'と', 'と binder ihop måndag och fredag.'],
  [
    'げつようびときんようび【　】いそがしいです。',
    'は',
    'は gör de två dagarna till meningens ämne.',
  ],
];
lesson.forEach(([p, a, e], i) =>
  add(`l5-${i + 1}`, 'Partiklar', p, i === 9 ? ['に', 'へ'] : a, e, {
    source: 'Lesson5 · lucka ' + (i + 1),
    official: true,
    choices: ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も', 'へ', '×'],
  }),
);
[
  [
    'きのうとしょかんでにほんごをべんきょうしました。うちもにほんごをべんきょうしました。',
    'Falskt',
    'För att säga ”hemma också” behåll platspartikeln: うちでもにほんごをべんきょうしました。',
  ],
  [
    'こうこうのとき、よくバスていのちかくでたけしさんにあいました。',
    'Sant',
    'の binder ihop substantiv; で markerar mötesplatsen och に personen man träffade.',
  ],
  [
    'おてらでしゃしんたくさんをとりました。',
    'Falskt',
    'Skriv exempelvis おてらでしゃしんをたくさんとりました。 eller たくさんのしゃしんをとりました。',
  ],
  [
    'まいにち７じはんぐらいねます。',
    'Falskt',
    'Skilj klockslag från varaktighet. ”Jag sover cirka 7,5 timmar varje dag”: まいにち７じかんはんぐらいねます。 ”Jag lägger mig vid halv åtta”: まいにち７じはんごろにねます。',
  ],
  [
    'よくスーパーでにくとやさいをかいます。',
    'Sant',
    'で anger handlingsplats, と förbinder kött och grönsaker, を markerar det som köps.',
  ],
  [
    'きょうカフェでコーヒーをのみました。きのうもカフェでもコーヒーをのみました。',
    'Falskt',
    'Om avsikten bara är ”igår också” är det naturliga きのうもカフェでコーヒーをのみました。 Det ytterligare も efter で kräver sammanhanget ”på kafé också, utöver en annan plats”.',
  ],
].forEach(([p, a, e], i) =>
  add(
    `l5-review-${i + 1}`,
    'Partiklar',
    `Bedöm meningen och föreslå en rättelse vid behov.\n${p}`,
    a,
    e,
    { source: 'Lesson5 · rätt eller fel ' + (i + 1), self: true, model: e },
  ),
);
[
  ['としょかん【　】本を読みます。', 'で', 'で visar var en handling sker.'],
  ['としょかん【　】本があります。', 'に', 'に visar var något finns.'],
  ['日本語【　】手紙を書きます。', 'で', 'Språket används som medel.'],
  ['パン【　】食べます。', 'を', 'Det som äts är direkt objekt.'],
  ['わたし【　】学生です。', 'は', 'は markerar temat: vad meningen handlar om.'],
  ['だれ【　】来ますか。', 'が', 'Frågeord som subjekt följs normalt av が.'],
  ['わたし【　】学生です。（jag också）', 'も', 'も betyder också.'],
  ['ともだち【　】映画を見ました。', 'と', 'と anger vem man gör något tillsammans med.'],
  ['バス【　】学校に行きます。', 'で', 'で anger transportmedlet.'],
  ['わたし【　】本です。', 'の', 'の binder ihop ägare och ägodel.'],
  ['７時【　】起きます。', 'に', 'に anger en bestämd tid.'],
  ['あした【　】学校に行きます。', '×', 'あした behöver normalt ingen tidspartikel.'],
  ['コーヒー【　】好きです。', 'が', '好き beskriver vad man tycker om med が.'],
  ['「ありがとう」【　】言います。', 'と', 'と markerar ett citat.'],
  ['これは本です【　】。（fråga）', 'か', 'か gör meningen till en fråga.'],
].forEach(([p, a, e], i) =>
  add('p-' + i, 'Partiklar', p, a, e, {
    choices: ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も', 'か', '×'],
  }),
);
[
  ['たかい → artig dåtid', 'たかかったです', 'Ta bort い och lägg till かったです.'],
  [
    'たかい → artig negation',
    ['たかくないです', 'たかくありません'],
    'Ta bort sista い: たかい → たか. Lägg till くないです eller くありません. Båda uttrycker artig negation utan dåtid.',
  ],
  [
    'たかい → artig negativ dåtid',
    ['たかくなかったです', 'たかくありませんでした'],
    'Börja med negationen たかくない och böj ない till なかった: たかくなかったです. Även たかくありませんでした är artig negativ dåtid.',
  ],
  [
    'いい → artig dåtid',
    'よかったです',
    'いい böjs oregelbundet från よい. Ta bort sista い och lägg till かったです: よい → よかったです. Skriv alltså inte いいでした.',
  ],
  [
    'いい → artig negation',
    ['よくないです', 'よくありません'],
    'いい är oregelbundet och böjs från よい: よい → よくないです eller よくありません. Behåll alltså inte いい framför negationsändelsen.',
  ],
  [
    'しずか → artig dåtid',
    'しずかでした',
    'しずか är ett na-adjektiv. Behåll ordet och byt kopulan です mot dåtidsformen でした: しずかです → しずかでした.',
  ],
  [
    'しずか → artig negation',
    ['しずかじゃないです', 'しずかではないです', 'しずかではありません', 'しずかじゃありません'],
    'しずか är ett na-adjektiv. Behåll しずか och byt です mot じゃないです eller ではありません. Även ではないです och じゃありません fungerar. Använd inte i-adjektivens くない direkt efter しずか.',
  ],
  ['En lugn stad: しずか【　】まち', 'な', 'Na-adjektiv får な framför substantiv.'],
  ['En dyr bok: たかい【　】本', '×', 'I-adjektiv står direkt framför substantiv.'],
  [
    'たべます → artig dåtid',
    'たべました',
    'Behåll verbstammen たべ och byt ます mot ました: たべます → たべました. Det ger artig dåtid utan negation.',
  ],
  [
    'いきます → artig negativ dåtid',
    'いきませんでした',
    'Behåll verbstammen いき och byt ます mot ませんでした: いきませんでした. ません står för negation och でした för dåtid; いきました skulle sakna negationen.',
  ],
  ['Föreslå: ”Vi äter!”', ['たべましょう', '食べましょう'], 'Verbstam + ましょう är ett förslag.'],
  [
    'Erbjud: ”Ska jag hjälpa till?”',
    ['てつだいましょうか', '手伝いましょうか'],
    'ましょうか används bland annat för erbjudanden.',
  ],
  [
    'Vilken räknare används för tunna, platta saker?',
    ['枚', 'まい'],
    '枚（まい）används för exempelvis papper och T-tröjor.',
  ],
].forEach(([p, a, e], i) =>
  add('b-' + i, 'Böjningar', p, a, e, {
    choices: i === 7 ? ['な', 'の', 'い', '×'] : i === 8 ? ['な', 'の', 'い', '×'] : undefined,
  }),
);
export const exams = [
  ...hayashiExams,
  {
    id: 'gema70',
    title: 'Gotoせんせい tenta',
    subtitle: 'Grammatik · maj 2026',
    description: 'Skriftsystem, ordklasser, partiklar, ordföljd och ljudsystem.',
    pages: 6,
    points: 100,
  },
  {
    id: 'goto-mock',
    title: 'Goto-sensei Mocktenta',
    subtitle: 'JAPC11/JAPD02 · Grammatik 1 模試',
    description: 'Skriftsystem, ordklasser, partiklar, ordföljd och ljudsystem. Extratenta från Goto-sensei.',
    pages: 6,
    points: 100,
  },
  {
    id: 'japc11',
    title: 'JAPC11',
    subtitle: 'Grammatik 1 · oktober 2024',
    description: 'Grammatikteori, fraser, romanisering och språkljud. Essäsvar på engelska.',
    pages: 7,
    points: 100,
  },
  {
    id: 'reading',
    title: 'Muraoせんせい tenta',
    subtitle: 'Läsning & skrivning · maj 2026',
    description: 'Ord, kanji, läsförståelse och egna meningar på japanska.',
    pages: 12,
    points: 100,
  },
];
export const examQuestions = [...hayashiQuestions];
function eq(exam, id, page, prompt, model, extra = {}) {
  const q = {
    id: `${exam}-${id}`,
    exam,
    page,
    prompt,
    model,
    topic: 'Grammatikteori',
    source: `${exam.toUpperCase()} · ${id}`,
    self: true,
    ...extra,
  };
  examQuestions.push(q);
  return q;
}
const writing =
  'Hiragana och katakana är fonografiska: tecknen återger huvudsakligen moror. Hiragana används bl.a. för partiklar och böjningsändelser (は、たべる); katakana för lånord (コーヒー). Kanji är i modern beskrivning morfografiska/logografiska och representerar betydelsebärande enheter, inte enbart idéer. Tentans term ideographic syftar på betydelseaspekten. Pictograph betyder bildtecken: 山 har historiskt en bergliknande form. Alla kanji är inte bildtecken.';
const readings =
  'On-yomi är läsningar med kinesiskt ursprung; kun-yomi är inhemska japanska ord kopplade till tecknets betydelse. Olika lånperioder och användningar har gett flera läsningar. 山: サン i 富士山（ふじさん）, やま när ordet står ensamt.';
eq(
  'gema70',
  '1.1',
  1,
  'Beskriv de tre skriftsystemen. Förklara phonographic, ideographic och pictograph och ge exempel.',
  writing,
  { points: 10 },
);
eq(
  'gema70',
  '1.2',
  2,
  'Varför har kanji ofta flera läsningar? Namnge grupperna och ge ett exempel.',
  readings,
  { points: 12 },
);
eq(
  'gema70',
  '1.3',
  2,
  'När används hiragana, katakana och kanji? Ge minst ett exempel för varje.',
  writing,
  { points: 10 },
);
[
  ['ともだちは', 'tomodachi wa'],
  ['とうきょうへ', ['tookyoo e', 'tōkyō e', 'toukyou e']],
  ['アニメ', 'anime'],
  ['を', 'o'],
].forEach(([p, a], i) =>
  eq(
    'gema70',
    '1.4-' + (i + 1),
    3,
    `Romanisera: ${p}`,
    `は uttalas wa, へ uttalas e och を uttalas o när de är partiklar. Långa vokaler ska återges.`,
    { self: false, answers: Array.isArray(a) ? a : [a], points: 2, topic: 'Ord & kanji' },
  ),
);
const classes = [
  'Noun',
  'Verb',
  'Adjective',
  'Adverb',
  'Pronoun',
  'Particle',
  'numerical classifier',
  'ideophone',
];
[
  ['Tシャツ', 'Noun'],
  ['まい', 'numerical classifier'],
  ['か', 'Particle'],
  ['あの', 'Pronoun'],
  ['かわいい', 'Adjective'],
  ['かいました', 'Verb'],
  ['ぜんぜん', 'Adverb'],
  ['です', 'Verb'],
  ['の', 'Particle'],
  ['ねこ', 'Noun'],
  ['ニャーニャー', 'ideophone'],
  ['と', 'Particle'],
  ['たくさん', 'Adverb'],
  ['が', 'Particle'],
  ['ザーザー', 'ideophone'],
].forEach(([p, a], i) =>
  eq(
    'gema70',
    '2-' + (i + 1),
    3,
    `Ange ordklass för ${p} i originalmeningen.`,
    p === 'あの'
      ? 'I tentans alternativ ligger Pronoun närmast. Mer precist är あの ett adnominalt/demonstrativt bestämningsord.'
      : p === 'です'
        ? 'です är kopula. Tentans begränsade alternativ kan behandla den under Verb; kontrollera lärarens terminologi.'
        : `${p}: ${a}.`,
    { self: ['あの', 'です'].includes(p), answers: [a], choices: classes, points: 1 },
  ),
);
const functionsList = [
  'Topic',
  'Subject',
  'Listing things',
  'Object',
  'Do things together with',
  'Tool',
  'Location of action',
  'Point of time',
  'Location of existence',
  'Quotation',
  'Question',
  'Also',
  'Assertion',
  'Possessive / nominal phrase',
  'Direction',
];
const particleExam = [
  ['わたしのすきなアニメ【は】ハイキューとワンパンマンです。', 'Topic'],
  ['ハイキュー【と】ワンパンマンです。', 'Listing things'],
  ['どようび【の】ごご７じにともだちとホラーえいがをみました。', 'Possessive / nominal phrase'],
  ['ごご７じ【に】ともだちとホラーえいがをみました。', 'Point of time'],
  ['ともだち【と】ホラーえいがをみました。', 'Do things together with'],
  ['ホラーえいが【を】みました。', 'Object'],
  ['しんかんせん【で】きょうとへいきました。', 'Tool'],
  ['きょうと【へ】いきました。', 'Direction'],
  ['たいていどこ【で】べんきょうしますか。', 'Location of action'],
  ['べんきょうします【か】。', 'Question'],
  ['ルンド【に】はおおきいきょうかいがあります。', 'Location of existence'],
  ['きょうかい【が】あります。', 'Subject'],
  ['スウェーデンご【と】えいごのべんきょうはたのしいですよ！', 'Listing things'],
  ['スウェーデンごとえいごのべんきょう【は】たのしいですよ！', 'Topic'],
  ['きょねん、日本【に】いきました。', 'Direction'],
  ['たのしいです【よ】！', 'Assertion'],
  ['わたし【も】', 'Also'],
  ['「ありがとう。」【と】かぞくにいいます。', 'Quotation'],
];
particleExam.forEach(([p, a], i) =>
  eq(
    'gema70',
    '3-' + (i + 1),
    4,
    `Vilken funktion har den markerade partikeln?\n${p}`,
    `Funktionen är ${a}.`,
    { self: false, answers: [a], choices: functionsList, topic: 'Partiklar', points: 1 },
  ),
);
const sovG = [
  ['みせでおまんじゅうをかいました。', 'O: おまんじゅう; V: かいました. Subjektet är utelämnat.'],
  ['あした、なにをしますか。', 'O: なに; V: します. Subjektet är utelämnat.'],
  ['ねこはまいにちたくさんねます。', 'S/tema: ねこ; V: ねます. Inget objekt.'],
  [
    'きょうとでたくさんのおてらのしゃしんをとりました。',
    'O: たくさんのおてらのしゃしん; V: とりました. Subjektet är utelämnat.',
  ],
  [
    'にほんのしぶやはとてもにぎやかなまちです。',
    'Tema: にほんのしぶや. Predikat: とてもにぎやかなまちです. です är kopula; inget direkt objekt.',
  ],
  [
    'わたしのすきなたべものはチーズとハンバーガーです。',
    'Tema: わたしのすきなたべもの. Predikat: チーズとハンバーガーです. Inget direkt objekt.',
  ],
  [
    'しゅうまつはたいていなにをしますか。',
    'O: なに; V: します. しゅうまつ är tidstema, inte den som utför handlingen.',
  ],
  ['いっしょにおよぎましょう！', 'V: およぎましょう. Subjektet är underförstått; inget objekt.'],
];
sovG.forEach(([p, m], i) =>
  eq('gema70', '4-' + (i + 1), 5, `Identifiera S, O och V.\n${p}`, m, { points: 2 }),
);
[
  ['ルンド', '2, 3'],
  ['ワンパンマン', '3, 6'],
  ['なっとう', '2, 4'],
  ['えいが', '2, 3'],
].forEach(([p, a], i) =>
  eq(
    'gema70',
    '5-' + (i + 1),
    5,
    `Antal stavelser och moror i ${p}? Skriv exempelvis 2, 3.`,
    `Svar: ${a}. ん, första delen av en dubbel konsonant och den andra delen av en lång vokal räknas som egna moror.`,
    { self: false, answers: [a, a.replace(', ', '/')], points: 2 },
  ),
);
[
  [
    'Japanska har SOV som standard, men även VOS används.',
    'Falskt',
    'Neutral ordföljd är SOV. Meningen gäller kursens grundmönster; efterställda led kan förekomma i spontant tal.',
  ],
  [
    'Japanska, engelska och svenska använder alla pitch accent.',
    'Falskt',
    'Engelska har normalt ett stressbaserat system, inte lexikal pitch accent som japanska.',
  ],
  [
    'När ord lånas läggs ofta konsonanter till för japansk stavelsestruktur.',
    'Falskt',
    'Det är ofta vokaler som skjuts in, exempelvis för att bryta upp konsonantkluster.',
  ],
].forEach(([p, a, m], i) =>
  eq('gema70', '6-' + (i + 1), 6, p, m, {
    self: false,
    answers: [a],
    choices: ['Sant', 'Falskt'],
    points: 1,
  }),
);

// Goto-mock (JAPC11/JAPD02 Grammatik 1 Mock tentan 模試, Natsumi Goto)
eq(
  'goto-mock',
  '1.1',
  1,
  'Beskriv japanskans tre skriftsystem.\n• Förklara betydelsen av termerna i ditt svar.\n• Ge exempel på japanska tecken från varje skriftssystem i ditt svar.\nTermer: phonographic, ideographic, pictographic',
  'Hiragana och katakana är fonografiska (phonographic): tecknen representerar språkljud (moror) snarare än betydelser. Hiragana används bl.a. för böjningsändelser och partiklar (t.ex. は、たべる); katakana för lånord och onomatopoetiska ord (t.ex. コーヒー). Kanji är ideografiska (ideographic) / morfografiska: de representerar betydelsebärande enheter eller begrepp (t.ex. 木 för träd, 山 för berg). Vissa kanji är ursprungligen piktografiska (pictographic): bildtecken som avbildar konkreta föremål (t.ex. 山 som liknar bergstoppar, 川 som liknar en flod). Lärarens anvisning: se till att definiera alla tre termerna tydligt och inkludera japanska tecken som exempel för varje system!',
  { points: 10, topic: 'Grammatikteori' },
);
eq(
  'goto-mock',
  '1.2',
  2,
  'Förklara om Kanji läsningar:\n• Förklara varför det ofta finns två eller fler läsningar/uttal av ett samma kanji-tecken.\n• Nämn namnet på de två grupperna som de olika läsningarna av kanji-tecken brukar sorteras in i.\n• Förklara/skriv minst ett kanji-tecken från Genki-boken som exempel på hur ett visst tecken kan läsas på flera olika sätt.',
  'Kanji har ofta flera läsningar eftersom de lånades in från Kina vid olika historiska tidpunkter och anpassades till det redan existerande inhemska japanska språket. De två grupperna är On-yomi (音読み, läsningar med kinesiskt ursprung) och Kun-yomi (訓読み, inhemska japanska läsningar). Exempel från Genki: 山 (kun-läsning: やま när tecknet står ensamt; on-läsning: サン i sammansättningar som 富士山 ふじさん); eller 日 (kun-läsning: ひ; on-läsning: にち i 日本 にほん eller じつ). Skriv faktiska japanska tecken i svaret enligt lärarens instruktion!',
  { points: 9, topic: 'Grammatikteori' },
);

[
  [
    'びょういんはここです。',
    ['byōin wa koko', 'byooin wa koko', 'byôin wa koko', 'byoin wa koko'],
    'びょういん romaniseras byōin (eller byooin). Partikeln は uttalas och romaniseras "wa" (aktuellt uttal, inte "ha").',
  ],
  [
    'だいがくへじてんしゃでいきます。',
    ['daigaku e jitensha', 'daigaku e ji ten sha', 'daigaku e jiten sha'],
    'Partikeln へ uttalas och romaniseras "e" (aktuellt uttal, inte "he"). じてんしゃ romaniseras jitensha.',
  ],
  [
    'わたしはとしょかんでべんきょうします。',
    ['watashi wa toshokan'],
    'わたしはとしょかん romaniseras "watashi wa toshokan". Partikeln は romaniseras "wa".',
  ],
].forEach(([p, a, exp], i) =>
  eq(
    'goto-mock',
    '1.3-' + (i + 1),
    2,
    `Romanisera BARA de understrukna orden:\n${p}`,
    exp,
    { self: false, answers: a, points: 2, topic: 'Ord & kanji' },
  ),
);

const mockWordClasses = [
  ['あそこ', 'Pronoun', 'あそこ は しずか です。'],
  ['しずか', 'Adjective', 'あそこ は しずか です。'],
  ['で', 'Particle', 'どこ で パン を かいました か。'],
  ['パン', 'Noun', 'どこ で パン を かいました か。'],
  ['か', 'Particle', 'どこ で パン を かいました か。'],
  ['つめたい', 'Adjective', 'つめたい おみず を がぶがぶ のみました。'],
  ['がぶがぶ', 'ideophone', 'つめたい おみず を がぶがぶ のみました。'],
  ['に', 'Particle', 'バス が いちじ に きます。'],
  ['きます', 'Verb', 'バス が いちじ に きます。'],
  ['とても', 'Adverb', 'これ は とても たかい ケーキ です。'],
  ['たかい', 'Adjective', 'これ は とても たかい ケーキ です。'],
  ['です', 'Verb', 'これ は とても たかい ケーキ です。'],
  ['さつ', 'numerical classifier', 'ノート を ２さつ ください。'],
  ['これ', 'Pronoun', '「これは いくらですか。」'],
  ['ざーざー', 'ideophone', 'あめ(regn) が ざーざー ふります(falla)。'],
  ['がくせい', 'Noun', 'がくせい が １０にん います。'],
  ['にん', 'numerical classifier', 'がくせい が １０にん います。'],
  ['よく', 'Adverb', 'よく おんがく を ききます か。'],
];

mockWordClasses.forEach(([word, ans, context], i) =>
  eq(
    'goto-mock',
    '2-' + (i + 1),
    3,
    `Ange ordklass för ${word} i originalmeningen.\nMening: ${context}`,
    `${word}: ${ans}. ${context}`,
    {
      self: false,
      answers: [ans],
      choices: classes,
      points: 1,
      topic: 'Ord & kanji',
    },
  ),
);

const particleMockChoices = [
  'A. Topic',
  'B. Subjekt',
  'C. Lista substantiv',
  'D. Direkt objekt',
  'E. Medaktör (göra tillsammans)',
  'F. Redskap/medel (tool)',
  'G. Handlingsplats',
  'H. Tid/Datum',
  'I . Befintlighet',
  'J. Citatmarkör',
  'K. Indirekt objekt (mottagare)',
  'L. Mål/direktion',
  'M. Understryka',
  'N. Binda substantiv och bilda fras',
  'O. Också',
];

const mockParticles = [
  ['たんじろう【は】ひとりで山にいきます。', 'A. Topic', 'たんじろう は markerar samtalsämnet/temat.'],
  ['たんじろうはひとりで山【に】いきます。', 'L. Mål/direktion', 'に markerar destination/rörelsemål tillsammans med verbet いきます.'],
  ['カオナシは「あ…あ…」【と】いいました。', 'J. Citatmarkör', 'と fungerar som citatmarkör efter yttrandet.'],
  ['トトロは木の下【で】まちます。', 'G. Handlingsplats', 'で markerar handlingsplatsen (木の下) där handlingen まちます sker.'],
  ['コナン【の】めがねはとてもべんりですよ。', 'N. Binda substantiv och bilda fras', 'の binder ihop två substantiv (Konans glasögon) och bildar en fras.'],
  ['コナンのめがねはとてもべんりです【よ】。', 'M. Understryka', 'よ understryker och framhäver information för lyssnaren.'],
  ['リヴァイさん【が】おちゃをルンドでかいました。', 'B. Subjekt', 'が markerar meningssubjektet (vem som köpte teet).'],
  ['リヴァイさんがおちゃ【を】ルンドでかいました。', 'D. Direkt objekt', 'を markerar det direkta objektet (vad som köptes).'],
  ['リヴァイさんがおちゃをルンド【で】かいました。', 'G. Handlingsplats', 'で markerar handlingsplatsen (Lund) där köpet genomfördes.'],
  ['えき【へ】じてんしゃでいきます。', 'L. Mål/direktion', 'へ anger riktning/mål för förflyttningen.'],
  ['えきへじてんしゃ【で】いきます。', 'F. Redskap/medel (tool)', 'で markerar transportmedel/redskap (med cykel).'],
  ['アーニャ【も】夜 18 時からスパイのアニメをみます。', 'O. Också', 'も betyder "också" (Anya ser också på anime).'],
  ['アーニャも夜 18 時からスパイ【の】アニメをみます。', 'N. Binda substantiv och bilda fras', 'の binder samman substantiven スパイ och anime.'],
  ['スウェーデン人はたいていスウェーデン語【と】英語を話す。', 'C. Lista substantiv', 'と binder ihop och listar två substantiv (svenska och engelska).'],
  ['スウェーデン人はたいていスウェーデン語と英語【を】話す。', 'D. Direkt objekt', 'を markerar det direkta objektet för verbet 話す.'],
  ['今日１５時【に】ともだちとフィーカを SOL のカフェでします。', 'H. Tid/Datum', 'に markerar en specifik tidpunkt (kl 15).'],
  ['今日１５時にともだち【と】フィーカを SOL のカフェでします。', 'E. Medaktör (göra tillsammans)', 'と markerar sällskap/medaktör (tillsammans med en vän).'],
  ['今日１５時にともだちとフィーカを SOL のカフェ【で】します。', 'G. Handlingsplats', 'で markerar platsen där handlingen (fikat) äger rum.'],
  ['アーニャ【が】 Jultomten にてがみ(brev)をかきました。', 'B. Subjekt', 'が markerar subjektet som utför skrivandet.'],
  ['アーニャが Jultomten 【に】てがみ(brev)をかきました。', 'K. Indirekt objekt (mottagare)', 'に markerar mottagaren av brevet (Jultomten).'],
  ['アーニャが Jultomten にてがみ【を】かきました。', 'D. Direkt objekt', 'を markerar det direkta objektet (brevet).'],
  ['私のかばんの中【に】 Surströmming があります。', 'I . Befintlighet', 'に markerar befintlighetsplatsen för existensverbet あります.'],
  ['私のかばんの中に Surströmming 【が】あります。', 'B. Subjekt', 'が markerar existenssubjektet vid verbet あります.'],
];

mockParticles.forEach(([prompt, ans, exp], i) => {
  const contrastive = Object.fromEntries(
    particleMockChoices
      .filter((c) => c !== ans)
      .map((c) => [c, `Du valde ${c}. Rätt grammatisk funktion är ${ans}: ${exp}`]),
  );
  eq(
    'goto-mock',
    '3-' + (i + 1),
    4,
    `Vilken grammatisk funktion har den markerade partikeln?\n${prompt}`,
    exp,
    {
      self: false,
      answers: [ans],
      choices: particleMockChoices,
      contrastive,
      points: 1,
      topic: 'Partiklar',
    },
  );
});

const mockWordOrder = [
  ['「なんようびに日本語のクラスがありますか。」', 'S: 日本語のクラス; V: あります. Inget objekt. (なんようびに är tidsadverbial).'],
  ['「その T シャツは２０００円です。」', 'Tema: その Tシャツ; Predikat/V: ２０００円です (です är kopula). Inget direkt objekt.'],
  ['すいようびににほんごのクラスがあります。', 'S: にほんごのクラス; V: あります. Inget objekt. (すいようびに är tidsadverbial).'],
  ['きょうとでたくさんのおてらのしゃしんをとりました。', 'O: たくさんのおてらのしゃしん; V: とりました. Subjektet är utelämnat (Jag). (きょうとで är platssadverbial).'],
  ['「公園にもいきました。」', 'V: いきました. Subjektet är utelämnat (Jag). Inget objekt. (公園にも är måladverbial).'],
  ['東京の地下鉄の駅にはたくさん人がいる。', 'S: 人 (eller たくさん人); V: いる. Inget direkt objekt. (東京の地下鉄の駅には är befintlighetsplats).'],
  ['８月にスウェーデンでは kräftor をたべます。', 'O: kräftor; V: たべます. Subjektet är utelämnat (Vi/man). (８月に och スウェーデンでは är tids- och platssadverbial).'],
  ['わたしはイケアでいすとランプ（lampa）をかいました。', 'S/Tema: わたし; O: いすとランプ; V: かいました. (イケアで är handlingsplats).'],
  ['きのうシナモンパンとクッキーをつくりました。', 'O: シナモンパンとクッキー; V: つくりました. Subjektet är utelämnat (Jag). (きのう är tidsadverbial).'],
  ['わたしはたいてい納豆とごはんとたまごを食べます。', 'S/Tema: わたし; O: 納豆とごはんとたまご; V: 食べます. (たいてい är frekvensadverb).'],
  ['あのおいしいスウェーデンのポテトはサシャが一人でたべました。', 'S: サシャ; O/Tema: あのおいしいスウェーデンのポテト; V: たべました. Lärarens facitnot: (あの一ポテト) markeras med は i stället för を eftersom det är topikaliserat som tema i meningsbörjan.'],
];

mockWordOrder.forEach(([p, m], i) =>
  eq(
    'goto-mock',
    '4-' + (i + 1),
    5,
    `Identifiera subjekt (S), objekt (O) och verb (V) i följande mening:\n${p}`,
    m,
    { points: 2, topic: 'Ordföljd' },
  ),
);

[
  [
    'ストックホルム',
    '6, 7',
    'Syllable: 6, Mora: 7. Lilla tsu (っ) kan inte bilda en egen stavelse men räknas som en mora: mora: su-to-tsu-ku-ho-ru-mu (7), stavelse: sut-to-ku-ho-ru-mu (6).',
    ['6, 7', '6/7', '6 / 7', '6,7', '6 stavelser, 7 moror'],
  ],
  [
    'しんじゅく',
    '3, 4',
    'Syllable: 3, Mora: 4. ん räknas som en separat mora: mora: shi-n-ju-ku (4), stavelse: shin-ju-ku (3).',
    ['3, 4', '3/4', '3 / 4', '3,4', '3 stavelser, 4 moror'],
  ],
  [
    'コペンハーゲン',
    '4, 7',
    'Syllable: 4, Mora: 7. Lång vokal (ー) och ん räknas som egna moror: mora: ko-pe-n-ha-a-ge-n (7), stavelse: ko-pen-haa-gen (4).',
    ['4, 7', '4/7', '4 / 7', '4,7', '4 stavelser, 7 moror'],
  ],
].forEach(([word, ans, exp, allAns], i) =>
  eq(
    'goto-mock',
    '5-' + (i + 1),
    6,
    `Antal stavelser och moror i ${word}? Skriv stavelser, moror (t.ex. 6, 7).`,
    exp,
    { self: false, answers: allAns, points: 2, topic: 'Moror & stavelser' },
  ),
);

[
  [
    'Hiragana och Katakana utvecklades från kanji.',
    'Sant',
    'Sant. Både hiragana och katakana utvecklades genom förenkling av kinesiska kanji-tecken (man\'yōgana).',
  ],
  [
    'Japanska pronomen utelämnas oftast i tal och skrift.',
    'Sant',
    'Sant. Japanska är ett pro-drop-språk där personliga pronomen oftast utelämnas när sammanhanget är tydligt.',
  ],
  [
    'Manyogana blandar piktografiska och ideografiska skriftsystem.',
    'Falskt',
    'Falskt. Man\'yōgana använde kanji fonografiskt (phonographic) för att representera japanska ljud, inte ideografiskt.',
  ],
  [
    'En topikmarkörs effekt kan gälla för mer än en mening.',
    'Sant',
    'Sant. Ett etablerat tema (markerat med は) kan förbli samtalsämne över flera efterföljande meningar.',
  ],
  [
    'Rendaku uppstår i sidoordnad sammansättning.',
    'Falskt',
    'Falskt. Rendaku (sekundär stämning) uppstår typiskt i underordnade sammansättningar, inte i sidoordnade sammansättningar.',
  ],
  [
    'I Japan fanns inget språk före Kanji-tecknens ankomst.',
    'Falskt',
    'Falskt. Japan hade ett fullt utvecklat muntligt språk långt före kontakten med Kina och införandet av kanji.',
  ],
].forEach(([statement, ans, exp], i) =>
  eq(
    'goto-mock',
    '6-' + (i + 1),
    6,
    statement,
    exp,
    {
      self: false,
      answers: [ans],
      choices: ['Sant', 'Falskt'],
      points: 1,
      topic: 'Grammatikteori',
    },
  ),
);

eq(
  'japc11',
  '1.1',
  2,
  'Explain why there are two readings in some kanji. Name the readings and give an example. Write 4–5 sentences in English.',
  readings,
  { points: 8 },
);
eq(
  'japc11',
  '1.2',
  2,
  'Explain the three writing systems and their distribution. Use phonographic, ideographic and pictograph; give examples. Write 6–8 sentences in English.',
  writing,
  { points: 10 },
);
[
  ['京都（きょうと）', ['kyōto', 'kyooto', 'kyouto']],
  ['ノート', ['nōto', 'nooto']],
  ['Zasshi', ['ざっし']],
  ['Comban', ['こんばん']],
  ['先生（せんせい）', ['sensei', 'sensee', 'sensē']],
  ['Ōsaka', ['おおさか']],
].forEach(([p, a], i) =>
  eq(
    'japc11',
    '1.3-' + (i + 1),
    3,
    `Byt mellan kana och romaji: ${p}`,
    `Modellsvar: ${a[0]}. ”Comban” återges som こんばん; följ kursens romaniseringskonvention.`,
    { self: false, answers: a, topic: 'Ord & kanji', points: 2 },
  ),
);
eq(
  'japc11',
  '2',
  3,
  'Explain the four Japanese word categories, characteristics and distribution. Give one example each. Write in English.',
  'Wago: inhemska japanska ord, t.ex. やま. Kango: sinojapanska ord, t.ex. 学校. Gairaigo: andra lånord, t.ex. コーヒー. Konshugo: ord med blandat ursprung, t.ex. 消しゴム. Kategorierna handlar om ordens ursprung, inte om ordklasser som verb/substantiv.',
  { points: 10 },
);
[
  ['ごはん', 'Noun'],
  ['を', 'Particle'],
  ['たくさん', 'Adverb'],
  ['たべます', 'Verb'],
  ['かわいい', 'Adjective'],
  ['ねこ', 'Noun'],
  ['が', 'Particle'],
  ['ニャーニャー', 'ideophone'],
  ['とても', 'Adverb'],
  ['むずかしい', 'Adjective'],
  ['つ', 'numerical classifier'],
  ['ありました', 'Verb'],
  ['わたし', 'Pronoun'],
  ['の', 'Particle'],
  ['せんこう', 'Noun'],
  ['です', 'Verb'],
].forEach(([p, a], i) =>
  eq(
    'japc11',
    '2.1-' + (i + 1),
    4,
    `Ange ordklass: ${p}`,
    p === 'です'
      ? 'です は kopula. I tentans alternativ motsvaras det närmast av Verb; kontrollera kursens terminologi.'
      : `${p}: ${a}.`,
    { self: p === 'です', answers: [a], choices: classes, points: 1 },
  ),
);
eq(
  'japc11',
  '3.1',
  5,
  'Explain sentence, clause, phrase, predicate and argument using a Japanese example. Write 6–8 sentences in English.',
  'En sentence är en fullständig mening och kan bestå av en eller flera clauses (satser). En clause innehåller ett predikat och dess argument. En phrase är en grupp ord som fungerar som en enhet. I わたしが本を読みます är 読みます predikatet; わたし och 本 är argument. 本を är en postpositionsfras. Skilj argument från fria tillägg som tid och plats.',
  { points: 10 },
);
[
  ['Största nominalfrasen: わたしのいもうとのかばんです。', 'わたしのいもうとのかばん'],
  ['Största postpositionsfrasen: 日本語の本をよみました。', '日本語の本を'],
  [
    'Verbfrasen: あさ８じにおきました。',
    'おきました (minimal verbfras). あさ８じに är tidsadverbial; större frasgränser beror på kursens analys.',
  ],
  ['Största nominalfrasen: これはアルミンさんの本です。', 'アルミンさんの本'],
  ['Verbfras med endast verb och argument: けんまさんとゲームをしました。', 'ゲームをしました'],
].forEach(([p, m], i) => eq('japc11', '3.2-' + (i + 1), i < 2 ? 5 : 6, p, m, { points: 2 }));
[
  ['８じにかえりました。', 'V: かえりました. Subjektet är utelämnat.'],
  ['エレンさんのいえがありません。', 'S: エレンさんのいえ; V: ありません.'],
  ['きのうかんじとひらがなをべんきょうしました。', 'O: かんじとひらがな; V: べんきょうしました.'],
  ['けんまさんはよくゲームをします。', 'S/tema: けんまさん; O: ゲーム; V: します.'],
  ['しゅうまつはなにをしますか。', 'O: なに; V: します. しゅうまつ är tidstema.'],
  ['ひなたさんは東京でおみやげをかいました。', 'S/tema: ひなたさん; O: おみやげ; V: かいました.'],
].forEach(([p, m], i) =>
  eq('japc11', '4.1-' + (i + 1), i === 5 ? 7 : 6, `Identifiera S, O och V.\n${p}`, m, {
    points: 2,
  }),
);
[
  ['じかん', '2, 3'],
  ['がっこう', '2, 4'],
  ['コーヒー', '2, 4'],
  ['おさけ', '3, 3'],
].forEach(([p, a], i) =>
  eq(
    'japc11',
    '5.1-' + (i + 1),
    7,
    `Antal stavelser och moror i ${p}? Skriv stavelser, moror (t.ex. 2, 3).`,
    `Svar: ${a}. Räkna långa vokaler, ん och っ som extra moror, men inte extra stavelser.`,
    { self: false, answers: [a, a.replace(', ', '/')], points: 2 },
  ),
);
[
  [
    'Each word in Japanese can bear more than one pitch accent.',
    'Falskt',
    'I kursens vanliga analys av Tokyodialekten har ett ord högst ett lexikalt accentfall.',
  ],
  [
    'Japanese has unaccented words without an abrupt pitch fall.',
    'Sant',
    'Heiban-ord saknar lexikalt accentfall.',
  ],
  [
    'Pitch accent makes the prominent part longer.',
    'Falskt',
    'Pitch accent gäller tonhöjd, inte i sig förlängning.',
  ],
  [
    'Swedish and Japanese both use stress and pitch accent.',
    'Falskt',
    'Svenska kombinerar betoning och ordaccenter; japanska analyseras vanligen med mora och tonaccent utan svensk typ av betoning.',
  ],
].forEach(([p, a, m], i) =>
  eq('japc11', '5.2-' + (i + 1), 7, p, m, {
    self: false,
    answers: [a],
    choices: ['Sant', 'Falskt'],
    points: 1,
  }),
);
const vocab = [
  ['tokee', 'とけい', 'klocka'],
  ['shoes', 'くつ', 'kutsu'],
  ['えいご', 'eigo', 'engelska'],
  ['ryokoo', 'りょこう', 'resa'],
  ['concert', 'コンサート', 'konsaato'],
  ['ステーキ', 'suteeki', 'biff'],
  ['chotto', 'ちょっと', 'lite'],
  ['Stockholm', 'ストックホルム', 'sutokkuhorumu'],
  ['kurashikku', 'クラシック', 'klassisk musik'],
  ['noruwee', 'ノルウェー', 'Norge'],
];
vocab.forEach(([p, a, b], i) => {
  eq(
    'reading',
    'I.1-' + (i + 1),
    2,
    `Fyll i de två saknade delarna för ”${p}”: kana / romaji / betydelse enligt tabellen.`,
    `${a} · ${b}`,
    { topic: 'Ord & kanji', points: 1 },
  );
  add(
    'v-' + i,
    'Ord & kanji',
    `Skriv med kana: ${['klocka', 'skor', 'engelska', 'resa', 'konsert', 'biff', 'lite', 'Stockholm', 'klassisk musik', 'Norge'][i]}`,
    i === 2 ? 'えいご' : i === 5 ? 'ステーキ' : a,
    `${p} · ${a} · ${b}`,
  );
});
eq(
  'reading',
  'I.2',
  3,
  'Hitta minst fem katakanaord i annonsen. Skriv orden och deras svenska eller engelska betydelse.',
  'Exempel som står i annonsen: カメラ = kamera; スペシャル = special; クーポン = kupong; コンパクト = kompakt; デジタル = digital; セット = set/paket; プレゼント = present/gåva; セール = rea. Välj fem och kontrollera stavningen mot bilden.',
  { topic: 'Ord & kanji', points: 5, image: true },
);
[
  ['ten thousand yen', '一万円 · いちまんえん'],
  ['九月', 'くがつ · september'],
  ['river', '川 · かわ'],
  ['みず', '水 · vatten'],
  ['した', '下 · under/nedanför'],
].forEach(([p, m], i) =>
  eq('reading', 'I.3-' + (i + 1), 4, `Fyll i tabellens två saknade delar: ${p}`, m, {
    topic: 'Ord & kanji',
    points: 2,
  }),
);
[
  ['【　】を飲みます。', ['フライドポテト', 'トースト', 'サラダ', 'アイスティー'], 'アイスティー'],
  [
    '【　】にあります。',
    ['ニューヨークヤンキース', 'ジャクソンさん', 'テニス', 'ウィーン'],
    'ウィーン',
  ],
  ['【　】でかいます。', ['まち', 'げんき', 'はがき', 'ひるごはん'], 'まち'],
  ['【　】にいきます。', ['おしろ', 'せんせい', 'いま', 'おまんじゅう'], 'おしろ'],
  ['【　】はさむいです。', ['ビール', 'ケーキ', 'スウェーデン', 'ピザ'], 'スウェーデン'],
].forEach(([p, c, a], i) =>
  eq(
    'reading',
    'I.4-' + (i + 1),
    5,
    p,
    `Det passande ordet är ${a}. Titta på verbet och vilken typ av substantiv det kräver.`,
    { self: false, answers: [a], choices: c, topic: 'Läsförståelse', points: 1 },
  ),
);
[
  [
    'このえいがはこわいですが、【　】。',
    ['むずかしいです', 'おおきいです', 'おもしろいです'],
    'おもしろいです',
  ],
  ['きのうわたしは【　】おきました。', ['はやい', 'すこし', 'おそく'], 'おそく'],
  [
    'ひるごはんをたべました。それから、【　】。',
    ['おきました', 'うちにかえりました', 'あさごはんをたべませんでした'],
    'うちにかえりました',
  ],
  ['天気は【　】。', ['あついです', 'さむくないです', 'いいです'], 'いいです'],
  ['では、【　】。', ['行きました', 'やすいです', 'おげんきで'], 'おげんきで'],
].forEach(([p, c, a], i) =>
  eq('reading', 'II.1-' + (i + 1), 6, p, `Modellsvar: ${a}.`, {
    self: false,
    answers: [a],
    choices: c,
    topic: 'Läsförståelse',
    points: 2,
  }),
);
export const letter =
  'ルンドはさむいですか。私はとうきょうにいます。九日にきました。いま、「マンガとしょかん」にいます。このとしょかんはめいじだいがくのまえにあります。マンガがすごくたくさんあります。まいにちいきます。でも、あしたはいきません。たけしさんとえいがをみますから。七月にスウェーデンにかえります。だいがくであいましょう。';
eq(
  'reading',
  'II.2-luckor',
  7,
  'Placera ① お元気で。 ② マリア ③ ソラさんへ ④ 六月十二日 ⑤ お元気ですか。 i A–E i originalbrevet.',
  'A = ③ ソラさんへ (mottagare). B = ⑤ お元気ですか。 (hälsning). C = ① お元気で。 (avslutning). D = ④ 六月十二日 (datum). E = ② マリア (avsändare). Brevet läses i spalter från höger till vänster.',
  { topic: 'Läsförståelse', points: 5, image: true },
);
[
  [
    'Vem skrev brevet och var är hon nu? Svara på japanska.',
    'マリアさんです。いま、とうきょうのマンガとしょかんにいます。',
  ],
  ['När kom hon dit? Använd hiragana.', 'ここのかにきました。'],
  ['Vad ska hon göra imorgon? Svara på japanska.', 'たけしさんとえいがをみます。'],
  [
    'Ligger biblioteket inne på Meiji universitet? Svara på japanska.',
    'いいえ、めいじだいがくのまえにあります。',
  ],
  ['När kommer hon tillbaka? Svara på svenska.', 'I juli.'],
].forEach(([p, m], i) =>
  eq('reading', 'II.2-' + (i + 1), 8, p, m, { topic: 'Läsförståelse', points: 3, context: letter }),
);
[
  [
    `Vilket datum är det idag? Utgå i detta övningsprov från ${EXERCISE_REFERENCE_DATE}.`,
    '今日は十月十六日です。',
  ],
  [`Vilken veckodag var det igår? Utgå från ${EXERCISE_REFERENCE_DATE}.`, 'きのうは木曜日でした。'],
  ['Var är katten? Se originalbilden.', 'ねこはテーブルの上にいます。'],
  ['Var är boken? Se originalbilden.', '本はかばんの中にあります。'],
  ['Vilken nationalitet har Takeshi? Se passet.', 'たけしさんは日本人です。'],
].forEach(([p, m], i) =>
  eq('reading', 'III.1-' + (i + 1), i < 3 ? 9 : 10, p, m, {
    topic: 'Läsförståelse',
    points: 3,
    image: i >= 2,
  }),
);
eq(
  'reading',
  'III.2',
  11,
  'Skriv 8–12 meningar om Marys helg utifrån bilderna. Använd dåtid och minst tre adjektiv som predikat.',
  'Bedömningslista: 8–12 meningar; innehållet följer bilderna; minst tre adjektiv står som predikat; verben står i dåtid; i-adjektiv böjs med ～かったです, na-adjektiv med ～でした; partiklar och tecken är korrekta. Exempel på form: たのしかったです。しずかでした。おもしろかったです。 Exempeltext (en av flera möjliga): 金曜日、メアリーさんは友だちと公園に行きました。公園はきれいでした。それから、レストランでごはんを食べました。ごはんはおいしかったです。土曜日、一人でお寺に行きました。お寺はりっぱでした。おまんじゅうを買いました。日曜日、家でざっしを読みました。お母さんとお茶を飲みました。午後、勉強しました。しゅうまつはたのしかったです。',
  { topic: 'Läsförståelse', points: 25, image: true },
);
// Originalfrågor fungerar även som enskilda träningskort.
examQuestions.forEach((q) => questions.push({ ...q, explanation: q.model }));
export const guides = [
  {
    id: 'writing-systems',
    title: 'Skriftsystem och kanjiläsningar',
    text: 'Hiragana och katakana återger huvudsakligen moror. Hiragana används bland annat för partiklar och böjningsändelser; katakana för lånord som コーヒー. Kanji representerar betydelsebärande enheter. Alla kanji är inte bildtecken. On-yomi har kinesiskt ursprung och kun-yomi är japanska läsningar: 山 läses やま ensamt och サン i 富士山（ふじさん）. I tabeller: kontrollera varje efterfrågad del, tecken, läsning och betydelse, separat.',
  },
  {
    id: 'word-origins',
    title: 'Ordens ursprung',
    text: 'Wago är inhemska japanska ord, som やま. Kango är sinojapanska ord, som 学校. Gairaigo är andra lånord, som コーヒー. Konshugo har blandat ursprung, som 消しゴム. Skilj dessa ursprungskategorier från ordklasser som verb och substantiv.',
  },
  {
    id: 'sentence-parts',
    title: 'Fraser, predikat och argument',
    text: 'En mening kan bestå av flera satser. En fras fungerar som en enhet; ta med bestämningar som hör till huvudordet. I わたしが本を読みます är 読みます predikat, わたし och 本 argument, och 本を en postpositionsfras. Skilj dessa från tillägg för tid och plats. Subjektet kan vara utelämnat och alla meningar har inte objekt. は kan markera ett tidstema; det är inte automatiskt den som utför handlingen. Frasgränser och kopulans klassificering kan bero på kursens analys.',
  },
  {
    id: 'word-classes',
    title: 'Ordklasser och kopula',
    text: 'Substantiv namnger, verb uttrycker handling eller tillstånd, och adjektiv beskriver egenskaper. Partiklar visar relationer i meningen. です är kopula; tentans begränsade alternativ kan behandla den under Verb. Dåtid är でした: きのうは木曜日でした (igår var det torsdag). あの framför substantiv är ett demonstrativt bestämningsord, även om Pronoun ligger närmast bland tentans alternativ. Kontrollera kursens terminologi.',
  },
  {
    id: 'reading-strategy',
    title: 'Läs frågan och hitta stödet',
    text: 'Dela upp frågan: vem, var, när och vad? Leta upp stöd för varje del i brevet eller bilden. Skilj månad från datum och ankomst från återresa. Kontrollera om svaret ska vara på svenska, japanska eller enbart hiragana. Vid en bildbeskrivning ska innehållet följa originalbilden; modellsvaret visar en möjlig formulering.',
  },
  {
    id: 'wa-ga',
    title: 'は eller が?',
    text: 'は sätter ämnet: わたしは学生です。が markerar subjekt, ofta ny information: だれが来ますか。Vid 好き、嫌い、わかる markeras det man gillar, ogillar eller förstår ofta med が.',
  },
  {
    id: 'ni-de',
    title: 'に eller で?',
    text: 'Handling på en plats → で: 図書館で読みます。Medel tar också で: 日本語で書きます (på japanska), バスで行きます (med buss). Något finns på en plats → に: 図書館に本があります。Mål och klockslag tar ofta に: 学校に行きます。７時に起きます。に används även för personen man träffar (友だちに会います) och fordonet man stiger på (バスに乗ります).',
  },
  {
    id: 'wo-to-no-mo',
    title: 'を・と・の・も',
    text: 'を: direkt objekt, 本を読みます。と: tillsammans med eller uppräkning, 友だちと / パンと水。と markerar också citat: 「ありがとう」と言います。の: ägande eller nominal bestämning, 私の本。も: också, 私も学生です。',
  },
  {
    id: 'no-particle',
    title: 'När behövs ingen partikel?',
    text: 'あした、きのう、まいにち tar normalt inte tidspartikeln に. Adverb som とても och たいてい behöver ingen extra partikel. I luckövningarna betyder × ”ingen partikel”.',
  },
  {
    id: 'adjectives',
    title: 'I- och na-adjektiv',
    text: 'たかい → たかくない → たかかった → たかくなかった. いい böjs med よ: よかった. しずかです → しずかでした. Framför substantiv: たかい本 men しずかなまち.',
  },
  {
    id: 'moras',
    title: 'Moror och stavelser',
    text: 'ん, っ och andra delen av en lång vokal är egna moror. きゃ är en mora. がっこう har fyra moror (が・っ・こ・う) men två stavelser. コーヒー har fyra moror och två stavelser.',
  },
  {
    id: 'verbs',
    title: 'Artiga verbformer',
    text: 'Utgå från formen med ます: たべます → たべました (dåtid), たべません (negation), たべませんでした (negativ dåtid). Byt ます mot ましょう för förslag: たべましょう. Med か kan du erbjuda hjälp: てつだいましょうか.',
  },
  {
    id: 'questions',
    title: 'Frågepartikeln か',
    text: 'か efter ett artigt yttrande gör det till en fråga: これは本です → これは本ですか。Jämför よ, som framhäver en upplysning för lyssnaren.',
  },
];

questions.push(...extraQuestions, ...l1l5Questions, ...calendarDayQuestions);
for (const q of questions) {
  q.section = q.id.replace(/^.*?-/, '').split('-')[0];
  if (/^(gema70-5-|japc11-5\.1-|goto-mock-5-)/.test(q.id)) q.topic = 'Moror & stavelser';
  if (/^(gema70-4-|japc11-4\.1-|goto-mock-4-)/.test(q.id)) q.topic = 'Ordföljd';
  q.promptLang ||=
    q.exam === 'japc11' && /^(Explain|Each|Japanese|Pitch|Swedish)/.test(q.prompt) ? 'en' : 'sv';
  q.answerLang ||=
    q.exam === 'japc11' && q.self && q.prompt.startsWith('Explain')
      ? 'en'
      : q.self
        ? 'sv'
        : q.answers?.some((a) => /[ぁ-ヿ一-龯]/.test(a))
          ? 'ja'
          : 'sv';
  if (q.exam === 'reading' && (/^reading-III/.test(q.id) || /^reading-II\.2-[1-4]$/.test(q.id)))
    q.answerLang = 'ja';
  enrichQuestion(q);
  q.choiceLang ||= q.choices?.some((a) => /[ぁ-ヿ一-龯]/.test(a))
    ? 'ja'
    : q.choices?.includes('Noun') || q.choices?.includes('Topic')
      ? 'en'
      : 'sv';
}
