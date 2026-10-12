// Renskrivet från 復習５課こたえ.pdf. Källans facitsidor publiceras inte.
const source = 'Bearbetad övning · Hayashis repetitionsblad · bifogat facit';
const items = [];
function item(key, page, topic, prompt, answers, wrong, explanation) {
  items.push({ key, page, topic, prompt, answers: [].concat(answers), wrong, explanation });
}
const numbers = [
  [
    '3243',
    'さんぜんにひゃくよんじゅうさん',
    'さんぜんにひゃくよんじゅう|さんぜんよんひゃくにじゅうさん|さんびゃくにじゅうよん',
  ],
  [
    '7662',
    'ななせんろっぴゃくろくじゅうに',
    'ななせんろくひゃくろくじゅうに|ななせんろっぴゃくにじゅうろく|ろくせんななひゃくろくじゅうに',
  ],
  [
    '58901',
    'ごまんはっせんきゅうひゃくいち',
    'ごまんはちせんきゅうひゃくいち|ごせんはっぴゃくきゅうじゅういち|ごまんはっせんきゅうひゃくじゅう',
  ],
  [
    '186035',
    'じゅうはちまんろくせんさんじゅうご',
    'じゅうはちまんろくせんさんびゃくご|じゅうはちまんろっせんさんじゅうご|じゅうはちまんろくせんごじゅうさん',
  ],
  ['3:12', 'さんじじゅうにふん', 'さんじじゅうにぷん|さんじにじゅっぷん|さんじじゅうふん'],
  [
    '9:40',
    ['くじよんじゅっぷん', 'くじよんじっぷん'],
    'きゅうじよんじゅっぷん|くじよんじゅうふん|くじよじゅっぷん',
  ],
  [
    '4:08 på morgonen',
    ['ごぜんよじはっぷん', 'ごぜんよじはちふん'],
    'ごごよじはっぷん|ごぜんよんじはっぷん|ごぜんよじはっじ',
  ],
  [
    '7:30 på kvällen',
    ['ごごしちじはん', 'ごごしちじさんじゅっぷん', 'ごごしちじさんじっぷん'],
    'ごぜんしちじはん|ごごしちじはんじかん|ごごしちじさんじゅうふん',
  ],
  [
    'Mary sov sju och en halv timme i natt. Skriv endast tidslängden.',
    ['しちじかんはん', 'しちじかんさんじゅっぷん', 'しちじかんさんじっぷん'],
    'しちじはん|しちじかん|はちじかんはん',
  ],
  [
    'Jag studerade japanska i ungefär fem timmar igår. Skriv endast tidslängden inklusive ”ungefär”.',
    'ごじかんぐらい',
    'ごじぐらい|ごじかんはん|ごふんぐらい',
  ],
  [
    'Jag väntade där på Takeshi i en timme. Skriv endast tidslängden.',
    'いちじかん',
    'いちじ|いっぷん|いちにち',
  ],
  [
    '22 september',
    'くがつにじゅうににち',
    'きゅうがつにじゅうににち|くがつにじゅうふつか|くがつにじゅうにち',
  ],
  ['5 mars', 'さんがついつか', 'さんがつごにち|ごがつみっか|さんがつよっか'],
  ['20 juli', 'しちがつはつか', 'なながつはつか|しちがつにじゅうにち|しちがつはちにち'],
  ['14 april', 'しがつじゅうよっか', 'よんがつじゅうよっか|しがつじゅうよんにち|しがつよっか'],
  [
    '1 december',
    'じゅうにがつついたち',
    'じゅうにがついちにち|じゅういちがつついたち|じゅうにがつふつか',
  ],
];
numbers.forEach(([prompt, answer, wrong], i) =>
  item(
    `number-${i + 1}`,
    1,
    'Ord & kanji',
    `Skriv med hiragana: ${prompt}`,
    answer,
    wrong.split('|'),
    i < 4
      ? 'Dela upp talet i tiotusental, tusental, hundratal och tiotal. Kontrollera ljudförändringar.'
      : i < 8
        ? 'じ anger klockslag; kontrollera minuternas uttal och förmiddag/eftermiddag.'
        : i < 11
          ? 'じかん anger antal timmar, はん en halv och ぐらい ungefär.'
          : 'Månader och datum har särskilda läsningar, särskilt den första, femte, fjortonde och tjugonde.',
  ),
);

