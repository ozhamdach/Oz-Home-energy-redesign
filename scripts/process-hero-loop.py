#!/usr/bin/env python3
"""
Turns the approved Higgsfield hero draft (assets/higgsfield/approved/) into
the seamless, silent homepage loop served from site/media/.

CONTENT pipeline, not a runtime dependency (same idea as process-photos.py).

Why a pendulum: the approved draft is a single slow dolly-in that ends
closer than it starts, so it cannot be looped as-is, and a cross-dissolve
between the last and first frame would double every panel edge during the
blend. Instead the clip is played forward and then back along a cosine time
curve: the camera eases to a stop at both ends, the first and last frames
are the same frame, and no pixel is ever invented. Only frames that
Higgsfield produced are used; fractional positions on the curve are a
linear blend of the two neighbouring frames (they differ by well under one
pixel, so there is no visible ghosting).

Requires: ffmpeg/ffprobe on PATH, numpy.
Run:      python3 scripts/process-hero-loop.py [--period 12] [--fps 24]
Outputs:  site/media/hero-loop.webm (VP9) and site/media/hero-loop.mp4 (H.264),
          both 1280x720, no audio track.
"""
import argparse
import math
import os
import subprocess
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "higgsfield", "approved", "hero-d2-source.mp4")
OUT_DIR = os.path.join(ROOT, "site", "media")
W, H = 1280, 720


def read_frames(path):
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H}:flags=lanczos",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, check=True, stdout=subprocess.PIPE).stdout
    size = W * H * 3
    n = len(raw) // size
    return np.frombuffer(raw, dtype=np.uint8)[: n * size].reshape(n, H, W, 3)


def encoder(path, fps, codec):
    base = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
            "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-an"]
    if codec == "webm":
        args = ["-c:v", "libvpx-vp9", "-crf", "35", "-b:v", "0", "-deadline", "good",
                "-cpu-used", "2", "-row-mt", "1", "-g", str(fps * 4), "-pix_fmt", "yuv420p"]
    else:
        args = ["-c:v", "libx264", "-crf", "27", "-preset", "slow", "-profile:v", "high",
                "-g", str(fps * 4), "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
    return subprocess.Popen(base + args + [path], stdin=subprocess.PIPE)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--period", type=float, default=12.0, help="loop length in seconds")
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--src", default=SRC)
    ap.add_argument("--out", default=OUT_DIR)
    a = ap.parse_args()

    frames = read_frames(a.src)
    n = len(frames)
    if n < 10:
        sys.exit(f"only {n} frames decoded from {a.src}")
    total = int(round(a.period * a.fps))
    os.makedirs(a.out, exist_ok=True)
    procs = {c: encoder(os.path.join(a.out, f"hero-loop.{c}"), a.fps, c) for c in ("webm", "mp4")}
    for k in range(total):
        # 0 -> n-1 -> 0 along a cosine, so velocity is zero at both ends
        pos = (n - 1) * (1 - math.cos(2 * math.pi * k / total)) / 2
        i = int(math.floor(pos))
        f = pos - i
        if f < 1e-4 or i >= n - 1:
            out = frames[min(i, n - 1)]
        else:
            out = ((1 - f) * frames[i].astype(np.float32) + f * frames[i + 1].astype(np.float32)).round().astype(np.uint8)
        buf = out.tobytes()
        for p in procs.values():
            p.stdin.write(buf)
    for c, p in procs.items():
        p.stdin.close()
        if p.wait() != 0:
            sys.exit(f"ffmpeg ({c}) failed")
    for c in procs:
        path = os.path.join(a.out, f"hero-loop.{c}")
        print(f"{path}: {os.path.getsize(path) / 1024:.0f} KB, {total} frames @ {a.fps} fps = {total / a.fps:.1f}s from {n} source frames")


if __name__ == "__main__":
    main()
