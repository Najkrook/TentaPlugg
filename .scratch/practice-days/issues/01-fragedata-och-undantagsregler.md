# 01 — Frågedata, svarsalias och pedagogiska undantagsförklaringar

**What to build:** Bygg och exponera en komplett uppsättning frågor för månadens dagar (1–31) baserat på `calendarData.days_of_month`. Varje fråga ska ha unika stabila ID:n (`calendar-day-1` till `calendar-day-31`), stödja både hiragana och romaji med vanliga stavningsvarianter (inklusive dubbla vokaler och makron), samt innehålla pedagogiska förklaringar för undantagsdagarna.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**Workflow:** done

**Prioritet:** P1

**Parent:** [Specifikation](../spec.md)

- [x] Generera och integrera 31 frågor för månadens dagar med ämnet `'Dagar'` och uppsättningen `calendar-days`.
- [x] Varje frågeobjekt innehåller `id` (`calendar-day-${day}`), `prompt` (*”Den ${day}:e”* / *”Den ${day}:a”*), `dayNumber`, `kanji`, `kana`, `romaji` och `isException`.
- [x] Svarsarrayen (`answers`) innehåller alla godtagbara varianter: kana (t.ex. `とおか`), standard-romaji (`tooka`), alternativa romaji (`touka`, `tōka`, `toka`), samt konsonantvarianter (t.ex. `tsuitachi` och `tuitati`).
- [x] Pedagogiska förklaringar finns för alla undantag:
  - 1–10: Urjapanska räkneord (wago) som slutar på *-ka* (förutom *tsuitachi*).
  - 14 och 24: Kinesisk siffra (jū / nijū) kombinerad med det oregelbundna *-yokka*.
  - 20: Den speciella urjapanska läsningen *hatsuka*.
  - 17, 19, 27, 29: Ljudskiftningar (*shichinichi* istället för *nananichi*, *kunichi* istället för *kyuunichi*).
- [x] Säkerställ att normalisering i `src/engine.js` eller svarslistan stöder makron (`ō`, `ū`) genom automatisk mappning.

**Avgränsning:** Detta ärende fokuserar på datamodell, normalisering och svarsvalidering. UI-komponenter och sessionsflöde hanteras i efterföljande ärenden.

**Verifierbar leverans:** Automattester bekräftar att alla 31 frågor har korrekta metadata, att undantag är korrekt flaggade och förklarade, samt att alla svarsvarianter (kana, romaji med makron/dubbelvokaler) valideras som korrekta.
