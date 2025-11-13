# Stapelspiel — Pistol Tetris

Ein einfacher Tetris-Klon, bei dem statt normaler Blöcke Pistolen als Sprite verwendet werden. Die Seite ist als statische Web-App aufgebaut und kann per GitHub Pages veröffentlicht werden.

Wie benutzen

- Öffne `index.html` im Browser (oder aktiviere GitHub Pages für dieses Repo).
- Steuerung: ← → ↓ (Bewegen), ↑ (Rotieren), Leertaste (Hard Drop)

Automatische Veröffentlichung

Eine GitHub Actions Workflow-Datei (`.github/workflows/deploy.yml`) ist im Repo enthalten und pusht die statischen Dateien zu `gh-pages`, wenn auf `main` gepusht wird. Aktivieren Sie GitHub Pages in den Repository-Einstellungen (Quelle: Branch `gh-pages`).
