# Tillförlitlig multiplayer: gemensam start, rättvis tid och återanslutning

**Status:** ready-for-agent

**Datum:** 2026-10-07

## Problem Statement

Spelare kan inte lita på att de får samma möjlighet att delta i en match. Användaren rapporterade stora skillnader mellan klockorna och att värdens spel senast började ungefär tio sekunder efter de andras. Lokal felsökning identifierade sju separata fel:

| Fynd | Problem                                                                           | Observerad evidens                                                                                                                                                         |
| ---- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1   | Starten väntar inte på att klienterna har fått och förberett matchen.             | När leveransen av värdens startuppdatering fördröjdes 13 sekunder blev värdens matchvy tillgänglig cirka 10,1 sekunder efter gästens.                                      |
| F2   | Databaskonflikter räknas som spelarens svarstid.                                  | Tio klienter skickade rätt svar inom 1–2 millisekunder. Tre fick ändå timeout och −50 poäng i båda körningarna; de accepterade svarens poäng varierade kraftigt.           |
| F3   | En osäker eller föråldrad klockkalibrering används som om den vore tillförlitlig. | Sex sekunders fördröjt serverkvitto gav cirka tre sekunders klockskillnad. En simulerad paus i den monotona klockan korrigerades inte av återgångs- eller onlinehändelser. |
| F4   | Ett andra klick kan hinna före spelarens första val.                              | När första begäran fördröjdes sparades det andra, felaktiga svaret och gav −250 poäng.                                                                                     |
| F5   | Omladdning tappar matchen och återinträde nekas.                                  | Samma konto och rumskod gav ”Matchen har redan startat” efter omladdning, trots att spelaren fortfarande var deltagare.                                                    |
| F6   | Abrupt frånkopplade gäster står kvar som redo.                                    | Efter att en gästklient stängts och testtiden flyttats fram en minut stod två spelare fortfarande som anslutna, och matchen gick att starta.                               |
| F7   | Den första tidsgränsen är dold.                                                   | ”Väntar på svar…” visades omedelbart före att den osynliga 60-sekundersgränsen gav −50 poäng.                                                                              |

F1 är en reproduktion med kontrollerat fördröjd leverans till prenumerationsgränsen. Den visar att det rapporterade startsymptomet är möjligt; den bevisar inte varför nätverk eller klient fördröjdes i användarens verkliga match. Pausen i F3 var också simulerad. Specifikationen ska inte tillskriva dessa symptom en viss enhet eller webbläsare utan ytterligare evidens.

## Solution

Spelarna ska få en tydlig förberedelsefas, en gemensam nedräkning och en matchklocka vars kvalitet är känd. En osynkroniserad klient visas som återanslutande eller synkroniserande och får inte obemärkt räknas som redo. Under normala, fungerande testförhållanden ska skillnaden mellan klienternas spelstart vara högst 500 millisekunder.

Svar ska tas emot oberoende av andra spelares skrivningar. Ett första val låses direkt, skickas med en stabil identitet och räknas högst en gång. Poäng och tidsgränser ska utgå från när svaret togs emot av servern, inte när en senare transaktion lyckades uppdatera ställningen. Nätets transporttid mellan klick och servermottagning kan fortfarande påverka resultatet; systemet lovar inte identiska poäng över godtyckligt olika nätförhållanden.

Omladdning ska återföra samma konto till den pågående matchen efter ny synkronisering. Frånkopplade spelare ska visas korrekt och ges en begränsad återanslutningstid. Alla tidsgränser ska vara synliga, inklusive de första 60 sekunderna.

## User Stories

