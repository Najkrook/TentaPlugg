import { selfAssessmentCriteria, selfAssessmentGuide } from './self-assessment.js';
// Teaching content stays separate from grading: hints must never decide correctness.
export const wordClasses = {
  Noun: 'Substantiv namnger exempelvis en sak, person eller företeelse.',
  Verb: 'Verb uttrycker handling eller tillstånd och kan böjas i tid och negation.',
  Adjective: 'Adjektiv beskriver en egenskap hos något.',
  Adverb: 'Adverb beskriver exempelvis hur, hur mycket eller hur ofta något sker.',
  Pronoun: 'Pronomen syftar på exempelvis en person utan att ange personens namn.',
  Particle: 'Partiklar visar hur ord och fraser förhåller sig till resten av meningen.',
  'numerical classifier':
    'Räkneordsklassifikatorer används med antal och väljs efter vad man räknar, som 枚 för platta saker.',
  ideophone:
    'Ideofoner är ljudhärmande eller beskrivande uttryck, som ニャーニャー för kattens läte.',
};

export const particleFunctions = {
  Topic: 'Tema: det meningen handlar om.',
  Subject: 'Subjekt: det som gör något eller som predikatet säger något om.',
  'Listing things': 'Uppräkning: binder ihop substantiv, som A och B.',
  Object: 'Direkt objekt: det handlingen riktas mot.',
  'Do things together with': 'Sällskap: vem man gör något tillsammans med.',
  Tool: 'Medel: det man använder för att göra något, även språk eller transportmedel.',
  'Location of action': 'Handlingsplats: var något görs.',
  'Point of time': 'Tidpunkt: när något sker.',
  'Location of existence': 'Existensplats: var någon eller något finns.',
  Quotation: 'Citat: innehållet i det som sägs eller tänks.',
  Question: 'Fråga: gör yttrandet till en fråga.',
  Also: 'Också: lägger till något till det som redan gäller.',
  Assertion: 'Upplysning: よ framhäver information för den som lyssnar.',
  'Possessive / nominal phrase': 'Nominal bestämning: ett substantiv bestämmer ett annat.',
  Direction: 'Riktning eller mål: vart någon förflyttar sig.',
};

const particleReasons = [
  'は gör わたしのすきなアニメ till tema. Resten av meningen berättar vilka animer det är.',
  'と binder ihop namnen ハイキュー och ワンパンマン. Ingen person anges som sällskap i en handling.',
  'の binder ihop どようび och ごご: lördagens eftermiddag. Det är に efter klockslaget som anger tidpunkten.',
  'に följer ごご７じ (klockan sju på kvällen). Uttrycket svarar på när filmen sågs.',
  'と följer ともだち (vän). Filmen ses tillsammans med en vän; det är sällskap.',
  'を följer ホラーえいが (skräckfilm). Filmen är det som ses, alltså objektet till みました.',
  'で följer しんかんせん (snabbtåg). Tåget används för resan och är därför transportmedel.',
  'へ följer きょうと. Med いきました anger Kyoto resans riktning eller mål.',
  'で följer どこ (var). べんきょうします är en handling, så frågan gäller var studierna sker.',
  'か avslutar meningen och gör den till en fråga.',
  'に följer ルンド och hör ihop med あります (finns). Lund är platsen där kyrkan finns.',
  'が följer きょうかい (kyrka). Kyrkan är det som finns och är subjekt till あります.',
  'と binder ihop スウェーデンご och えいご: svenska och engelska. Här räknas två språk upp.',
  'は gör hela uttrycket om studier i svenska och engelska till tema. Resten säger att studierna är roliga.',
  'に följer 日本 och hör ihop med いきました. Japan är resans mål, inte platsen där något finns.',
  'よ tillför en upplysande eller betonande ton för lyssnaren. Det gör inte meningen till en fråga.',
  'も efter わたし betyder jag också. Jämför は, som presenterar jag som tema utan betydelsen också.',
  'と står efter 「ありがとう」 och före いいます (säger). Det markerar vad som sägs, alltså ett citat.',
];

