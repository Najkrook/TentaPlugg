# Hayashi-sensei: mobilträning och tentaträning

Status: ready-for-agent
Workflow: done

## Beslut

Användaren godkände implementation av två versioner under Gamla tentor, baserade på det åttasidiga repetitionsbladet 復習５課こたえ.pdf. Alla moment ingår. Den dubblerade Tokyo-klockslagsfrågan förekommer en gång.

- Mobil: 135 flervalsfrågor, fyra alternativ, direkt rättning och låst första svar. Alla sju Kyoto-stödord ingår.
- Tenta: 129 uppgifter, 131 övningspoäng. Egna svar med kana; inga romajisvar. Kyoto kräver tre meningar utifrån sju stödord och ger tre poäng vid godkänd självbedömning.
- Gemensamt underlag: 16 tal/tid/datum, sju Kyoto-stödord, 21 frågeordsluckor, 22 adverb/ord och 69 partikelluckor. Källsida och sourceKey kopplar versionerna.
- Separata exam-ID:n, fråge-ID:n, utkast och resultat. Befintlig lagring och synk återanvänds.
- Facit visas efter svar i mobilversionen och efter inlämning i tentaversionen. Käll-PDF och sidbilder publiceras inte. Klientbaserad rättning behålls.
- Ingen tidsgräns eller Firebase-publicering.

## Acceptans

Allt innehåll jämförs med PDF:ens åtta sidor. Testa innehåll/poäng, dolda facit och ljud, återupptagning, separata utkast, Enter/IME, självbedömning och felträning. Kör enhetstester, produktionsbygge samt dator- och mobiltester.

## Resultat

Alla åtta källsidor har granskats visuellt och jämförts med frågeunderlaget. 229 enhetstester och 16 webbläsartester passerar, inklusive gamla tentor och vanlig träning. Produktionsbygget passerar med befintlig varning om Firebase-paketets storlek. Safari kräver uttryckligt fokus på vald svarsknapp; klickhanteraren hanterar det nu.