1. Som värd vill jag se vilka spelare som faktiskt är anslutna, så att jag inte startar med tomma platser.
2. Som gäst vill jag få samma startförberedelse som värden, så att jag inte missar den första frågan.
3. Som värd vill jag att även min egen klient bekräftar att matchen är laddad, så att mitt värdskap inte kringgår startkontrollen.
4. Som spelare vill jag att nedräkningen startar först när deltagarna har förberett rätt matchversion, så att alla utgår från samma läge.
5. Som värd vill jag kunna avbryta en förberedelse som fastnat, så att lobbyn går att använda igen.
6. Som spelare vill jag få ett begripligt besked om starten inte kan samordnas, så att en anslutningsfördröjning inte ser ut som att jag svarat för långsamt.
7. Som spelare vill jag att nya frågor och deras tidsgränser hör till en entydig runda, så att gamla uppdateringar inte flyttar mig bakåt.
8. Som spelare vill jag att fel på datorns vanliga klocka inte påverkar matchen, så att ett felaktigt klockslag inte ger fördel eller nackdel.
9. Som spelare vill jag att dåliga tidsprover avvisas, så att spelet inte använder en klocka som kan gå flera sekunder fel.
10. Som spelare vill jag se när klockan synkroniseras, så att jag förstår varför jag ännu inte kan markeras som redo.
11. Som spelare vill jag att klockan kontrolleras igen efter bakgrundsläge eller återanslutning, så att en gammal kalibrering inte lever vidare.
12. Som spelare vill jag att klockans kvalitet försämras tydligt om anslutningen inte räcker till, så att jag inte får en falskt exakt nedräkning.
13. Som spelare vill jag att tio samtidiga svar kan tas emot, så att populariteten hos en fråga inte orsakar timeout.
14. Som spelare vill jag att databasens omförsök inte sänker mina poäng, så att svarstiden beskriver mitt svar och dess transport till servern.
15. Som spelare vill jag att ett svar som tagits emot i tid fortfarande räknas när ställningen uppdateras senare, så att jag inte straffas för intern kötid.
16. Som spelare vill jag att faktiskt sena svar avslås tydligt, så att samma tidsregel gäller för alla.
17. Som spelare vill jag att det första mottagna svaret startar samma åttasekundersfönster för alla, så att stängningen av rundan är konsekvent.
18. Som spelare vill jag att upprepade leveranser av samma svar inte ger fler poäng, så att omförsök är säkra.
19. Som spelare vill jag att mitt första klick låser mitt val direkt, så att ett dubbelklick inte skickar ett annat svar.
20. Som spelare vill jag se ”Skickar svar…” tills servern har bekräftat mottagningen, så att jag kan skilja ett väntande svar från ett sparat svar.
21. Som spelare vill jag få rätt- och felåterkoppling först när mitt svar har godtagits, så att ljud och färger inte lovar poäng som aldrig sparats.
22. Som spelare vill jag kunna försöka leverera samma val igen vid ett tillfälligt fel, så att jag inte behöver gissa om svaret redan finns.
23. Som spelare vill jag återvända till samma match efter omladdning, så att ett tekniskt avbrott inte blir ett frivilligt avhopp.
24. Som spelare vill jag få tillbaka min aktuella fråga, poäng och redan inskickade svar, så att jag inte kan eller måste svara en andra gång.
25. Som spelare vill jag att återanslutningen använder mitt inloggade konto, så att en annan användare på samma enhet inte tar över min matchplats.
26. Som spelare vill jag kunna återansluta via rumskoden även om den lokala hänvisningen saknas, så att matchen fortfarande går att hitta.
27. Som spelare vill jag att ett uttryckligt ”Lämna match” fortsatt räknas som avhopp, så att avsiktlig förlust inte kan göras ogjord genom omladdning.
28. Som spelare vill jag att en tillfälligt frånkopplad deltagare märks som sådan, så att antalet redo spelare inte är missvisande.
29. Som värd vill jag att gäster vars närvaro löpt ut inte uppfyller kravet på minst två redo spelare, så att jag inte startar en ensam match.
30. Som kvarvarande spelare vill jag att matchen fortsätter när en motspelare försvinner, så att spelet inte kan hållas stilla av en övergiven flik.
31. Som spelare vill jag att ett frånkopplingsavhopp registreras högst en gång, så att flera klienter inte ger dubbla förluster eller ELO-ändringar.
32. Som spelare vill jag se hur mycket av de första 60 sekunderna som återstår, så att ett tidsstraff inte kommer utan förvarning.
33. Som spelare vill jag se när tidsgränsen växlar till åtta sekunder efter första svaret, så att även ett sent första svar ger det avsedda svarsfönstret.
34. Som spelare vill jag att timer, svarsknappar och serverns bedömning följer samma gräns, så att knapparnas tillstånd motsvarar vad spelet kan godta.
35. Som spelare vill jag behålla korrekt slutresultat och ELO efter återanslutning, så att tekniska avbrott inte skriver om en avslutad match.
36. Som användare av en äldre klient vill jag få ett tydligt besked om att uppdatera innan jag deltar i en ny matchversion, så att inkompatibla klienter inte skadar matchen.

