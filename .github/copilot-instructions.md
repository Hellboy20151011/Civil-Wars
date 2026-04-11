# Projektregeln für GitHub Copilot

## Ziel des Projekts
Dieses Projekt ist ein Browsergame. Die Spiellogik darf nicht vereinfacht oder inhaltlich verändert werden, nur damit der Code leichter aussieht.
Der Code soll jedoch für Anfänger möglichst verständlich, sauber strukturiert und leicht erweiterbar sein.

## Allgemeine Prinzipien
- Schreibe einfachen, gut lesbaren Code.
- Bevorzuge klare Namen statt kurzer oder cleverer Namen.
- Vermeide unnötige Abstraktionen, wenn eine einfache Funktion reicht.
- Halte Funktionen klein und mit genau einer klaren Aufgabe.
- Erkläre komplexe Stellen mit kurzen Kommentaren.
- Keine unnötig komplizierten Design Patterns.
- Keine versteckte Magie.
- Keine großen All-in-one-Dateien.

## Architektur
- Trenne Backend, Datenbanklogik und Frontend sauber.
- Spiellogik darf nicht direkt im HTML liegen.
- SQL-Zugriffe gehören in eigene Module.
- Validierung gehört nicht in die Datenbankabfrage selbst, sondern davor.
- Jede Datei soll möglichst nur eine Verantwortung haben.

## Für Anfänger optimieren
- Verwende einfache Kontrollstrukturen.
- Vermeide zu tiefe Verschachtelungen.
- Nutze sprechende Variablennamen.
- Erkläre neue Funktionen kurz.
- Wenn es zwei Lösungen gibt, nimm die verständlichere.

## JavaScript / Node.js
- Verwende eine konsistente Modulstruktur.
- Exportiere klar benannte Funktionen.
- Trenne Routes, Controller, Services und Datenbankzugriffe.
- Schreibe robuste Fehlerbehandlung mit verständlichen Fehlermeldungen.
- Keine übermäßig kompakte Syntax nur der Kürze wegen.
- Bevorzuge async/await statt unnötig verschachtelter Promises.
- Kommentiere Codeblöcke im Code damit es verständlicher wird

## PostgreSQL
- Schreibe lesbare SQL-Queries.
- Verwende klare Tabellennamen und Spaltennamen.
- Vermeide unnötig komplexe Queries, wenn zwei einfache verständlicher sind.
- Denke an Constraints, Foreign Keys und sinnvolle Defaults.
- Erkläre bei Migrationen kurz, was geändert wird.

## HTML / CSS
- Halte HTML semantisch und einfach.
- Trenne Struktur (HTML), Darstellung (CSS) und Verhalten (JavaScript).
- Vermeide Inline-Styles.
- CSS soll nachvollziehbar und sauber gruppiert sein.
- Bevorzuge einfache Klassenstrukturen statt unnötig komplexer Selektoren.

## Antwortstil von Copilot
Wenn du Code erzeugst:
- gib vollständige, direkt nutzbare Dateien aus
- erkläre kurz die Ordnerstruktur
- nenne bei Änderungen auch, welche Datei neu ist und welche geändert wurde
- schlage keine unnötigen Frameworks vor
- bleibe kompatibel mit dem bestehenden Projekt

## Wichtige Spielregel
Die Spielmechanik darf nicht vereinfacht oder abgeschwächt werden, nur um den Code einfacher zu machen.
Die Vereinfachung betrifft ausschließlich Lesbarkeit, Struktur und Wartbarkeit des Codes.
