# What If — Stick-Figure Animated Episodes

Dusk-lit stick-figure "What If" episodes (the format that broke out on YouTube in Oct 2026),
every frame hand-written SVG rendered by Remotion, voice + sound from ElevenLabs.

## Episodes

| Episode | Title | Length | Credits |
|---|---|---|---|
| `pause` | What if you could pause everyone but you? | 86.6 s | 1323 |
| `shower` | ماذا لو كان لدشك نشرة طقس؟ (Arabic) | 32.9 s | 396 |
| `showeren` | What if your shower had a weather forecast? | 32.6 s | 514 |
| `rewind` / `copy-paste` / `shelter` | reference episodes shipped with the skill | — | — |

Character: fingerless mitten rig (Pip, Mo, his sister, mum, the man in the suit).

## Run it

```bash
npm install
cp -r <this-repo>/skills/what-if-animation/scripts <skill>/scripts   # or point at skills/
# add an ElevenLabs API key as ELEVENLABS_API_KEY (env var or .env above the studio)
python <skill>/scripts/voice.py <slug>      # voice + word timings
python <skill>/scripts/plan.py <slug>       # edit timeline
node <skill>/scripts/stills.mjs <slug>      # storyboard stills
python <skill>/scripts/board.py <slug>      # storyboard sheet
python <skill>/scripts/sfx.py <slug>        # sound stems
python <skill>/scripts/master.py <slug>     # render + master to -14 LUFS
```

The full pipeline, formula, and checklists live in [`skills/what-if-animation/SKILL.md`](skills/what-if-animation/SKILL.md).

## Layout

- `src/episodes/<slug>/` — `episode.json` (script/science/shots/edit/sound), `shots.tsx`, `index.tsx`
- `src/engine/` — rig, room kit, sets, UI, fonts
- `library/sfx/` — cached sound clips shared by every episode
- `out/<slug>/` — storyboards, finals, reports (board stills are regenerable, gitignored)
- `skills/what-if-animation/` — the workflow skill (pipeline + references + scripts)

## Notes

- The `.env` ElevenLabs key is never committed (gitignored).
- `node_modules/` is never committed — `npm install` recreates it.
- Board captions in `storyboard.jpg` are PIL-drawn (Arabic shows as tofu there); the stills themselves in `out/<slug>/board/` render correctly.