// Explicit syllable boundaries follow the counting convention in these exercises.
const syllables = {
  かさ: 'か・さ',
  ねこ: 'ね・こ',
  さくら: 'さ・く・ら',
  にほん: 'に・ほん',
  さんぽ: 'さん・ぽ',
  しんぶん: 'しん・ぶん',
  きって: 'きっ・て',
  ざっし: 'ざっ・し',
  きっぷ: 'きっ・ぷ',
  もっと: 'もっ・と',
  おばあさん: 'お・ばあ・さん',
  おじいさん: 'お・じい・さん',
  おとうさん: 'お・とう・さん',
  おかあさん: 'お・かあ・さん',
  きゃく: 'きゃ・く',
  しゃしん: 'しゃ・しん',
  ちょっと: 'ちょっ・と',
  りょこう: 'りょ・こう',
  きょう: 'きょう',
  ぎゅうにゅう: 'ぎゅう・にゅう',
  パーティー: 'パー・ティー',
  タクシー: 'タ・ク・シー',
  ベッド: 'ベッ・ド',
  チケット: 'チ・ケッ・ト',
  ルンド: 'ルン・ド',
  ワンパンマン: 'ワン・パン・マン',
  なっとう: 'なっ・とう',
  えいが: 'えい・が',
  じかん: 'じ・かん',
  がっこう: 'がっ・こう',
  コーヒー: 'コー・ヒー',
  おさけ: 'お・さ・け',
  ストックホルム: 'ス・トッ・ク・ホ・ル・ム',
  しんじゅく: 'しん・じゅ・く',
  コペンハーゲン: 'コ・ペン・ハー・ゲン',
};

const readingReasons = {
  'reading-I.4-1':
    '飲みます betyder dricker. アイスティー är iste, alltså något man dricker. De andra alternativen är pommes frites, rostat bröd och sallad, som man äter.',
  'reading-I.4-2':
    'にあります anger var något finns och behöver här en plats. ウィーン är Wien. De övriga alternativen är ett lag, en person och en sport.',
  'reading-I.4-3':
    'でかいます betyder köper på en plats. まち (stad) anger platsen. はがき är något man kan köpa, men objektet skulle normalt markeras med を.',
  'reading-I.4-4':
    'にいきます betyder går eller åker till ett mål. おしろ (slott) är platsen bland alternativen.',
  'reading-I.4-5':
    'さむい beskriver kyla i väder eller omgivning. スウェーデン är därför det naturliga valet här. För kall mat eller dryck används normalt つめたい.',
  'reading-II.1-1':
    'ですが binder här ihop en kontrast: filmen är skrämmande men intressant (おもしろいです). Det är det avsedda modellsvar som passar kontrasten bäst; andra fortsättningar kan fungera i andra sammanhang.',
  'reading-II.1-2':
    'おきました betyder steg upp. Det behöver här ett adverb: おそい (sen) blir おそく (sent). はやい är adjektivformen; tidigt skulle vara はやく.',
  'reading-II.1-3':
    'それから betyder sedan. うちにかえりました (gick hem) är den naturliga fortsättningen efter lunchen i övningen. Att stiga upp eller inte äta frukost passar sämre i den avsedda tidsföljden.',
  'reading-II.1-4':
    '天気がいい / 天気はいい beskriver bra väder. Därför är いいです modellsvar här. Andra väderbeskrivningar kan vara möjliga med mer sammanhang; den korta meningen ensam gör inte varje annat alternativ grammatiskt omöjligt.',
  'reading-II.1-5':
    'では kan inleda ett avsked. おげんきで betyder ungefär ha det bra. De andra alternativen betyder gick/åkte respektive är billigt och passar inte som avskedsfras.',
};