export const kyoto = [
  [
    'Kyoto – mycket kallt',
    'きょうとはとてもさむかったです。',
    'きょうとはとてもさむいです。|きょうとはとてもさむいでした。|きょうとはとてもさむくなかったです。',
  ],
  [
    'Maten – god',
    'たべものはおいしかったです。',
    'たべものはおいしいです。|たべものはおいしいでした。|たべものはおいしくなかったです。',
  ],
  [
    'Hotellet – inte nytt',
    'ホテルはあたらしくなかったです。',
    'ホテルはあたらしかったです。|ホテルはあたらしくないです。|ホテルはあたらしいでした。',
  ],
  [
    'Hotellet – lite litet',
    'ホテルはちょっとちいさかったです。',
    'ホテルはちょっとちいさいです。|ホテルはちょっとちいさいでした。|ホテルはちょっとちいさくなかったです。',
  ],
  [
    'Templet – oerhört vackert',
    'おてらはすごくきれいでした。',
    'おてらはすごくきれかったです。|おてらはすごくきれいです。|おてらはすごくきれいじゃなかったです。',
  ],
  [
    'Restaurangen – livlig',
    'レストランはにぎやかでした。',
    'レストランはにぎやかかったです。|レストランはにぎやかです。|レストランはにぎやかじゃなかったです。',
  ],
  [
    'Souveniren – inte dyr',
    'おみやげはたかくなかったです。',
    'おみやげはたかかったです。|おみやげはたかくないです。|おみやげはたかいでした。',
  ],
];
kyoto.forEach(([hint, answer, wrong], i) =>
  item(
    `kyoto-${i + 1}`,
    2,
    'Böjningar',
    `Resan till Kyoto var förra året. Välj rätt artig mening i dåtid: ${hint}.`,
    answer,
    wrong.split('|'),
    'I-adjektiv får かったです eller くなかったです. Na-adjektiv använder でした i positiv dåtid.',
  ),
);

