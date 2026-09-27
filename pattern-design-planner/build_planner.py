#!/usr/bin/env python3
"""
Pattern Design Planner — interior design system (B5 portrait, Wire-O).

Single source of truth for the six sample interior pages. Every page element is
defined once here and emitted to:

  1. PatternDesignPlanner_Interior.jsx  — InDesign ExtendScript that builds a
     fully editable, layered InDesign document (swatches, paragraph styles,
     object styles, parent pages, native table, live text, vector rules).
  2. preview/*.svg + PatternDesignPlanner_Interior_Preview.pdf — vector preview
     rendered from the same geometry (text stays live text in the PDF).

All geometry is in millimetres, page-relative (0,0 = top-left of trim).
Vertical positions snap to a 3.5 mm baseline grid (writing lines every 7 mm).

Usage:  python3 build_planner.py
"""

import json
import os
import shutil
import subprocess
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PT = 0.352778  # mm per point

# ---------------------------------------------------------------------------
# FORMAT & GRID
# ---------------------------------------------------------------------------
PAGE_W, PAGE_H = 176.0, 250.0          # B5 (ISO) trim
BLEED = 3.0
M_TOP, M_BOTTOM, M_INSIDE, M_OUTSIDE = 18.0, 22.0, 22.0, 16.0
COLUMNS, GUTTER = 6, 4.0
UNIT = 3.5                              # baseline grid increment
LINE_PITCH = 2                          # writing lines every 2 units = 7 mm
INSET = 4.0                             # inner padding of boxes / panels


def Y(r):
    """Baseline-grid row -> y (mm)."""
    return M_TOP + r * UNIT


def live(side):
    """Live-area x range for a left (verso) or right (recto) page."""
    return (M_OUTSIDE, PAGE_W - M_INSIDE) if side == "L" else (M_INSIDE, PAGE_W - M_OUTSIDE)


# ---------------------------------------------------------------------------
# COLOUR — CMYK for print, HEX for preview
# ---------------------------------------------------------------------------
COLORS = {
    "PDP Warm White": ([0, 1, 4, 1], "#FAF7F0"),
    "PDP Cream":      ([2, 4, 12, 0], "#F3EDDF"),
    "PDP Mist":       ([9, 4, 3, 2], "#E5EAED"),
    "PDP Line":       ([22, 10, 8, 5], "#C3CCD2"),
    "PDP Frame":      ([35, 18, 13, 8], "#A7B4BD"),
    "PDP Blue-Grey":  ([55, 32, 24, 18], "#6E8391"),
    "PDP Slate":      ([70, 48, 38, 38], "#3E4E5A"),
    "PDP Gold":       ([18, 28, 58, 12], "#B69D6C"),
}

# ---------------------------------------------------------------------------
# TYPE — paragraph styles
# family key: serif / serif-italic / sans ; weight used for fallback + preview
# ---------------------------------------------------------------------------
FONTS = {
    "serif":        {"family": "Cormorant Garamond", "fallback": "Minion Pro", "css": "PDP Serif", "italic": False},
    "serif-italic": {"family": "Cormorant Garamond", "fallback": "Minion Pro", "css": "PDP Serif Italic", "italic": True},
    "sans":         {"family": "Jost", "fallback": "Myriad Pro", "css": "PDP Sans", "italic": False},
}