const wordReasons = {
  Tシャツ: 'Tシャツ betyder T-tröja och namnger en sak.',
  まい: 'まい används när man räknar tunna, platta saker, som T-tröjor.',
  か: 'か markerar här att meningen är en fråga.',
  かわいい: 'かわいい betyder söt och beskriver en egenskap.',
  かいました: 'かいました betyder köpte; ました visar artig dåtid av verbet かいます.',
  ぜんぜん: 'ぜんぜん anger grad, normalt inte alls tillsammans med negation.',
  の: 'の binder här ihop substantiv till en större nominalfras.',
  ねこ: 'ねこ betyder katt och namnger ett djur.',
  ニャーニャー: 'ニャーニャー härmar kattens jamande.',
  と: 'と kopplar ett uttryck till resten av meningen, exempelvis i uppräkning eller citat.',
  たくさん: 'たくさん anger här mängden i handlingen: mycket eller många.',
  が: 'が markerar hur substantivfrasen förhåller sig till predikatet.',
  ザーザー: 'ザーザー härmar exempelvis ljudet av kraftigt regn.',
  ごはん: 'ごはん betyder ris eller måltid och namnger det man äter.',
  を: 'を markerar direkt objekt, exempelvis det man äter.',
  たべます: 'たべます betyder äter och uttrycker handlingen i artig form.',
  とても: 'とても betyder mycket och förstärker en egenskap, som とてもむずかしい.',
  むずかしい: 'むずかしい betyder svår och beskriver en egenskap.',
  つ: 'つ används som allmän räknare för saker, exempelvis ひとつ och ふたつ.',
  ありました: 'ありました är artig dåtid av あります och beskriver att något fanns.',
  わたし: 'わたし syftar på den som talar: jag.',
  せんこう: 'せんこう namnger här ett huvudämne eller studieinriktning.',
  あそこ: 'あそこ är ett demonstrativt pronomen som syftar på en plats långt från både talare och lyssnare.',
  しずか: 'しずか är stammen av na-adjektivet しずか（な） och beskriver en egenskap (lugn/tyst).',
  で: 'で fungerar här som partikel och markerar handlingsplats eller medel.',
  パン: 'パン betyder bröd och namnger en sak (substantiv).',
  か: 'か markerar här att meningen är en fråga (frågepartikel).',
  つめたい: 'つめたい är ett i-adjektiv som beskriver egenskapen kall (om dryck/beröring).',
  がぶがぶ: 'がぶがぶ är en ideofon (ljudhärmande/onomatopoetiskt) som beskriver att dricka glupskt i stora klunkar.',
  に: 'に fungerar här som partikel och anger en tidpunkt eller ett rörelsemål.',
  きます: 'きます är artig presens av verbet くる (att komma) och uttrycker en handling.',
  たかい: 'たかい är ett i-adjektiv som betyder dyr eller hög.',
  です: 'です fungerar som kopula (predikatsled) och klassificeras i tentans terminologi under Verb.',
  さつ: 'さつ är en räkneordsklassifikator (numerical classifier) för bundna föremål som böcker och häften.',
  '２さつ': 'さつ är en räkneordsklassifikator (numerical classifier) för bundna föremål som böcker och häften.',
  これ: 'これ är ett demonstrativt pronomen som syftar på något nära talaren.',
  ざーざー: 'ざーざー är en ideofon som beskriver ljudet av kraftigt ösregn.',
  がくせい: 'がくせい betyder student och namnger en person (substantiv).',
  にん: 'にん är en räkneordsklassifikator (numerical classifier) för personer.',
  '１０にん': 'にん är en räkneordsklassifikator (numerical classifier) för personer.',
  よく: 'よく är ett frekvensadverb som anger att någon gör något ofta eller väl.',
};

const specificChecklists = {
  'gema70-1.1': [
    'Namnge hiragana, katakana och kanji och skilj ljudskrift från betydelsebärande tecken.',
    'Förklara phonographic, ideographic och pictograph; visa med exempel varför alla kanji inte är bildtecken.',
  ],
  'gema70-1.2': [
    'Namnge on-yomi och kun-yomi och förklara deras olika språkliga ursprung.',
    'Ge ett kanji med båda läsningarna i ord, exempelvis 山 i やま och 富士山（ふじさん）.',
  ],
  'gema70-1.3': [
    'Beskriv vad vart och ett av de tre skriftsystemen används till.',
    'Ge minst ett exempel per system och förklara varför exemplet passar.',
  ],
  'goto-mock-1.1': [
    'Definiera phonographic, ideographic och pictograph och förklara skillnaden mellan ljudskrift och betydelsebärande tecken.',
    'Ge japanska tecken som exempel för hiragana, katakana och kanji och beskriv vad de används till.',
  ],
  'goto-mock-1.2': [
    'Namnge on-yomi och kun-yomi och förklara deras olika historiska och språkliga ursprung.',
    'Ge minst ett kanji från Genki (t.ex. 山 eller 日) med dess olika läsningar i konkreta ord.',
  ],
  'japc11-1.1': [
    'Skriv 4–5 meningar på engelska.',
    'Namnge on-yomi och kun-yomi, förklara ursprunget och ge ett kanji med exempel på båda läsningarna.',
  ],
  'japc11-1.2': [
    'Skriv 6–8 meningar på engelska om de tre skriftsystemens användning.',
    'Förklara phonographic, ideographic och pictograph och ge exempel. Alla kanji är inte bildtecken.',
  ],
  'japc11-2': [
    'Svara på engelska och förklara wago, kango, gairaigo och konshugo.',
    'Ge ett exempel per kategori och koppla det till ordets ursprung. Dessa kategorier är inte ordklasser.',
  ],
  'japc11-3.1': [
    'Skriv 6–8 meningar på engelska och förklara sentence, clause, phrase, predicate och argument.',
    'Använd ett japanskt exempel och peka ut predikat och argument. Skilj argument från tillägg som tid och plats.',
  ],
  'reading-III.2': [
    'Skriv 8–12 meningar som följer originalbilderna.',
    'Använd dåtid och minst tre adjektiv som predikat: kontrollera skillnaden mellan ～かったです och ～でした.',
    'Kontrollera partiklar, tecken och händelsernas ordning. Modelltexten är ett exempel, inte den enda möjliga texten.',
  ],
};

