#!/usr/bin/env python3
"""
Generate valid PWA PNG icons using Python's standard library (struct + zlib).
Creates:
- public/pwa-192x192.png (192x192)
- public/pwa-512x512.png (512x512)
- public/pwa-maskable-512x512.png (512x512, padded safe-zone)
- public/apple-touch-icon.png (180x180)
- public/favicon.ico (48x48)
"""

import os
import struct
import zlib
import math

def create_png(width, height, get_pixel):
    """Generates valid uncompressed/compressed 32-bit RGBA PNG data."""
    raw_scanlines = bytearray()
    for y in range(height):
        raw_scanlines.append(0)  # filter type 0: None
        for x in range(width):
            r, g, b, a = get_pixel(x, y, width, height)
            raw_scanlines.extend((int(r) & 0xFF, int(g) & 0xFF, int(b) & 0xFF, int(a) & 0xFF))

    compressed = zlib.compress(bytes(raw_scanlines), 9)

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return c + struct.pack('>I', crc)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)) # 8-bit RGBA
    idat = chunk(b'IDAT', compressed)
    iend = chunk(b'IEND', b'')

    return header + ihdr + idat + iend

def lerp(c1, c2, t):
    return (
        c1[0] + (c2[0] - c1[0]) * t,
        c1[1] + (c2[1] - c1[1]) * t,
        c1[2] + (c2[2] - c1[2]) * t,
    )

def is_inside_rounded_rect(x, y, w, h, r):
    # Normalized coords from center
    cx, cy = w / 2, h / 2
    dx = abs(x - cx) - (cx - r)
    dy = abs(y - cy) - (cy - r)
    if dx <= 0 or dy <= 0:
        return True
    return (dx * dx + dy * dy) <= (r * r)

def render_javed_icon(is_maskable=False):
    def pixel(x, y, w, h):
        # 1. Background gradient
        t = (x + y) / (w + h)
        # Deep royal blue to dark navy
        bg_col = lerp((30, 58, 138), (15, 23, 42), t)

        if not is_maskable:
            # Rounded squircle border
            radius = w * 0.22
            if not is_inside_rounded_rect(x, y, w, h, radius):
                return (0, 0, 0, 0) # transparent outside squircle

        # 2. Main content scaling
        cx, cy = w / 2, h / 2
        scale = 0.72 if is_maskable else 0.85
        nx = (x - cx) / (cx * scale)
        ny = (y - cy) / (cy * scale)

        # Ambient ring
        dist = math.sqrt(nx * nx + ny * ny)
        if 0.72 <= dist <= 0.77:
            return (96, 165, 250, 180) # light blue glow ring

        # 3. Stylized 'J' Lettermark:
        # Vertical spine at nx between -0.15 and 0.05, ny between -0.55 and 0.15
        is_j_stem = (-0.14 <= nx <= 0.06) and (-0.55 <= ny <= 0.18)
        # J bottom loop
        is_j_curve = False
        if ny > 0.18:
            j_cx, j_cy = -0.10, 0.18
            j_dist = math.sqrt((nx - j_cx) ** 2 + (ny - j_cy) ** 2)
            if 0.15 <= j_dist <= 0.35 and nx <= 0.06:
                is_j_curve = True

        # J top crossbar
        is_j_bar = (-0.30 <= nx <= 0.06) and (-0.55 <= ny <= -0.42)

        # 4. Lightning Bolt glyph:
        # Polygons for electronics lightning bolt in vibrant gold (#fbbf24)
        is_bolt = False
        # Upper diagonal: (0.1, -0.6) to (-0.1, 0.0)
        # Lower diagonal: (-0.15, 0.0) to (0.25, 0.6)
        if (-0.2 <= nx <= 0.45) and (-0.6 <= ny <= 0.6):
            # Check triangular bolt facets
            # Upper triangle
            if (nx > 0.05 and ny < 0.02 and (nx - 0.28 * ny) <= 0.42 and (nx + 0.35 * ny) >= 0.0):
                is_bolt = True
            # Center connect
            elif (-0.1 <= nx <= 0.32 and -0.05 <= ny <= 0.08):
                is_bolt = True
            # Lower strike
            elif (nx < 0.35 and ny > 0.0 and (nx - 0.32 * ny) >= -0.08 and (nx + 0.4 * ny) <= 0.55):
                is_bolt = True

        if is_bolt:
            # Gold gradient
            bolt_t = (ny + 0.6) / 1.2
            b_col = lerp((251, 191, 36), (245, 158, 11), bolt_t)
            return (b_col[0], b_col[1], b_col[2], 255)

        if is_j_stem or is_j_curve or is_j_bar:
            return (255, 255, 255, 255)

        # Return background
        return (bg_col[0], bg_col[1], bg_col[2], 255)

    return pixel

def main():
    os.makedirs('public', exist_ok=True)
    print("Generating PWA icons...")

    # 1. pwa-192x192.png
    p192 = create_png(192, 192, render_javed_icon(is_maskable=False))
    with open('public/pwa-192x192.png', 'wb') as f:
        f.write(p192)
    print(" -> public/pwa-192x192.png (192x192)")

    # 2. pwa-512x512.png
    p512 = create_png(512, 512, render_javed_icon(is_maskable=False))
    with open('public/pwa-512x512.png', 'wb') as f:
        f.write(p512)
    print(" -> public/pwa-512x512.png (512x512)")

    # 3. pwa-maskable-512x512.png (Padded safe zone for Android)
    p_mask = create_png(512, 512, render_javed_icon(is_maskable=True))
    with open('public/pwa-maskable-512x512.png', 'wb') as f:
        f.write(p_mask)
    print(" -> public/pwa-maskable-512x512.png (512x512 maskable)")

    # 4. apple-touch-icon.png (180x180)
    p_apple = create_png(180, 180, render_javed_icon(is_maskable=False))
    with open('public/apple-touch-icon.png', 'wb') as f:
        f.write(p_apple)
    print(" -> public/apple-touch-icon.png (180x180)")

    # 5. favicon.ico / favicon (48x48)
    p_fav = create_png(48, 48, render_javed_icon(is_maskable=False))
    with open('public/favicon.ico', 'wb') as f:
        f.write(p_fav)
    print(" -> public/favicon.ico (48x48)")

    print("All PWA icons generated successfully!")

if __name__ == '__main__':
    main()
