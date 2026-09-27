# Pattern Design Planner: Interior Design System

Six sample interior pages for a B5 portrait knitting and crochet pattern-development planner with Wire-O binding. The pages use the cover palette: muted blue-grey, warm white, soft cream and restrained champagne gold.

| File | What it is |
|---|---|
| `PatternDesignPlanner_Interior.idml` | **Open this in InDesign** (File › Open). It's a native InDesign package with all text, frames, rules, the table, swatches, styles, layers and parent pages editable. |
| `PatternDesignPlanner_Interior.jsx` | **InDesign build script.** Creates the fully editable document: swatches, paragraph and object styles, layers, parent pages, live text, a native table and vector rules. |
| `PatternDesignPlanner_Interior_Preview.pdf` | Vector preview of the 6 pages at trim size. Text is live, not rasterised. |
| `PatternDesignPlanner_Spreads.png` | Presentation board showing the pages as reader spreads. |
| `preview/page-0X.svg` | Per-page vector previews. |
| `build_planner.py` / `build_idml.py` | The single source of truth for the layout. Re-run both to regenerate the script, the IDML and the previews. |
| `src/engine.jsx` | The InDesign engine that the generator fills with layout data. |

## Opening in InDesign

**Easiest:** File › Open › `PatternDesignPlanner_Interior.idml`, then save it as `.indd`. Install the fonts first (below) so no font shows as missing.

**Alternative (script):**

1. Install the fonts, which are free from Google Fonts: **Cormorant Garamond** (Regular, Medium, Italic) and **Jost** (Light, Regular, Medium). If they are missing, the script falls back to Minion Pro and Myriad Pro and lists what it substituted.
2. In InDesign, open **Window › Utilities › Scripts**. Right-click **User** and choose **Reveal in Finder/Explorer**. Copy `PatternDesignPlanner_Interior.jsx` into that folder, then double-click it in the panel.
3. Save the new document as `.indd`. You can also export an `.idml` for older InDesign versions.

## Format & grid

| | |
|---|---|
| Trim | 176 × 250 mm (ISO B5), portrait, facing pages |
| Bleed | 3 mm all round |
| Margins | Top 18 · Bottom 22 · **Inside 22** (Wire-O punch clearance) · Outside 16 mm |
| Live area | 138 × 210 mm |
| Columns | 6 columns with 4 mm gutters |
| Baseline grid | 3.5 mm, starting at 18 mm. Every label, rule and box edge snaps to it. |
| Writing line pitch | 7 mm (2 grid units) |
| Box inner padding | 4 mm |

Page 1 is a recto (right-hand) divider. Pages 2–3 and 4–5 are true spreads. Page 6 is a verso.

## Colour (CMYK process)

| Swatch | CMYK | Hex (screen) | Use |
|---|---|---|---|
| PDP Blue-Grey | 55 32 24 18 | `#6E8391` | Primary: divider block, section tab, running heads |
| PDP Slate | 70 48 38 38 | `#3E4E5A` | Titles, labels, entry text |
| PDP Warm White | 0 1 4 1 | `#FAF7F0` | Paper flood (Background layer, can be switched off) |
| PDP Cream | 2 4 12 0 | `#F3EDDF` | Inspiration panels, table header |
| PDP Mist | 9 4 3 2 | `#E5EAED` | Action panels (Things to Explore, Chosen Gauge) |
| PDP Frame | 35 18 13 8 | `#A7B4BD` | Box strokes, stitch rules, dot grids, scale |
| PDP Line | 22 10 8 5 | `#C3CCD2` | Writing rules |
| PDP Gold | 18 28 58 12 | `#B69D6C` | Accent rules, corner marks, stitch column |

For real metallic gold, redefine **PDP Gold** as a spot colour (Pantone 871 C or 10127 C, or a foil plate). Every gold element picks up the change.

## Typography (paragraph styles, group "PDP")

| Style | Font | Size / Leading | Tracking | Notes |
|---|---|---|---|---|
| Divider Title | Cormorant Garamond Regular | 46 / 50 pt | 380 | All caps, warm white |
| Divider Subtitle | Cormorant Garamond Italic | 15 / 20 pt | 10 | |
| Page Title | Cormorant Garamond Medium | 26 / 30 pt | 0 | |
| Page Subtitle (Right) | Cormorant Garamond Italic | 12.5 / 16 pt | 10 | Page name, set against the spine |
| Running Head (Right) | Jost Medium | 6 / 8 pt | 420 | All caps, set at the outer edge |
| Field Label | Jost Medium | 6.5 / 9 pt | 180 | All caps |
| Option Label | Jost Regular | 7.5 / 10 pt | 30 | Knitting / Crochet |
| Table Head (Center) | Jost Medium | 6 / 8 pt | 180 | All caps |
| Table Number | Cormorant Garamond Medium | 13 / 14 pt | 0 | |
| Entry | Jost Light | 9 pt / 7 mm | 0 | For typing into the fill-in frames |

Text frames use a *fixed* first-baseline offset, so every baseline lands exactly on the grid.

## Graphic language

- **Stitch rule:** a 0.5 pt dashed rule (1.6 mm dash, 1.2 mm gap) that reads as a running stitch or seam line. It runs across the header of every working page and continues across the spine on spreads. On left pages it starts with a 12 mm gold lead.
- **Corner mark:** a gold L at 0.6 pt with 3 mm arms, the only corner treatment. It sits at the top-left corner of every box and panel. The sketch field has one at all four corners, like construction marks.
- **Stitch column:** six small gold "V"s (knit stitches) that lead into the divider title.
- **10 cm scale:** ticks every 5 mm along the bottom of the sketch field, which references gauge measurement.
- **Section tab:** a blue-grey bleed tab on the outer edge. Move it down for each later section to build a thumb index.
- **Box vocabulary:** open rules for flowing writing, outlined boxes for contained notes, cream panels for inspiration, mist panels for actions and decisions. Boxes are deliberately *not* all the same size.

Line weights: writing rules 0.35 pt · boxes and stitch rules 0.5 pt · gold 0.6 pt · scale ticks 0.35 pt.

## InDesign document structure

**Layers** (top to bottom): Fill-in Text · Labels & Type · Decorative · Rules & Frames · Colour Blocks · Background (locked).

**Parent pages**
- `A-Working Page` holds the paper flood, section tab, running head "DESIGN" and the header stitch rule.
- `B-Divider` holds the paper flood only.

**Object styles** (group "PDP"): Background, Block, Section Tab, Panel Cream, Panel Mist, Box, Checkbox, Writing Rule, Stitch Rule (uses the custom dashed stroke style *PDP Stitch Dash*), Gold Rule, Gold Mark, Scale Tick, Dot, Text Frame.

**Editability**
- Each block of writing rules is a named group, for example "The Idea". Double-click into a group to edit a single line.
- Every ruled area has an empty, invisible text frame on the *Fill-in Text* layer. Its baselines sit on the rules, ready for a fillable or digital edition. Hide the layer for print if you like.
- The swatch comparison is a native InDesign table: rows and columns can be added, cell strokes are styled, and the body cells use the Entry style.
- Dot grids are groups of vector circles. Nothing is rasterised, and no group spans more than one layer.

## Extending the system

Duplicate `A-Working Page` for each new section, for example `C-Sampling`. Change the running head and move the section tab down by one tab height (31.5 mm = 9 grid units). New pages should reuse the same header block, field pattern (label, then a rule three grid units below), 7 mm writing pitch and box vocabulary.