const letterReasons = [
  'Avsändaren マリア finns i originalbrevet. 私はとうきょうにいます och いま、「マンガとしょかん」にいます anger var hon är nu.',
  '九日にきました anger ankomstdagen. 九日 läses ここのか; uppgiften ber om hiragana.',
  'あしたはいきません syftar på biblioteket. Nästa mening, たけしさんとえいがをみますから, förklarar att hon ska se film med Takeshi.',
  'めいじだいがくのまえにあります betyder att biblioteket ligger framför universitetet. のまえ betyder framför, inte inne på.',
  '七月にスウェーデンにかえります anger återresan. 七月 betyder juli; det är en månad, inte ett datum i månaden.',
];

export const learningTips = {
  Partiklar:
    'Läs fram till predikatet. Fråga sedan vad uttrycket före partikeln anger: vem, vad, var, när eller med vilket medel.',
  Böjningar:
    'Säg först vilken form uppgiften ber om. Skriv sedan grundformen → stammen → ändelsen och kontrollera tid, negation och artighet.',
  'Ord & kanji':
    'Täck svaret och skriv ordet igen. Kontrollera särskilt skriftsystem, små kana och långa vokaler.',
  Grammatikteori:
    'Förklara regeln med egna ord och peka ut ett exempel som visar varför den gäller.',
  Läsförståelse:
    'Peka ut ordet eller meningen som stöder svaret. Kontrollera sedan att svaret innehåller allt frågan ber om.',
  'Moror & stavelser':
    'Räkna först mororna med ett taktslag per del. Räkna sedan stavelserna separat och skriv stavelser först, moror sedan.',
  Ordföljd:
    'Börja med predikatet. Fråga vem eller vad det handlar om och vad handlingen riktas mot. Lägg inte till ett led som saknas i meningen.',
  Kana: 'Täck facit, titta på tecknet och skriv läsningen ur minnet. Kontrollera grundtecknet och eventuella streck eller ringar.',
};