// Varje rad är en dialog/mening; samtliga facitluckor ersätts före visning.
export const questionWords = [
  [3, 'ソラさんは（なんねんせい）ですか。\nよねんせいです。'],
  [3, 'しゅうまつ（どこ）にいきましたか。\nどこにもいきませんでした。'],
  [3, '（どの）じてんしゃが2000えんですか。\nあのじてんしゃが2000えんですよ。'],
  [3, 'げつようびは（どう）ですか。\nげつようびはちょっと…。かようびにあいましょう。'],
  [3, '（どんな）たべものがすきですか。\nにほんのたべものがすきです。'],
  [3, 'たけしさんは（なんさい）ですか。\nはたちです。'],
  [3, 'びょういんは（どこ）ですか。\nびょういんはゆうびんきょくのとなりです。'],
  [3, 'パーティーは（どう）でしたか。\nとてもたのしかったです。'],
  [4, 'とうきょうはいま（なんじ）ですか。\nごごさんじです。'],
  [
    4,
    'あした（なに）をしますか。\nともだちとテニスをします。いっしょに（どう）ですか。\nいいですね。',
  ],
  [4, 'そのとけいは（いくら）ですか。\nさんぜんはっぴゃくえんです。'],
  [4, 'これは（なん）ですか。\nこれはにほんごのきょうかしょです。'],
  [4, 'なつやすみにとうきょうにいきました。\n（どう）でしたか。\nとてもあつかったです。'],
  [4, 'これは（だれの）かばんですか。\nメアリーさんのかばんです。'],
  [5, 'たんじょうびは（なんがつなんにち）ですか。\nさんがつみっかです。'],
  [5, 'メアリーさんは（どんな）ひとですか。\nとてもやさしいひとです。'],
  [5, 'にほんごのクラスは（なんようび）ですか。\nげつようびときんようびです。'],
  [5, '（どんな）ひとがすきですか。\nやさしいひとがすきです。'],
  [5, '（なんようび）にれきしのクラスがありますか。\nきんようびにあります。'],
  [5, 'これは（だれの）じてんしゃですか。\nメアリーさんのです。'],
];
const wordMeaning = {
  なんねんせい: 'årskurs',
  どこ: 'var/vart',
  どの: 'vilken, framför substantiv',
  どう: 'hur',
  どんな: 'vilken sorts',
  なんさい: 'ålder',
  なんじ: 'klockslag',
  なに: 'vad',
  いくら: 'pris',
  なん: 'vad, framför です',
  だれの: 'vems',
  なんがつなんにち: 'månad och datum',
  なんようび: 'veckodag',
};
const wordChoices = {
  なんねんせい: ['なんさい', 'なんじ', 'いくら'],
  どこ: ['だれ', 'なんじ', 'いくら'],
  どの: ['どれ', 'どこ', 'だれ'],
  どう: ['どの', 'だれ', 'いくら'],
  どんな: ['どれ', 'どこ', 'なんじ'],
  なんさい: ['なんねんせい', 'なんじ', 'いくら'],
  なんじ: ['なんようび', 'なんさい', 'いくら'],
  なに: ['どこ', 'だれ', 'なんじ'],
  いくら: ['なんじ', 'どこ', 'だれ'],
  なん: ['どの', 'なんじ', 'いくら'],
  だれの: ['だれ', 'どこ', 'いくら'],
  なんがつなんにち: ['なんじ', 'どこ', 'いくら'],
  なんようび: ['なんじ', 'だれ', 'いくら'],
};
function blanks(group, rows, topic, choices, explain) {
  rows.forEach(([page, text, hint], row) => {
    const matches = [...text.matchAll(/（([^）]+)）/g)];
    matches.forEach((match, index) => {
      let n = 0;
      const clean = text.replace(/（([^）]+)）/g, () => (n++ === index ? '【　】' : '（　）'));
      item(
        `${group}-${row + 1}-${index + 1}`,
        page,
        topic,
        `Fyll i den markerade luckan${matches.length > 1 ? ` (${index + 1} av ${matches.length})` : ''}.${hint ? ` Betydelse: ${hint}.` : ''}\n${clean}`,
        match[1],
        choices(match[1]),
        explain(match[1]),
      );
    });
  });
}
blanks(
  'question',
  questionWords,
  'Ord & kanji',
  (a) => wordChoices[a],
  (a) => `Frågeordet efterfrågar ${wordMeaning[a]}. Använd dialogens svar som ledtråd.`,
);
export const adverbs = [
  [5, 'このえいがは（ぜんぜん）おもしろくなかったです。', 'inte alls'],
  [5, 'メアリーさんはうちで（よく）べんきょうします。', 'ofta'],
  [5, 'メアリーさんのかばんは（すごく）おおきいです。', 'oerhört (vardaglig förstärkning)'],
  [5, 'きのうのれきしのテストは（とても）むずかしかったです。', 'mycket'],
  [6, '（じゃあ）、そのかさをください。', 'i så fall'],
  [6, 'ソラさんは（たいてい）きっさてんでコーヒーをのみます。', 'vanligtvis'],
  [6, 'たけしさんはおととい（ひとりで）ぎんこうにいきました。', 'ensam'],
  [6, 'きのうしゃしんを（たくさん）とりました。', 'många'],
  [6, 'あした（いっしょに）テニスをしましょう。', 'tillsammans'],
  [6, 'ともだちのへやはきれいです。（でも）わたしのへやはきれいじゃないです。', 'men'],
  [6, 'たけしさんは（ぜんぜん）おさけをのみません。', 'inte alls'],
  [6, 'あのとけいは（ちょっと）たかいですね。', 'lite'],
  [6, 'たけしさんは（たいてい）11じにねます。', 'vanligtvis'],
  [6, 'ひこうきのきっぷは（あまり）たかくなかったです。', 'inte särskilt'],
  [6, 'いいてんきですね。でも（ちょっと）あついですね。', 'lite'],
  [6, 'かんじは（ちょっと）むずかしいです。', 'lite'],
  [6, '（Tシャツ）をさんまいください。', 'T-tröjor'],
  [6, 'きのうおてらで（おみやげ）をかいました。', 'souvenirer'],
  [6, 'げつようびに（アルバイト）があります。', 'extrajobb'],
  [6, '（おととい）はとてもいいてんきでしたね。', 'i förrgår'],
  [6, '（さらいねん）にほんとかんこくへいきます。', 'om två år'],
  [6, 'まどのちかくに（ねこ）がいます。', 'katt'],
];
const adverbChoices = {
  Tシャツ: ['かさ', 'きっぷ', 'しゃしん'],
  おみやげ: ['きょうかしょ', 'きっぷ', 'かさ'],
  アルバイト: ['たんじょうび', 'りょこう', 'パーティー'],
  おととい: ['きのう', 'あした', 'あさって'],
  さらいねん: ['らいねん', 'ことし', 'せんねん'],
  ねこ: ['いぬ', 'がくせい', 'せんせい'],
  じゃあ: ['でも', 'いつも', 'ちょっと'],
  でも: ['じゃあ', 'いつも', 'たくさん'],
};
blanks(
  'word',
  adverbs,
  'Ord & kanji',
  (a) =>
    adverbChoices[a] ||
    ['ぜんぜん', 'ちょっと', 'たいてい', 'ひとりで'].filter((x) => x !== a).slice(0, 3),
  (a) => `Uttrycket i facit är ${a}. Jämför betydelseledtråden och meningen.`,
);
// Båda förstärkningarna fungerar i fritext; endast en finns bland mobilvalen.
for (const q of items.filter((q) => q.key.startsWith('word-'))) {
  if (['すごく', 'とても'].includes(q.answers[0]))
    q.answers.push(q.answers[0] === 'すごく' ? 'とても' : 'すごく');
  if (q.answers[0] === 'Tシャツ') q.answers.push('ティーシャツ');
}

