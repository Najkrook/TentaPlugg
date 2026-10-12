// Criteria elaborate the existing model answers; they never award points automatically.
const criteria = {
  'goto-mock-1.1': [
    'Definiera och förklara de tre termerna: phonographic (ljud/mora-baserad), ideographic (betydelsebärande enheter) och pictographic (bildtecken).',
    'Ge konkreta exempel på japanska tecken från varje skriftsystem (hiragana, katakana och kanji).',
    'Beskriv vad respektive skriftsystem används till i modern japanska.',
  ],
  'goto-mock-1.2': [
    'Förklara den historiska orsaken till varför kanji har flera läsningar (inlån från Kina till befintligt japanskt språk).',
    'Namnge de två grupperna: On-yomi (音読み, kinesiskt ursprung) och Kun-yomi (訓読み, inhemskt japanskt ursprung).',
    'Ange minst ett kanji-tecken från Genki-boken (t.ex. 山 eller 日) skrivet på japanska med dess olika läsningar och ordexempel.',
  ],
  'gema70-2-4': [
    'Identifiera あの som demonstrativt bestämningsord framför ett substantiv.',
    'Jämför med tentans alternativ Pronoun och notera att den mer precisa termen kan skilja sig.',
  ],
  'gema70-2-8': [
    'Identifiera です som kopula.',
    'Relatera till tentans alternativ Verb och kontrollera kursens terminologi.',
  ],
  'japc11-2.1-16': [
    'Identifiera です som kopula.',
    'Relatera till tentans alternativ Verb och kontrollera kursens terminologi.',
  ],
  'japc11-3.2-1': [
    'Ta med hela わたしのいもうとのかばん, inklusive bestämningarna före かばん.',
    'Lämna です utanför nominalfrasen.',
  ],
  'japc11-3.2-2': [
    'Ta med hela 日本語の本 och den avslutande partikeln を.',
    'Lämna よみました utanför postpositionsfrasen.',
  ],
  'japc11-3.2-3': [
    'Identifiera おきました som den minimala verbfrasen.',
    'Skilj tidsadverbialet あさ８じに från verbet; större frasgränser beror på kursens analys.',
  ],
  'japc11-3.2-4': [
    'Ta med hela アルミンさんの本, inklusive bestämningen av 本.',
    'Lämna これは och です utanför den efterfrågade nominalfrasen.',
  ],
  'japc11-3.2-5': [
    'Ta med objektet ゲームを och verbet しました.',
    'Lämna sällskapsuttrycket けんまさんと utanför när bara verb och argument efterfrågas.',
  ],
  'reading-I.2': [
    'Välj minst fem katakanaord som faktiskt finns i annonsen.',
    'Skriv en svensk eller engelsk betydelse för vart och ett och kontrollera stavningen mot originalbilden.',
  ],
  'reading-II.2-luckor': [
    'Kontrollera alla fem placeringar: A = ③, B = ⑤, C = ①, D = ④, E = ②.',
    'Skilj mottagare, hälsning, avslutning, datum och avsändare; läs spalterna från höger till vänster.',
  ],
  'reading-II.2-1': [
    'Namnge マリア och ange att hon är på mangabiblioteket i Tokyo.',
    'Svara på japanska och ta med både vem och var; jämför med 私はとうきょうにいます i brevet.',
  ],
  'reading-II.2-2': [
    'Ange den nionde: 九日 läses ここのか.',
    'Skriv med hiragana och använd dåtid om ankomsten, exempelvis ここのかにきました。',
  ],
  'reading-II.2-3': [
    'Ange att hon ska se film med Takeshi, inte gå till biblioteket.',
    'Svara på japanska och ta med både たけしさんと och えいがをみます.',
  ],
  'reading-II.2-4': [
    'Svara nej: biblioteket ligger framför universitetet, inte inne på det.',
    'Svara på japanska; kontrollera のまえにあります mot brevet.',
  ],
  'reading-II.2-5': [
    'Ange juli, alltså månaden 七月, inte den sjunde dagen.',
    'Svara på svenska och skilj återresan från ankomstdagen.',
  ],
  'reading-III.1-1': [
    'Utgå från övningsprovets fasta datum i frågan, inte dagens verkliga datum.',
    'Skriv datumet på japanska och avsluta med です; jämför månad och dag med modellsvaret.',
  ],
  'reading-III.1-2': [
    'Utgå från gårdagen relativt datumet i frågan: torsdag, 木曜日.',
    'Använd japanska och dåtid: きのうは木曜日でした。',
  ],
  'reading-III.1-3': [
    'Ange att katten är på bordet: テーブルの上.',
    'Använd に för platsen och います för katten; skriv svaret på japanska.',
  ],
  'reading-III.1-4': [
    'Ange att boken är i väskan: かばんの中.',
    'Använd に för platsen och あります för boken; skriv svaret på japanska.',
  ],
  'reading-III.1-5': [
    'Ange nationaliteten 日本人, inte bara landet 日本.',
    'Skriv en japansk mening om Takeshi, exempelvis たけしさんは日本人です。',
  ],
};