PSTYLES = {
    # name: font, style, size(pt), leading(pt), tracking, color, caps, align
    "Divider Title":      dict(font="serif", style="Regular", weight=400, size=46, leading=50, tracking=380, color="PDP Warm White", caps=True, align="left"),
    "Divider Subtitle":   dict(font="serif-italic", style="Italic", weight=400, size=15, leading=20, tracking=10, color="PDP Slate", caps=False, align="left"),
    "Running Head":       dict(font="sans", style="Medium", weight=500, size=6, leading=8, tracking=420, color="PDP Blue-Grey", caps=True, align="left"),
    "Running Head Right": dict(font="sans", style="Medium", weight=500, size=6, leading=8, tracking=420, color="PDP Blue-Grey", caps=True, align="right"),
    "Page Title":         dict(font="serif", style="Medium", weight=500, size=26, leading=30, tracking=0, color="PDP Slate", caps=False, align="left"),
    "Page Subtitle":      dict(font="serif-italic", style="Italic", weight=400, size=12.5, leading=16, tracking=10, color="PDP Blue-Grey", caps=False, align="left"),
    "Page Subtitle Right": dict(font="serif-italic", style="Italic", weight=400, size=12.5, leading=16, tracking=10, color="PDP Blue-Grey", caps=False, align="right"),
    "Field Label":        dict(font="sans", style="Medium", weight=500, size=6.5, leading=9, tracking=180, color="PDP Slate", caps=True, align="left"),
    "Option Label":       dict(font="sans", style="Regular", weight=400, size=7.5, leading=10, tracking=30, color="PDP Slate", caps=False, align="left"),
    "Table Head":         dict(font="sans", style="Medium", weight=500, size=6, leading=8, tracking=180, color="PDP Slate", caps=True, align="left"),
    "Table Head Center":  dict(font="sans", style="Medium", weight=500, size=6, leading=8, tracking=180, color="PDP Slate", caps=True, align="center"),
    "Table Number":       dict(font="serif", style="Medium", weight=500, size=13, leading=14, tracking=0, color="PDP Blue-Grey", caps=False, align="center"),
    "Entry":              dict(font="sans", style="Light", weight=300, size=9, leading=7 / PT, tracking=0, color="PDP Slate", caps=False, align="left"),
}

# ---------------------------------------------------------------------------
# OBJECT STYLES — fill, stroke, weight(pt), dash
# ---------------------------------------------------------------------------
OSTYLES = {
    "PDP Background":   dict(fill="PDP Warm White", stroke=None, weight=0),
    "PDP Block":        dict(fill="PDP Blue-Grey", stroke=None, weight=0),
    "PDP Section Tab":  dict(fill="PDP Blue-Grey", stroke=None, weight=0),
    "PDP Panel Cream":  dict(fill="PDP Cream", stroke=None, weight=0),
    "PDP Panel Mist":   dict(fill="PDP Mist", stroke=None, weight=0),
    "PDP Box":          dict(fill=None, stroke="PDP Frame", weight=0.5),
    "PDP Checkbox":     dict(fill=None, stroke="PDP Blue-Grey", weight=0.5),
    "PDP Writing Rule": dict(fill=None, stroke="PDP Line", weight=0.35),
    "PDP Stitch Rule":  dict(fill=None, stroke="PDP Frame", weight=0.5, dash=[4.5, 3.4]),
    "PDP Gold Rule":    dict(fill=None, stroke="PDP Gold", weight=0.6),
    "PDP Gold Mark":    dict(fill=None, stroke="PDP Gold", weight=0.6),
    "PDP Scale Tick":   dict(fill=None, stroke="PDP Frame", weight=0.35),
    "PDP Dot":          dict(fill="PDP Frame", stroke=None, weight=0),
    "PDP Text Frame":   dict(fill=None, stroke=None, weight=0),
}

LAYERS = ["Background", "Colour Blocks", "Rules & Frames", "Decorative", "Labels & Type", "Fill-in Text"]

# ---------------------------------------------------------------------------
# ITEM BUILDERS
# ---------------------------------------------------------------------------
ITEMS = []


def _add(page, kind, layer, name, **kw):
    ITEMS.append(dict(page=page, kind=kind, layer=layer, name=name, **kw))


def rect(page, x, y, w, h, style, layer, name):
    _add(page, "rect", layer, name, x=x, y=y, w=w, h=h, style=style)


def line(page, x1, y1, x2, y2, style, layer, name):
    _add(page, "path", layer, name, pts=[[x1, y1], [x2, y2]], style=style)


def path(page, pts, style, layer, name):
    _add(page, "path", layer, name, pts=pts, style=style)


def text(page, x, base, w, content, pstyle, name, layer="Labels & Type"):
    s = PSTYLES[pstyle]
    size_mm = s["size"] * PT
    off = round(size_mm * 1.0, 3)                     # fixed first-baseline offset
    h = round(off + size_mm * 0.6 + 1.5, 3)
    _add(page, "text", layer, name, x=x, base=base, w=w, off=off, h=h, text=content, style=pstyle)