export function enrichQuestion(q) {
  const answer = q.answers?.[0];
  if (q.choices?.includes('Noun') && !q.self) {
    const word = q.prompt.match(/(?:för|ordklass:) (.+?)(?: i originalmeningen\.|$)/)?.[1];
    q.explanation = `${word || 'Ordet'} hör här till ${answer}. ${wordClasses[answer]} ${wordReasons[word] || ''}`;
    q.contrastive = Object.fromEntries(
      q.choices
        .filter((c) => c !== answer)
        .map((c) => [
          c,
          `Du valde ${c}: ${wordClasses[c]} Här är svaret ${answer}. ${q.explanation}`,
        ]),
    );
  }
  if (q.id.startsWith('gema70-3-')) {
    const reason = particleReasons[Number(q.id.split('-').at(-1)) - 1];
    q.explanation = `${particleFunctions[answer]} ${reason}`;
    q.contrastive = Object.fromEntries(
      q.choices
        .filter((c) => c !== answer)
        .map((c) => [c, `Du valde ${c}: ${particleFunctions[c]} Här gäller ${answer}. ${reason}`]),
    );
  }
  if (q.topic === 'Moror & stavelser') {
    const word = Object.keys(syllables).find((w) => q.prompt.includes(`${w}?`));
    if (word) {
      const moras = word.match(/[ぁ-ヿ][ゃゅょャュョァィゥェォ]?/g);
      const parts = syllables[word].split('・');
      q.soundBreakdown = { word, moras, syllables: parts };
      q.explanation = `${word}: moror ${moras.join('・')} (${moras.length}); stavelser ${parts.join('・')} (${parts.length}). ん, っ och andra delen av en lång vokal får ett eget moraslag men ingen egen stavelse. Små kana som ゃ och ィ hör ihop med tecknet före. Svaret skrivs ${parts.length}, ${moras.length}: stavelser först, moror sedan.`;
    }
  }
  if (readingReasons[q.id]) q.explanation = readingReasons[q.id];
  if (/^v-\d+$/.test(q.id)) {
    q.explanation = [
      'Klocka heter とけい: と・け・い. Det långa e-ljudet skrivs här けい, även när uttalet återges som tokee.',
      'Skor heter くつ: く = ku, つ = tsu. Skriv båda tecknen i hiragana.',
      'Engelska heter えいご: え・い・ご. ご har dakuten; utan strecken blir det こ och ett annat ljud.',
      'Resa heter りょこう: りょ・こ・う. ょ är litet och bildar ryo med り; う förlänger o-ljudet.',
      'Konsert skrivs コンサート: コ・ン・サ・ー・ト. Lånordet skrivs med katakana och ー förlänger a-ljudet.',
      'Biff skrivs ステーキ: ス・テ・ー・キ. Det är ett lånord i katakana. ー förlänger e-ljudet.',
      'Lite heter ちょっと: ちょ・っ・と. Litet ょ bildar cho; litet っ markerar dubbelkonsonanten i chotto.',
      'Stockholm skrivs ストックホルム: ス・ト・ッ・ク・ホ・ル・ム. Litet ッ markerar dubbelkonsonanten; namnet skrivs med katakana.',
      'Klassisk musik skrivs クラシック: ク・ラ・シ・ッ・ク. シ är shi och litet ッ markerar dubbelkonsonanten.',
      'Norge skrivs ノルウェー: ノ・ル・ウェ・ー. Litet ェ bildar we med ウ; ー förlänger det sista e-ljudet.',
    ][Number(q.id.split('-')[1])];
  }
  if (/^reading-II\.2-[1-5]$/.test(q.id)) {
    q.explanation = `${q.model} ${letterReasons[Number(q.id.split('-').at(-1)) - 1]}`;
  }
  if (q.id.startsWith('gema70-1.4-')) {
    q.explanation = [
      'ともだち → tomodachi. は är här partikel och uttalas wa: tomodachi wa.',
      'とうきょう har två långa o-ljud: tōkyō, tookyoo eller toukyou. Partikeln へ uttalas e: tōkyō e.',
      'Dela upp アニメ: ア = a, ニ = ni, メ = me. Sätt ihop delarna till anime; här finns ingen lång vokal.',
      'を uttalas o när det används som partikel. Den här tentauppgiften använder uttalsbaserad romanisering.',
    ][Number(q.id.split('-').at(-1)) - 1];
  }
  if (q.id.startsWith('japc11-1.3-')) {
    q.explanation = [
      'きょうと delas i きょ・う・と. きょ skrivs kyo och う förlänger o: kyōto, kyooto eller kyouto.',
      'ノート delas i ノ・ー・ト. ノ är no, ー förlänger o och ト är to: nōto eller nooto.',
      'Zasshi innehåller dubbelkonsonanten ss. Skriv den med litet っ: ざ・っ・し → ざっし.',
      'Tentans Comban återges som こんばん. Slutet är ん; följ kursens romaniseringskonvention för formen Comban.',
      'せんせい delas i せ・ん・せ・い: sensei. Det sista い kan återges som vokallängd i sensee eller sensē; samtliga godtas här.',
      'Ō i Ōsaka är ett långt o. Här skrivs det med おお: お・お・さ・か → おおさか.',
    ][Number(q.id.split('-').at(-1)) - 1];
  }
  if (q.self) {
    q.checklist = [
      'Har du besvarat alla delar av frågan och tagit med de exempel eller antal meningar som efterfrågas?',
      q.topic === 'Ordföljd'
        ? 'Har du avgränsat hela fraser, hittat predikatet och skilt subjekt/tema och objekt från tid och plats?'
        : q.topic === 'Läsförståelse'
          ? 'Kan du stödja innehållet med brevet eller originalbilden och använda den tid och språkform som frågan kräver?'
          : q.topic === 'Ord & kanji'
            ? 'Finns alla efterfrågade läsningar, tecken och betydelser med, även små kana och vokallängd?'
            : q.topic === 'Partiklar'
              ? 'Har du förklarat vad partikeln gör i just den här meningen och skrivit en rättelse där det behövs?'
              : 'Har du förklarat begreppen med egna ord och använt exempel som visar skillnaden mellan dem?',
      'Stämmer innehållet med modellösningen? Annan korrekt formulering går bra; välj Behöver öva mer om en viktig del saknas.',
    ];
    if (specificChecklists[q.id]) q.checklist = [...specificChecklists[q.id], q.checklist.at(-1)];
    q.checklist = selfAssessmentCriteria(q, q.checklist);
    q.guideId = selfAssessmentGuide(q);
  }
  // Keep speech and other consumers of model in sync with the displayed explanation.
  if (q.model && !q.self) q.model = q.explanation;
  return q;
}