const lessonCriteria = [
  [
    'Behåll handlingsplatsens で när du lägger till も: うちでも.',
    'Skriv en rättelse som uttrycker att studierna skedde hemma också.',
  ],
  [
    'Bedöm meningen som korrekt.',
    'Förklara の mellan substantiv, で för mötesplatsen och に för personen som träffades.',
  ],
  [
    'Placera を efter しゃしん och たくさん före verbet, eller skriv たくさんのしゃしんを.',
    'Behåll で som markör för platsen där bilderna togs.',
  ],
  [
    'Skilj varaktigheten ７じかんはん från klockslaget ７じはん.',
    'Skriv en rättelse som tydligt uttrycker den avsedda betydelsen: sovtid eller läggdags.',
  ],
  [
    'Bedöm meningen som korrekt.',
    'Förklara で som handlingsplats, と som uppräkning och を som direkt objekt.',
  ],
  [
    'För betydelsen ”igår också”: skriv きのうもカフェでコーヒーをのみました。',
    'Förklara att カフェでも kräver sammanhanget ”på kafé också”, utöver en annan plats.',
  ],
];

export function selfAssessmentCriteria(q, fallback) {
  let items = criteria[q.id];
  if (q.id.startsWith('l5-review-')) items = lessonCriteria[Number(q.id.split('-').at(-1)) - 1];
  if (q.topic === 'Ordföljd') {
    items = [
      `Jämför din analys led för led: ${q.model}`,
      'Ta med hela nominalfraser. Skilj tid och plats från subjekt/tema och objekt; lägg inte till led som är utelämnade.',
    ];
  }
  if (/^reading-I\.[13]-/.test(q.id)) {
    items = q.model
      .split(' · ')
      .map(
        (part, i) =>
          `Kontrollera den ${i === 0 ? 'första' : 'andra'} saknade tabelldelen: ${part}.`,
      );
  }
  return items ? [...items, fallback.at(-1)] : fallback;
}

export function selfAssessmentGuide(q) {
  if (!q.self) return null;
  if (q.id === 'hayashi-exam-kyoto') return 'adjectives';
  if (/^(gema70-1\.[123]$|japc11-1\.[12]$|goto-mock-1\.[12]$)/.test(q.id)) return 'writing-systems';
  if (q.id === 'japc11-2') return 'word-origins';
  if (q.topic === 'Ordföljd' || q.id.startsWith('japc11-3.')) return 'sentence-parts';
  if (q.topic === 'Grammatikteori') return 'word-classes';
  if (q.topic === 'Ord & kanji') return 'writing-systems';
  if (q.id === 'reading-III.2') return 'adjectives';
  if (q.id === 'reading-III.1-2') return 'word-classes';
  if (/^reading-III\.1-[34]$/.test(q.id)) return 'ni-de';
  if (q.topic === 'Läsförståelse') return 'reading-strategy';
  if (q.topic === 'Partiklar') return q.id === 'l5-review-4' ? 'ni-de' : 'wo-to-no-mo';
  return null;
}