def rules(page, x, w, rows, name, style="PDP Writing Rule", lead_gold=False):
    """A block of writing rules on grid rows, grouped in InDesign."""
    _add(page, "rules", "Rules & Frames", name, x=x, w=w, ys=[Y(r) for r in rows], style=style)
    if lead_gold:
        _add(page, "rules", "Decorative", name + " — Gold Leads", x=x, w=3.0, ys=[Y(r) for r in rows], style="PDP Gold Rule")
    # empty fill-in frame aligned to the rules (for typing / digital use)
    ys = [Y(r) for r in rows]
    pitch = ys[1] - ys[0] if len(ys) > 1 else 7.0
    _add(page, "entry", "Fill-in Text", name + " — Fill-in", x=x + (4.5 if lead_gold else 0.5), w=w - (5 if lead_gold else 1),
         top=ys[0] - 6.0, off=4.8, bottom=ys[-1] + 1.0, pitch=pitch)


def corner(page, x, y, name, dx=1, dy=1, arm=3.0):
    """Gold L corner mark — the planner's corner treatment."""
    path(page, [[x, y + dy * arm], [x, y], [x + dx * arm, y]], "PDP Gold Mark", "Decorative", name)


def checkbox(page, x, base, label, name):
    rect(page, x, base - 2.5, 2.8, 2.8, "PDP Checkbox", "Rules & Frames", name + " — Box")
    if label:
        text(page, x + 4.4, base, 22, label, "Option Label", name + " — Label")


def dotgrid(page, x, y, cols, rows_, step, name, d=0.55):
    _add(page, "dots", "Decorative", name, x=x, y=y, cols=cols, rows=rows_, step=step, d=d, style="PDP Dot")


def field(page, x, w, r, label, name):
    """Label + single writing rule (3 units below label baseline)."""
    text(page, x, Y(r), w, label, "Field Label", name + " — Label")
    rules(page, x, w, [r + 3], name)


def craft(page, x, r, name):
    text(page, x, Y(r), 38, "Craft", "Field Label", name + " — Label")
    base = Y(r + 3) - 1.2
    checkbox(page, x, base, "Knitting", name + " / Knitting")
    checkbox(page, x + 21, base, "Crochet", name + " / Crochet")


def panel(page, x, y1, y2, w, style, label, name, lbl_row):
    rect(page, x, y1, w, y2 - y1, style, "Colour Blocks" if style.startswith("PDP Panel") else "Rules & Frames", name + " — Panel")
    corner(page, x, y1, name + " — Corner")
    text(page, x + INSET, Y(lbl_row), w - 2 * INSET, label, "Field Label", name + " — Label")


# ---------------------------------------------------------------------------
# PARENT PAGES
# ---------------------------------------------------------------------------
def parent_working():
    for side, key in (("L", "A-L"), ("R", "A-R")):
        x0, x1 = live(side)
        bx0, bx1 = (-BLEED, PAGE_W) if side == "L" else (0, PAGE_W + BLEED)
        rect(key, bx0, -BLEED, bx1 - bx0, PAGE_H + 2 * BLEED, "PDP Background", "Background", "Paper — Warm White")
        tx = -BLEED if side == "L" else PAGE_W - 5.0
        rect(key, tx, Y(0), 5.0 + BLEED, Y(9) - Y(0), "PDP Section Tab", "Colour Blocks", "Section Tab — Design")
        if side == "L":
            text(key, x0, Y(1), 60, "Design", "Running Head", "Running Head")
            line(key, x0, Y(6), x0 + 12, Y(6), "PDP Gold Rule", "Decorative", "Header Rule — Gold")
            line(key, x0 + 14.5, Y(6), x1, Y(6), "PDP Stitch Rule", "Rules & Frames", "Header Rule — Stitch")
        else:
            text(key, x1 - 60, Y(1), 60, "Design", "Running Head Right", "Running Head")
            line(key, x0, Y(6), x1, Y(6), "PDP Stitch Rule", "Rules & Frames", "Header Rule — Stitch")


def parent_divider():
    rect("B-R", 0, -BLEED, PAGE_W + BLEED, PAGE_H + 2 * BLEED, "PDP Background", "Background", "Paper — Warm White")