## Implementation Decisions

Följande beslut och acceptansgränser godkändes av användaren tillsammans med testgränsen och ärendeindelningen 2026-10-07.

1. **Befintlig plattform.** Behåll klientappen, Firebase-inloggningen och Firestore. Introducera inte Cloud Functions, betald drift eller ett nytt backendkrav inom denna leverans. Varje ärende omfattar de datamodells-, regel-, API- och vyändringar som dess beteende behöver.
2. **Befintliga spelregler.** Behåll 2–10 spelare, tio frågor, nuvarande kategorier, 60 sekunders inledande svarstid, därefter åtta sekunder från första mottagna svaret och två sekunders resultatpaus. Behåll poängkurvan 200–1 000, −250 för fel, −50 för uteblivet svar samt befintlig ELO- och avhoppsmodell.
3. **Klockkontrakt.** Matchklockan ska exponera både tid och kvalitet: mätt osäkerhet, mättidpunkt och giltighet. Ett provs nätfördröjning får inte döljas genom att bara välja det snabbaste av flera dåliga prov. Högsta accepterade osäkerhet är 250 millisekunder per klient; ett prov med sex sekunders kvittodröjsmål kvalificerar aldrig för redo-status. Kalibrering gäller högst 60 sekunder och förnyas inför start, efter återgång till synlig flik och efter återanslutning. Överlappande kalibreringar får inte låta ett äldre resultat ersätta ett nyare.
4. **Mottagningstid och poäng.** Det auktoritativa svarstidmåttet är serverns mottagningstid för den första oföränderliga svarsposten. Den senare sammanställningens starttid, omförsök och sluttid får inte ersätta den. Klientens klicktid kan användas för diagnos men ska inte fritt kunna bakdatera ett svar eller styra rankade poäng.
5. **Svar utan gemensam skrivkonflikt.** Ta emot ett svar per match, runda och deltagare som en egen, oföränderlig post med stabil identitet och serverstämplad mottagningstid. Att skriva denna post ska inte kräva att samma gemensamma lobbydokument skrivs om. Separera mottagandet från den idempotenta sammanställningen av rundans svar, poäng och ställning. En återleverans med samma identitet och innehåll ger samma kvitto; ett annat innehåll kan inte skriva över posten.
6. **Gemensamt rundslut.** Första svarstid, deadline och snabbaste korrekta svar härleds från mottagna poster, oberoende av den ordning klienter råkar sammanställa dem i. Vid exakt samma mottagningstid används en dokumenterad stabil skiljeregel som inte ändrar poängen. Avslut och timeout måste samordnas med mottagna svar: en post mottagen före deadline får inte förvandlas till timeout av en senare sammanställning. Svar vid eller efter deadline avvisas. Slutresultat och samtliga ELO-uppdateringar förblir atomära och registreras en gång.
7. **Lokal svarslåsning.** Första klicket fångar val och försöksidentitet synkront och låser alla alternativ innan nätanropet börjar. Lägena obesvarat, skickar, bekräftat och leveransfel är synliga. Ett oklart nätverksutfall kräver avstämning eller omleverans av samma val; ett nytt val tillåts inte medan det första kan ha sparats. Sena callbacks från en äldre runda eller match får inte ändra nuvarande vy.
8. **Närvaro per deltagare.** Alla deltagare, inte bara värden, förnyar sin närvaro. Utgå från tio sekunders heartbeat-intervall och 45 sekunders giltighet som godkända standarder. Giltighet beräknas mot betrodd matchtid och serverstämplad närvaro. Visa upptäckt frånkoppling direkt; senast när närvaron löper ut ska spelaren upphöra att räknas som redo. Närvaroskrivningar ska vara separata från svarsmottagningen och inte skapa en ny gemensam konfliktpunkt.
9. **Avbrott är inte ett uttryckligt avhopp.** Omladdning, stängning och nätbortfall ska inte förlita sig på att ett asynkront unload-anrop hinner köras. En spelare i pågående match kan återvända innan närvaron löpt ut. Rundans ordinarie tider fortsätter under avbrottet; ingen kan stoppa matchen eller få extra svarstid genom att koppla ned. Efter 45 sekunder utan förnyelse verkställs avhopp högst en gång. Ett uttryckligt avhopp gäller omedelbart. Om minst två spelare återstår fortsätter matchen; annars används den befintliga avslutsregeln. I en väntande lobby utesluts föråldrade gäster från redo-antalet, och en föråldrad värd gör lobbyn inaktiv.
10. **Förberedelse före start.** Inför en startversion och förberedelsefas där varje avsedd deltagare, inklusive värden, bekräftar rätt matchinnehåll och giltig klocka. Bind bekräftelsen till deltagare, anslutningssession och startversion; gamla bekräftelser återanvänds inte. Gemensam framtida start beslutas först när giltiga bekräftelser finns. Värdens bekräftade startoperation ska kunna föra värdens vy framåt även om dess prenumerationsleverans släpar efter. Att endast vänta längre än nuvarande tre sekunder är inte en tillräcklig lösning.
11. **Begränsad väntan och svåra nätfel.** Längsta förberedelse är 30 sekunder, därefter återgår lobbyn till ett begripligt försök-igen-läge utan resultat eller ELO. Vid föråldrad startversion, bortfall under förberedelsen eller för sen startleverans får klienten inte obemärkt börja poängsatt spel på den gamla starten. Avbryt och förbered om en ännu inte påbörjad poängsatt runda. Om en allvarlig leveransstörning gör första rundan orättvis innan alla deltagare har kunnat börja, ska starten ogiltigförklaras och eventuell preliminär rundpoäng kasseras, utan ELO. Protokollet ska versionsskydda denna återgång. Perfekt samtidighet vid obegränsad nätfördröjning utlovas inte.
12. **Återanslutning.** Spara en minimal hänvisning till aktuell match per konto och flik, som en hint som måste verifieras mot autentisering och serverdata. Samma befintliga deltagare får återansluta även när matchen startat; okända konton får inte efteransluta och uttryckligen avhoppade spelare återfår inte aktiv status. Ändra ordningen så att medlemskap kan skiljas från ny anslutning. Återanslutning laddar senaste version, synkroniserar klockan och hämtar sparat svar innan knappar aktiveras. En ny anslutningssession ersätter gamla callbacks för den aktuella fliken utan att en annan fortfarande giltig session råkar avregistreras.
13. **Synlig timer.** Före första svaret visar vyn återstående tid av 60 sekunder. När första svaret bekräftats visas i stället återstående tid av åtta sekunder från dess mottagning, även om detta passerar den tidigare 60-sekundersgränsen. Timer, progressindikator, tillgänglighetstext och knappaktivering använder samma deadline. Vid osäker klocka visas ett synkroniseringsläge i stället för en påstått exakt siffra. Tidsstraff presenteras först när rundresultatet är fastställt.
14. **Kompatibilitet och behörighet.** Versionera det ändrade matchprotokollet. Äldre färdiga resultat ska förbli läsbara och privata studiedata ska inte migreras av detta arbete. Blandade inkompatibla klienter ska få ett uppdateringsbesked och får inte skriva enligt gamla regler i en ny match. Reglerna för nya svar, närvaro och startbekräftelser ska binda skrivningar till rätt autentiserad deltagare, match, runda och version, samt hindra omskrivning av mottagningstid och redan mottaget svar. Befintliga skydd får inte lättas för att få tester att gå igenom.
15. **Små ändringar före större.** Klockans injicerbara tids- och transportgräns skapas endast om befintlig gräns inte räcker, inom klockärendet. Motsvarande lokala uppdelning av mottagning och sammanställning görs inom svarsärendet. Ingen separat bred omstrukturering av appen behövs.

