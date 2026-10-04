const kanaRows = [
  ['あいうえお', 'a i u e o'],
  ['かきくけこ', 'ka ki ku ke ko'],
  ['さしすせそ', 'sa shi su se so'],
  ['たちつてと', 'ta chi tsu te to'],
  ['なにぬねの', 'na ni nu ne no'],
  ['はひふへほ', 'ha hi fu he ho'],
  ['まみむめも', 'ma mi mu me mo'],
  ['やゆよ', 'ya yu yo'],
  ['らりるれろ', 'ra ri ru re ro'],
  ['わをん', 'wa wo n'],
  ['がぎぐげご', 'ga gi gu ge go'],
  ['ざじずぜぞ', 'za ji zu ze zo'],
  ['だぢづでど', 'da ji zu de do'],
  ['ばびぶべぼ', 'ba bi bu be bo'],
  ['ぱぴぷぺぽ', 'pa pi pu pe po'],
];
const variants = {
  shi: ['shi', 'si'],
  chi: ['chi', 'ti'],
  tsu: ['tsu', 'tu'],
  fu: ['fu', 'hu'],
  ji: ['ji', 'zi'],
  wo: ['wo', 'o'],
};
export const extraQuestions = [];
for (const [kana, romaji] of kanaRows)
  for (const [i, char] of [...kana].entries()) {
    const answer = romaji.split(' ')[i];
    for (const script of ['hiragana', 'katakana']) {
      const glyph = script === 'hiragana' ? char : String.fromCharCode(char.charCodeAt(0) + 0x60);
      const answers =
        char === 'ぢ' ? ['ji', 'di'] : char === 'づ' ? ['zu', 'du'] : variants[answer] || [answer];
      extraQuestions.push({
        id: `kana-${script}-${char.codePointAt(0)}`,
        topic: 'Kana',
        prompt: `Skriv med romaji: ${glyph}`,
        answers,
        explanation: `${glyph} skrivs ${answers.join(' eller ')}. Hepburn används som huvudform; vanliga Kunrei-varianter godtas. を godtar både wo och uttalet o.`,
        source: 'Kompletterande övning',
        promptLang: 'sv',
        answerLang: 'en',
        hidePromptSpeech: true,
      });
    }
  }
const sounds = [
  ['かさ', 2, 2],
  ['ねこ', 2, 2],
  ['さくら', 3, 3],
  ['にほん', 2, 3],
  ['さんぽ', 2, 3],
  ['しんぶん', 2, 4],
  ['きって', 2, 3],
  ['ざっし', 2, 3],
  ['きっぷ', 2, 3],
  ['もっと', 2, 3],
  ['おばあさん', 3, 5],
  ['おじいさん', 3, 5],
  ['おとうさん', 3, 5],
  ['おかあさん', 3, 5],
  ['きゃく', 2, 2],
  ['しゃしん', 2, 3],
  ['ちょっと', 2, 3],
  ['りょこう', 2, 3],
  ['きょう', 1, 2],
  ['ぎゅうにゅう', 2, 4],
  ['パーティー', 2, 4],
  ['タクシー', 3, 4],
  ['ベッド', 2, 3],
  ['チケット', 3, 4],
];
sounds.forEach(([word, s, m], i) =>
  extraQuestions.push({
    id: `sound-extra-${i + 1}`,
    topic: 'Moror & stavelser',
    prompt: `Hur många stavelser och moror har ${word}? Skriv stavelser, moror.`,
    answers: [`${s}, ${m}`, `${s}/${m}`],
    explanation: `${word}: ${s} stavelser och ${m} moror. Lång vokal, ん och っ bidrar med en extra mora. Kombinationer som きゃ eller ティ bildar en mora.`,
    source: 'Kompletterande övning',
    answerLang: 'sv',
  }),
);
const sentences = [
  ['わたしが本を読みます。', 'わたし', '本', '読みます'],
  ['ねこが魚を食べます。', 'ねこ', '魚', '食べます'],
  ['友だちが水を飲みます。', '友だち', '水', '飲みます'],
  ['先生が日本語を教えます。', '先生', '日本語', '教えます'],
  ['母がパンを買いました。', '母', 'パン', '買いました'],
  ['父が新聞を読みました。', '父', '新聞', '読みました'],
  ['学生が音楽を聞きます。', '学生', '音楽', '聞きます'],
  ['たけしさんが手紙を書きました。', 'たけしさん', '手紙', '書きました'],
  ['学校で本を読みます。', null, '本', '読みます'],
  ['きのう映画を見ました。', null, '映画', '見ました'],
  ['毎日コーヒーを飲みます。', null, 'コーヒー', '飲みます'],
  ['図書館で日本語を勉強しました。', null, '日本語', '勉強しました'],
  ['あしたテニスをします。', null, 'テニス', 'します'],
  ['朝ごはんを食べませんでした。', null, '朝ごはん', '食べませんでした'],
  ['写真を撮りましょう。', null, '写真', '撮りましょう'],
  ['何を買いましたか。', null, '何', '買いました'],
  ['ねこが寝ています。', 'ねこ', null, '寝ています'],
  ['友だちが来ました。', '友だち', null, '来ました'],
  ['雨が降りました。', '雨', null, '降りました'],
  ['先生が帰りました。', '先生', null, '帰りました'],
  ['八時に起きました。', null, null, '起きました'],
  ['公園で泳ぎました。', null, null, '泳ぎました'],
  ['あした学校に行きます。', null, null, '行きます'],
  ['きのう家に帰りました。', null, null, '帰りました'],
];
sentences.forEach(([sentence, s, o, v], i) => {
  const field = i % 3,
    labels = ['subjektet (S)', 'objektet (O)', 'verbet (V)'],
    a = [s, o, v][field];
  extraQuestions.push({
    id: `sov-extra-${i + 1}`,
    topic: 'Ordföljd',
    prompt: `Identifiera ${labels[field]}. Skriv utan partikel; skriv × om ledet saknas.\n${sentence}`,
    answers: a ? [a] : ['×', 'saknas', 'utelämnat'],
    answerLang: 'ja',
    explanation: `S: ${s || 'utelämnat'}. O: ${o || 'saknas'}. V: ${v}. Plats och tid är inte subjekt eller direkt objekt.`,
    source: 'Kompletterande övning',
  });
});