# ---------------------------------------------------------------------------
# PAGE 1 — DESIGN DIVIDER (recto)
# ---------------------------------------------------------------------------
def page1():
    p = 1
    x0, x1 = live("R")
    rect(p, 0, -BLEED, PAGE_W + BLEED, Y(38) + BLEED, "PDP Block", "Colour Blocks", "Divider Block — Blue-Grey")
    # stitch column: a vertical run of knit-stitch "V"s leading into the title
    for i in range(6):
        cy = Y(20) + i * 3.2
        path(p, [[x0, cy], [x0 + 1.5, cy + 1.7], [x0 + 3.0, cy]], "PDP Gold Mark", "Decorative", f"Stitch Column — V{i + 1}")
    text(p, x0 - 0.8, Y(31), x1 - x0 + 10, "Design", "Divider Title", "Divider Title")
    line(p, x0, Y(34), x0 + 26, Y(34), "PDP Gold Rule", "Decorative", "Divider Rule — Gold")
    text(p, x0, Y(42), x1 - x0, "From first thought to finished pattern.", "Divider Subtitle", "Divider Subtitle")
    corner(p, x1, Y(60), "Construction Mark", dx=-1, dy=-1, arm=3.0)


# ---------------------------------------------------------------------------
# PAGES 2–3 — IDEA BANK SPREAD
# ---------------------------------------------------------------------------
def page2():
    p = 2
    x0, x1 = live("L")
    W = x1 - x0
    text(p, x0, Y(4), 90, "Idea Bank", "Page Title", "Page Title")
    text(p, x1 - 60, Y(4), 60, "Idea Capture", "Page Subtitle Right", "Page Subtitle")
    field(p, x0, W, 8, "Working Pattern Name / Idea", "Working Pattern Name / Idea")
    craft(p, x0, 13, "Craft")
    field(p, x0 + 42, 50, 13, "Design Type", "Design Type")
    field(p, x0 + 96, W - 96, 13, "Season / Timing", "Season / Timing")
    text(p, x0, Y(19), W, "The Idea", "Field Label", "The Idea — Label")
    rules(p, x0, W, range(22, 37, LINE_PITCH), "The Idea")
    # Inspiration — open cream panel with a dot grid: room for words, swatches, sketches
    panel(p, x0, Y(38), Y(60), W, "PDP Panel Cream", "Inspiration", "Inspiration", 40)
    dotgrid(p, x0 + INSET, Y(42.5), 27, 12, 5.0, "Inspiration — Dot Grid")
    _add(p, "entry", "Fill-in Text", "Inspiration — Fill-in", x=x0 + INSET, w=W - 2 * INSET,
         top=Y(41.5), off=4.8, bottom=Y(60) - 3, pitch=7.0)


def page3():
    p = 3
    x0, x1 = live("R")
    W = x1 - x0
    text(p, x0, Y(4), 60, "Early Thoughts", "Page Subtitle", "Page Subtitle")
    # top row: two boxes of different proportion
    wa = 56.0
    wb = W - wa - GUTTER
    for bx, bw, lbl in ((x0, wa, "Yarn / Fibre Thoughts"), (x0 + wa + GUTTER, wb, "Stitch Pattern Ideas")):
        panel(p, bx, Y(8), Y(26), bw, "PDP Box", lbl, lbl, 10)
        rules(p, bx + INSET, bw - 2 * INSET, range(13, 26, LINE_PITCH), lbl)
    # open, full-width construction lines
    text(p, x0, Y(29), W, "Construction Thoughts", "Field Label", "Construction Thoughts — Label")
    rules(p, x0, W, range(32, 43, LINE_PITCH), "Construction Thoughts")
    # things to explore — mist panel with tick boxes
    panel(p, x0, Y(45), Y(60), W, "PDP Panel Mist", "Things to Explore", "Things to Explore", 47)
    rows = list(range(50, 59, LINE_PITCH))
    for i, r in enumerate(rows):
        checkbox(p, x0 + INSET, Y(r) - 1.2, None, f"Things to Explore / Item {i + 1}")
    rules(p, x0 + INSET + 5.5, W - 2 * INSET - 5.5, rows, "Things to Explore")


