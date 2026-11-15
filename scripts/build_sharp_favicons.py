"""Build sharp 16/32px light+dark favicons from the client P6 mark."""
from __future__ import annotations

import base64
import io
import os
import struct

from PIL import Image, ImageEnhance, ImageFilter

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(BASE, "public")
SOURCE = os.path.join(
    os.path.dirname(BASE),
    ".cursor",
    "projects",
    "c-Users-personal-Desktop-Perform6-Admin-Portal",
    "assets",
    "faviconp6-9043ffcb-8bf7-493c-b013-cd333bb0297c.png",
)
# Fallback: also accept a copy under project assets if present
ALT_SOURCE = os.path.join(
    BASE,
    "..",
    ".cursor",
    "projects",
    "c-Users-personal-Desktop-Perform6-Admin-Portal",
    "assets",
    "faviconp6-9043ffcb-8bf7-493c-b013-cd333bb0297c.png",
)


def resolve_source() -> str:
    candidates = [
        os.path.join(BASE, "src", "assets", "faviconp6.png"),
        r"C:\Users\personal\.cursor\projects\c-Users-personal-Desktop-Perform6-Admin-Portal\assets\faviconp6-9043ffcb-8bf7-493c-b013-cd333bb0297c.png",
        SOURCE,
    ]
    for path in candidates:
        if os.path.isfile(path):
            return path
    raise FileNotFoundError("favicon source PNG not found")


def remove_white_background(img: Image.Image) -> Image.Image:
    """Knock out solid white canvas; keep blue ring + black mark."""
    src = img.convert("RGBA")
    px = src.load()
    w, h = src.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # Near-white canvas → transparent (ring gaps become see-through)
            if r >= 245 and g >= 245 and b >= 245:
                px[x, y] = (255, 255, 255, 0)
            elif r >= 230 and g >= 230 and b >= 230:
                # Soft edge anti-alias against white
                whiteness = min(r, g, b)
                alpha = int(max(0, min(255, (255 - whiteness) * 8)))
                px[x, y] = (r, g, b, alpha)
    return src


def crop_to_content(img: Image.Image, pad_ratio: float = 0.06) -> Image.Image:
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    size = max(right - left, bottom - top)
    pad = int(size * pad_ratio)
    cx = (left + right) // 2
    cy = (top + bottom) // 2
    half = size // 2 + pad
    box = (
        max(0, cx - half),
        max(0, cy - half),
        min(img.width, cx + half),
        min(img.height, cy + half),
    )
    cropped = img.crop(box)
    # Square canvas
    side = max(cropped.width, cropped.height)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(cropped, ((side - cropped.width) // 2, (side - cropped.height) // 2))
    return canvas


def to_dark_scheme(img: Image.Image) -> Image.Image:
    """Keep blue ring; turn near-black mark white for dark browser chrome."""
    out = img.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            # Blue ring — leave alone
            if b > r + 25 and b > g + 15 and b >= 90:
                continue
            # Dark mark → white
            if r < 90 and g < 90 and b < 90:
                px[x, y] = (255, 255, 255, a)
            elif r < 150 and g < 150 and b < 150 and abs(r - g) < 25 and abs(g - b) < 25:
                t = max(r, g, b) / 150.0
                v = int(200 + 55 * t)
                px[x, y] = (v, v, v, a)
    return out


def resize_sharp(img: Image.Image, size: int) -> Image.Image:
    """Downscale for crisp favicon pixels."""
    # Oversample path: high-quality LANCZOS then light sharpen at tiny sizes
    scaled = img.resize((size, size), Image.Resampling.LANCZOS)
    if size <= 32:
        scaled = scaled.filter(ImageFilter.UnsharpMask(radius=0.6, percent=140, threshold=2))
        # Slight contrast so mark stays readable at 16px
        rgb = scaled.convert("RGBA")
        enhancer = ImageEnhance.Contrast(rgb)
        scaled = enhancer.enhance(1.12)
    return scaled


def write_png(path: str, img: Image.Image) -> None:
    img.save(path, format="PNG", optimize=True)


def write_svg(path: str, img: Image.Image) -> None:
    # Embed 180px master for sharp SVG scaling in supporting browsers
    master = img.resize((180, 180), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    master.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">'
        f'<image width="180" height="180" href="data:image/png;base64,{b64}"/>'
        "</svg>\n"
    )
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)


def write_ico(path: str, images: list[Image.Image]) -> None:
    dirs: list[tuple[int, int, int, int]] = []
    parts: list[bytes] = []
    offset = 6 + 16 * len(images)
    for im in images:
        buf = io.BytesIO()
        im.convert("RGBA").save(buf, format="PNG")
        blob = buf.getvalue()
        w, h = im.size
        dirs.append((0 if w >= 256 else w, 0 if h >= 256 else h, len(blob), offset))
        parts.append(blob)
        offset += len(blob)
    out = io.BytesIO()
    out.write(struct.pack("<HHH", 0, 1, len(images)))
    for w, h, size, off in dirs:
        out.write(struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, size, off))
    for blob in parts:
        out.write(blob)
    with open(path, "wb") as f:
        f.write(out.getvalue())


def main() -> None:
    src_path = resolve_source()
    raw = Image.open(src_path)
    light = crop_to_content(remove_white_background(raw))
    dark = to_dark_scheme(light)

    light16 = resize_sharp(light, 16)
    light32 = resize_sharp(light, 32)
    dark16 = resize_sharp(dark, 16)
    dark32 = resize_sharp(dark, 32)
    light180 = light.resize((180, 180), Image.Resampling.LANCZOS)
    dark180 = dark.resize((180, 180), Image.Resampling.LANCZOS)

    write_png(os.path.join(PUBLIC, "favicon-16x16.png"), light16)
    write_png(os.path.join(PUBLIC, "favicon-32x32.png"), light32)
    write_png(os.path.join(PUBLIC, "favicon-16x16-dark-scheme.png"), dark16)
    write_png(os.path.join(PUBLIC, "favicon-32x32-dark-scheme.png"), dark32)
    write_png(os.path.join(PUBLIC, "apple-touch-icon.png"), light180)

    write_svg(os.path.join(PUBLIC, "favicon-light.svg"), light)
    write_svg(os.path.join(PUBLIC, "favicon-dark.svg"), dark)

    write_ico(
        os.path.join(PUBLIC, "favicon.ico"),
        [light16, light32],
    )
    write_ico(
        os.path.join(PUBLIC, "favicon-dark.ico"),
        [dark16, dark32],
    )

    print(
        "ok",
        "source",
        src_path,
        "light32",
        light32.getpixel((16, 16)),
        "dark32",
        dark32.getpixel((16, 16)),
    )


if __name__ == "__main__":
    main()
