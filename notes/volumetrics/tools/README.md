# Rendering the video without capturing the screen

Screen capture of the presentation came out laggy, so the video is rendered instead: the narration is recorded and cut first, the time of each press is worked out from it, and the page draws every frame at an exact 60 fps into a file. Nothing is captured live, so a slow machine only makes the render take longer.

Three steps, each a script in this folder:

1. `transcribe.py`: the recording → the words with the time each is said (`words.json`).
2. `align.mjs`: those words against `../script.md`'s press markers (`[42b]`) → when each beat is pressed (`timeline.json`).
3. `render.mjs`: the timeline → the video (`.mp4`, 1920 × 1080, 60 fps, no sound unless `--audio` is given).

Then the video goes under the narration in an editor; both start at 0, so they are in sync.

## Setting up (once)

Needs Node 18 or later, Python 3.9 or later, and `ffmpeg` on the PATH.

```sh
cd notes/volumetrics/tools
npm install
npx playwright install chromium
pip install faster-whisper        # in a virtual environment, if you like
```

## A test of the first two minutes

```sh
mkdir -p out
python transcribe.py /path/to/voice.wav out/words.json --until 120
node align.mjs --transcript out/words.json --out out/timeline.json
node render.mjs --timeline out/timeline.json --out out/test.mp4 --to 120 --audio /path/to/voice.wav
```

`render.mjs` prints a `graphics:` line when it starts. It should name the machine's graphics card. If it says SwiftShader or llvmpipe, the browser is drawing in software, and the 3D cloud at the start will take a very long time: try `--chrome` (the installed Google Chrome), and without `--headless`.

## Tuning the timing by hand

`timeline.json` is a list of beats, one per line, in the order they are pressed:

```json
{"n":"15g","t":95.08,"name":"most importantly","said":"And most importantly, I want you to see …","check":false}
```

- `t` is when the beat is pressed, in seconds from the start of the recording. Change it to move the press; only `n` and `t` are read by the renderer.
- `said` is what the script says from that press on, and `name` is the beat's name: both only to find your way.
- `"check": true` marks a beat that was placed by guess (its words weren't found where the script has them, or it has no words of its own, or the script has no marker for it): look at these first.
- A beat shows until the next one's `t`, so to hold a picture longer, make the next beat's `t` later.
- The first beat always shows from 0.

Render only the stretch you changed, with the sound on it to check: `node render.mjs --timeline out/timeline.json --out out/part.mp4 --from 60 --to 90 --audio /path/to/voice.wav`. The frames before `--from` are still stepped (not saved), so the stretch starts in the right state.

Re-running `align.mjs` overwrites the timeline, hand changes included: write to another file (`--out`) once you have started tuning.

## The whole video

```sh
python transcribe.py /path/to/voice.wav out/words-all.json
node align.mjs --transcript out/words-all.json --out out/timeline-all.json
node render.mjs --timeline out/timeline-all.json --out out/video.mp4
```

Where the narration leaves the script, the matching guesses; `align.mjs` prints how many of the script's words it found and which beats to check.

## A prompt for an agent on the PC that renders

Paste this, with the path of the recording filled in:

> You're helping me render a video on this PC. Work in the `tools` folder that sits next to `volumetrics-video.html` (in the repository `erfan-ahmadi.github.io` it is `notes/volumetrics/tools`, on the branch `claude/focused-pascal-fwqrnp`), and read its `README.md` first.
>
> Goal: a 1920 × 1080, 60 fps video of the first 2 minutes of my presentation, in sync with my narration at `<PATH TO THE RECORDING>`.
>
> 1. Check that Node 18+, Python 3.9+ and `ffmpeg` are there. If something is missing, tell me what and how you'd install it, and wait for my OK.
> 2. In the `tools` folder: `npm install`, `npx playwright install chromium`, and `pip install faster-whisper` in a virtual environment.
> 3. `python transcribe.py <recording> out/words.json --until 120`
> 4. `node align.mjs --transcript out/words.json --out out/timeline.json`, and show me what it prints, and the beats marked `"check": true`.
> 5. `node render.mjs --timeline out/timeline.json --out out/test.mp4 --to 120 --audio <recording>`. Tell me its `graphics:` line and its frames per second. If the graphics line says SwiftShader or llvmpipe, stop the render, try again with `--chrome`, and tell me.
> 6. Tell me where `out/test.mp4` is.
>
> Don't change `volumetrics-video.html`, `script.md` or anything under `src/`, and don't commit or push. If a script fails, show me the error and what you think is wrong before changing it.
