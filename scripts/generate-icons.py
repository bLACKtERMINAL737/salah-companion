"""Generates the Salah Companion app icons from the same 8-point star motif
used throughout the UI (lib/star-path.ts), so the installed app icon
actually matches the in-app brand mark instead of being a generic
placeholder. Colors are pulled straight from app/globals.css's dark-theme
tokens: emerald-700 -> emerald-900 gradient background, gold-400 star.
No external image assets needed — everything is drawn with Pillow.
"""

import math
from PIL import Image, ImageDraw

EMERALD_700 = (15, 92, 63)
EMERALD_900 = (10, 51, 39)
GOLD_400 = (218, 184, 106)
GOLD_700 = (154, 123, 46)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def diagonal_gradient(size):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            px[x, y] = lerp(EMERALD_700, EMERALD_900, t)
    return img


def star_points(cx, cy, r_outer, r_inner, rotation_deg=0.0):
    pts = []
    for i in range(16):
        angle = math.radians(-90 + i * 22.5 + rotation_deg)
        r = r_outer if i % 2 == 0 else r_inner
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    return pts


def make_icon(size, maskable=False):
    img = diagonal_gradient(size)
    draw = ImageDraw.Draw(img, "RGBA")

    cx = cy = size / 2
    # Maskable icons need extra safe-zone padding (content within the
    # inner ~80% circle) since platforms may crop to a circle/squircle.
    scale = 0.30 if maskable else 0.40
    r_outer = size * scale
    r_inner = r_outer * (20 / 46)

    # Soft ring for depth
    ring_w = max(2, size // 64)
    draw.ellipse(
        [cx - r_outer * 1.32, cy - r_outer * 1.32, cx + r_outer * 1.32, cy + r_outer * 1.32],
        outline=GOLD_700 + (110,),
        width=ring_w,
    )

    draw.polygon(star_points(cx, cy, r_outer, r_inner), fill=GOLD_400)
    # Small inner dot, echoing the compass-center dot used in the Qibla UI
    dot_r = size * 0.018
    draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=EMERALD_900 + (255,))

    return img


def make_maskable_background(size):
    """Maskable variant: fills edge-to-edge (no rounded corners baked in —
    the OS applies its own mask shape) per the PWA maskable-icon spec."""
    return make_icon(size, maskable=True)


if __name__ == "__main__":
    import os

    out_dir = "public/icons"
    os.makedirs(out_dir, exist_ok=True)

    make_icon(192).save(f"{out_dir}/icon-192.png")
    make_icon(512).save(f"{out_dir}/icon-512.png")
    make_maskable_background(512).save(f"{out_dir}/icon-512-maskable.png")
    # Apple touch icon: no transparency, slightly larger mark (iOS applies
    # its own rounded-square mask, so no padding trick needed here).
    make_icon(180).convert("RGB").save(f"{out_dir}/apple-touch-icon.png")
    # Favicon-sized fallback for browser tabs.
    make_icon(32).convert("RGB").save(f"{out_dir}/favicon-32.png")

    print("Generated:", os.listdir(out_dir))
