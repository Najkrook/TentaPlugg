# 02. CSS färgkodning och tema-stöd för granskningsknappar

**Status:** ready-for-agent

**Workflow:** done

**Blocked by:** 01. Statuslogik och markup för navigatorn vid tentagranskning

## Beskrivning

Uppdatera `src/style.css` med stilar för `.question-jump button.correct`, `.question-jump button.incorrect` och `.question-jump button.pending` för både Classic och Sakura-temat:
- Grönt för rätt svar med godkänd kontrast (>= 4.5:1).
- Rött för felaktiga svar med godkänd kontrast (>= 4.5:1).
- Gult/bärnsten för frågor som väntar på egen kontroll med godkänd kontrast (>= 4.5:1).
- Se till att `.current` (rammarkering för aktiv fråga) fungerar bra och tydligt tillsammans med bakgrundsfärgerna.