export const particleRows = [
  [
    7,
    'メアリーさん、たいてい（×）しゅうまつはなに（を）しますか。\nうち（で）おんがく（を）ききます。',
  ],
  [7, 'にほんご（の）きょうかしょはどこ（×）ですか。\nつくえ（の）うえ（×）です。'],
  [7, 'せんしゅう（×）バス（に）のりました。'],
  [7, 'バスてい（の）ちかく（に）いぬ（が）います。'],
  [7, 'せんげつ（×）うみ（で）およぎました。'],
  [
    7,
    'らいしゅう（×）きっさてん（で）コーヒー（を）のみません（か）。\nいいです（ね）。いきましょう。',
  ],
  [7, 'メアリーさんはあまり（×）あさごはん（を）たべません。'],
  [7, 'ぎんこうはだいがく（と）スーパー（の）あいだ（×）です。'],
  [7, 'しちじ（×）はん（に）おきました。'],
  [7, 'そのかさはいくら（×）ですか。\nさんびゃくえんです。\nじゃあ、そのかさ（を）ください。'],
  [7, 'ソラさんはきょう（×）うち（に）かえりません。'],
  [8, 'うち（に）ねこ（が）いません。'],
  [8, 'かようび（に）にじかん（×）ぐらい（×）えいが（を）みました。'],
  [8, '９月３日（に）あたらしいパソコン（を）かいます。'],
  [8, 'だいがく（の）ちかく（に）きっさてん（が）あります（か）。\nはい、あそこ（に）あります。'],
  [8, 'ちゅうごくご（が）わかりません。'],
  [8, 'すいようび（に）カフェ（で）ソラさん（と）たかしさん（に）あいました。'],
  [8, '３じはん（に）でかけます。'],
  [8, 'びょういん（で）いちじかん（×）せんせい（を）まちました。'],
  [8, 'どんなのみもの（が）すき（×）ですか。\nコーヒー（が）すきです。'],
  [
    8,
    'このかんじはむずかしいです（ね）。\nそうですね。せんせい（に）ききましょう（か）。\nそうしましょう。',
  ],
  [
    8,
    'こうこう（の）とき、よく（×）ほん（を）よみましたか。\nはい、たくさん（×）よみました。まいにち（×）いちじかん（×）ぐらい（×）よみました。',
  ],
  [8, 'まち（に）がくせい（が）たくさん（×）います。にぎやかですね。'],
];
const particleReason = {
  '×': 'Här behövs ingen extra partikel, exempelvis efter ett adverb eller ett uttryck för tidslängd.',
  を: 'を markerar handlingens objekt.',
  で: 'で markerar platsen där handlingen sker.',
  の: 'の binder ihop substantiv, exempelvis ägande, läge eller en tidsperiod.',
  に: 'に kan markera tidpunkt, mål, existensplats eller den person/fordon som verbet riktas mot.',
  が: 'が markerar det som finns, förstås eller gillas.',
  と: 'と binder ihop substantiv eller anger sällskap.',
  か: 'か avslutar en fråga eller ett förslag i frågeform.',
  ね: 'ね söker medhåll eller bekräftar något gemensamt.',
};
blanks(
  'particle',
  particleRows,
  'Partiklar',
  (a) =>
    a === 'に'
      ? ['を', 'が', 'の']
      : ['×', 'を', 'で', 'に', 'が'].filter((x) => x !== a).slice(0, 3),
  (a) => particleReason[a],
);
for (const q of items.filter((q) => q.key.startsWith('particle-'))) {
  // Återresa: へ är också en korrekt målmarkör; inte ett distraktoralternativ.
  if (q.key === 'particle-11-2') q.answers.push('へ');
}