# ---------------------------------------------------------------------------
# PAGES 4–5 — THE DESIGN OPENING SPREAD
# ---------------------------------------------------------------------------
def page4():
    p = 4
    x0, x1 = live("L")
    W = x1 - x0
    text(p, x0, Y(4), 90, "The Design", "Page Title", "Page Title")
    text(p, x1 - 60, Y(4), 60, "The Idea", "Page Subtitle Right", "Page Subtitle")
    field(p, x0, W, 8, "Working Pattern Name", "Working Pattern Name")
    craft(p, x0, 13, "Craft")
    field(p, x0 + 42, 46, 13, "Design Type", "Design Type")
    field(p, x0 + 92, W - 92, 13, "Target Release / Season", "Target Release / Season")
    text(p, x0, Y(19), W, "The Idea", "Field Label", "The Idea — Label")
    rules(p, x0, W, range(22, 37, LINE_PITCH), "The Idea")                     # 8 lines
    panel(p, x0, Y(38), Y(60), W, "PDP Panel Cream", "Inspiration", "Inspiration", 40)
    rules(p, x0 + INSET, W - 2 * INSET, range(43, 60, LINE_PITCH), "Inspiration")  # 9 lines


def page5():
    p = 5
    x0, x1 = live("R")
    W = x1 - x0
    text(p, x0, Y(4), 60, "Design Direction", "Page Subtitle", "Page Subtitle")
    wc = 62.0
    text(p, x0, Y(8), wc, "Construction", "Field Label", "Construction — Label")
    rules(p, x0, wc, range(11, 24, LINE_PITCH), "Construction")                 # 7 lines
    kx = x0 + wc + 2 * GUTTER
    text(p, kx, Y(8), x1 - kx, "Key Design Features", "Field Label", "Key Design Features — Label")
    rules(p, kx, x1 - kx, range(11, 24, LINE_PITCH), "Key Design Features", lead_gold=True)
    # sketch / schematic — large open drawing field
    sy1, sy2 = Y(26), Y(60)
    rect(p, x0, sy1, W, sy2 - sy1, "PDP Box", "Rules & Frames", "Sketch — Frame")
    corner(p, x0, sy1, "Sketch — Corner TL", 1, 1)
    corner(p, x1, sy1, "Sketch — Corner TR", -1, 1)
    corner(p, x0, sy2, "Sketch — Corner BL", 1, -1)
    corner(p, x1, sy2, "Sketch — Corner BR", -1, -1)
    text(p, x0 + INSET, Y(28), 80, "Sketch / Schematic / Doodle", "Field Label", "Sketch — Label")
    dotgrid(p, x0 + INSET, Y(30.5), 27, 19, 5.0, "Sketch — Dot Grid")
    # 10 cm gauge scale along the bottom edge (cm long, 5 mm short)
    ticks = []
    for i in range(21):
        tx = x0 + INSET + i * 5.0
        ticks.append([tx, sy2, tx, sy2 - (2.2 if i % 2 == 0 else 1.2)])
    _add(p, "ticks", "Decorative", "Sketch — 10 cm Scale", segs=ticks, style="PDP Scale Tick")


# ---------------------------------------------------------------------------
# PAGE 6 — SWATCH & GAUGE (verso)
# ---------------------------------------------------------------------------
def page6():
    p = 6
    x0, x1 = live("L")
    W = x1 - x0
    text(p, x0, Y(4), 100, "Swatch & Gauge", "Page Title", "Page Title")
    field(p, x0, 84, 8, "Yarn Used", "Yarn Used")
    field(p, x0 + 88, W - 88, 8, "Colourway", "Colourway")
    field(p, x0, 50, 13, "Needle / Hook Size", "Needle / Hook Size")
    field(p, x0 + 54, W - 54, 13, "Stitch Pattern", "Stitch Pattern")
    field(p, x0, 42, 18, "Unblocked Gauge", "Unblocked Gauge")
    field(p, x0 + 46, 42, 18, "Blocked Gauge", "Blocked Gauge")
    field(p, x0 + 92, W - 92, 18, "Blocking Method", "Blocking Method")
    _add(p, "table", "Labels & Type", "Swatch Comparison Table", x=x0, y=Y(23), w=W,
         cols=[18, 30, 42, 48], head_h=7.0, row_h=10.5,
         head=["Swatch", "Tool Size", "Gauge", "Verdict"], rows=["1", "2", "3"])
    # lower zone: two columns
    wl = 66.0
    xr = x0 + wl + GUTTER
    wr = x1 - xr
    text(p, x0, Y(38), wl, "Fabric / Drape Notes", "Field Label", "Fabric / Drape Notes — Label")
    rules(p, x0, wl, range(41, 50, LINE_PITCH), "Fabric / Drape Notes")          # 5 lines
    panel(p, x0, Y(51), Y(60), wl, "PDP Panel Mist", "Chosen Gauge", "Chosen Gauge", 53)
    rules(p, x0 + INSET, wl - 2 * INSET, [56, 59], "Chosen Gauge")
    panel(p, xr, Y(36), Y(60), wr, "PDP Box", "Swatching Notes", "Swatching Notes", 38)
    rules(p, xr + INSET, wr - 2 * INSET, range(41, 60, LINE_PITCH), "Swatching Notes")  # 10 lines


