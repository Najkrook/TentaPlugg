# Öva på månadens dagar: godkänd specifikation och ärenden

**Status:** ready-for-agent — samtliga 4 implementationstickets är genomförda och verifierade med 196 godkända tester.

[Läs hela specifikationen](spec.md).

## Ärendeindelning

1. **[Frågedata, svarsalias och pedagogiska undantagsförklaringar](issues/01-fragedata-och-undantagsregler.md).** (Klar) Skapar frågebanken för alla 31 dagar, alias för kana och romaji, samt förklaringar av undantag.
2. **[Lägesväljare och sessionsstart på startsidan](issues/02-valjare-och-sessionsstart.md).** (Klar) Lägger till övningskort på startsidan med 3 snabbval (1–10, Undantag, 1–31) och initierar pass.
3. **[Kalenderdesign på frågevyn och loopande kortlek](issues/03-fragedesign-och-loopande-kortlek.md).** (Klar) Levererar datumbricka i sessionen, direkt facit med ljud och undantagsförklaring, samt återköing av felade dagar tills passet är slutfört.
4. **[SRS-integration, framstegsvisning och automattester](issues/04-srs-integration-och-framsteg.md).** (Klar) Integrerar med Leitner-statistiken, visar framsteg på startsidan och säkerställer full testtäckning.