## Testing Decisions

**Godkänd primär testgräns:** verkliga användarflöden i flera isolerade webbläsarkontexter mot lokala Auth- och Firestore-emulatorer, med riktiga regler. Använd samma offentliga anslutnings-, start- och svarsflöden som appen. Godkänt beteende mäts i vad deltagarna ser och vad som slutligt sparats; tester ska inte kräva en viss intern funktionsindelning.

Återanvänd befintliga webbläsartester för lobby, klockskevhet, tio rundor, avhopp och ELO, befintliga emulatorprov med riktiga transaktioner och regler samt rena tester av deadlines, poäng och ELO. De befintliga tiopersonstesterna skickar svar sekventiellt och utgör därför inte ett bevis för samtidighet.

Komplettera med smala deterministiska tester för klockans osäkerhet, åldrande och tidshopp där långa väntetider annars skulle krävas. Introducera högst en smal injicerbar gräns för tid/transport om nödvändigt; ersätt inte spelreglerna eller produktionsresultatet med testdubblar. Leveransstörningar ska injiceras vid nät- eller prenumerationsgränsen. Felsökningsprototypens omskrivning av mottagarcallbacken ska inte bli den permanenta testlösningen.

| Scenario                                                                             | Förväntat observerbart resultat                                                                                                    |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Start med två respektive tio friska klienter                                         | Samtliga ser samma startversion och får aktiva svarsalternativ inom 500 ms från varandra i kontrollerat lokalt nät.                |
| Värdens startleverans fördröjs 13 s                                                  | Värden förblir inte ensam i lobby medan gästen spelar poängsatt; bekräftad lokal start används eller starten omförbereds säkert.   |
| En gäst blir inte redo eller försvinner under förberedelse                           | Ingen oskyddad start; tydlig väntan och avbrutet försök inom 30 s utan ELO.                                                        |
| Klockslag skiljer ±60 s mellan enheter                                               | Samma nedräkning och tidsgränser.                                                                                                  |
| Alla tidsprov får 6 s kvittodröjsmål                                                 | Klockan markeras otillräcklig och klienten får inte redo-status på ett felaktigt prov.                                             |
| Synlighet/anslutning återkommer eller monoton tid avviker                            | Ny kalibrering krävs innan redo eller svar; äldre kalibreringsresultat kan inte vinna över ett nyare.                              |
| Tio klienter skickar samtidigt utan injicerad nätfördröjning                         | Tio riktiga svarsposter accepteras, ingen falsk timeout; poängen stämmer med serverns mottagningstider. Kör minst fem nya matcher. |
| Sammanställningen tvingas till konflikt/omförsök efter mottagning                    | Mottagna svar behåller tid, val och poäng även om sammanställningen avslutas efter deadline.                                       |
| Svar strax före, exakt på och efter deadline                                         | Endast svaret före deadline kan räknas; samma regel i vy och slutlig bedömning.                                                    |
| Två olika snabba klick med fördröjd första begäran                                   | Första valet förblir låst och endast det kan sparas; serverbekräftelse styr återkopplingen.                                        |
| Förlorat kvitto och omleverans                                                       | Samma svar identifieras utan dubbla poäng eller omskrivning av val.                                                                |
| Omladdning som värd/gäst under nedräkning, obesvarad/besvarad runda och resultatpaus | Samma konto återfår senaste tillåtna läge och kan inte svara dubbelt.                                                              |
| Abrupt stängd gäst, med tid kontrollerat framflyttad                                 | Gästen är inte redo efter 45 s och får inte bidra till startkravet; aktiv match får högst ett avhopp.                              |
| Återkomst före/efter närvarons utgång samt gammal sessionscallback                   | Återkomst före utgång tillåts, efter verkställt avhopp återställs inte aktiv plats; gammal callback stör inte aktuell session.     |
| Ingen svarar, eller första svaret kommer nära 60 s                                   | Synlig 60-sekunderstimer; fullt nytt åttasekundersfönster vid första svaret; ett timeoutstraff per uteblivet svar.                 |
| Sista rundan, samtidig stängning och flera klienters omförsök                        | Alla giltiga sista svar sparas och varje deltagares matchstatistik/ELO ändras exakt en gång.                                       |
| Otillåten deltagare, ändrat svar eller manipulerad mottagningstid                    | De nya skrivningarna avvisas av verkliga Firestore-regler.                                                                         |
| Äldre resultat och inkompatibel klient                                               | Resultat går att läsa; inkompatibla skrivningar blandas inte in i nya matcher.                                                     |