# ---------------------------------------------------------------------------
# PAGE REGISTRY
# ---------------------------------------------------------------------------
PAGES = [
    dict(n=1, side="R", parent="B", title="Design — Divider"),
    dict(n=2, side="L", parent="A", title="Idea Bank — Idea Capture"),
    dict(n=3, side="R", parent="A", title="Idea Bank — Early Thoughts"),
    dict(n=4, side="L", parent="A", title="The Design — The Idea"),
    dict(n=5, side="R", parent="A", title="The Design — Design Direction"),
    dict(n=6, side="L", parent="A", title="Swatch & Gauge"),
]


def build_items():
    ITEMS.clear()
    parent_working()
    parent_divider()
    for fn in (page1, page2, page3, page4, page5, page6):
        fn()
    return ITEMS


# ---------------------------------------------------------------------------
# EMIT — InDesign ExtendScript
# ---------------------------------------------------------------------------
def emit_jsx(items):
    data = dict(
        page=dict(w=PAGE_W, h=PAGE_H, bleed=BLEED, top=M_TOP, bottom=M_BOTTOM, inside=M_INSIDE,
                  outside=M_OUTSIDE, columns=COLUMNS, gutter=GUTTER, grid=UNIT),
        colors={k: v[0] for k, v in COLORS.items()},
        fonts=FONTS,
        pstyles=PSTYLES,
        ostyles=OSTYLES,
        layers=LAYERS,
        pages=PAGES,
        items=items,
    )
    engine = open(os.path.join(HERE, "src", "engine.jsx"), encoding="utf-8").read()
    js = engine.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=True, indent=None))
    out = os.path.join(HERE, "PatternDesignPlanner_Interior.jsx")
    with open(out, "w", encoding="utf-8") as f:
        f.write(js)
    return out


# ---------------------------------------------------------------------------
# EMIT — SVG preview (same geometry)
# ---------------------------------------------------------------------------
def _esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _svg_text(x, base, w, content, style):
    s = PSTYLES[style]
    f = FONTS[s["font"]]
    size = s["size"] * PT
    ls = s["tracking"] / 1000.0 * size
    t = content.upper() if s["caps"] else content
    anchor, tx = "start", x
    if s["align"] == "right":
        anchor, tx = "end", x + w + ls      # compensate trailing tracking
    elif s["align"] == "center":
        anchor, tx = "middle", x + w / 2 + ls / 2
    return (f'<text x="{tx:.3f}" y="{base:.3f}" font-family="{f["css"]}" font-weight="{s["weight"]}" '
            f'font-size="{size:.3f}" letter-spacing="{ls:.3f}" fill="{COLORS[s["color"]][1]}" '
            f'text-anchor="{anchor}">{_esc(t)}</text>')


def _stroke_attrs(style):
    o = OSTYLES[style]
    a = f'stroke="{COLORS[o["stroke"]][1]}" stroke-width="{o["weight"] * PT:.3f}" fill="none"'
    if o.get("dash"):
        a += f' stroke-dasharray="{" ".join(f"{d * PT:.3f}" for d in o["dash"])}"'
    return a


