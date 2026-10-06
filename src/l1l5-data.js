// Data from Material/L1からL5.pdf - Rika Hayashi (SOL A417, Lunds universitet)
// 『げんき』L1~L5 ふくしゅう satsmönster

const particleChoices = ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も', 'へ', '×'];

export const l1l5Questions = [
  // ==========================================
  // SLIDE 9: PARTIKLAR (Del 1)
  // ==========================================
  // S1: きのう ( ) びょういん ( ) ぎんこう ( ) いきました。
  {
    id: 'l1l5-p-1',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nきのう【　】びょういんとぎんこうにいきました。',
    answers: ['×'],
    choices: particleChoices,
    explanation:
      'きのう (igår) är en relativ tidsangivelse och används normalt utan tidspartikeln に.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-2',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nきのうびょういん【　】ぎんこうにいきました。',
    answers: ['と'],
    choices: particleChoices,
    explanation:
      'と förbinder två substantiv i en uppräkning: sjukhus OCH bank (びょういんとぎんこう).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-3',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nきのうびょういんとぎんこう【　】いきました。',
    answers: ['に', 'へ'],
    choices: particleChoices,
    explanation:
      'に (eller へ) anger målet eller riktningen för förflyttningen vid verbet いきました (gick/åkte till banken).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S2: メアリーさん ( ) ソラさんはねこ ( ) だいすきです。
  {
    id: 'l1l5-p-4',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nメアリーさん【　】ソラさんはねこがだいすきです。',
    answers: ['と'],
    choices: particleChoices,
    explanation: 'と binder samman personerna Mary och Sora i en uppräkning: Mary OCH Sora.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-5',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nメアリーさんとソラさんはねこ【　】だいすきです。',
    answers: ['が'],
    choices: particleChoices,
    explanation:
      'Vid känslouttryck och preferenser som だいすき markeras föremålet/djuret man tycker om med が.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S3: としょかん ( ) ちかく ( ) たけしさん ( ) まちます。
  {
    id: 'l1l5-p-6',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nとしょかん【　】ちかくでたけしさんをまちます。',
    answers: ['の'],
    choices: particleChoices,
    explanation: 'Substantiv + の + lägesord: bibliotekets närhet (としょかんのちかく).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-7',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nとしょかんのちかく【　】たけしさんをまちます。',
    answers: ['で'],
    choices: particleChoices,
    explanation:
      'で markerar handlingsplatsen där man väntar (att vänta är en aktiv handling: まちます).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-8',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nとしょかんのちかくでたけしさん【　】まちます。',
    answers: ['を'],
    choices: particleChoices,
    explanation: 'を markerar det direkta objektet för verbet まちます: den person man väntar på.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S4: せんしゅう ( ) じてんしゃ ( ) のりました。
  {
    id: 'l1l5-p-9',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nせんしゅう【　】じてんしゃにのりました。',
    answers: ['×'],
    choices: particleChoices,
    explanation:
      'せんしゅう (förra veckan) är ett relativt tidsuttryck och tar ingen tidspartikel.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-10',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nせんしゅうじてんしゃ【　】のりました。',
    answers: ['に'],
    choices: particleChoices,
    explanation:
      'Fordonet eller transportmedlet man stiger på/cyklar på markeras med に vid verbet のります.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S5: このかんじはとても ( ) むずかしい ( ) です。せんせい ( ) ききましょう。
  {
    id: 'l1l5-p-11',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nこのかんじはとても【　】むずかしいです。せんせいにききましょう。',
    answers: ['×'],
    choices: particleChoices,
    explanation:
      'Adverbet とても (mycket) modifierar adjektivet direkt utan någon partikel emellan.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-12',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nこのかんじはとてもむずかしい【　】です。せんせいにききましょう。',
    answers: ['×'],
    choices: particleChoices,
    explanation:
      'Ett i-adjektiv i presens (むずかしい) följs direkt av artighetsmarkören です utan någon partikel.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-13',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nこのかんじはとてもむずかしいです。せんせい【　】ききましょう。',
    answers: ['に'],
    choices: particleChoices,
    explanation:
      'Vid verbet ききます (i betydelsen fråga) markeras personen man frågar med partikeln に.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S6: にちようび ( ) ひとりで ( ) カフェ ( ) コーヒー ( ) のみます。
  {
    id: 'l1l5-p-14',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nにちようび【　】ひとりでカフェでコーヒーをの行きます。',
    answers: ['に'],
    choices: particleChoices,
    explanation:
      'Veckodagar är specifika tidpunkter och markeras med tidspartikeln に: にちようびに.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-15',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nにちようびにひとりで【　】カフェでコーヒーをのみます。',
    answers: ['×'],
    choices: particleChoices,
    explanation:
      'ひとりで (ensam) är ett komplett adverbialt uttryck som redan innehåller で och behöver ingen partikel.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-16',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nにちようびにひとりでカフェ【　】コーヒーをのみます。',
    answers: ['で'],
    choices: particleChoices,
    explanation: 'で markerar handlingsplatsen där man fikar (på kaféet).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-17',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nにちようびにひとりでカフェでコーヒー【　】のみます。',
    answers: ['を'],
    choices: particleChoices,
    explanation: 'を markerar det direkta objektet som dricks vid verbet のみます: kaffet.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S7: バスてい ( ) ソラさん ( ) あいました。
  {
    id: 'l1l5-p-18',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nバスてい【　】ソラさんにあいました。',
    answers: ['で'],
    choices: particleChoices,
    explanation: 'Handlingsplatsen för mötet (vid busshållplatsen) markeras med で.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-19',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nバスていでソラさん【　】あいました。',
    answers: ['に'],
    choices: particleChoices,
    explanation: 'Personen man möter eller träffar markeras med partikeln に vid verbet あいます.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S8: ひとりで ( ) うみ ( ) サーフィン ( ) します。
  {
    id: 'l1l5-p-20',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nひとりで【　】うみでサーフィンをします。',
    answers: ['×'],
    choices: particleChoices,
    explanation:
      'ひとりで (ensam) är ett självständigt adverbialt uttryck och tar ingen partikel efter sig.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-21',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nひとりでうみ【　】サーフィンをします。',
    answers: ['で'],
    choices: particleChoices,
    explanation: 'で markerar platsen där aktiviteten utövas (i havet).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-22',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nひとりでうみでサーフィン【　】します。',
    answers: ['を', '×'],
    choices: particleChoices,
    explanation: 'Vid sporter och spel används normalt partikeln を tillsammans med verbet します.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S9: いつ ( ) れきし ( ) テスト ( ) ありますか。
  {
    id: 'l1l5-p-23',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nいつ【　】れきしのテストがありますか。',
    answers: ['×'],
    choices: particleChoices,
    explanation: 'Frågeordet いつ (när) tar normalt ingen tidspartikel (inte に).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-24',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nいつれきし【　】テストがありますか。',
    answers: ['の'],
    choices: particleChoices,
    explanation: 'の binder samman två substantiv: ämnet historia och prov (historiaprov).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-25',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nいつれきしのテスト【　】ありますか。',
    answers: ['が'],
    choices: particleChoices,
    explanation:
      'Händelsen eller föremålet som äger rum/finns markeras med が vid verbet あります.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S10: まいにち ( ) 3じかん ( ) うち ( ) べんきょうします。
  {
    id: 'l1l5-p-26',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nまいにち【　】3じかんうちでべんきょうします。',
    answers: ['×'],
    choices: particleChoices,
    explanation: 'まいにち (varje dag) är en frekvensangivelse och tar inte tidspartikeln に.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-27',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nまいにち3じかん【　】うちでべんきょうします。',
    answers: ['×'],
    choices: particleChoices,
    explanation:
      'Tidslängd/varaktighet (3 timmar = 3じかん) står direkt utan partikel före verbet.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-28',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nまいにち3じかんうち【　】べんきょうします。',
    answers: ['で'],
    choices: particleChoices,
    explanation: 'で markerar handlingsplatsen (hemma där studierna bedrivs).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S11: Tシャツ ( ) 2まい ( ) かいます。
  {
    id: 'l1l5-p-29',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nTシャツ【　】2まいかいます。',
    answers: ['を'],
    choices: particleChoices,
    explanation: 'を markerar föremålet som köps (T-shirtarna) som direkt objekt.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-30',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nTシャツを2まい【　】かいます。',
    answers: ['×'],
    choices: particleChoices,
    explanation: 'Räkneordsuttryck placeras oftast direkt före verbet utan någon partikel.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S12: ぼく ( ) へや ( ) ゲーム ( ) しましょう。
  {
    id: 'l1l5-p-31',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nぼく【　】へやでゲームをしましょう。',
    answers: ['の'],
    choices: particleChoices,
    explanation: 'の anger tillhörighet eller ägande: mitt rum (ぼくのへや).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-32',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nぼくのへや【　】ゲームをしましょう。',
    answers: ['で'],
    choices: particleChoices,
    explanation: 'で markerar platsen där handlingen (spelandet) ska äga rum.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-33',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nぼくのへやでゲーム【　】しましょう。',
    answers: ['を'],
    choices: particleChoices,
    explanation: 'Spel och sporter kombineras med partikeln を och verbet する (ゲームをします).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 9,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // ==========================================
  // SLIDE 18: PARTIKLAR (Del 2)
  // ==========================================
  // S13: あそこ ( ) スーパー ( ) ぎんこう ( ) あります。
  {
    id: 'l1l5-p-34',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nあそこ【　】スーパーとぎんこうがあります。',
    answers: ['に'],
    choices: particleChoices,
    explanation: 'Platsen där föremål finns vid existensverbet あります markeras med partikeln に.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-35',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nあそこにスーパー【　】ぎんこうがあります。',
    answers: ['と'],
    choices: particleChoices,
    explanation: 'と förbinder två substantiv i en uppräkning: snabbköp OCH bank.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-36',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nあそこにスーパーとぎんこう【　】あります。',
    answers: ['が'],
    choices: particleChoices,
    explanation: 'Det som finns eller existerar markeras med subjektsmarkören が vid あります.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S14: このTシャツはちょっと ( ) おおきい ( ) です。
  {
    id: 'l1l5-p-37',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nこのTシャツはちょっと【　】おおきいです。',
    answers: ['×'],
    choices: particleChoices,
    explanation:
      'Adverbet ちょっと (lite) modifierar adjektivet direkt utan någon partikel emellan.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-38',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nこのTシャツはちょっとおおきい【　】です。',
    answers: ['×'],
    choices: particleChoices,
    explanation: 'Ett i-adjektiv i presens (おおきい) binds direkt till です utan partikel.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S15: わたしはときどき ( ) ソラさん ( ) えいが ( ) みます。
  {
    id: 'l1l5-p-39',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nわたしはときどき【　】ソラさんとえいがをみます。',
    answers: ['×'],
    choices: particleChoices,
    explanation: 'Frekvensadverbet ときどき (ibland) tar normalt inte tidspartikeln に.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-40',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nわたしはときどきソラさん【　】えいがをみます。',
    answers: ['と'],
    choices: particleChoices,
    explanation: 'と anger sällskap: vem man gör handlingen tillsammans med (med Sora).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-41',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nわたしはときどきソラさんとえいが【　】みます。',
    answers: ['を'],
    choices: particleChoices,
    explanation: 'を markerar det direkta objektet för verbet みます: filmen som ses.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S16: うち ( ) かえりましょう。
  {
    id: 'l1l5-p-42',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nうち【　】かえりましょう。',
    answers: ['に', 'へ'],
    choices: particleChoices,
    explanation:
      'Målet eller riktningen för hemfärden markeras med partikeln に eller へ vid verbet かえります.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S17: まいばん ( ) おんがく ( ) ききます。
  {
    id: 'l1l5-p-43',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nまいばん【　】おんがくをききます。',
    answers: ['×'],
    choices: particleChoices,
    explanation: 'Tidsuttrycket まいばん (varje kväll) används utan tidspartikeln に.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-44',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nまいばんおんがく【　】ききます。',
    answers: ['を'],
    choices: particleChoices,
    explanation: 'Musiken är det direkta objektet som lyssnas på och markeras med を.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S18: バスてい ( ) ちかく ( ) メアリーさん ( ) います。
  {
    id: 'l1l5-p-45',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nバスてい【　】ちかくにメアリーさんがいます。',
    answers: ['の'],
    choices: particleChoices,
    explanation: 'Substantiv + の + lägesord: busshållplatsens närhet (バスていのちかく).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-46',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nバスていのちかく【　】メアリーさんがいます。',
    answers: ['に'],
    choices: particleChoices,
    explanation:
      'Platsen där en levande varelse finns eller vistas markeras med に vid verbet います.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-47',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nバスていのちかくにメアリーさん【　】います。',
    answers: ['が'],
    choices: particleChoices,
    explanation: 'Personen som finns markeras som subjekt med partikeln が vid verbet います.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S19: せんげつ ( ) 70じかんぐらい ( ) べんきょうしました。
  {
    id: 'l1l5-p-48',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nせんげつ【　】70じかんぐらいべんきょうしました。',
    answers: ['×'],
    choices: particleChoices,
    explanation: 'せんげつ (förra månaden) är en relativ tidsangivelse och tar inte partikeln に.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-49',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nせんげつ70じかんぐらい【　】べんきょうしました。',
    answers: ['×'],
    choices: particleChoices,
    explanation:
      'Tidslängd med approximativt suffix (70 timmar ungefär) tar ingen partikel före verbet.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S20: こんばん ( ) 12じはん ( ) ねます。
  {
    id: 'l1l5-p-50',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nこんばん【　】12じはんにねます。',
    answers: ['×'],
    choices: particleChoices,
    explanation: 'こんばん (ikväll) är en relativ tidsangivelse och tar ingen tidspartikel.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-51',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nこんばん12じはん【　】ねます。',
    answers: ['に'],
    choices: particleChoices,
    explanation:
      'Ett specifikt klockslag (12:30) är en bestämd tidpunkt och markeras med partikeln に.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S21: としょかん ( ) なか ( ) カフェ ( ) あります。
  {
    id: 'l1l5-p-52',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nとしょかん【　】なかにカフェがあります。',
    answers: ['の'],
    choices: particleChoices,
    explanation: 'Substantiv + の + lägesord: inne i biblioteket (としょかんのなか).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-53',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nとしょかんのなか【　】カフェがあります。',
    answers: ['に'],
    choices: particleChoices,
    explanation: 'Existensplatsen för ett kafé vid verbet あります markeras med partikeln に.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-54',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nとしょかんのなかにカフェ【　】あります。',
    answers: ['が'],
    choices: particleChoices,
    explanation: 'Det som finns (kaféet) markeras med subjektsmarkören が vid あります.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S22: あしたどこ ( ) いきますか。…どこ ( ) ( ) いきません。
  {
    id: 'l1l5-p-55',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nあしたどこ【　】いきますか。',
    answers: ['に', 'へ'],
    choices: particleChoices,
    explanation:
      'Riktningen eller destinationen för frågan vart man ska gå markeras med に eller へ.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-56',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nあしたどこにいきますか。…どこ【　】もいきません。',
    answers: ['に', 'へ'],
    choices: particleChoices,
    explanation:
      'Vid total negation av förflyttning placeras に eller へ före も: どこにも / どこへも.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-57',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nあしたどこにいきますか。…どこへ【　】いきません。',
    answers: ['も'],
    choices: particleChoices,
    explanation:
      'Partikeln も efter frågeord och målpartikel ger en total negation: inte till någonstans (どこへもいきません).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // S23: すみません。コーヒー ( ) ハンバーガー ( ) ください。
  {
    id: 'l1l5-p-58',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nすみません。コーヒー【　】ハンバーガーをください。',
    answers: ['と'],
    choices: particleChoices,
    explanation: 'と förbinder kaffe och hamburgare i uppräkningen: kaffe OCH hamburgare.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-p-59',
    topic: 'Partiklar',
    prompt:
      'Please complete the sentence using one hiragana (cannot use は; if nothing needed put ×):\nすみません。コーヒーとハンバーガー【　】ください。',
    answers: ['を', '×'],
    choices: particleChoices,
    explanation: 'を markerar det man ber om vid ください: ハンバーガーをください.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 18,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // ==========================================
  // SLIDE 13: FLERVALSUPPGIFTER (11 frågor)
  // ==========================================
  {
    id: 'l1l5-mc-1',
    topic: 'Ord & kanji',
    prompt:
      'Please choose the appropriate word or expression:\nたけしさんは【　】としょかんにいきました。',
    answers: ['ひとりで'],
    choices: ['ぜんぜん', 'ひとりで', 'いっしょに'],
    explanation:
      'ひとりで betyder ensam. ぜんぜん kräver ett nekande verb och いっしょに kräver sällskap (eller と).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 13,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-mc-2',
    topic: 'Ord & kanji',
    prompt:
      'Please choose the appropriate word or expression:\nこのTシャツは【　】たかかったです。',
    answers: ['ちょっと'],
    choices: ['あまり', 'ちょっと', 'たいてい'],
    explanation:
      'ちょっと betyder lite/ganska och passar med dåtidsadjektivet たかかったです. あまり kräver en negation.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 13,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-mc-3',
    topic: 'Ord & kanji',
    prompt: 'Please choose the appropriate word or expression:\nまどのちかくに【　】がいます。',
    answers: ['いぬ'],
    choices: ['しんぶん', 'いぬ', 'さいふ'],
    explanation:
      'います används för levande varelser (människor och djur, som いぬ). För icke-levande ting används あります.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 13,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-mc-4',
    topic: 'Grammatikteori',
    prompt:
      'Please choose the appropriate word or expression:\nともだちのへやはきれいです。【　】わたしのへやはきれいじゃないです。',
    answers: ['でも'],
    choices: ['どうぞ', 'それから', 'でも'],
    explanation:
      'でも betyder men och skapar kontrast mellan kompisens rena rum och mitt inte rena rum.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 13,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-mc-5',
    topic: 'Ord & kanji',
    prompt: 'Please choose the appropriate word or expression:\n【　】はとてもいいてんきでしたね。',
    answers: ['おととい'],
    choices: ['おととい', 'あさって', 'らいしゅう'],
    explanation:
      'おととい (i förrgår) är dåtid och matchar verbet でした. あさって (i övermorgon) och らいしゅう (nästa vecka) är framtid.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 13,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-mc-6',
    topic: 'Ord & kanji',
    prompt: 'Please choose the appropriate word or expression:\n【　】をなんまいかいましたか。',
    answers: ['Tシャツ'],
    choices: ['くつ', 'Tシャツ', 'けしゴム'],
    explanation:
      'Räknaren まい (枚) används för tunna, platta föremål som T-shirtar och papper. Skor räknas med 足 (そく).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 13,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-mc-7',
    topic: 'Ord & kanji',
    prompt:
      'Please choose the appropriate word or expression:\nあした【　】サーフィンをしましょう。',
    answers: ['いっしょに'],
    choices: ['ときどき', 'たいてい', 'いっしょに'],
    explanation:
      'いっしょに (tillsammans) passar perfekt med förslagsformen ましょう (låt oss surfa tillsammans imorgon).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 13,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-mc-8',
    topic: 'Ord & kanji',
    prompt: 'Please choose the appropriate word or expression:\nせんしゅうは【　】あつかったです。',
    answers: ['すごく'],
    choices: ['たいてい', 'すごく', 'どんな'],
    explanation:
      'すごく (väldigt/otroligt) är ett förstärkande adverb som beskriver hur varmt det var (あつかったです).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 13,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-mc-9',
    topic: 'Ord & kanji',
    prompt: 'Please choose the appropriate word or expression:\nソラさんのおかあさんは【　】です。',
    answers: ['かんごし'],
    choices: ['こうがく', 'かんこく', 'かんごし'],
    explanation:
      'かんごし betyder sjuksköterska (yrke). こうがく betyder ingenjörskonst och かんこく är Sydkorea.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 13,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-mc-10',
    topic: 'Ord & kanji',
    prompt:
      'Please choose the appropriate word or expression:\nたけしさんは【　】おさけをのみません。',
    answers: ['あまり'],
    choices: ['よく', 'あまり', 'ちょっと'],
    explanation:
      'あまり används tillsammans med en nekande verbform (のみません) och betyder inte särskilt ofta / sällan.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 13,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-mc-11',
    topic: 'Ord & kanji',
    prompt:
      'Please choose the appropriate word or expression:\nあのしゅくだいは【　】むずかしくなかったです。',
    answers: ['ぜんぜん'],
    choices: ['ぜんぜん', 'じゃあ', 'でも'],
    explanation:
      'ぜんぜん kombineras med en nekande form (むずかしくなかったです) och betyder inte alls svår.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 13,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // ==========================================
  // SLIDES 5, 6, 8, 11, 16, 17: GRAMMATIKBEGREPP & FRÅGEMÖNSTER
  // ==========================================
  //なん vs なに (Slide 5 & 6)
  {
    id: 'l1l5-g-1',
    topic: 'Grammatikteori',
    prompt: 'When is the reading なん used instead of なに for 何?',
    answers: ['Before t-, d-, n-sounds and counter suffixes'],
    choices: [
      'Before t-, d-, n-sounds and counter suffixes',
      'Before particles を and が',
      'Only at the end of a sentence',
    ],
    explanation:
      'なん används när följande ljud börjar på t-, d- eller n-raden (t.ex. なん＋ですか) samt före räkneord/klassifikatorer (なんさい, なんじ).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 5,
    promptLang: 'en',
    answerLang: 'en',
  },
  {
    id: 'l1l5-g-2',
    topic: 'Grammatikteori',
    prompt: 'Please choose the correct reading of 何:\nきのう【　】をたべましたか。',
    answers: ['なに'],
    choices: ['なに', 'なん'],
    explanation:
      'Före partikeln を används läsningen なに: なにをたべましたか。 Läsningen なん används före t/d/n-ljud och räkneord.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 5,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-g-3',
    topic: 'Grammatikteori',
    prompt: 'Please choose the correct reading of 何:\nそれは【　】ですか。',
    answers: ['なん'],
    choices: ['なん', 'なに'],
    explanation:
      'Före です (vars begynnelsekonsonant d tillhör d-raden) uttalas 何 alltid なん: なんですか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 5,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-g-4',
    topic: 'Grammatikteori',
    prompt: 'Please choose the correct reading of 何:\nソラさんは【　】さいですか。',
    answers: ['なん'],
    choices: ['なん', 'なに'],
    explanation: 'Före räknesuffixet さい (år gammal) används läsningen なん: なんさいですか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 5,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-g-5',
    topic: 'Grammatikteori',
    prompt: 'Please choose the correct question word:\nきょうは【　】ですか。…きんようびです。',
    answers: ['なんようび'],
    choices: ['なんようび', 'なんがつなんにち', 'いつ'],
    explanation:
      'När svaret är en specifik veckodag (きんようび) frågar man med なんようび (vilken veckodag).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 6,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-g-6',
    topic: 'Grammatikteori',
    prompt:
      'Please choose the correct question word:\nたんじょうびは【　】ですか。…くがつじゅうよっかです。',
    answers: ['なんがつなんにち'],
    choices: ['なんがつなんにち', 'なんようび', 'なんさい'],
    explanation:
      'När svaret är ett specifikt datum med månad och dag (14 september) frågar man med なんがつなんにち (vilken månad och dag) eller いつ.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 6,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-g-7',
    topic: 'Grammatikteori',
    prompt:
      'Please choose the correct reading of 何:\nとしょかんのでんわばんごうは【　】ばんですか。',
    answers: ['なん'],
    choices: ['なん', 'なに'],
    explanation: 'Före nummersuffixet ばん (nummer) används läsningen なん: なんばんですか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 5,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-g-8',
    topic: 'Grammatikteori',
    prompt: 'Please choose the correct reading of 何:\nしゅうまつ【　】をしますか。',
    answers: ['なに'],
    choices: ['なに', 'なん'],
    explanation: 'Före partikeln を används läsningen なに: なにをしますか (vad ska du göra).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 5,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // Nをする (Slide 8)
  {
    id: 'l1l5-g-9',
    topic: 'Grammatikteori',
    prompt: 'What kinds of nouns can be combined with をする according to Genki L1–L5?',
    answers: ['Sports/games, gatherings/events, and activities'],
    choices: [
      'Sports/games, gatherings/events, and activities',
      'Only ball sports and physical athletics',
      'Only academic study and homework',
    ],
    explanation:
      'Nをする används för 1) sporter/spel (テニス, ゲーム), 2) sammankomster/fester (パーティー, かいぎ), och 3) aktiviteter (しゅくだい, アルバイト).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 8,
    promptLang: 'en',
    answerLang: 'en',
  },
  {
    id: 'l1l5-g-10',
    topic: 'Grammatikteori',
    prompt: 'Please choose the appropriate particle:\nこんばんうちでパーティー【　】します。',
    answers: ['を'],
    choices: ['を', 'に', 'で'],
    explanation: 'Nをする (arrangera fest): パーティーをします tar partikeln を.',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 8,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // ～をください / ～をおねがいします / ～をどうぞ (Slide 11)
  {
    id: 'l1l5-g-11',
    topic: 'Grammatikteori',
    prompt: 'Ordering at a café/restaurant: コーヒーとケーキ【　】。',
    answers: ['をおねがいします'],
    choices: ['をおねがいします', 'をどうぞ', 'をください'],
    explanation:
      'Vid beställning av mat och dryck på restaurang eller kafé används vanligen ～をおねがいします (eller をください).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 11,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-g-12',
    topic: 'Grammatikteori',
    prompt: 'Asking for a physical item in a shop: そのとけい【　】。',
    answers: ['をください'],
    choices: ['をください', 'をどうぞ', 'をおねがいします'],
    explanation:
      'När man ber om ett specifikt föremål man vill köpa i en butik säger man そのとけいをください (ge mig den klockan, tack).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 11,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-g-13',
    topic: 'Grammatikteori',
    prompt: 'Store clerk offering something to a guest: いらっしゃいませ。メニュー【　】。',
    answers: ['をどうぞ'],
    choices: ['をどうぞ', 'をください', 'をおねがいします'],
    explanation:
      'När man erbjuder eller räcker över något till någon säger man ～をどうぞ (var så god och ta menyn).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 11,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // どれ vs どのN (Slide 16 & 17)
  {
    id: 'l1l5-g-14',
    topic: 'Grammatikteori',
    prompt: 'What is the grammatical difference between どれ and どの?',
    answers: ['どの must modify a noun directly; どれ stands alone as a pronoun'],
    choices: [
      'どの must modify a noun directly; どれ stands alone as a pronoun',
      'どれ must modify a noun directly; どの stands alone as a pronoun',
      'They are completely identical in syntax',
    ],
    explanation:
      'どの är ett demonstrativt attribut och MÅSTE följas direkt av ett substantiv (どのペン). どれ är ett självständigt pronomen (どれですか).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 16,
    promptLang: 'en',
    answerLang: 'en',
  },
  {
    id: 'l1l5-g-15',
    topic: 'Grammatikteori',
    prompt: 'Please complete the sentence:\n【　】がメアリーさんのかさですか。',
    answers: ['どれ'],
    choices: ['どれ', 'どの', 'あれ'],
    explanation:
      'När frågeordet följs direkt av partikeln が utan ett substantiv används どれ (vilken/vilket).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 16,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-g-16',
    topic: 'Grammatikteori',
    prompt: 'Please complete the sentence:\n【　】ペンが300えんですか。',
    answers: ['どの'],
    choices: ['どの', 'どれ', 'だれの'],
    explanation:
      'Före ett substantiv (ペン) måste どの användas: どのペンが300えんですか (vilken penna kostar 300 yen).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 17,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // ==========================================
  // SLIDES 7 & 15: ÖVERSÄTTNING MED ORDFÖLJDSBYGGE (15 frågor)
  // ==========================================
  // Slide 7 (10 frågor)
  {
    id: 'l1l5-t-1',
    topic: 'Ordföljd',
    prompt: 'Translate into Japanese:\nWhat year are you in college?',
    answers: [
      'だいがくなんねんせいですか。',
      'だいがくのなんねんせいですか。',
      'なんねんせいですか。',
    ],
    tiles: ['なんねんせい', 'だいがく', '。', 'ですか'],
    explanation:
      'だいがく (universitet) + なんねんせい (vilken årskurs) + ですか (fråga): だいがくなんねんせいですか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 7,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-2',
    topic: 'Ordföljd',
    prompt: 'Translate into Japanese:\nHow about the economic class?',
    answers: ['けいざいのクラスはどうですか。'],
    tiles: ['クラス', 'は', 'けいざい', 'どうですか', '。', 'の'],
    explanation:
      'けいざい (ekonomi) + の + クラス (lektion/kurs) + は + どうですか (hur är det): けいざいのクラスはどうですか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 7,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-3',
    topic: 'Ordföljd',
    prompt: 'Translate into Japanese:\nWhen did you go to the library?',
    answers: ['いつとしょかんにいきましたか。', 'いつとしょかんへいきましたか。'],
    tiles: ['としょかん', 'に', '。', 'いつ', 'いきましたか'],
    explanation:
      'いつ (när) + としょかん (bibliotek) + に + いきましたか (gick du): いつとしょかんにいきましたか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 7,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-4',
    topic: 'Ordföljd',
    prompt: 'Translate into Japanese:\nWhat time did Mary get up yesterday?',
    answers: [
      'きのうメアリーさんはなんじにおきましたか。',
      'メアリーさんはきのうなんじにおきましたか。',
    ],
    tiles: ['なんじに', 'きのう', 'は', 'メアリーさん', '。', 'おきましたか'],
    explanation:
      'きのう + メアリーさんは + なんじに + おきましたか: きのうメアリーさんはなんじにおきましたか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 7,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-5',
    topic: 'Ordföljd',
    prompt: 'Translate into Japanese:\nWhere is the post office?',
    answers: ['ゆうびんきょくはどこですか。'],
    tiles: ['どこ', 'は', 'ゆうびんきょく', '。', 'ですか'],
    explanation:
      'ゆうびんきょく (postkontor) + は + どこ (var) + ですか: ゆうびんきょくはどこですか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 7,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-6',
    topic: 'Ordföljd',
    prompt: 'Translate into Japanese:\nWhat is your major?',
    answers: ['せんこうはなんですか。'],
    tiles: ['なん', 'せんこう', '。', 'は', 'ですか'],
    explanation: 'せんこう (huvudämne) + は + なん (vad) + ですか: せんこうはなんですか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 7,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-7',
    topic: 'Ordföljd',
    prompt: 'Translate into Japanese:\nHow much is this watch?',
    answers: ['このとけいはいくらですか。'],
    tiles: ['いくら', 'は', 'とけい', 'この', 'ですか', '。'],
    explanation:
      'この (denna) + とけい (klocka) + は + いくら (hur mycket) + ですか: このとけいはいくらですか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 7,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-8',
    topic: 'Ordföljd',
    prompt: 'Translate into Japanese:\nWhose bicycle is that?',
    answers: ['あれはだれのじてんしゃですか。'],
    tiles: ['じてんしゃ', 'だれの', 'は', 'あれ', '。', 'ですか'],
    explanation:
      'あれ (den där borta) + は + だれの (vems) + じてんしゃ (cykel) + ですか: あれはだれのじてんしゃですか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 7,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-9',
    topic: 'Ordföljd',
    prompt: 'Translate into Japanese:\nHow old are you, Takeshi?',
    answers: ['たけしさんはなんさいですか。'],
    tiles: ['なんさい', 'は', 'たけしさん', '。', 'ですか'],
    explanation: 'たけしさんは + なんさい (hur många år) + ですか: たけしさんはなんさいですか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 7,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-10',
    topic: 'Ordföljd',
    prompt: 'Translate into Japanese:\nWhat did you do last weekend?',
    answers: ['しゅうまつなにをしましたか。', 'しゅうまつはなにをしましたか。'],
    tiles: ['しましたか', 'なにを', 'しゅうまつ', '。'],
    explanation:
      'しゅうまつ (helg) + なにを (vad) + しましたか (gjorde du): しゅうまつなにをしましたか。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 7,
    promptLang: 'en',
    answerLang: 'ja',
  },

  // Slide 15 (5 frågor med も/にも/でも)
  {
    id: 'l1l5-t-11',
    topic: 'Ordföljd',
    prompt:
      'Ken studies politics and biology. Translate the underline part into Japanese:\nYui studies politics and biology, too.',
    answers: [
      'ゆいさんもせいじとせいぶつがくをべんきょうします。',
      'ゆいさんもせいじとせいぶつをべんきょうします。',
    ],
    tiles: ['べんきょうします', 'ゆいさん', 'せいぶつがくを', 'も', 'せいじと', '。'],
    explanation:
      'Partikeln も (också) ersätter ämnespartikeln は: ゆいさんも せいじとせいぶつがくを べんきょうします。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 15,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-12',
    topic: 'Ordföljd',
    prompt:
      'Mary swam on Wednesday. Translate the underline part into Japanese:\nShe swam on Friday, too.',
    answers: ['きんようびにもおよぎました。'],
    tiles: ['およぎました', 'に', 'きんようび', '。', 'も'],
    explanation:
      'När も kombineras med tidspartikeln に placeras も efter に: きんようびにも およぎました。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 15,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-13',
    topic: 'Ordföljd',
    prompt:
      'Yumi watched the movie with Takashi at home. Translate the underline part into Japanese:\nShe watched the movie with Takashi at the town, too.',
    answers: ['まちでもたけしさんとえいがをみました。'],
    tiles: ['みました', 'まち', 'も', 'えいがを', 'で', 'たけしさんと', '。'],
    explanation:
      'När も kombineras med handlingsplatspartikeln で behålls förflyttningen/platsen: まちでも たけしさんと えいがを みました。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 15,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-14',
    topic: 'Ordföljd',
    prompt:
      'Yumi went to the book store last night. Translate the underline part into Japanese:\nShe went to the supermarket, too.',
    answers: ['スーパーにもいきました。', 'スーパーへもいきました。'],
    tiles: ['いきました', 'に', 'スーパー', '。', 'も'],
    explanation:
      'Målpartikeln に (eller へ) behålls och följs av も för att uttrycka ”till snabbköpet också”: スーパーにも いきました。',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 15,
    promptLang: 'en',
    answerLang: 'ja',
  },
  {
    id: 'l1l5-t-15',
    topic: 'Ordföljd',
    prompt:
      'Ken ate pork cutlet. Translate the underline part into Japanese:\nHe ate a hamburger, too.',
    answers: ['ハンバーガーもたべました。'],
    tiles: ['たべました', 'ハンバーガー', '。', 'も'],
    explanation:
      'Partikeln も ersätter direkt objektpartikeln を: ハンバーガーも たべました (åt en hamburgare också).',
    source: 'L1–L5 ふくしゅう (Hayashi)',
    set: 'l1l5',
    slide: 15,
    promptLang: 'en',
    answerLang: 'ja',
  },
];
