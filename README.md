# Kodshim Quest

A top-down, Pokémon-style browser game for learning the basic laws of
korbanos: which animals may be offered, how their age and sex are named, and
the four kinds of korban. Levels 1 and 2 are playable.

Play it at https://jewishai.me/kodshim-quest/

The game began in [kodshim-practice](https://github.com/matt-CMDB/kodshim-practice)
and moved here with its history.

## Run it locally

The game is a static page with no build step. Serve the folder over HTTP:

```
python3 -m http.server 8766
# then open http://localhost:8766/
```

Controls: arrows / WASD walk, Z / Space / Enter talk and confirm, X cancel
(hold to run), Esc opens the menu and the Sefer on any screen. Progress is
saved in `localStorage` under `kodshim.quest.v1`.

## Layout

- `js/content.js`: every fact, lesson and question, with Rambam and Vayikra sources.
- `js/rules.js`: the animal and korban generators that grade answers from those rules.
- `js/sprites.js`, `js/tiles.js`, `js/art.js`: all pixel art, drawn in code.
- `js/maps.js`, `js/engine.js`, `js/battle.js`, `js/sefer.js`, `js/ui.js`: world, dialogue, challenges, the Sefer and the UI frames.
- `js/audio.js`: chiptune music and sound effects, no samples.

## Running an agent over the repo

`tools/agent.mjs` runs a Claude Code agent against this folder from a script, so
the work bills to an API key instead of to a Claude Code plan:

```
cd tools && npm install
export ANTHROPIC_API_KEY=sk-ant-...
node tools/agent.mjs "check js/rules.js against the halachos quoted in js/content.js"
```

Read-only unless you pass `--write`. `AGENT_BUDGET_USD` caps the estimated spend
of a run (default 5) and each run prints what it cost. Nothing in `tools/` is
published: the workflow below copies only `index.html`, `style.css` and `js/`.

## Deploying

Every push to `main` publishes the game through `.github/workflows/pages.yml`.
In the repository settings, Pages must use "GitHub Actions" as its source.