def _svg_item(it):
    k = it["kind"]
    if k == "rect":
        o = OSTYLES[it["style"]]
        fill = COLORS[o["fill"]][1] if o["fill"] else "none"
        stroke = f'stroke="{COLORS[o["stroke"]][1]}" stroke-width="{o["weight"] * PT:.3f}"' if o["stroke"] else ""
        return f'<rect x="{it["x"]:.3f}" y="{it["y"]:.3f}" width="{it["w"]:.3f}" height="{it["h"]:.3f}" fill="{fill}" {stroke}/>'
    if k == "path":
        pts = " ".join(f"{x:.3f},{y:.3f}" for x, y in it["pts"])
        return f'<polyline points="{pts}" {_stroke_attrs(it["style"])} stroke-linejoin="miter"/>'
    if k == "rules":
        return "".join(f'<line x1="{it["x"]:.3f}" y1="{y:.3f}" x2="{it["x"] + it["w"]:.3f}" y2="{y:.3f}" {_stroke_attrs(it["style"])}/>'
                       for y in it["ys"])
    if k == "ticks":
        return "".join(f'<line x1="{a:.3f}" y1="{b:.3f}" x2="{c:.3f}" y2="{d:.3f}" {_stroke_attrs(it["style"])}/>'
                       for a, b, c, d in it["segs"])
    if k == "dots":
        col = COLORS[OSTYLES[it["style"]]["fill"]][1]
        r = it["d"] / 2
        return "".join(f'<circle cx="{it["x"] + i * it["step"]:.3f}" cy="{it["y"] + j * it["step"]:.3f}" r="{r:.3f}" fill="{col}"/>'
                       for j in range(it["rows"]) for i in range(it["cols"]))
    if k == "text":
        return _svg_text(it["x"], it["base"], it["w"], it["text"], it["style"])
    if k == "table":
        return _svg_table(it)
    return ""  # entry frames are invisible


def _svg_table(it):
    out = []
    x, y = it["x"], it["y"]
    cols, hh, rh = it["cols"], it["head_h"], it["row_h"]
    W = sum(cols)
    n = len(it["rows"])
    c = lambda k: COLORS[k][1]
    out.append(f'<rect x="{x}" y="{y}" width="{W}" height="{hh}" fill="{c("PDP Cream")}"/>')
    out.append(f'<line x1="{x}" y1="{y}" x2="{x + W}" y2="{y}" stroke="{c("PDP Gold")}" stroke-width="{0.6 * PT}"/>')
    out.append(f'<line x1="{x}" y1="{y + hh}" x2="{x + W}" y2="{y + hh}" stroke="{c("PDP Frame")}" stroke-width="{0.5 * PT}"/>')
    for i in range(n):
        yy = y + hh + (i + 1) * rh
        last = i == n - 1
        out.append(f'<line x1="{x}" y1="{yy}" x2="{x + W}" y2="{yy}" stroke="{c("PDP Frame" if last else "PDP Line")}" '
                   f'stroke-width="{(0.5 if last else 0.35) * PT}"/>')
    cx = x
    for j, w in enumerate(cols):
        if j > 0:
            out.append(f'<line x1="{cx}" y1="{y + hh}" x2="{cx}" y2="{y + hh + n * rh}" stroke="{c("PDP Line")}" stroke-width="{0.35 * PT}"/>')
        hs = "Table Head Center" if j == 0 else "Table Head"
        cap = PSTYLES[hs]["size"] * PT * 0.7
        out.append(_svg_text(cx + (0 if j == 0 else 2.5), y + hh / 2 + cap / 2, w - (0 if j == 0 else 2.5), it["head"][j], hs))
        cx += w
    for i, lbl in enumerate(it["rows"]):
        cap = PSTYLES["Table Number"]["size"] * PT * 0.62
        out.append(_svg_text(x, y + hh + i * rh + rh / 2 + cap / 2, cols[0], lbl, "Table Number"))
    return "".join(out)


def svg_page(items, page_def):
    n, side, parent = page_def["n"], page_def["side"], page_def["parent"]
    key = f"{parent}-{side}"
    body = [_svg_item(it) for it in items if it["page"] == key]
    body += [_svg_item(it) for it in items if it["page"] == n]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{PAGE_W}mm" height="{PAGE_H}mm" '
            f'viewBox="0 0 {PAGE_W} {PAGE_H}">' + "".join(body) + "</svg>")


# ---------------------------------------------------------------------------
# PREVIEW PDF / PNG (Chromium headless)
# ---------------------------------------------------------------------------
FONT_URLS = {
    "CormorantGaramond.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf",
    "CormorantGaramond-Italic.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond-Italic%5Bwght%5D.ttf",
    "Jost.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/jost/Jost%5Bwght%5D.ttf",
}


def ensure_fonts():
    d = os.path.join(HERE, ".fonts")
    os.makedirs(d, exist_ok=True)
    for fn, url in FONT_URLS.items():
        p = os.path.join(d, fn)
        if not os.path.exists(p):
            urllib.request.urlretrieve(url, p)
    return d


