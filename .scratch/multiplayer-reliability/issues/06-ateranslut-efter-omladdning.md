# 06 — Återanslut samma spelare efter omladdning

**What to build:** Samma inloggade spelare kan återvända till aktuell match efter omladdning, med rätt fråga, redan sparat svar och ställning, utan att en ny deltagare släpps in efter start.

**Blocked by:** 02 — Lås första svaret och visa dess leveransstatus; 05 — Förbered alla deltagare före gemensam matchstart.

**Status:** ready-for-agent

**Workflow:** open

**Prioritet:** P2

**Fynd:** F5

**Parent:** [Specifikation](../spec.md)

- [ ] En minimal matchhänvisning sparas per konto och flik och verifieras mot inloggning och serverdata innan någon match återställs. Utloggning eller kontobyte återanvänder inte ett annat kontos matchläge.
- [ ] Anslutningsflödet skiljer befintligt deltagarskap från ny anslutning innan det avvisar en startad match. En befintlig, ännu inte avhoppad deltagare kan återansluta via sparad hänvisning eller rumskod.
- [ ] Okända konton får inte ansluta efter start och uttryckligen avhoppade eller redan utgångna deltagare återfår inte aktiv spelstatus.
- [ ] Omladdning inom närvarofristen räknas inte som uttryckligt avhopp. En ny anslutning återupprättar närvaro, hämtar senaste matchversion och synkroniserar tiden före redo eller svar.
- [ ] Aktuell fråga, rundstatus, poäng, deadline och bekräftat eget svar återställs från servern. Ett redan mottaget svar kan inte ändras eller räknas igen efter omladdning.
- [ ] Förlorat eller väntande kvitto stäms av mot sparat svar före upplåsning. Ny lokal inmatning får inte konkurrera med en osäker tidigare leverans.
- [ ] Återanslutning under förberedelse/nedräkning följer aktuellt startprotokoll och bekräftar om med rätt session; den återanvänder inte en gammal startbekräftelse.
- [ ] Rundtid fortsätter medan klienten är borta. En återvändande spelare får inget nytt åttasekundersfönster och kan inte svara på redan avslutade rundor.
- [ ] Saknad eller stängd lobby, gammal hänvisning, inkompatibel version och avslutad match ger ett begripligt slutläge. Resultat/ELO återregistreras inte när resultatsidan öppnas igen.
- [ ] Gamla callbacks och gamla anslutningssessioner kan inte stänga eller skriva över den återställda vyn.
- [ ] Verkliga browserprov täcker värd och gäst, obesvarad och besvarad runda, resultatpaus och startförberedelse, med återkomst före respektive efter närvarons utgång.
- [ ] Prova även återinträde med enbart rumskod, utloggning/kontobyte, okänd deltagare och uttryckligt avhopp. Reglerna upprätthåller samma medlemskapsgräns som gränssnittet.

**Varför blockerat:** 02 definierar den svaravsikt och det kvitto som måste stämmas av efter omladdning. 04, transitivt genom 05, skiljer tillåten återkomst från verkställt avhopp. 05 definierar det startläge och de sessionsbekräftelser som också måste kunna återställas; godtagbar tid ingår transitivt via dessa ärenden.

**Verifierbar leverans:** Ladda om som värd och som gäst mitt i en match och återvänd till korrekt aktuellt läge, utan ”Matchen har redan startat” och utan dubbla svar eller resultat.