export const hayashiItems = items;
export const hayashiQuestions = [];
const checklist = [
  'Skriv tre fullständiga meningar som motsvarar tre av stödorden.',
  'Använd dåtid: resan ägde rum förra året.',
  'Kontrollera i-/na-adjektiv, negation och artiga desu/masu-former.',
  'Skriv med hiragana och katakana, inte romaji eller kanji.',
];
for (const variant of ['mobile', 'exam']) {
  for (const q of items) {
    if (variant === 'exam' && q.key.startsWith('kyoto-')) continue;
    const mobile = variant === 'mobile';
    const answer = mobile && q.answers[0] === '×' ? 'Ingen partikel' : q.answers[0];
    const choices = [answer, ...q.wrong.map((a) => (a === '×' ? 'Ingen partikel' : a))];
    const rotation = hayashiQuestions.length % 4;
    hayashiQuestions.push({
      id: `hayashi-${variant}-${q.key}`,
      sourceKey: q.key,
      exam: `hayashi-${variant}`,
      source,
      page: q.page,
      topic: q.topic,
      prompt:
        (mobile ? q.prompt.replace('Skriv med hiragana:', 'Välj rätt hiragana för:') : q.prompt) +
        (!mobile && q.topic === 'Partiklar'
          ? '\nSkriv × om ingen partikel behövs.'
          : !mobile && !q.key.startsWith('number-')
            ? '\nSkriv med kana, inte romaji.'
            : ''),
      answers: mobile ? [answer] : q.answers,
      choices: mobile ? [...choices.slice(rotation), ...choices.slice(0, rotation)] : undefined,
      points: 1,
      model: `${q.answers.join(' / ')}\n${q.explanation}`,
      explanation: q.explanation,
      originalAvailable: false,
      hidePromptSpeech: true,
      answerLang: 'ja',
    });
  }
  if (variant === 'exam') {
    const q = {
      id: 'hayashi-exam-kyoto',
      sourceKey: 'kyoto',
      sourceKeys: kyoto.map((_, i) => `kyoto-${i + 1}`),
      exam: 'hayashi-exam',
      source,
      page: 2,
      topic: 'Böjningar',
      prompt: `Du reste till Kyoto förra året. Skriv tre meningar utifrån tre av stödorden nedan. Använd hiragana och katakana samt artiga desu/masu-former i dåtid.\n${kyoto.map((k) => k[0]).join('\n')}`,
      self: true,
      points: 3,
      answers: [],
      model: kyoto.map((k) => k[1]).join('\n'),
      checklist,
      originalAvailable: false,
      hidePromptSpeech: true,
      answerLang: 'ja',
    };
    hayashiQuestions.splice(
      hayashiQuestions.findIndex((x) => x.id === 'hayashi-exam-question-1-1'),
      0,
      q,
    );
  }
}
export const hayashiExams = ['mobile', 'exam'].map((variant) => ({
  id: `hayashi-${variant}`,
  title: `Hayashi-sensei · ${variant === 'mobile' ? 'Mobilträning' : 'Tentaträning'}`,
  subtitle: 'Lektion 5 · Bearbetat repetitionsblad',
  description:
    variant === 'mobile'
      ? 'Hela materialet med fyra svarsalternativ och direkt rättning. Ett tryck per svar.'
      : 'Hela materialet med egna svar på japanska. Facit visas efter inlämning.',
  pages: 8,
  points: hayashiQuestions
    .filter((q) => q.exam === `hayashi-${variant}`)
    .reduce((n, q) => n + q.points, 0),
  feedbackTiming: variant === 'mobile' ? 'immediate' : 'submission',
  originalAvailable: false,
}));
