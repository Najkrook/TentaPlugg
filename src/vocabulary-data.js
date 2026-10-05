/**
 * Complete Vocabulary & Kanji Dataset from Genki I (3rd Edition) Lessons 3, 4, 5.
 * Parsed and verified from Material/vocabulary.pdf.
 * Includes all kanji readings, compound words, word types, Swedish and English translations,
 * calendar matrices and location words.
 */

export const kanjiList = [
  {
    "id": "k-001",
    "lesson": 3,
    "number": 1,
    "kanji": "一",
    "strokes": 1,
    "onyomi": [
      "いち",
      "いっ"
    ],
    "kunyomi": [
      "ひと"
    ],
    "meaning_en": "one",
    "meaning_sv": "ett",
    "compounds": [
      {
        "kanji": "一",
        "kana": "いち",
        "en": "one",
        "sv": "ett"
      },
      {
        "kanji": "一時",
        "kana": "いちじ",
        "en": "one o'clock",
        "sv": "klockan ett"
      },
      {
        "kanji": "一年生",
        "kana": "いちねんせい",
        "en": "first-year student",
        "sv": "förstaårsstudent"
      },
      {
        "kanji": "一分",
        "kana": "いっぷん",
        "en": "one minute",
        "sv": "en minut"
      },
      {
        "kanji": "一つ",
        "kana": "ひとつ",
        "en": "one (general counter)",
        "sv": "en / ett (generell räkning)"
      }
    ]
  },
  {
    "id": "k-002",
    "lesson": 3,
    "number": 2,
    "kanji": "二",
    "strokes": 2,
    "onyomi": [
      "に"
    ],
    "kunyomi": [
      "ふた"
    ],
    "meaning_en": "two",
    "meaning_sv": "två",
    "compounds": [
      {
        "kanji": "二",
        "kana": "に",
        "en": "two",
        "sv": "två"
      },
      {
        "kanji": "二時",
        "kana": "にじ",
        "en": "two o'clock",
        "sv": "klockan två"
      },
      {
        "kanji": "二年生",
        "kana": "にねんせい",
        "en": "second-year student",
        "sv": "andraårsstudent"
      },
      {
        "kanji": "二つ",
        "kana": "ふたつ",
        "en": "two (general counter)",
        "sv": "två (generell räkning)"
      },
      {
        "kanji": "二日間",
        "kana": "ふつかかん",
        "en": "two days",
        "sv": "två dagar (tidsrymd)"
      }
    ]
  },
  {
    "id": "k-003",
    "lesson": 3,
    "number": 3,
    "kanji": "三",
    "strokes": 3,
    "onyomi": [
      "さん"
    ],
    "kunyomi": [
      "みっ"
    ],
    "meaning_en": "three",
    "meaning_sv": "tre",
    "compounds": [
      {
        "kanji": "三",
        "kana": "さん",
        "en": "three",
        "sv": "tre"
      },
      {
        "kanji": "三時",
        "kana": "さんじ",
        "en": "three o'clock",
        "sv": "klockan tre"
      },
      {
        "kanji": "三年生",
        "kana": "さんねんせい",
        "en": "third-year student",
        "sv": "tredjeårsstudent"
      },
      {
        "kanji": "三月",
        "kana": "さんがつ",
        "en": "March",
        "sv": "mars"
      },
      {
        "kanji": "三つ",
        "kana": "みっつ",
        "en": "three (general counter)",
        "sv": "tre (generell räkning)"
      }
    ]
  },
  {
    "id": "k-004",
    "lesson": 3,
    "number": 4,
    "kanji": "四",
    "strokes": 5,
    "onyomi": [
      "し"
    ],
    "kunyomi": [
      "よん",
      "よ",
      "よっ"
    ],
    "meaning_en": "four",
    "meaning_sv": "fyra",
    "compounds": [
      {
        "kanji": "四",
        "kana": "よん",
        "en": "four",
        "sv": "fyra"
      },
      {
        "kanji": "四時",
        "kana": "よじ",
        "en": "four o'clock",
        "sv": "klockan fyra"
      },
      {
        "kanji": "四年生",
        "kana": "よねんせい",
        "en": "fourth-year student",
        "sv": "fjärdeårsstudent"
      },
      {
        "kanji": "四月",
        "kana": "しがつ",
        "en": "April",
        "sv": "april"
      },
      {
        "kanji": "四つ",
        "kana": "よっつ",
        "en": "four (general counter)",
        "sv": "fyra (generell räkning)"
      }
    ]
  },
  {
    "id": "k-005",
    "lesson": 3,
    "number": 5,
    "kanji": "五",
    "strokes": 4,
    "onyomi": [
      "ご"
    ],
    "kunyomi": [
      "いつ"
    ],
    "meaning_en": "five",
    "meaning_sv": "fem",
    "compounds": [
      {
        "kanji": "五",
        "kana": "ご",
        "en": "five",
        "sv": "fem"
      },
      {
        "kanji": "五時",
        "kana": "ごじ",
        "en": "five o'clock",
        "sv": "klockan fem"
      },
      {
        "kanji": "五月",
        "kana": "ごがつ",
        "en": "May",
        "sv": "maj"
      },
      {
        "kanji": "五歳",
        "kana": "ごさい",
        "en": "five years old",
        "sv": "fem år gammal"
      },
      {
        "kanji": "五つ",
        "kana": "いつつ",
        "en": "five (general counter)",
        "sv": "fem (generell räkning)"
      }
    ]
  },
  {
    "id": "k-006",
    "lesson": 3,
    "number": 6,
    "kanji": "六",
    "strokes": 4,
    "onyomi": [
      "ろく",
      "ろっ"
    ],
    "kunyomi": [
      "むっ"
    ],
    "meaning_en": "six",
    "meaning_sv": "sex",
    "compounds": [
      {
        "kanji": "六",
        "kana": "ろく",
        "en": "six",
        "sv": "sex"
      },
      {
        "kanji": "六時",
        "kana": "ろくじ",
        "en": "six o'clock",
        "sv": "klockan sex"
      },
      {
        "kanji": "六百",
        "kana": "ろっぴゃく",
        "en": "six hundred",
        "sv": "sexhundra"
      },
      {
        "kanji": "六分",
        "kana": "ろっぷん",
        "en": "six minutes",
        "sv": "sex minuter"
      },
      {
        "kanji": "六つ",
        "kana": "むっつ",
        "en": "six (general counter)",
        "sv": "sex (generell räkning)"
      }
    ]
  },
  {
    "id": "k-007",
    "lesson": 3,
    "number": 7,
    "kanji": "七",
    "strokes": 2,
    "onyomi": [
      "しち"
    ],
    "kunyomi": [
      "なな"
    ],
    "meaning_en": "seven",
    "meaning_sv": "sju",
    "compounds": [
      {
        "kanji": "七",
        "kana": "しち / なな",
        "en": "seven",
        "sv": "sju"
      },
      {
        "kanji": "七時",
        "kana": "しちじ",
        "en": "seven o'clock",
        "sv": "klockan sju"
      },
      {
        "kanji": "七月",
        "kana": "しちがつ",
        "en": "July",
        "sv": "juli"
      },
      {
        "kanji": "七つ",
        "kana": "ななつ",
        "en": "seven (general counter)",
        "sv": "sju (generell räkning)"
      },
      {
        "kanji": "七人",
        "kana": "ななにん / しちにん",
        "en": "seven people",
        "sv": "sju personer"
      }
    ]
  },
  {
    "id": "k-008",
    "lesson": 3,
    "number": 8,
    "kanji": "八",
    "strokes": 2,
    "onyomi": [
      "はち",
      "はっ"
    ],
    "kunyomi": [
      "やっ"
    ],
    "meaning_en": "eight",
    "meaning_sv": "åtta",
    "compounds": [
      {
        "kanji": "八",
        "kana": "はち",
        "en": "eight",
        "sv": "åtta"
      },
      {
        "kanji": "八時",
        "kana": "はちじ",
        "en": "eight o'clock",
        "sv": "klockan åtta"
      },
      {
        "kanji": "八百",
        "kana": "はっぴゃく",
        "en": "eight hundred",
        "sv": "åttahundra"
      },
      {
        "kanji": "八歳",
        "kana": "はっさい",
        "en": "eight years old",
        "sv": "åtta år gammal"
      },
      {
        "kanji": "八つ",
        "kana": "やっつ",
        "en": "eight (general counter)",
        "sv": "åtta (generell räkning)"
      }
    ]
  },
  {
    "id": "k-009",
    "lesson": 3,
    "number": 9,
    "kanji": "九",
    "strokes": 2,
    "onyomi": [
      "きゅう",
      "く"
    ],
    "kunyomi": [
      "ここの"
    ],
    "meaning_en": "nine",
    "meaning_sv": "nio",
    "compounds": [
      {
        "kanji": "九",
        "kana": "きゅう",
        "en": "nine",
        "sv": "nio"
      },
      {
        "kanji": "九時",
        "kana": "くじ",
        "en": "nine o'clock",
        "sv": "klockan nio"
      },
      {
        "kanji": "九月",
        "kana": "くがつ",
        "en": "September",
        "sv": "september"
      },
      {
        "kanji": "九歳",
        "kana": "きゅうさい",
        "en": "nine years old",
        "sv": "nio år gammal"
      },
      {
        "kanji": "九つ",
        "kana": "ここのつ",
        "en": "nine (general counter)",
        "sv": "nio (generell räkning)"
      }
    ]
  },
  {
    "id": "k-010",
    "lesson": 3,
    "number": 10,
    "kanji": "十",
    "strokes": 2,
    "onyomi": [
      "じゅう",
      "じゅっ",
      "じっ"
    ],
    "kunyomi": [
      "とお"
    ],
    "meaning_en": "ten",
    "meaning_sv": "tio",
    "compounds": [
      {
        "kanji": "十",
        "kana": "じゅう",
        "en": "ten",
        "sv": "tio"
      },
      {
        "kanji": "十時",
        "kana": "じゅうじ",
        "en": "ten o'clock",
        "sv": "klockan tio"
      },
      {
        "kanji": "十月",
        "kana": "じゅうがつ",
        "en": "October",
        "sv": "oktober"
      },
      {
        "kanji": "十歳",
        "kana": "じゅっさい / じっさい",
        "en": "ten years old",
        "sv": "tio år gammal"
      },
      {
        "kanji": "十",
        "kana": "とお",
        "en": "ten (general counter)",
        "sv": "tio (generell räkning)"
      }
    ]
  },
  {
    "id": "k-011",
    "lesson": 3,
    "number": 11,
    "kanji": "百",
    "strokes": 6,
    "onyomi": [
      "ひゃく",
      "びゃく",
      "ぴゃく"
    ],
    "kunyomi": [],
    "meaning_en": "hundred",
    "meaning_sv": "hundra",
    "compounds": [
      {
        "kanji": "百",
        "kana": "ひゃく",
        "en": "hundred",
        "sv": "hundra"
      },
      {
        "kanji": "三百",
        "kana": "さんびゃく",
        "en": "three hundred",
        "sv": "trehundra"
      },
      {
        "kanji": "六百",
        "kana": "ろっぴゃく",
        "en": "six hundred",
        "sv": "sexhundra"
      },
      {
        "kanji": "八百",
        "kana": "はっぴゃく",
        "en": "eight hundred",
        "sv": "åttahundra"
      }
    ]
  },
  {
    "id": "k-012",
    "lesson": 3,
    "number": 12,
    "kanji": "千",
    "strokes": 3,
    "onyomi": [
      "せん",
      "ぜん"
    ],
    "kunyomi": [],
    "meaning_en": "thousand",
    "meaning_sv": "tusen",
    "compounds": [
      {
        "kanji": "千",
        "kana": "せん",
        "en": "thousand",
        "sv": "tusen"
      },
      {
        "kanji": "三千",
        "kana": "さんぜん",
        "en": "three thousand",
        "sv": "tretusen"
      },
      {
        "kanji": "八千",
        "kana": "はっせん",
        "en": "eight thousand",
        "sv": "åttatusen"
      },
      {
        "kanji": "千円",
        "kana": "せんえん",
        "en": "one thousand yen",
        "sv": "ettusen yen"
      }
    ]
  },
  {
    "id": "k-013",
    "lesson": 3,
    "number": 13,
    "kanji": "万",
    "strokes": 3,
    "onyomi": [
      "まん"
    ],
    "kunyomi": [],
    "meaning_en": "ten thousand",
    "meaning_sv": "tiotusen",
    "compounds": [
      {
        "kanji": "一万",
        "kana": "いちまん",
        "en": "ten thousand",
        "sv": "tiotusen (10 000)"
      },
      {
        "kanji": "十万",
        "kana": "じゅうまん",
        "en": "one hundred thousand",
        "sv": "hundratusen (100 000)"
      },
      {
        "kanji": "百万",
        "kana": "ひゃくまん",
        "en": "one million",
        "sv": "en miljon (1 000 000)"
      }
    ]
  },
  {
    "id": "k-014",
    "lesson": 3,
    "number": 14,
    "kanji": "円",
    "strokes": 4,
    "onyomi": [
      "えん"
    ],
    "kunyomi": [
      "まる"
    ],
    "meaning_en": "yen; circle",
    "meaning_sv": "yen; cirkel",
    "compounds": [
      {
        "kanji": "百円",
        "kana": "ひゃくえん",
        "en": "one hundred yen",
        "sv": "hundra yen"
      },
      {
        "kanji": "円",
        "kana": "えん",
        "en": "circle",
        "sv": "cirkel"
      },
      {
        "kanji": "円高",
        "kana": "えんだか",
        "en": "strong yen",
        "sv": "stark yen"
      },
      {
        "kanji": "円い",
        "kana": "まるい",
        "en": "round",
        "sv": "rund"
      }
    ]
  },
  {
    "id": "k-015",
    "lesson": 3,
    "number": 15,
    "kanji": "時",
    "strokes": 10,
    "onyomi": [
      "じ"
    ],
    "kunyomi": [
      "とき"
    ],
    "meaning_en": "time",
    "meaning_sv": "tid; klockslag",
    "compounds": [
      {
        "kanji": "一時",
        "kana": "いちじ",
        "en": "one o'clock",
        "sv": "klockan ett"
      },
      {
        "kanji": "時間",
        "kana": "じかん",
        "en": "time; ... hours",
        "sv": "tid; timmar"
      },
      {
        "kanji": "子どもの時",
        "kana": "こどものとき",
        "en": "in one's childhood",
        "sv": "när man var barn"
      },
      {
        "kanji": "時々",
        "kana": "ときどき",
        "en": "sometimes",
        "sv": "ibland"
      },
      {
        "kanji": "時計",
        "kana": "とけい",
        "en": "watch; clock",
        "sv": "klocka / armbandsur"
      }
    ]
  },
  {
    "id": "k-016",
    "lesson": 4,
    "number": 16,
    "kanji": "日",
    "strokes": 4,
    "onyomi": [
      "に",
      "にち",
      "にっ"
    ],
    "kunyomi": [
      "び",
      "ひ",
      "か"
    ],
    "meaning_en": "day; sun",
    "meaning_sv": "dag; sol",
    "compounds": [
      {
        "kanji": "日本",
        "kana": "にほん",
        "en": "Japan",
        "sv": "Japan"
      },
      {
        "kanji": "日曜日",
        "kana": "にちようび",
        "en": "Sunday",
        "sv": "söndag"
      },
      {
        "kanji": "毎日",
        "kana": "まいにち",
        "en": "every day",
        "sv": "varje dag"
      },
      {
        "kanji": "母の日",
        "kana": "ははのひ",
        "en": "Mother's Day",
        "sv": "Mors dag"
      },
      {
        "kanji": "日記",
        "kana": "にっき",
        "en": "diary",
        "sv": "dagbok"
      },
      {
        "kanji": "三日",
        "kana": "みっか",
        "en": "three days",
        "sv": "tre dagar / den tredje"
      }
    ]
  },
  {
    "id": "k-017",
    "lesson": 4,
    "number": 17,
    "kanji": "本",
    "strokes": 5,
    "onyomi": [
      "ほん"
    ],
    "kunyomi": [
      "もと"
    ],
    "meaning_en": "book; basis",
    "meaning_sv": "bok; bas/ursprung",
    "compounds": [
      {
        "kanji": "本",
        "kana": "ほん",
        "en": "book",
        "sv": "bok"
      },
      {
        "kanji": "日本",
        "kana": "にほん",
        "en": "Japan",
        "sv": "Japan"
      },
      {
        "kanji": "日本語",
        "kana": "にほんご",
        "en": "Japanese language",
        "sv": "japanska språket"
      },
      {
        "kanji": "山本さん",
        "kana": "やまもとさん",
        "en": "Mr./Ms. Yamamoto",
        "sv": "Yamamoto"
      }
    ]
  },
  {
    "id": "k-018",
    "lesson": 4,
    "number": 18,
    "kanji": "人",
    "strokes": 2,
    "onyomi": [
      "じん",
      "にん"
    ],
    "kunyomi": [
      "ひと"
    ],
    "meaning_en": "person",
    "meaning_sv": "person / människa",
    "compounds": [
      {
        "kanji": "日本人",
        "kana": "にほんじん",
        "en": "Japanese people",
        "sv": "japan / japaner"
      },
      {
        "kanji": "一人で",
        "kana": "ひとりで",
        "en": "alone",
        "sv": "ensam"
      },
      {
        "kanji": "この人",
        "kana": "このひと",
        "en": "this person",
        "sv": "den här personen"
      },
      {
        "kanji": "三人",
        "kana": "さんにん",
        "en": "three people",
        "sv": "tre personer"
      }
    ]
  },
  {
    "id": "k-019",
    "lesson": 4,
    "number": 19,
    "kanji": "月",
    "strokes": 4,
    "onyomi": [
      "げつ",
      "がつ"
    ],
    "kunyomi": [
      "つき"
    ],
    "meaning_en": "moon; month",
    "meaning_sv": "måne; månad",
    "compounds": [
      {
        "kanji": "月曜日",
        "kana": "げつようび",
        "en": "Monday",
        "sv": "måndag"
      },
      {
        "kanji": "一月",
        "kana": "いちがつ",
        "en": "January",
        "sv": "januari"
      },
      {
        "kanji": "月",
        "kana": "つき",
        "en": "moon",
        "sv": "måne"
      },
      {
        "kanji": "今月",
        "kana": "こんげつ",
        "en": "this month",
        "sv": "denna månad"
      },
      {
        "kanji": "一か月",
        "kana": "いっかげつ",
        "en": "one month",
        "sv": "en månad (tidsperiod)"
      }
    ]
  },
  {
    "id": "k-020",
    "lesson": 4,
    "number": 20,
    "kanji": "火",
    "strokes": 4,
    "onyomi": [
      "か"
    ],
    "kunyomi": [
      "ひ",
      "び"
    ],
    "meaning_en": "fire",
    "meaning_sv": "eld",
    "compounds": [
      {
        "kanji": "火曜日",
        "kana": "かようび",
        "en": "Tuesday",
        "sv": "tisdag"
      },
      {
        "kanji": "火",
        "kana": "ひ",
        "en": "fire",
        "sv": "eld"
      },
      {
        "kanji": "火山",
        "kana": "かざん",
        "en": "volcano",
        "sv": "vulkan"
      },
      {
        "kanji": "花火",
        "kana": "はなび",
        "en": "fireworks",
        "sv": "fyrverkeri"
      },
      {
        "kanji": "火星",
        "kana": "かせい",
        "en": "Mars",
        "sv": "Mars (planeten)"
      }
    ]
  },
  {
    "id": "k-021",
    "lesson": 4,
    "number": 21,
    "kanji": "水",
    "strokes": 4,
    "onyomi": [
      "すい"
    ],
    "kunyomi": [
      "みず"
    ],
    "meaning_en": "water",
    "meaning_sv": "vatten",
    "compounds": [
      {
        "kanji": "水曜日",
        "kana": "すいようび",
        "en": "Wednesday",
        "sv": "onsdag"
      },
      {
        "kanji": "水",
        "kana": "みず",
        "en": "water",
        "sv": "vatten"
      },
      {
        "kanji": "水泳",
        "kana": "すいえい",
        "en": "swimming",
        "sv": "simning"
      },
      {
        "kanji": "水道",
        "kana": "すいどう",
        "en": "water supply",
        "sv": "vattenledning / kranvatten"
      },
      {
        "kanji": "水着",
        "kana": "みずぎ",
        "en": "swimwear",
        "sv": "badkläder"
      }
    ]
  },
  {
    "id": "k-022",
    "lesson": 4,
    "number": 22,
    "kanji": "木",
    "strokes": 4,
    "onyomi": [
      "もく"
    ],
    "kunyomi": [
      "き"
    ],
    "meaning_en": "tree",
    "meaning_sv": "träd",
    "compounds": [
      {
        "kanji": "木曜日",
        "kana": "もくようび",
        "en": "Thursday",
        "sv": "torsdag"
      },
      {
        "kanji": "木",
        "kana": "き",
        "en": "tree",
        "sv": "träd"
      },
      {
        "kanji": "木村さん",
        "kana": "きむらさん",
        "en": "Mr./Ms. Kimura",
        "sv": "Kimura"
      }
    ]
  },
  {
    "id": "k-023",
    "lesson": 4,
    "number": 23,
    "kanji": "金",
    "strokes": 8,
    "onyomi": [
      "きん"
    ],
    "kunyomi": [
      "かね"
    ],
    "meaning_en": "gold; money",
    "meaning_sv": "guld; pengar",
    "compounds": [
      {
        "kanji": "金曜日",
        "kana": "きんようび",
        "en": "Friday",
        "sv": "fredag"
      },
      {
        "kanji": "お金",
        "kana": "おかね",
        "en": "money",
        "sv": "pengar"
      },
      {
        "kanji": "料金",
        "kana": "りょうきん",
        "en": "charge; fee",
        "sv": "avgift / pris"
      },
      {
        "kanji": "お金持ち",
        "kana": "おかねもち",
        "en": "rich person",
        "sv": "rik person"
      }
    ]
  },
  {
    "id": "k-024",
    "lesson": 4,
    "number": 24,
    "kanji": "土",
    "strokes": 3,
    "onyomi": [
      "ど",
      "と"
    ],
    "kunyomi": [
      "つち"
    ],
    "meaning_en": "soil",
    "meaning_sv": "jord / mark",
    "compounds": [
      {
        "kanji": "土曜日",
        "kana": "どようび",
        "en": "Saturday",
        "sv": "lördag"
      },
      {
        "kanji": "土",
        "kana": "つち",
        "en": "soil",
        "sv": "jord"
      },
      {
        "kanji": "土地",
        "kana": "とち",
        "en": "land",
        "sv": "mark / tomt"
      },
      {
        "kanji": "粘土",
        "kana": "ねんど",
        "en": "clay",
        "sv": "lera"
      }
    ]
  },
  {
    "id": "k-025",
    "lesson": 4,
    "number": 25,
    "kanji": "曜",
    "strokes": 18,
    "onyomi": [
      "よう"
    ],
    "kunyomi": [],
    "meaning_en": "weekday",
    "meaning_sv": "veckodag",
    "compounds": [
      {
        "kanji": "日曜日",
        "kana": "にちようび",
        "en": "Sunday",
        "sv": "söndag"
      },
      {
        "kanji": "曜日",
        "kana": "ようび",
        "en": "day of the week",
        "sv": "veckodag"
      }
    ]
  },
  {
    "id": "k-026",
    "lesson": 4,
    "number": 26,
    "kanji": "上",
    "strokes": 3,
    "onyomi": [
      "じょう"
    ],
    "kunyomi": [
      "うえ",
      "のぼ"
    ],
    "meaning_en": "up; above",
    "meaning_sv": "upp; ovanpå / över",
    "compounds": [
      {
        "kanji": "上",
        "kana": "うえ",
        "en": "top; above",
        "sv": "ovanpå / över"
      },
      {
        "kanji": "上手な",
        "kana": "じょうずな",
        "en": "good at",
        "sv": "skicklig / duktig på"
      },
      {
        "kanji": "屋上",
        "kana": "おくじょう",
        "en": "rooftop",
        "sv": "tak / takterrass"
      },
      {
        "kanji": "上る",
        "kana": "のぼる",
        "en": "to go up",
        "sv": "stiga / gå upp"
      }
    ]
  },
  {
    "id": "k-027",
    "lesson": 4,
    "number": 27,
    "kanji": "下",
    "strokes": 3,
    "onyomi": [
      "か",
      "げ"
    ],
    "kunyomi": [
      "した",
      "くだ"
    ],
    "meaning_en": "down; under",
    "meaning_sv": "ner; under / nedanför",
    "compounds": [
      {
        "kanji": "下",
        "kana": "した",
        "en": "under",
        "sv": "under / nedanför"
      },
      {
        "kanji": "地下鉄",
        "kana": "ちかてつ",
        "en": "subway",
        "sv": "tunnelbana"
      },
      {
        "kanji": "下手な",
        "kana": "へたな",
        "en": "poor at",
        "sv": "dålig / oskicklig på"
      },
      {
        "kanji": "下さい",
        "kana": "ください",
        "en": "Please give/do...",
        "sv": "var snäll och ge/gör..."
      }
    ]
  },
  {
    "id": "k-028",
    "lesson": 4,
    "number": 28,
    "kanji": "中",
    "strokes": 4,
    "onyomi": [
      "ちゅう",
      "じゅう"
    ],
    "kunyomi": [
      "なか"
    ],
    "meaning_en": "middle; inside",
    "meaning_sv": "mitten; inuti",
    "compounds": [
      {
        "kanji": "中",
        "kana": "なか",
        "en": "inside",
        "sv": "inuti / inne i"
      },
      {
        "kanji": "中国",
        "kana": "ちゅうごく",
        "en": "China",
        "sv": "Kina"
      },
      {
        "kanji": "中学",
        "kana": "ちゅうがく",
        "en": "junior high school",
        "sv": "högstadium"
      },
      {
        "kanji": "一年中",
        "kana": "いちねんじゅう",
        "en": "all year around",
        "sv": "året runt"
      }
    ]
  },
  {
    "id": "k-029",
    "lesson": 4,
    "number": 29,
    "kanji": "半",
    "strokes": 5,
    "onyomi": [
      "はん"
    ],
    "kunyomi": [],
    "meaning_en": "half",
    "meaning_sv": "halv",
    "compounds": [
      {
        "kanji": "三時半",
        "kana": "さんじはん",
        "en": "half past three",
        "sv": "halv fyra (3:30)"
      },
      {
        "kanji": "半分",
        "kana": "はんぶん",
        "en": "half",
        "sv": "hälft"
      },
      {
        "kanji": "半年",
        "kana": "はんとし",
        "en": "half a year",
        "sv": "ett halvår"
      },
      {
        "kanji": "半額",
        "kana": "はんがく",
        "en": "half price",
        "sv": "halva priset"
      }
    ]
  },
  {
    "id": "k-030",
    "lesson": 5,
    "number": 30,
    "kanji": "山",
    "strokes": 3,
    "onyomi": [
      "さん"
    ],
    "kunyomi": [
      "やま"
    ],
    "meaning_en": "mountain",
    "meaning_sv": "berg",
    "compounds": [
      {
        "kanji": "山",
        "kana": "やま",
        "en": "mountain",
        "sv": "berg"
      },
      {
        "kanji": "山川さん",
        "kana": "やまかわさん",
        "en": "Mr./Ms. Yamakawa",
        "sv": "Yamakawa"
      },
      {
        "kanji": "富士山",
        "kana": "ふじさん",
        "en": "Mt. Fuji",
        "sv": "Fuji (berget)"
      }
    ]
  },
  {
    "id": "k-031",
    "lesson": 5,
    "number": 31,
    "kanji": "川",
    "strokes": 3,
    "onyomi": [],
    "kunyomi": [
      "かわ",
      "がわ"
    ],
    "meaning_en": "river",
    "meaning_sv": "flod / å",
    "compounds": [
      {
        "kanji": "川",
        "kana": "かわ",
        "en": "river",
        "sv": "flod / å"
      },
      {
        "kanji": "山川さん",
        "kana": "やまかわさん",
        "en": "Mr./Ms. Yamakawa",
        "sv": "Yamakawa"
      },
      {
        "kanji": "小川さん",
        "kana": "おがわさん",
        "en": "Mr./Ms. Ogawa",
        "sv": "Ogawa"
      }
    ]
  },
  {
    "id": "k-032",
    "lesson": 5,
    "number": 32,
    "kanji": "元",
    "strokes": 4,
    "onyomi": [
      "げん",
      "がん"
    ],
    "kunyomi": [
      "もと"
    ],
    "meaning_en": "origin",
    "meaning_sv": "ursprung / grund",
    "compounds": [
      {
        "kanji": "元気な",
        "kana": "げんきな",
        "en": "fine; healthy",
        "sv": "pigg / frisk"
      },
      {
        "kanji": "元日",
        "kana": "がんじつ",
        "en": "the first day of the year",
        "sv": "nyårsdagen"
      },
      {
        "kanji": "地元",
        "kana": "じもと",
        "en": "local",
        "sv": "lokal / hemort"
      }
    ]
  },
  {
    "id": "k-033",
    "lesson": 5,
    "number": 33,
    "kanji": "気",
    "strokes": 6,
    "onyomi": [
      "き"
    ],
    "kunyomi": [],
    "meaning_en": "spirit",
    "meaning_sv": "ande / sinne / energi",
    "compounds": [
      {
        "kanji": "元気な",
        "kana": "げんきな",
        "en": "fine; healthy",
        "sv": "pigg / frisk"
      },
      {
        "kanji": "天気",
        "kana": "てんき",
        "en": "weather",
        "sv": "väder"
      },
      {
        "kanji": "電気",
        "kana": "でんき",
        "en": "electricity; light",
        "sv": "elektricitet / lampa"
      },
      {
        "kanji": "気持ち",
        "kana": "きもち",
        "en": "feeling",
        "sv": "känsla"
      },
      {
        "kanji": "人気",
        "kana": "にんき",
        "en": "popularity",
        "sv": "popularitet"
      }
    ]
  },
  {
    "id": "k-034",
    "lesson": 5,
    "number": 34,
    "kanji": "天",
    "strokes": 4,
    "onyomi": [
      "てん"
    ],
    "kunyomi": [],
    "meaning_en": "heaven",
    "meaning_sv": "himmel",
    "compounds": [
      {
        "kanji": "天気",
        "kana": "てんき",
        "en": "weather",
        "sv": "väder"
      },
      {
        "kanji": "天国",
        "kana": "てんごく",
        "en": "heaven",
        "sv": "himlen / paradiset"
      },
      {
        "kanji": "天皇",
        "kana": "てんのう",
        "en": "Japanese emperor",
        "sv": "kejsare (av Japan)"
      },
      {
        "kanji": "天才",
        "kana": "てんさい",
        "en": "genius",
        "sv": "geni"
      }
    ]
  },
  {
    "id": "k-035",
    "lesson": 5,
    "number": 35,
    "kanji": "私",
    "strokes": 7,
    "onyomi": [
      "し"
    ],
    "kunyomi": [
      "わたし"
    ],
    "meaning_en": "I; private",
    "meaning_sv": "jag; privat",
    "compounds": [
      {
        "kanji": "私",
        "kana": "わたし",
        "en": "I",
        "sv": "jag"
      },
      {
        "kanji": "私立大学",
        "kana": "しりつだいがく",
        "en": "private university",
        "sv": "privatuniversitet"
      }
    ]
  },
  {
    "id": "k-036",
    "lesson": 5,
    "number": 36,
    "kanji": "今",
    "strokes": 4,
    "onyomi": [
      "こん"
    ],
    "kunyomi": [
      "いま"
    ],
    "meaning_en": "now",
    "meaning_sv": "nu",
    "compounds": [
      {
        "kanji": "今",
        "kana": "いま",
        "en": "now",
        "sv": "nu"
      },
      {
        "kanji": "今日",
        "kana": "きょう",
        "en": "today",
        "sv": "i dag"
      },
      {
        "kanji": "今晩",
        "kana": "こんばん",
        "en": "tonight",
        "sv": "i kväll"
      },
      {
        "kanji": "今月",
        "kana": "こんげつ",
        "en": "this month",
        "sv": "denna månad"
      },
      {
        "kanji": "今年",
        "kana": "ことし",
        "en": "this year",
        "sv": "i år"
      }
    ]
  },
  {
    "id": "k-037",
    "lesson": 5,
    "number": 37,
    "kanji": "田",
    "strokes": 5,
    "onyomi": [],
    "kunyomi": [
      "た",
      "だ"
    ],
    "meaning_en": "rice field",
    "meaning_sv": "risfält",
    "compounds": [
      {
        "kanji": "田中さん",
        "kana": "たなかさん",
        "en": "Mr./Ms. Tanaka",
        "sv": "Tanaka"
      },
      {
        "kanji": "山田さん",
        "kana": "やまださん",
        "en": "Mr./Ms. Yamada",
        "sv": "Yamada"
      },
      {
        "kanji": "田んぼ",
        "kana": "たんぼ",
        "en": "rice field",
        "sv": "risfält"
      }
    ]
  },
  {
    "id": "k-038",
    "lesson": 5,
    "number": 38,
    "kanji": "女",
    "strokes": 3,
    "onyomi": [
      "じょ"
    ],
    "kunyomi": [
      "おんな"
    ],
    "meaning_en": "woman",
    "meaning_sv": "kvinna",
    "compounds": [
      {
        "kanji": "女の人",
        "kana": "おんなのひと",
        "en": "woman",
        "sv": "kvinna"
      },
      {
        "kanji": "女性",
        "kana": "じょせい",
        "en": "woman",
        "sv": "kvinna (formellt)"
      },
      {
        "kanji": "女の子",
        "kana": "おんなのこ",
        "en": "girl",
        "sv": "flicka"
      },
      {
        "kanji": "長女",
        "kana": "ちょうじょ",
        "en": "the eldest daughter",
        "sv": "äldsta dottern"
      }
    ]
  },
  {
    "id": "k-039",
    "lesson": 5,
    "number": 39,
    "kanji": "男",
    "strokes": 7,
    "onyomi": [
      "だん"
    ],
    "kunyomi": [
      "おとこ"
    ],
    "meaning_en": "man",
    "meaning_sv": "man",
    "compounds": [
      {
        "kanji": "男の人",
        "kana": "おとこのひと",
        "en": "man",
        "sv": "man"
      },
      {
        "kanji": "男性",
        "kana": "だんせい",
        "en": "man",
        "sv": "man (formellt)"
      },
      {
        "kanji": "男の子",
        "kana": "おとこのこ",
        "en": "boy",
        "sv": "pojke"
      },
      {
        "kanji": "男子学生",
        "kana": "だんしがくせい",
        "en": "male student",
        "sv": "manlig student"
      }
    ]
  },
  {
    "id": "k-040",
    "lesson": 5,
    "number": 40,
    "kanji": "見",
    "strokes": 7,
    "onyomi": [
      "けん"
    ],
    "kunyomi": [
      "み"
    ],
    "meaning_en": "to see",
    "meaning_sv": "att se / titta",
    "compounds": [
      {
        "kanji": "見る",
        "kana": "みる",
        "en": "to see",
        "sv": "att se / titta"
      },
      {
        "kanji": "見物",
        "kana": "けんぶつ",
        "en": "sightseeing",
        "sv": "sightseeing / sightseeingtur"
      },
      {
        "kanji": "花見",
        "kana": "はなみ",
        "en": "flower viewing",
        "sv": "körsbärsblomningsskådande (hanami)"
      },
      {
        "kanji": "意見",
        "kana": "いけん",
        "en": "opinion",
        "sv": "åsikt"
      }
    ]
  },
  {
    "id": "k-041",
    "lesson": 5,
    "number": 41,
    "kanji": "行",
    "strokes": 6,
    "onyomi": [
      "こう",
      "ぎょう"
    ],
    "kunyomi": [
      "い"
    ],
    "meaning_en": "to go",
    "meaning_sv": "att gå / resa",
    "compounds": [
      {
        "kanji": "行く",
        "kana": "いく",
        "en": "to go",
        "sv": "att gå / åka"
      },
      {
        "kanji": "銀行",
        "kana": "ぎんこう",
        "en": "bank",
        "sv": "bank"
      },
      {
        "kanji": "一行目",
        "kana": "いちぎょうめ",
        "en": "first line",
        "sv": "första raden"
      },
      {
        "kanji": "旅行",
        "kana": "りょこう",
        "en": "travel",
        "sv": "resa"
      }
    ]
  },
  {
    "id": "k-042",
    "lesson": 5,
    "number": 42,
    "kanji": "食",
    "strokes": 9,
    "onyomi": [
      "しょく"
    ],
    "kunyomi": [
      "た"
    ],
    "meaning_en": "to eat",
    "meaning_sv": "att äta",
    "compounds": [
      {
        "kanji": "食べる",
        "kana": "たべる",
        "en": "to eat",
        "sv": "att äta"
      },
      {
        "kanji": "食べ物",
        "kana": "たべもの",
        "en": "food",
        "sv": "mat"
      },
      {
        "kanji": "食堂",
        "kana": "しょくどう",
        "en": "cafeteria",
        "sv": "matsal / kafeteria"
      },
      {
        "kanji": "食事",
        "kana": "しょくじ",
        "en": "meal",
        "sv": "måltid"
      },
      {
        "kanji": "朝食",
        "kana": "ちょうしょく",
        "en": "breakfast",
        "sv": "frukost (formellt)"
      }
    ]
  },
  {
    "id": "k-043",
    "lesson": 5,
    "number": 43,
    "kanji": "飲",
    "strokes": 12,
    "onyomi": [
      "いん"
    ],
    "kunyomi": [
      "の"
    ],
    "meaning_en": "to drink",
    "meaning_sv": "att dricka",
    "compounds": [
      {
        "kanji": "飲む",
        "kana": "のむ",
        "en": "to drink",
        "sv": "att dricka"
      },
      {
        "kanji": "飲み物",
        "kana": "のみもの",
        "en": "drink",
        "sv": "dryck"
      },
      {
        "kanji": "飲酒運転",
        "kana": "いんしゅうんてん",
        "en": "drunken driving",
        "sv": "rattfylleri"
      }
    ]
  }
];

