#!/usr/bin/env python3
"""
One-time (re-runnable) processing pipeline for the real Oz Home Energy
photography supplied in assets/original-photography/. Produces the
responsive derivatives actually served from site/img/photos/.

This is a CONTENT pipeline, not a site runtime dependency — the built
website has no Python dependency at all; this script is only run by
whoever next needs to reprocess or add photography, the same way a
designer's export tool isn't part of the shipped product.

Requires: Pillow, pillow-avif-plugin
  pip install pillow pillow-avif-plugin

For each source photo this:
  1. Applies EXIF auto-orientation, then strips ALL metadata (EXIF/GPS/ICC
     comments) — nothing beyond pixel data is carried into the derivatives.
  2. Applies a manual crop where specified (black screenshot borders
     removed; verified against the original in this session before being
     hard-coded here — see docs/asset-manifest.md for the reasoning per
     photo).
  3. Emits AVIF + WebP + JPEG at several widths, plus records the
     full-size (largest) width/height for the <img> width/height
     attributes that prevent layout shift.

Run: python3 scripts/process-photos.py
"""
import os
import json
from PIL import Image, ImageOps

try:
    import pillow_avif  # noqa: F401  (registers AVIF plugin with Pillow)
except ImportError:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_ROOT = os.path.join(ROOT, "assets", "original-photography")
OUT_ROOT = os.path.join(ROOT, "site", "img", "photos")

# (output_slug, source_relative_path, crop_box_or_None, [widths])
# crop_box is (left, top, right, bottom) in ORIGINAL pixel coordinates,
# applied AFTER EXIF auto-orientation. None = no crop needed.
JOBS = [
    # -- Ground-mount solar --
    ("ground-mount-wide", "ground-mount-solar/ground-mount-wide.jpg", None, [640, 1200, 2048]),
    ("ground-mount-close", "ground-mount-solar/ground-mount-close.jpg", None, [480, 800, 1200]),
    # -- Commercial solar --
    ("commercial-array-team", "commercial-solar/commercial-completed-array-with-team.jpg", None, [640, 1200, 1536]),
    ("commercial-lift-team-1", "commercial-solar/commercial-install-team-lift-01.jpg", None, [480, 800, 1536]),
    ("commercial-lift-team-2", "commercial-solar/commercial-install-team-lift-02.jpg", None, [480, 800, 1536]),
    ("commercial-panel-detail", "commercial-solar/commercial-panel-detail.jpg", None, [480, 800, 1536]),
    # -- Rooftop solar (03 and 04 are exact duplicates of 01/02 — dropped, see docs/asset-manifest.md) --
    ("residential-solar-rooftop-1", "rooftop-solar/regional-rooftop-overview-01.jpg", None, [480, 800, 1536]),
    ("residential-solar-rooftop-2", "rooftop-solar/regional-rooftop-overview-02.jpg", None, [480, 800, 1536]),
    # residential-rooftop-solar.jpg: black letterbox bars top/bottom (rows
    # 0-295 and 1240-1535 of 1536) — crop to the real content only.
    ("residential-solar-rooftop-3", "rooftop-solar/residential-rooftop-solar.jpg", (0, 296, 707, 1240), [480, 707]),
    # -- Battery systems --
    # fox-battery-context.jpg: same letterbox pattern (rows 0-295 / 1240-1535 of 1536).
    ("battery-fox-installed", "battery-systems/fox-battery-context.jpg", (0, 296, 707, 1240), [480, 707]),
    ("battery-fox-detail", "battery-systems/fox-battery-detail.jpg", None, [480, 800, 1320]),
    ("battery-sungrow-installed", "battery-systems/sungrow-battery-system.jpg", None, [480, 800, 1152]),
    ("battery-white-unit", "battery-systems/white-battery-system.jpg", None, [480, 800, 1200]),
    # -- EV charging --
    # tesla-wall-connector.jpg: letterbox rows 0-87 / 1448-1535 of 1536.
    ("ev-tesla-wall-connector", "ev-charging/tesla-wall-connector.jpg", (0, 88, 707, 1448), [480, 707]),
    # -- Team --
    ("team-installers", "team/team-at-installation.jpg", None, [480, 571]),
    # -- Vehicle branding --
    # van-wrap-rear-side.png: letterbox rows 0-993 / 1874-2867 of 2868.
    ("fleet-van", "vehicle-branding/van-wrap-rear-side.png", (0, 994, 1320, 1874), [480, 800, 1320]),
    # -- Installation / commissioning process (progress imagery — never
    #    presented as completed work; see docs/asset-manifest.md) --
    ("process-switchboard-open-1", "installation-process/switchboard-work-in-progress-01.jpg", None, [480, 707]),
    # switchboard-work-in-progress-02.jpg: letterbox rows 0-501 / 1034-1535 of 1536.
    ("process-switchboard-open-2", "installation-process/switchboard-work-in-progress-02.jpg", (0, 502, 707, 1034), [480, 707]),
    ("process-commercial-array-lift", "installation-process/commercial-array-from-lift.jpg", None, [480, 800, 1536]),
    ("process-commercial-commissioning-1", "installation-process/commercial-switchboard-commissioning-01.jpg", None, [480, 800, 1536]),
    ("process-commercial-commissioning-2", "installation-process/commercial-switchboard-commissioning-02.jpg", None, [480, 800, 1536]),
    # -- Trust badges (used small, in a restrained trust strip — not hero) --
    ("trust-ohme-badge", "trust-badges/ohme-approved-installer.jpg", None, [320, 480]),
    ("trust-tesla-badge", "trust-badges/tesla-powerwall-certified-installer.png", None, [320, 480]),
]

manifest = {}

os.makedirs(OUT_ROOT, exist_ok=True)

for slug, rel_src, crop, widths in JOBS:
    src_path = os.path.join(SRC_ROOT, rel_src)
    im = Image.open(src_path)
    im = ImageOps.exif_transpose(im)  # honour any real orientation tag
    im = im.convert("RGB") if im.mode not in ("RGB", "RGBA") else im
    if crop:
        im = im.crop(crop)

    full_w, full_h = im.size
    manifest[slug] = {"width": full_w, "height": full_h, "widths": []}

    for w in widths:
        w = min(w, full_w)
        h = round(full_h * (w / full_w))
        resized = im.resize((w, h), Image.LANCZOS)
        base = f"{slug}-{w}"

        jpg_path = os.path.join(OUT_ROOT, base + ".jpg")
        resized.convert("RGB").save(jpg_path, "JPEG", quality=82, optimize=True)

        webp_path = os.path.join(OUT_ROOT, base + ".webp")
        resized.save(webp_path, "WEBP", quality=80, method=6)

        avif_path = os.path.join(OUT_ROOT, base + ".avif")
        try:
            resized.save(avif_path, "AVIF", quality=55)
        except Exception as e:
            print(f"  (skipping AVIF for {base}: {e})")

        manifest[slug]["widths"].append(w)
        print(f"{base}: jpg/webp/avif written ({w}x{h})")

with open(os.path.join(OUT_ROOT, "manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2, sort_keys=True)

print(f"\nDone. {len(JOBS)} source photos processed into {OUT_ROOT}")
print("Dropped (exact duplicates, not processed): rooftop-solar/regional-rooftop-overview-03.jpg (== 01), "
      "regional-rooftop-overview-04.jpg (== 02)")
print("Not used publicly (design mockup sheet, kept only in assets/original-photography): "
      "vehicle-branding/van-wrap-side.jpg")
