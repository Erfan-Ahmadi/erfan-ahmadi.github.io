#!/usr/bin/env python3
"""Writes the words of a recording with the time each is said, for align.mjs.

    pip install faster-whisper
    python transcribe.py voice.wav words.json [--model small.en] [--until 120]

--model   a Whisper model: small.en is quick; medium.en is slower and gets more words right
--until   only the first so many seconds (for a test)
"""
import argparse
import json

from faster_whisper import WhisperModel

ap = argparse.ArgumentParser()
ap.add_argument("audio")
ap.add_argument("out")
ap.add_argument("--model", default="small.en")
ap.add_argument("--until", type=float, default=None)
a = ap.parse_args()

model = WhisperModel(a.model, device="auto", compute_type="auto")
kw = dict(word_timestamps=True, vad_filter=False, condition_on_previous_text=False)
if a.until:
    kw["clip_timestamps"] = [0.0, a.until]
segments, info = model.transcribe(a.audio, **kw)
words = []
for s in segments:
    for w in s.words or []:
        words.append({"word": w.word, "start": round(w.start, 3), "end": round(w.end, 3)})
    print(f"\r{s.end:8.1f} s", end="", flush=True)
json.dump({"audio": a.audio, "language": info.language, "words": words}, open(a.out, "w"), ensure_ascii=False, indent=0)
print(f"\n{len(words)} words, to {words[-1]['end'] if words else 0:.1f} s -> {a.out}")