export const vocabularyList = [
  {
    "id": "v-l3-01",
    "lesson": 3,
    "category": "Nouns · Entertainment & Sports",
    "section": "vocabulary",
    "kanji": "映画",
    "kana": "えいが",
    "romaji": "eiga",
    "en": "movie",
    "sv": "film / bio",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l3-02",
    "lesson": 3,
    "category": "Nouns · Entertainment & Sports",
    "section": "vocabulary",
    "kanji": "音楽",
    "kana": "おんがく",
    "romaji": "ongaku",
    "en": "music",
    "sv": "musik",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-03",
    "lesson": 3,
    "category": "Nouns · Entertainment & Sports",
    "section": "vocabulary",
    "kanji": "雑誌",
    "kana": "ざっし",
    "romaji": "zasshi",
    "en": "magazine",
    "sv": "tidskrift / tidning",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-04",
    "lesson": 3,
    "category": "Nouns · Entertainment & Sports",
    "section": "vocabulary",
    "kanji": null,
    "kana": "スポーツ",
    "romaji": "supootsu",
    "en": "sports",
    "sv": "sport / idrott",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-05",
    "lesson": 3,
    "category": "Nouns · Entertainment & Sports",
    "section": "vocabulary",
    "kanji": null,
    "kana": "デート",
    "romaji": "deeto",
    "en": "date (romantic, not calendar)",
    "sv": "dejt",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-06",
    "lesson": 3,
    "category": "Nouns · Entertainment & Sports",
    "section": "vocabulary",
    "kanji": null,
    "kana": "テニス",
    "romaji": "tenisu",
    "en": "tennis",
    "sv": "tennis",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-07",
    "lesson": 3,
    "category": "Nouns · Entertainment & Sports",
    "section": "vocabulary",
    "kanji": null,
    "kana": "テレビ",
    "romaji": "terebi",
    "en": "TV",
    "sv": "tv / television",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-08",
    "lesson": 3,
    "category": "Nouns · Foods & Drinks",
    "section": "vocabulary",
    "kanji": null,
    "kana": "アイスクリーム",
    "romaji": "aisukuriimu",
    "en": "ice cream",
    "sv": "glass",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-09",
    "lesson": 3,
    "category": "Nouns · Foods & Drinks",
    "section": "vocabulary",
    "kanji": null,
    "kana": "ハンバーガー",
    "romaji": "hanbaagaa",
    "en": "hamburger",
    "sv": "hamburgare",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-10",
    "lesson": 3,
    "category": "Nouns · Foods & Drinks",
    "section": "vocabulary",
    "kanji": "お酒",
    "kana": "おさけ",
    "romaji": "osake",
    "en": "sake; alcoholic drink",
    "sv": "sake; alkoholhaltig dryck",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-11",
    "lesson": 3,
    "category": "Nouns · Foods & Drinks",
    "section": "vocabulary",
    "kanji": "お茶",
    "kana": "おちゃ",
    "romaji": "ocha",
    "en": "green tea",
    "sv": "grönt te / te",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-12",
    "lesson": 3,
    "category": "Nouns · Foods & Drinks",
    "section": "vocabulary",
    "kanji": null,
    "kana": "コーヒー",
    "romaji": "koohii",
    "en": "coffee",
    "sv": "kaffe",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-13",
    "lesson": 3,
    "category": "Nouns · Foods & Drinks",
    "section": "vocabulary",
    "kanji": "水",
    "kana": "みず",
    "romaji": "mizu",
    "en": "water",
    "sv": "vatten",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-14",
    "lesson": 3,
    "category": "Nouns · Foods & Drinks",
    "section": "vocabulary",
    "kanji": "朝ご飯",
    "kana": "あさごはん",
    "romaji": "asagohan",
    "en": "breakfast",
    "sv": "frukost",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-15",
    "lesson": 3,
    "category": "Nouns · Foods & Drinks",
    "section": "vocabulary",
    "kanji": "昼ご飯",
    "kana": "ひるごはん",
    "romaji": "hirugohan",
    "en": "lunch",
    "sv": "lunch",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-16",
    "lesson": 3,
    "category": "Nouns · Foods & Drinks",
    "section": "vocabulary",
    "kanji": "晩ご飯",
    "kana": "ばんごはん",
    "romaji": "bangohan",
    "en": "dinner",
    "sv": "middag",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l3-17",
    "lesson": 3,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": "家",
    "kana": "いえ",
    "romaji": "ie",
    "en": "home; house",
    "sv": "hem / hus",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-18",
    "lesson": 3,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": "家",
    "kana": "うち",
    "romaji": "uchi",
    "en": "home; house; my place",
    "sv": "hem / mitt hem",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l3-19",
    "lesson": 3,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": "学校",
    "kana": "がっこう",
    "romaji": "gakkou",
    "en": "school",
    "sv": "skola",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-20",
    "lesson": 3,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": null,
    "kana": "カフェ",
    "romaji": "kafe",
    "en": "cafe",
    "sv": "kafé",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l3-21",
    "lesson": 3,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "明日",
    "kana": "あした",
    "romaji": "ashita",
    "en": "tomorrow",
    "sv": "i morgon",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l3-22",
    "lesson": 3,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "今日",
    "kana": "きょう",
    "romaji": "kyou",
    "en": "today",
    "sv": "i dag",
    "wordType": "time",
    "dialogue": true
  },
  {
    "id": "v-l3-23",
    "lesson": 3,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "朝",
    "kana": "あさ",
    "romaji": "asa",
    "en": "morning",
    "sv": "morgon",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l3-24",
    "lesson": 3,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "今晩",
    "kana": "こんばん",
    "romaji": "konban",
    "en": "tonight",
    "sv": "i kväll",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l3-25",
    "lesson": 3,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "毎日",
    "kana": "まいにち",
    "romaji": "mainichi",
    "en": "every day",
    "sv": "varje dag",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l3-26",
    "lesson": 3,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "毎晩",
    "kana": "まいばん",
    "romaji": "maiban",
    "en": "every night",
    "sv": "varje kväll",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l3-27",
    "lesson": 3,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "週末",
    "kana": "しゅうまつ",
    "romaji": "shuumatsu",
    "en": "weekend",
    "sv": "helg",
    "wordType": "time",
    "dialogue": true
  },
  {
    "id": "v-l3-28",
    "lesson": 3,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "土曜日",
    "kana": "どようび",
    "romaji": "doyoubi",
    "en": "Saturday",
    "sv": "lördag",
    "wordType": "time",
    "dialogue": true
  },
  {
    "id": "v-l3-29",
    "lesson": 3,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "日曜日",
    "kana": "にちようび",
    "romaji": "nichiyoubi",
    "en": "Sunday",
    "sv": "söndag",
    "wordType": "time",
    "dialogue": true
  },
  {
    "id": "v-l3-30",
    "lesson": 3,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": null,
    "kana": "いつ",
    "romaji": "itsu",
    "en": "when",
    "sv": "när",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l3-31",
    "lesson": 3,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": null,
    "kana": "～ごろ",
    "romaji": "~goro",
    "en": "at about...",
    "sv": "cirka / vid ...-tiden",
    "wordType": "time",
    "dialogue": true
  },
  {
    "id": "v-l3-32",
    "lesson": 3,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "行く",
    "kana": "いく",
    "romaji": "iku",
    "en": "to go (destination に/へ)",
    "sv": "gå / åka (till destination に/へ)",
    "wordType": "u-verb",
    "particle": "に/へ",
    "dialogue": true
  },
  {
    "id": "v-l3-33",
    "lesson": 3,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "帰る",
    "kana": "かえる",
    "romaji": "kaeru",
    "en": "to go back; to return (destination に/へ)",
    "sv": "åka hem / återvända (till に/へ)",
    "wordType": "u-verb",
    "particle": "に/へ",
    "dialogue": true
  },
  {
    "id": "v-l3-34",
    "lesson": 3,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "聞く",
    "kana": "きく",
    "romaji": "kiku",
    "en": "to listen; to hear (～を)",
    "sv": "lyssna; höra (på ～を)",
    "wordType": "u-verb",
    "particle": "を",
    "dialogue": false
  },
  {
    "id": "v-l3-35",
    "lesson": 3,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "飲む",
    "kana": "のむ",
    "romaji": "nomu",
    "en": "to drink (～を)",
    "sv": "dricka (～を)",
    "wordType": "u-verb",
    "particle": "を",
    "dialogue": false
  },
  {
    "id": "v-l3-36",
    "lesson": 3,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "話す",
    "kana": "はなす",
    "romaji": "hanasu",
    "en": "to speak; to talk (language を/で)",
    "sv": "tala; prata (språk を/で)",
    "wordType": "u-verb",
    "particle": "を/で",
    "dialogue": false
  },
  {
    "id": "v-l3-37",
    "lesson": 3,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "読む",
    "kana": "よむ",
    "romaji": "yomu",
    "en": "to read (～を)",
    "sv": "läsa (～を)",
    "wordType": "u-verb",
    "particle": "を",
    "dialogue": false
  },
  {
    "id": "v-l3-38",
    "lesson": 3,
    "category": "Ru-verbs",
    "section": "vocabulary",
    "kanji": "起きる",
    "kana": "おきる",
    "romaji": "okiru",
    "en": "to get up",
    "sv": "stiga upp / vakna",
    "wordType": "ru-verb",
    "particle": null,
    "dialogue": false
  },
  {
    "id": "v-l3-39",
    "lesson": 3,
    "category": "Ru-verbs",
    "section": "vocabulary",
    "kanji": "食べる",
    "kana": "たべる",
    "romaji": "taberu",
    "en": "to eat (～を)",
    "sv": "äta (～を)",
    "wordType": "ru-verb",
    "particle": "を",
    "dialogue": true
  },
  {
    "id": "v-l3-40",
    "lesson": 3,
    "category": "Ru-verbs",
    "section": "vocabulary",
    "kanji": "寝る",
    "kana": "ねる",
    "romaji": "neru",
    "en": "to sleep; to go to sleep",
    "sv": "sova / gå och lägga sig",
    "wordType": "ru-verb",
    "particle": null,
    "dialogue": false
  },
  {
    "id": "v-l3-41",
    "lesson": 3,
    "category": "Ru-verbs",
    "section": "vocabulary",
    "kanji": "見る",
    "kana": "みる",
    "romaji": "miru",
    "en": "to see; to look at; to watch (～を)",
    "sv": "se / titta på (～を)",
    "wordType": "ru-verb",
    "particle": "を",
    "dialogue": true
  },
  {
    "id": "v-l3-42",
    "lesson": 3,
    "category": "Irregular Verbs",
    "section": "vocabulary",
    "kanji": "来る",
    "kana": "くる",
    "romaji": "kuru",
    "en": "to come (destination に/へ)",
    "sv": "komma (till destination に/へ)",
    "wordType": "irregular-verb",
    "particle": "に/へ",
    "dialogue": false
  },
  {
    "id": "v-l3-43",
    "lesson": 3,
    "category": "Irregular Verbs",
    "section": "vocabulary",
    "kanji": null,
    "kana": "する",
    "romaji": "suru",
    "en": "to do (～を)",
    "sv": "göra (～を)",
    "wordType": "irregular-verb",
    "particle": "を",
    "dialogue": true
  },
  {
    "id": "v-l3-44",
    "lesson": 3,
    "category": "Irregular Verbs",
    "section": "vocabulary",
    "kanji": "勉強する",
    "kana": "べんきょうする",
    "romaji": "benkyousuru",
    "en": "to study (～を)",
    "sv": "studera / plugga (～を)",
    "wordType": "irregular-verb",
    "particle": "を",
    "dialogue": true
  },
  {
    "id": "v-l3-45",
    "lesson": 3,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": null,
    "kana": "いい",
    "romaji": "ii",
    "en": "good",
    "sv": "bra / god",
    "wordType": "i-adj",
    "dialogue": true
  },
  {
    "id": "v-l3-46",
    "lesson": 3,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "早い",
    "kana": "はやい",
    "romaji": "hayai",
    "en": "early",
    "sv": "tidig",
    "wordType": "i-adj",
    "dialogue": true
  },
  {
    "id": "v-l3-47",
    "lesson": 3,
    "category": "Adverbs",
    "section": "vocabulary",
    "kanji": null,
    "kana": "あまり",
    "romaji": "amari",
    "en": "not much (with negative)",
    "sv": "inte mycket / sällan (med nekande form)",
    "wordType": "adverb",
    "dialogue": false
  },
  {
    "id": "v-l3-48",
    "lesson": 3,
    "category": "Adverbs",
    "section": "vocabulary",
    "kanji": "全然",
    "kana": "ぜんぜん",
    "romaji": "zenzen",
    "en": "not at all (with negative)",
    "sv": "inte alls (med nekande form)",
    "wordType": "adverb",
    "dialogue": false
  },
  {
    "id": "v-l3-49",
    "lesson": 3,
    "category": "Adverbs",
    "section": "vocabulary",
    "kanji": null,
    "kana": "たいてい",
    "romaji": "taitei",
    "en": "usually",
    "sv": "vanligtvis / oftast",
    "wordType": "adverb",
    "dialogue": true
  },
  {
    "id": "v-l3-50",
    "lesson": 3,
    "category": "Adverbs",
    "section": "vocabulary",
    "kanji": null,
    "kana": "ちょっと",
    "romaji": "chotto",
    "en": "a little",
    "sv": "lite / en aning",
    "wordType": "adverb",
    "dialogue": true
  },
  {
    "id": "v-l3-51",
    "lesson": 3,
    "category": "Adverbs",
    "section": "vocabulary",
    "kanji": "時々",
    "kana": "ときどき",
    "romaji": "tokidoki",
    "en": "sometimes",
    "sv": "ibland / då och då",
    "wordType": "adverb",
    "dialogue": true
  },
  {
    "id": "v-l3-52",
    "lesson": 3,
    "category": "Adverbs",
    "section": "vocabulary",
    "kanji": null,
    "kana": "よく",
    "romaji": "yoku",
    "en": "often; much",
    "sv": "ofta; mycket",
    "wordType": "adverb",
    "dialogue": false
  },
  {
    "id": "v-l3-53",
    "lesson": 3,
    "category": "Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "そうですね",
    "romaji": "sou desu ne",
    "en": "That's right.; Let me see.",
    "sv": "Det stämmer.; Låt mig se.",
    "wordType": "expression",
    "dialogue": true
  },
  {
    "id": "v-l3-54",
    "lesson": 3,
    "category": "Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "でも",
    "romaji": "demo",
    "en": "but",
    "sv": "men",
    "wordType": "expression",
    "dialogue": true
  },
  {
    "id": "v-l3-55",
    "lesson": 3,
    "category": "Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "どうですか",
    "romaji": "dou desu ka",
    "en": "How about...?; How is...?",
    "sv": "Vad sägs om...?; Hur vore det med...?",
    "wordType": "expression",
    "dialogue": true
  },
  {
    "id": "v-l3-56",
    "lesson": 3,
    "category": "Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "ええ",
    "romaji": "ee",
    "en": "yes",
    "sv": "ja (ledigt/vardagligt)",
    "wordType": "expression",
    "dialogue": true
  },
  {
    "id": "v-l4-01",
    "lesson": 4,
    "category": "Nouns · Activities",
    "section": "vocabulary",
    "kanji": null,
    "kana": "ゲーム",
    "romaji": "geemu",
    "en": "game",
    "sv": "spel",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-02",
    "lesson": 4,
    "category": "Nouns · Activities",
    "section": "vocabulary",
    "kanji": null,
    "kana": "アルバイト",
    "romaji": "arubaito",
    "en": "part-time job (colloquially: バイト)",
    "sv": "extrajobb / deltidsjobb (vardagligt: バイト)",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-03",
    "lesson": 4,
    "category": "Nouns · Activities",
    "section": "vocabulary",
    "kanji": "買い物",
    "kana": "かいもの",
    "romaji": "kaimono",
    "en": "shopping",
    "sv": "shopping / handla",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-04",
    "lesson": 4,
    "category": "Nouns · Activities",
    "section": "vocabulary",
    "kanji": null,
    "kana": "クラス",
    "romaji": "kurasu",
    "en": "class",
    "sv": "lektion / klass",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-05",
    "lesson": 4,
    "category": "Nouns · People & Things",
    "section": "vocabulary",
    "kanji": "犬",
    "kana": "いぬ",
    "romaji": "inu",
    "en": "dog",
    "sv": "hund",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-06",
    "lesson": 4,
    "category": "Nouns · People & Things",
    "section": "vocabulary",
    "kanji": "猫",
    "kana": "ねこ",
    "romaji": "neko",
    "en": "cat",
    "sv": "katt",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-07",
    "lesson": 4,
    "category": "Nouns · People & Things",
    "section": "vocabulary",
    "kanji": "人",
    "kana": "ひと",
    "romaji": "hito",
    "en": "person",
    "sv": "person / människa",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l4-08",
    "lesson": 4,
    "category": "Nouns · People & Things",
    "section": "vocabulary",
    "kanji": "子供",
    "kana": "こども",
    "romaji": "kodomo",
    "en": "child",
    "sv": "barn",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-09",
    "lesson": 4,
    "category": "Nouns · People & Things",
    "section": "vocabulary",
    "kanji": null,
    "kana": "あなた",
    "romaji": "anata",
    "en": "you",
    "sv": "du",
    "wordType": "pronoun",
    "dialogue": false
  },
  {
    "id": "v-l4-10",
    "lesson": 4,
    "category": "Nouns · People & Things",
    "section": "vocabulary",
    "kanji": null,
    "kana": "いす",
    "romaji": "isu",
    "en": "chair",
    "sv": "stol",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-11",
    "lesson": 4,
    "category": "Nouns · People & Things",
    "section": "vocabulary",
    "kanji": "机",
    "kana": "つくえ",
    "romaji": "tsukue",
    "en": "desk",
    "sv": "skrivbord",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-12",
    "lesson": 4,
    "category": "Nouns · People & Things",
    "section": "vocabulary",
    "kanji": "写真",
    "kana": "しゃしん",
    "romaji": "shashin",
    "en": "picture; photograph",
    "sv": "foto / fotografi",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l4-13",
    "lesson": 4,
    "category": "Nouns · People & Things",
    "section": "vocabulary",
    "kanji": "花",
    "kana": "はな",
    "romaji": "hana",
    "en": "flower",
    "sv": "blomma",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-14",
    "lesson": 4,
    "category": "Nouns · People & Things",
    "section": "vocabulary",
    "kanji": null,
    "kana": "レポート",
    "romaji": "repooto",
    "en": "(term) paper",
    "sv": "rapport / uppsats",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-15",
    "lesson": 4,
    "category": "Nouns · People & Things",
    "section": "vocabulary",
    "kanji": "ご飯",
    "kana": "ごはん",
    "romaji": "gohan",
    "en": "rice; meal",
    "sv": "ris / måltid",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-16",
    "lesson": 4,
    "category": "Nouns · People & Things",
    "section": "vocabulary",
    "kanji": null,
    "kana": "パン",
    "romaji": "pan",
    "en": "bread",
    "sv": "bröd",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-17",
    "lesson": 4,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": "お寺",
    "kana": "おてら",
    "romaji": "otera",
    "en": "temple",
    "sv": "buddhistiskt tempel",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l4-18",
    "lesson": 4,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": "公園",
    "kana": "こうえん",
    "romaji": "kouen",
    "en": "park",
    "sv": "park",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l4-19",
    "lesson": 4,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": null,
    "kana": "スーパー",
    "romaji": "suupaa",
    "en": "supermarket",
    "sv": "mataffär / stormarknad",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-20",
    "lesson": 4,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": "バス停",
    "kana": "ばすてい",
    "romaji": "basutei",
    "en": "bus stop",
    "sv": "busshållplats",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-21",
    "lesson": 4,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": "病院",
    "kana": "びょういん",
    "romaji": "byouin",
    "en": "hospital",
    "sv": "sjukhus",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-22",
    "lesson": 4,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": null,
    "kana": "ホテル",
    "romaji": "hoteru",
    "en": "hotel",
    "sv": "hotell",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l4-23",
    "lesson": 4,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": "本屋",
    "kana": "ほんや",
    "romaji": "hon'ya",
    "en": "bookstore",
    "sv": "bokhandel",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l4-24",
    "lesson": 4,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": "町",
    "kana": "まち",
    "romaji": "machi",
    "en": "town; city",
    "sv": "stad / samhälle",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-25",
    "lesson": 4,
    "category": "Nouns · Places",
    "section": "vocabulary",
    "kanji": null,
    "kana": "レストラン",
    "romaji": "resutoran",
    "en": "restaurant",
    "sv": "restaurang",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l4-26",
    "lesson": 4,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "昨日",
    "kana": "きのう",
    "romaji": "kinou",
    "en": "yesterday",
    "sv": "i går",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l4-27",
    "lesson": 4,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "～時間",
    "kana": "～じかん",
    "romaji": "~jikan",
    "en": "... hours",
    "sv": "... timmar (tidslängd)",
    "wordType": "time",
    "dialogue": true
  },
  {
    "id": "v-l4-28",
    "lesson": 4,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "一時間",
    "kana": "いちじかん",
    "romaji": "ichijikan",
    "en": "one hour",
    "sv": "en timme",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l4-29",
    "lesson": 4,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "先週",
    "kana": "せんしゅう",
    "romaji": "senshuu",
    "en": "last week",
    "sv": "förra veckan",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l4-30",
    "lesson": 4,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "時",
    "kana": "とき",
    "romaji": "toki",
    "en": "when...; at the time of... (～の)",
    "sv": "då; vid tidpunkten för... (～の)",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l4-31",
    "lesson": 4,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "月曜日",
    "kana": "げつようび",
    "romaji": "getsuyoubi",
    "en": "Monday",
    "sv": "måndag",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l4-32",
    "lesson": 4,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "火曜日",
    "kana": "かようび",
    "romaji": "kayoubi",
    "en": "Tuesday",
    "sv": "tisdag",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l4-33",
    "lesson": 4,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "水曜日",
    "kana": "すいようび",
    "romaji": "suiyoubi",
    "en": "Wednesday",
    "sv": "onsdag",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l4-34",
    "lesson": 4,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "木曜日",
    "kana": "もくようび",
    "romaji": "mokuyoubi",
    "en": "Thursday",
    "sv": "torsdag",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l4-35",
    "lesson": 4,
    "category": "Nouns · Time",
    "section": "vocabulary",
    "kanji": "金曜日",
    "kana": "きんようび",
    "romaji": "kin'youbi",
    "en": "Friday",
    "sv": "fredag",
    "wordType": "time",
    "dialogue": false
  },
  {
    "id": "v-l4-36",
    "lesson": 4,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "会う",
    "kana": "あう",
    "romaji": "au",
    "en": "to meet; to see (a person に)",
    "sv": "träffa; möta (person に)",
    "wordType": "u-verb",
    "particle": "に",
    "dialogue": false
  },
  {
    "id": "v-l4-37",
    "lesson": 4,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": null,
    "kana": "ある",
    "romaji": "aru",
    "en": "there is... (place に thing が)",
    "sv": "finnas (icke-levande ting: plats に sak が)",
    "wordType": "u-verb",
    "particle": "に / が",
    "dialogue": true
  },
  {
    "id": "v-l4-38",
    "lesson": 4,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "買う",
    "kana": "かう",
    "romaji": "kau",
    "en": "to buy (～を)",
    "sv": "köpa (～を)",
    "wordType": "u-verb",
    "particle": "を",
    "dialogue": false
  },
  {
    "id": "v-l4-39",
    "lesson": 4,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "書く",
    "kana": "かく",
    "romaji": "kaku",
    "en": "to write (person に thing を)",
    "sv": "skriva (till person に, sak を)",
    "wordType": "u-verb",
    "particle": "に / を",
    "dialogue": false
  },
  {
    "id": "v-l4-40",
    "lesson": 4,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "撮る",
    "kana": "とる",
    "romaji": "toru",
    "en": "to take (a picture) (～を)",
    "sv": "ta (ett foto) (～を)",
    "wordType": "u-verb",
    "particle": "を",
    "dialogue": true
  },
  {
    "id": "v-l4-41",
    "lesson": 4,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "待つ",
    "kana": "まつ",
    "romaji": "matsu",
    "en": "to wait (～を)",
    "sv": "vänta (på ～を)",
    "wordType": "u-verb",
    "particle": "を",
    "dialogue": true
  },
  {
    "id": "v-l4-42",
    "lesson": 4,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": null,
    "kana": "わかる",
    "romaji": "wakaru",
    "en": "to understand (～が)",
    "sv": "förstå (～が)",
    "wordType": "u-verb",
    "particle": "が",
    "dialogue": true
  },
  {
    "id": "v-l4-43",
    "lesson": 4,
    "category": "Ru-verbs",
    "section": "vocabulary",
    "kanji": null,
    "kana": "いる",
    "romaji": "iru",
    "en": "(a person/animal) is in...; stays at... (place に person が)",
    "sv": "finnas / vistas (levande varelse: plats に varelse が)",
    "wordType": "ru-verb",
    "particle": "に / が",
    "dialogue": true
  },
  {
    "id": "v-l4-44",
    "lesson": 4,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "～ぐらい",
    "romaji": "~gurai",
    "en": "about (approximate measurement)",
    "sv": "ungefär / cirka (vid mått/mängd)",
    "wordType": "adverb",
    "dialogue": false
  },
  {
    "id": "v-l4-45",
    "lesson": 4,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "ごめんなさい",
    "romaji": "gomennasai",
    "en": "I'm sorry.",
    "sv": "Förlåt / ursäkta.",
    "wordType": "expression",
    "dialogue": true
  },
  {
    "id": "v-l4-46",
    "lesson": 4,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "それから",
    "romaji": "sorekara",
    "en": "and then",
    "sv": "och sedan / därefter",
    "wordType": "expression",
    "dialogue": false
  },
  {
    "id": "v-l4-47",
    "lesson": 4,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "だから",
    "romaji": "dakara",
    "en": "so; therefore",
    "sv": "därför / så",
    "wordType": "expression",
    "dialogue": true
  },
  {
    "id": "v-l4-48",
    "lesson": 4,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "たくさん",
    "romaji": "takusan",
    "en": "many; a lot",
    "sv": "många / mycket",
    "wordType": "adverb",
    "dialogue": true
  },
  {
    "id": "v-l4-49",
    "lesson": 4,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "～と",
    "romaji": "~to",
    "en": "together with (a person); and",
    "sv": "tillsammans med (person); och",
    "wordType": "particle",
    "dialogue": true
  },
  {
    "id": "v-l4-50",
    "lesson": 4,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "どうして",
    "romaji": "doushite",
    "en": "why",
    "sv": "varför",
    "wordType": "adverb",
    "dialogue": true
  },
  {
    "id": "v-l4-51",
    "lesson": 4,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": "一人で",
    "kana": "ひとりで",
    "romaji": "hitoride",
    "en": "alone",
    "sv": "ensam / på egen hand",
    "wordType": "adverb",
    "dialogue": true
  },
  {
    "id": "v-l4-52",
    "lesson": 4,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "もしもし",
    "romaji": "moshimoshi",
    "en": "Hello? (used on the phone)",
    "sv": "Hallå? (i telefon)",
    "wordType": "expression",
    "dialogue": true
  },
  {
    "id": "loc-01",
    "lesson": 4,
    "category": "Location Words",
    "section": "location",
    "kanji": "右",
    "kana": "みぎ",
    "romaji": "migi",
    "en": "right (~の)",
    "sv": "höger (om ~)",
    "wordType": "noun"
  },
  {
    "id": "loc-02",
    "lesson": 4,
    "category": "Location Words",
    "section": "location",
    "kanji": "左",
    "kana": "ひだり",
    "romaji": "hidari",
    "en": "left (~の)",
    "sv": "vänster (om ~)",
    "wordType": "noun"
  },
  {
    "id": "loc-03",
    "lesson": 4,
    "category": "Location Words",
    "section": "location",
    "kanji": "前",
    "kana": "まえ",
    "romaji": "mae",
    "en": "front (~の)",
    "sv": "framför / fram (om ~)",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "loc-04",
    "lesson": 4,
    "category": "Location Words",
    "section": "location",
    "kanji": "後ろ",
    "kana": "うしろ",
    "romaji": "ushiro",
    "en": "back (~の)",
    "sv": "bakom / bak (om ~)",
    "wordType": "noun"
  },
  {
    "id": "loc-05",
    "lesson": 4,
    "category": "Location Words",
    "section": "location",
    "kanji": "中",
    "kana": "なか",
    "romaji": "naka",
    "en": "inside (~の)",
    "sv": "inuti / inne i (~)",
    "wordType": "noun"
  },
  {
    "id": "loc-06",
    "lesson": 4,
    "category": "Location Words",
    "section": "location",
    "kanji": "上",
    "kana": "うえ",
    "romaji": "ue",
    "en": "on; above (~の)",
    "sv": "på / ovanpå / över (~)",
    "wordType": "noun"
  },
  {
    "id": "loc-07",
    "lesson": 4,
    "category": "Location Words",
    "section": "location",
    "kanji": "下",
    "kana": "した",
    "romaji": "shita",
    "en": "under (~の)",
    "sv": "under / nedanför (~)",
    "wordType": "noun"
  },
  {
    "id": "loc-08",
    "lesson": 4,
    "category": "Location Words",
    "section": "location",
    "kanji": "近く",
    "kana": "ちかく",
    "romaji": "chikaku",
    "en": "near; nearby (~の)",
    "sv": "nära / i närheten av (~)",
    "wordType": "noun"
  },
  {
    "id": "loc-09",
    "lesson": 4,
    "category": "Location Words",
    "section": "location",
    "kanji": "隣",
    "kana": "となり",
    "romaji": "tonari",
    "en": "next (~の)",
    "sv": "bredvid / intill (av samma slag, ~)",
    "wordType": "noun"
  },
  {
    "id": "loc-10",
    "lesson": 4,
    "category": "Location Words",
    "section": "location",
    "kanji": "間",
    "kana": "あいだ",
    "romaji": "aida",
    "en": "between (A と B の)",
    "sv": "mellan (A och B: A と B の)",
    "wordType": "noun"
  },
  {
    "id": "v-l5-01",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": "食べ物",
    "kana": "たべもの",
    "romaji": "tabemono",
    "en": "food",
    "sv": "mat",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l5-02",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": "飲み物",
    "kana": "のみもの",
    "romaji": "nomimono",
    "en": "drink",
    "sv": "dryck",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l5-03",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": "果物",
    "kana": "くだもの",
    "romaji": "kudamono",
    "en": "fruit",
    "sv": "frukt",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l5-04",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": "休み",
    "kana": "やすみ",
    "romaji": "yasumi",
    "en": "holiday; day off; absence",
    "sv": "ledighet / semester / lov",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l5-05",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": "旅行",
    "kana": "りょこう",
    "romaji": "ryokou",
    "en": "travel",
    "sv": "resa",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l5-06",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": "海",
    "kana": "うみ",
    "romaji": "umi",
    "en": "sea",
    "sv": "hav",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l5-07",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": null,
    "kana": "サーフィン",
    "romaji": "saafin",
    "en": "surfing",
    "sv": "surfning",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l5-08",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": "お土産",
    "kana": "おみやげ",
    "romaji": "omiyage",
    "en": "souvenir",
    "sv": "souvenir / present från resa",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l5-09",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": null,
    "kana": "バス",
    "romaji": "basu",
    "en": "bus",
    "sv": "buss",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l5-10",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": "天気",
    "kana": "てんき",
    "romaji": "tenki",
    "en": "weather",
    "sv": "väder",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l5-11",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": "宿題",
    "kana": "しゅくだい",
    "romaji": "shukudai",
    "en": "homework",
    "sv": "läxa",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l5-12",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": null,
    "kana": "テスト",
    "romaji": "tesuto",
    "en": "test",
    "sv": "test / prov",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l5-13",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": "誕生日",
    "kana": "たんじょうび",
    "romaji": "tanjoubi",
    "en": "birthday",
    "sv": "födelsedag",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l5-14",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": "部屋",
    "kana": "へや",
    "romaji": "heya",
    "en": "room",
    "sv": "rum",
    "wordType": "noun",
    "dialogue": false
  },
  {
    "id": "v-l5-15",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": "僕",
    "kana": "ぼく",
    "romaji": "boku",
    "en": "I (used by men)",
    "sv": "jag (används främst av män/killar)",
    "wordType": "pronoun",
    "dialogue": true
  },
  {
    "id": "v-l5-16",
    "lesson": 5,
    "category": "Nouns",
    "section": "vocabulary",
    "kanji": null,
    "kana": "Lサイズ",
    "romaji": "eru saizu",
    "en": "size L",
    "sv": "storlek L",
    "wordType": "noun",
    "dialogue": true
  },
  {
    "id": "v-l5-17",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "新しい",
    "kana": "あたらしい",
    "romaji": "atarashii",
    "en": "new",
    "sv": "ny",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-18",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "古い",
    "kana": "ふるい",
    "romaji": "furui",
    "en": "old (thing—not used for people)",
    "sv": "gammal (om saker, ej personer)",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-19",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "暑い",
    "kana": "あつい",
    "romaji": "atsui (weather)",
    "en": "hot (weather)",
    "sv": "varm (om väder/klimat)",
    "wordType": "i-adj",
    "dialogue": true
  },
  {
    "id": "v-l5-20",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "寒い",
    "kana": "さむい",
    "romaji": "samui",
    "en": "cold (weather—not used for things)",
    "sv": "kall (om väder, ej saker)",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-21",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "熱い",
    "kana": "あつい",
    "romaji": "atsui (thing)",
    "en": "hot (thing)",
    "sv": "het / varm (om föremål/mat/dryck)",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-22",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "忙しい",
    "kana": "いそがしい",
    "romaji": "isogashii",
    "en": "busy (people/days)",
    "sv": "upptagen / hektisk",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-23",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "大きい",
    "kana": "おおきい",
    "romaji": "ookii",
    "en": "large",
    "sv": "stor",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-24",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "小さい",
    "kana": "ちいさい",
    "romaji": "chiisai",
    "en": "small",
    "sv": "liten",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-25",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "面白い",
    "kana": "おもしろい",
    "romaji": "omoshiroi",
    "en": "interesting; funny",
    "sv": "intressant / rolig",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-26",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": null,
    "kana": "つまらない",
    "romaji": "tsumaranai",
    "en": "boring",
    "sv": "tråkig",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-27",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": null,
    "kana": "やさしい",
    "romaji": "yasashii",
    "en": "easy (problem); kind (person)",
    "sv": "lätt (uppgift); snäll (person)",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-28",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "難しい",
    "kana": "むずかしい",
    "romaji": "muzukashii",
    "en": "difficult",
    "sv": "svår",
    "wordType": "i-adj",
    "dialogue": true
  },
  {
    "id": "v-l5-29",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": null,
    "kana": "かっこいい",
    "romaji": "kakkoii",
    "en": "good-looking (conjugates like いい)",
    "sv": "snygg / häftig (böjs som いい: かっこよくない)",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-30",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "怖い",
    "kana": "こわい",
    "romaji": "kowai",
    "en": "frightening",
    "sv": "läskig / skrämmande",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-31",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "楽しい",
    "kana": "たのしい",
    "romaji": "tanoshii",
    "en": "fun",
    "sv": "rolig",
    "wordType": "i-adj",
    "dialogue": true
  },
  {
    "id": "v-l5-32",
    "lesson": 5,
    "category": "い-adjectives",
    "section": "vocabulary",
    "kanji": "安い",
    "kana": "やすい",
    "romaji": "yasui",
    "en": "inexpensive; cheap (thing)",
    "sv": "billig",
    "wordType": "i-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-33",
    "lesson": 5,
    "category": "な-adjectives",
    "section": "vocabulary",
    "kanji": "好き",
    "kana": "すき (な)",
    "romaji": "suki (na)",
    "en": "fond of; to like (～が)",
    "sv": "tycka om / gilla (～が)",
    "wordType": "na-adj",
    "particle": "が",
    "dialogue": true
  },
  {
    "id": "v-l5-34",
    "lesson": 5,
    "category": "な-adjectives",
    "section": "vocabulary",
    "kanji": "嫌い",
    "kana": "きらい (な)",
    "romaji": "kirai (na)",
    "en": "disgusted with; to dislike (～が)",
    "sv": "ogilla / tycka illa om (～が)",
    "wordType": "na-adj",
    "particle": "が",
    "dialogue": false
  },
  {
    "id": "v-l5-35",
    "lesson": 5,
    "category": "な-adjectives",
    "section": "vocabulary",
    "kanji": "大好き",
    "kana": "だいすき (な)",
    "romaji": "daisuki (na)",
    "en": "very fond of; to love (～が)",
    "sv": "älska / tycka mycket om (～が)",
    "wordType": "na-adj",
    "particle": "が",
    "dialogue": true
  },
  {
    "id": "v-l5-36",
    "lesson": 5,
    "category": "な-adjectives",
    "section": "vocabulary",
    "kanji": "大嫌い",
    "kana": "だいきらい (な)",
    "romaji": "daikirai (na)",
    "en": "to hate (～が)",
    "sv": "avsky / hata (～が)",
    "wordType": "na-adj",
    "particle": "が",
    "dialogue": false
  },
  {
    "id": "v-l5-37",
    "lesson": 5,
    "category": "な-adjectives",
    "section": "vocabulary",
    "kanji": null,
    "kana": "きれい (な)",
    "romaji": "kirei (na)",
    "en": "beautiful; clean",
    "sv": "vacker; ren (OBS: slutar på い men är な-adjektiv!)",
    "wordType": "na-adj",
    "dialogue": true
  },
  {
    "id": "v-l5-38",
    "lesson": 5,
    "category": "な-adjectives",
    "section": "vocabulary",
    "kanji": "元気",
    "kana": "げんき (な)",
    "romaji": "genki (na)",
    "en": "healthy; energetic",
    "sv": "frisk / pigg / kry",
    "wordType": "na-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-39",
    "lesson": 5,
    "category": "な-adjectives",
    "section": "vocabulary",
    "kanji": "静か",
    "kana": "しずか (な)",
    "romaji": "shizuka (na)",
    "en": "quiet",
    "sv": "tyst / lugn",
    "wordType": "na-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-40",
    "lesson": 5,
    "category": "な-adjectives",
    "section": "vocabulary",
    "kanji": null,
    "kana": "にぎやか (な)",
    "romaji": "nigiyaka (na)",
    "en": "lively",
    "sv": "livlig / fartfylld",
    "wordType": "na-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-41",
    "lesson": 5,
    "category": "な-adjectives",
    "section": "vocabulary",
    "kanji": "暇",
    "kana": "ひま (な)",
    "romaji": "hima (na)",
    "en": "not busy; free (time)",
    "sv": "ledig / ha tid över",
    "wordType": "na-adj",
    "dialogue": false
  },
  {
    "id": "v-l5-42",
    "lesson": 5,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "泳ぐ",
    "kana": "およぐ",
    "romaji": "oyogu",
    "en": "to swim",
    "sv": "simma",
    "wordType": "u-verb",
    "dialogue": true
  },
  {
    "id": "v-l5-43",
    "lesson": 5,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "聞く",
    "kana": "きく",
    "romaji": "kiku (ask)",
    "en": "to ask (person に)",
    "sv": "fråga (person に)",
    "wordType": "u-verb",
    "particle": "に",
    "dialogue": false
  },
  {
    "id": "v-l5-44",
    "lesson": 5,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": "乗る",
    "kana": "のる",
    "romaji": "noru",
    "en": "to ride; to board (～に)",
    "sv": "åka (med fordon) / stiga på (～に)",
    "wordType": "u-verb",
    "particle": "に",
    "dialogue": false
  },
  {
    "id": "v-l5-45",
    "lesson": 5,
    "category": "U-verbs",
    "section": "vocabulary",
    "kanji": null,
    "kana": "やる",
    "romaji": "yaru",
    "en": "to do; to perform (～を)",
    "sv": "göra (vardagligt) (～を)",
    "wordType": "u-verb",
    "particle": "を",
    "dialogue": true
  },
  {
    "id": "v-l5-46",
    "lesson": 5,
    "category": "Ru-verbs",
    "section": "vocabulary",
    "kanji": "出かける",
    "kana": "でかける",
    "romaji": "dekakeru",
    "en": "to go out",
    "sv": "gå ut / ge sig iväg",
    "wordType": "ru-verb",
    "dialogue": false
  },
  {
    "id": "v-l5-47",
    "lesson": 5,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": "一緒に",
    "kana": "いっしょに",
    "romaji": "isshoni",
    "en": "together",
    "sv": "tillsammans",
    "wordType": "adverb",
    "dialogue": true
  },
  {
    "id": "v-l5-48",
    "lesson": 5,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "すごく",
    "romaji": "sugoku",
    "en": "extremely",
    "sv": "väldigt / extremt",
    "wordType": "adverb",
    "dialogue": true
  },
  {
    "id": "v-l5-49",
    "lesson": 5,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": "大丈夫",
    "kana": "だいじょうぶ",
    "romaji": "daijoubu",
    "en": "It's okay.; Not to worry.; Everything is under control.",
    "sv": "Det är lugnt / okej / ingen fara.",
    "wordType": "expression",
    "dialogue": true
  },
  {
    "id": "v-l5-50",
    "lesson": 5,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "とても",
    "romaji": "totemo",
    "en": "very",
    "sv": "mycket / väldigt",
    "wordType": "adverb",
    "dialogue": false
  },
  {
    "id": "v-l5-51",
    "lesson": 5,
    "category": "Adverbs & Expressions",
    "section": "vocabulary",
    "kanji": null,
    "kana": "どんな",
    "romaji": "donna",
    "en": "what kind of...",
    "sv": "vad för slags / hurdant...",
    "wordType": "expression",
    "dialogue": true
  },
  {
    "id": "v-l5-52",
    "lesson": 5,
    "category": "Counters",
    "section": "vocabulary",
    "kanji": "～枚",
    "kana": "～まい",
    "romaji": "~mai",
    "en": "[counter for flat objects]",
    "sv": "räkneord för platta föremål (papper, tröjor etc.)",
    "wordType": "counter",
    "dialogue": true
  }
];

