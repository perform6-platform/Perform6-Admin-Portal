"""Build favicon.svg with prefers-color-scheme for Safari / macOS."""
from __future__ import annotations

import base64
import io
import os

from PIL import Image

PUBLIC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")


def b64_png(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.convert("RGBA").save(buf, format="PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def main() -> None:
    raise SystemExit(
        "public/favicon.svg is vector path art from the EPS. "
        "This script embeds a PNG and must not replace it."
    )
    light = Image.open(os.path.join(PUBLIC, "apple-touch-icon.png")).convert("RGBA")
    dark = (
        Image.open(os.path.join(PUBLIC, "favicon-32x32-dark-scheme.png"))
        .convert("RGBA")
        .resize((180, 180), Image.Resampling.LANCZOS)
    )
    if light.size != (180, 180):
        light = light.resize((180, 180), Image.Resampling.LANCZOS)

    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">\n'
        "  <style>\n"
        "    .dark { display: none }\n"
        "    @media (prefers-color-scheme: dark) {\n"
        "      .light { display: none }\n"
        "      .dark { display: block }\n"
        "    }\n"
        "  </style>\n"
        f'  <image class="light" width="180" height="180" href="data:image/png;base64,{b64_png(light)}"/>\n'
        f'  <image class="dark" width="180" height="180" href="data:image/png;base64,{b64_png(dark)}"/>\n'
        "</svg>\n"
    )
    path = os.path.join(PUBLIC, "favicon.svg")
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)
    print("ok", path, len(svg))


if __name__ == "__main__":
    main()