Kör de viktigaste UI-flödena i Chromium på datorbredd och WebKit på mobilbredd. Kör den tunga tioklientsbelastningen i Chromium. E2E ska fånga relevanta konsol- och sidfel och verifiera att väntelägen inte fastnar. Alla tester använder det isolerade demoprojektet; skarpa konton och matcher används inte. Ett lyckat bygge eller statiska källtextkontroller ersätter inte dessa beteendeprov.

## Out of Scope

- Implementation och publicering av appändringar i detta planeringsuppdrag.
- Nytt spelinnehåll, nya kategorier, ändrad poängkurva, ändrad ELO-formel, fler än tio spelare eller visuell omdesign.
- Införande av betalda backendtjänster, driftmigrering eller automatisk produktionsdeploy.
- Retroaktiv ändring av tidigare matchresultat eller ELO.
- Ett fullständigt fuskresistent tävlingssystem. De nya skrivningarna ska skyddas, men hela befintliga rankningssystemets tillitsmodell byggs inte om här.
- Godtyckligt lång offlineåtkomst till aktiva matcher, paus av spelet för varje nätavbrott eller garanti om perfekt samtidighet på ett obegränsat långsamt nät.
- Att slå fast orsaken till användarens specifika produktionsincident utan loggar eller motsvarande evidens.

## Further Notes

- Under felsökningen passerade 16 rena multiplayerprov, åtta emulatorprov och det befintliga Chromium-provet för felställda enhetsklockor. De nya scenarierna hittade luckor trots detta.
- Prioritera F1–F3 för den rapporterade tidsproblematiken. F4 kan levereras tidigt och separat som skydd av spelarens första val.
- Sju godkända implementationstickets täcker samtliga fynd. Varje ticket ska leverera en verifierbar del av användarflödet med sina regler, databehov och tester, inte endast ett tekniklager.
- De godkända numeriska gränserna för klockkvalitet, förberedelse och närvaro ska behandlas som produktkontrakt och dokumenteras tillsammans med implementationen.
- Användaren godkände testgränser, ärendenas storlek och blockerande beroenden före slutpublicering. Specifikationen är publicerad som ready-for-agent; implementation och verifiering av de nya acceptanskriterierna återstår.