export const calendarData = {
  "days_of_month": [
    {
      "day": 1,
      "kanji": "一日",
      "kana": "ついたち",
      "romaji": "tsuitachi",
      "sv": "den 1:a"
    },
    {
      "day": 2,
      "kanji": "二日",
      "kana": "ふつか",
      "romaji": "futsuka",
      "sv": "den 2:a"
    },
    {
      "day": 3,
      "kanji": "三日",
      "kana": "みっか",
      "romaji": "mikka",
      "sv": "den 3:e"
    },
    {
      "day": 4,
      "kanji": "四日",
      "kana": "よっか",
      "romaji": "yokka",
      "sv": "den 4:e"
    },
    {
      "day": 5,
      "kanji": "五日",
      "kana": "いつか",
      "romaji": "itsuka",
      "sv": "den 5:e"
    },
    {
      "day": 6,
      "kanji": "六日",
      "kana": "むいか",
      "romaji": "muika",
      "sv": "den 6:e"
    },
    {
      "day": 7,
      "kanji": "七日",
      "kana": "なのか",
      "romaji": "nanoka",
      "sv": "den 7:e"
    },
    {
      "day": 8,
      "kanji": "八日",
      "kana": "ようか",
      "romaji": "youka",
      "sv": "den 8:e"
    },
    {
      "day": 9,
      "kanji": "九日",
      "kana": "ここのか",
      "romaji": "kokonoka",
      "sv": "den 9:e"
    },
    {
      "day": 10,
      "kanji": "十日",
      "kana": "とおか",
      "romaji": "tooka",
      "sv": "den 10:e"
    },
    {
      "day": 11,
      "kanji": "十一日",
      "kana": "じゅういちにち",
      "romaji": "juuichinichi",
      "sv": "den 11:e"
    },
    {
      "day": 12,
      "kanji": "十二日",
      "kana": "じゅうににち",
      "romaji": "juuninichi",
      "sv": "den 12:e"
    },
    {
      "day": 13,
      "kanji": "十三日",
      "kana": "じゅうさんにち",
      "romaji": "juusannichi",
      "sv": "den 13:e"
    },
    {
      "day": 14,
      "kanji": "十四日",
      "kana": "じゅうよっか",
      "romaji": "juuyokka",
      "sv": "den 14:e"
    },
    {
      "day": 15,
      "kanji": "十五日",
      "kana": "じゅうごにち",
      "romaji": "juugonichi",
      "sv": "den 15:e"
    },
    {
      "day": 16,
      "kanji": "十六日",
      "kana": "じゅうろくにち",
      "romaji": "juurokunichi",
      "sv": "den 16:e"
    },
    {
      "day": 17,
      "kanji": "十七日",
      "kana": "じゅうしちにち",
      "romaji": "juushichinichi",
      "sv": "den 17:e"
    },
    {
      "day": 18,
      "kanji": "十八日",
      "kana": "じゅうはちにち",
      "romaji": "juuhachinichi",
      "sv": "den 18:e"
    },
    {
      "day": 19,
      "kanji": "十九日",
      "kana": "じゅうくにち",
      "romaji": "juukunichi",
      "sv": "den 19:e"
    },
    {
      "day": 20,
      "kanji": "二十日",
      "kana": "はつか",
      "romaji": "hatsuka",
      "sv": "den 20:e"
    },
    {
      "day": 21,
      "kanji": "二十一日",
      "kana": "にじゅういちにち",
      "romaji": "nijuuichinichi",
      "sv": "den 21:a"
    },
    {
      "day": 22,
      "kanji": "二十二日",
      "kana": "にじゅうににち",
      "romaji": "nijuuninichi",
      "sv": "den 22:a"
    },
    {
      "day": 23,
      "kanji": "二十三日",
      "kana": "にじゅうさんにち",
      "romaji": "nijuusannichi",
      "sv": "den 23:e"
    },
    {
      "day": 24,
      "kanji": "二十四日",
      "kana": "にじゅうよっか",
      "romaji": "nijuuyokka",
      "sv": "den 24:e"
    },
    {
      "day": 25,
      "kanji": "二十五日",
      "kana": "にじゅうごにち",
      "romaji": "nijuugonichi",
      "sv": "den 25:e"
    },
    {
      "day": 26,
      "kanji": "二十六日",
      "kana": "にじゅうろくにち",
      "romaji": "nijuurokunichi",
      "sv": "den 26:e"
    },
    {
      "day": 27,
      "kanji": "二十七日",
      "kana": "にじゅうしちにち",
      "romaji": "nijuushichinichi",
      "sv": "den 27:e"
    },
    {
      "day": 28,
      "kanji": "二十八日",
      "kana": "にじゅうはちにち",
      "romaji": "nijuuhachinichi",
      "sv": "den 28:e"
    },
    {
      "day": 29,
      "kanji": "二十九日",
      "kana": "にじゅうくにち",
      "romaji": "nijuukunichi",
      "sv": "den 29:e"
    },
    {
      "day": 30,
      "kanji": "三十日",
      "kana": "さんじゅうにち",
      "romaji": "sanjuunichi",
      "sv": "den 30:e"
    },
    {
      "day": 31,
      "kanji": "三十一日",
      "kana": "さんじゅういちにち",
      "romaji": "sanjuuichinichi",
      "sv": "den 31:a"
    }
  ],
  "months": [
    {
      "month": 1,
      "kanji": "一月",
      "kana": "いちがつ",
      "romaji": "ichigatsu",
      "en": "January",
      "sv": "januari"
    },
    {
      "month": 2,
      "kanji": "二月",
      "kana": "にがつ",
      "romaji": "nigatsu",
      "en": "February",
      "sv": "februari"
    },
    {
      "month": 3,
      "kanji": "三月",
      "kana": "さんがつ",
      "romaji": "sangatsu",
      "en": "March",
      "sv": "mars"
    },
    {
      "month": 4,
      "kanji": "四月",
      "kana": "しがつ",
      "romaji": "shigatsu",
      "en": "April",
      "sv": "april"
    },
    {
      "month": 5,
      "kanji": "五月",
      "kana": "ごがつ",
      "romaji": "gogatsu",
      "en": "May",
      "sv": "maj"
    },
    {
      "month": 6,
      "kanji": "六月",
      "kana": "ろくがつ",
      "romaji": "rokugatsu",
      "en": "June",
      "sv": "juni"
    },
    {
      "month": 7,
      "kanji": "七月",
      "kana": "しちがつ",
      "romaji": "shichigatsu",
      "en": "July",
      "sv": "juli"
    },
    {
      "month": 8,
      "kanji": "八月",
      "kana": "はちがつ",
      "romaji": "hachigatsu",
      "en": "August",
      "sv": "augusti"
    },
    {
      "month": 9,
      "kanji": "九月",
      "kana": "くがつ",
      "romaji": "kugatsu",
      "en": "September",
      "sv": "september"
    },
    {
      "month": 10,
      "kanji": "十月",
      "kana": "じゅうがつ",
      "romaji": "juugatsu",
      "en": "October",
      "sv": "oktober"
    },
    {
      "month": 11,
      "kanji": "十一月",
      "kana": "じゅういちがつ",
      "romaji": "juuichigatsu",
      "en": "November",
      "sv": "november"
    },
    {
      "month": 12,
      "kanji": "十二月",
      "kana": "じゅうにがつ",
      "romaji": "juunigatsu",
      "en": "December",
      "sv": "december"
    }
  ],
  "weekdays": [
    {
      "day": "Sunday",
      "kanji": "日曜日",
      "kana": "にちようび",
      "romaji": "nichiyoubi",
      "sv": "söndag"
    },
    {
      "day": "Monday",
      "kanji": "月曜日",
      "kana": "げつようび",
      "romaji": "getsuyoubi",
      "sv": "måndag"
    },
    {
      "day": "Tuesday",
      "kanji": "火曜日",
      "kana": "かようび",
      "romaji": "kayoubi",
      "sv": "tisdag"
    },
    {
      "day": "Wednesday",
      "kanji": "水曜日",
      "kana": "すいようび",
      "romaji": "suiyoubi",
      "sv": "onsdag"
    },
    {
      "day": "Thursday",
      "kanji": "木曜日",
      "kana": "もくようび",
      "romaji": "mokuyoubi",
      "sv": "torsdag"
    },
    {
      "day": "Friday",
      "kanji": "金曜日",
      "kana": "きんようび",
      "romaji": "kin'youbi",
      "sv": "fredag"
    },
    {
      "day": "Saturday",
      "kanji": "土曜日",
      "kana": "どようび",
      "romaji": "doyoubi",
      "sv": "lördag"
    }
  ],
  "time_matrix": {
    "day": [
      {
        "term": "the day before yesterday",
        "kanji": null,
        "kana": "おととい",
        "romaji": "ototoi",
        "sv": "i förrgår"
      },
      {
        "term": "yesterday",
        "kanji": "昨日",
        "kana": "きのう",
        "romaji": "kinou",
        "sv": "i går"
      },
      {
        "term": "today",
        "kanji": "今日",
        "kana": "きょう",
        "romaji": "kyou",
        "sv": "i dag"
      },
      {
        "term": "tomorrow",
        "kanji": "明日",
        "kana": "あした",
        "romaji": "ashita",
        "sv": "i morgon"
      },
      {
        "term": "the day after tomorrow",
        "kanji": null,
        "kana": "あさって",
        "romaji": "asatte",
        "sv": "i övermorgon"
      }
    ],
    "week": [
      {
        "term": "two weeks ago",
        "kanji": "二週間前",
        "kana": "にしゅうかんまえ",
        "romaji": "nishuukanmae",
        "sv": "för två veckor sedan"
      },
      {
        "term": "last week",
        "kanji": "先週",
        "kana": "せんしゅう",
        "romaji": "senshuu",
        "sv": "förra veckan"
      },
      {
        "term": "this week",
        "kanji": "今週",
        "kana": "こんしゅう",
        "romaji": "konshuu",
        "sv": "denna vecka"
      },
      {
        "term": "next week",
        "kanji": "来週",
        "kana": "らいしゅう",
        "romaji": "raishuu",
        "sv": "nästa vecka"
      },
      {
        "term": "the week after next",
        "kanji": "再来週",
        "kana": "さらいしゅう",
        "romaji": "saraishuu",
        "sv": "i nästnästa vecka"
      }
    ],
    "month": [
      {
        "term": "two months ago",
        "kanji": "二か月前",
        "kana": "にかげつまえ",
        "romaji": "nikagetsumae",
        "sv": "för två månader sedan"
      },
      {
        "term": "last month",
        "kanji": "先月",
        "kana": "せんげつ",
        "romaji": "sengetsu",
        "sv": "förra månaden"
      },
      {
        "term": "this month",
        "kanji": "今月",
        "kana": "こんげつ",
        "romaji": "kongetsu",
        "sv": "denna månad"
      },
      {
        "term": "next month",
        "kanji": "来月",
        "kana": "らいげつ",
        "romaji": "raigetsu",
        "sv": "nästa månad"
      },
      {
        "term": "the month after next",
        "kanji": "再来月",
        "kana": "さらいげつ",
        "romaji": "saraigetsu",
        "sv": "i nästnästa månad"
      }
    ],
    "year": [
      {
        "term": "the year before last",
        "kanji": null,
        "kana": "おととし",
        "romaji": "ototoshi",
        "sv": "i förrfjol"
      },
      {
        "term": "last year",
        "kanji": "去年",
        "kana": "きょねん",
        "romaji": "kyonen",
        "sv": "i fjol / förra året"
      },
      {
        "term": "this year",
        "kanji": "今年",
        "kana": "ことし",
        "romaji": "kotoshi",
        "sv": "i år"
      },
      {
        "term": "next year",
        "kanji": "来年",
        "kana": "らいねん",
        "romaji": "rainen",
        "sv": "nästa år"
      },
      {
        "term": "the year after next",
        "kanji": "再来年",
        "kana": "さらいねん",
        "romaji": "sarainen",
        "sv": "i nästnästa år / om två år"
      }
    ]
  }
};

export const metadata = {
  "title": "Genki I (3rd Edition) Vocabulary & Kanji - Lessons 3, 4, 5",
  "source": "Material/vocabulary.pdf",
  "lessons": [
    3,
    4,
    5
  ],
  "stats": {
    "kanjiCount": 43,
    "vocabularyCount": 170,
    "calendarDaysCount": 31,
    "monthsCount": 12,
    "weekdaysCount": 7,
    "timeMatrixCount": 20
  }
};

export default {
  metadata,
  kanjiList,
  vocabularyList,
  calendarData,
};