def font_css(fdir):
    return f"""
@font-face {{ font-family: 'PDP Serif'; src: url('file://{fdir}/CormorantGaramond.ttf'); font-weight: 300 700; }}
@font-face {{ font-family: 'PDP Serif Italic'; src: url('file://{fdir}/CormorantGaramond-Italic.ttf'); font-weight: 300 700; }}
@font-face {{ font-family: 'PDP Sans'; src: url('file://{fdir}/Jost.ttf'); font-weight: 100 900; }}
"""


def find_chrome():
    for c in ("/opt/pw-browsers/chromium-1194/chrome-linux/chrome", shutil.which("chromium"), shutil.which("google-chrome")):
        if c and os.path.exists(c):
            return c
    return None


def emit_preview(items):
    pdir = os.path.join(HERE, "preview")
    os.makedirs(pdir, exist_ok=True)
    svgs = {}
    for pd in PAGES:
        s = svg_page(items, pd)
        svgs[pd["n"]] = s
        with open(os.path.join(pdir, f"page-{pd['n']:02d}.svg"), "w", encoding="utf-8") as f:
            f.write(s)

    fdir = ensure_fonts()
    css = font_css(fdir)
    pages_html = "".join(f'<div class="pg">{svgs[pd["n"]]}</div>' for pd in PAGES)
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{css}
@page {{ size: {PAGE_W}mm {PAGE_H}mm; margin: 0; }}
html, body {{ margin: 0; padding: 0; }}
.pg {{ width: {PAGE_W}mm; height: {PAGE_H}mm; overflow: hidden; page-break-after: always; break-after: page; }}
.pg svg {{ display: block; }}
</style></head><body>{pages_html}</body></html>"""
    hp = os.path.join(pdir, "_pages.html")
    with open(hp, "w", encoding="utf-8") as f:
        f.write(html)

    # spreads overview (presentation board)
    def pg(n):
        return f'<div class="p">{svgs[n]}</div>' if n else '<div class="p blank"></div>'
    spreads = [(None, 1), (2, 3), (4, 5), (6, None)]
    labels = ["Page 1 — Design divider", "Pages 2–3 — Idea Bank", "Pages 4–5 — The Design", "Page 6 — Swatch & Gauge"]
    board = "".join(f'<figure><div class="spread">{pg(a)}{pg(b)}</div><figcaption>{l}</figcaption></figure>'
                    for (a, b), l in zip(spreads, labels))
    bhtml = f"""<!doctype html><html><head><meta charset="utf-8"><style>{css}
body {{ margin: 0; background: #D9DDDF; font-family: 'PDP Sans'; }}
.wrap {{ display: grid; grid-template-columns: 1fr 1fr; gap: 70px 60px; padding: 70px; }}
figure {{ margin: 0; }}
.spread {{ display: flex; justify-content: center; }}
.p {{ width: 176mm; height: 250mm; box-shadow: 0 10px 30px rgba(40,52,60,.18); }}
.p svg {{ display:block; }}
.blank {{ box-shadow: none; }}
figcaption {{ text-align: center; margin-top: 22px; font-size: 22px; letter-spacing: .22em; text-transform: uppercase; color: #3E4E5A; }}
</style></head><body><div class="wrap">{board}</div></body></html>"""
    bp = os.path.join(pdir, "_spreads.html")
    with open(bp, "w", encoding="utf-8") as f:
        f.write(bhtml)

    chrome = find_chrome()
    if not chrome:
        print("Chromium not found — SVG previews written, PDF skipped.")
        return
    flags = [chrome, "--headless", "--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"]
    pdf = os.path.join(HERE, "PatternDesignPlanner_Interior_Preview.pdf")
    subprocess.run(flags + ["--no-pdf-header-footer", f"--print-to-pdf={pdf}", f"file://{hp}"],
                   check=True, capture_output=True)
    # board: 4 spreads in 2x2, each spread 352mm wide at 96dpi ≈ 1330px
    subprocess.run(flags + ["--hide-scrollbars", "--window-size=2920,2280",
                            f"--screenshot={os.path.join(HERE, 'PatternDesignPlanner_Spreads.png')}", f"file://{bp}"],
                   check=True, capture_output=True)
    print("Preview:", pdf)


if __name__ == "__main__":
    items = build_items()
    print("JSX:", emit_jsx(items))
    emit_preview(items)
    print(f"{len(items)} layout items")
