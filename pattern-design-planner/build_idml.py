#!/usr/bin/env python3
"""
Emit PatternDesignPlanner_Interior.idml — a native InDesign package that opens
directly with File › Open (InDesign CS4+). Built from the same layout items as
the .jsx and the preview (build_planner.py), so all three stay identical.

Everything in the package is live and editable: text frames + stories with
paragraph styles, vector rectangles / lines / ovals, a native table, swatches,
object styles, layers and parent pages.

Usage:  python3 build_idml.py
"""

import os
import zipfile
from xml.sax.saxutils import escape, quoteattr

import build_planner as B

K = 72 / 25.4  # points per mm
W, H = B.PAGE_W * K, B.PAGE_H * K
DOM = "16.0"
NS = 'xmlns:idPkg="http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging"'
HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'


def f(v):
    return f"{v:.4f}".rstrip("0").rstrip(".")


class Ids:
    def __init__(self):
        self.n = 0x200

    def __call__(self, prefix="u"):
        self.n += 1
        return f"{prefix}{self.n:x}"


uid = Ids()
LAYER_ID = {name: f"uLayer{i}" for i, name in enumerate(B.LAYERS)}
STORIES = []   # (id, xml)


def a(v):
    return quoteattr(str(v))


# ---------------------------------------------------------------- references
def color_ref(name):
    return "Swatch/None" if not name else f"Color/{name}"


def ps_ref(name):
    return f"ParagraphStyle/{name}"


def os_ref(name):
    return f"ObjectStyle/{name}"


# ---------------------------------------------------------------- geometry
class Space:
    """page-relative mm -> spread points"""

    def __init__(self, side):
        self.dx = -W if side == "L" else 0.0

    def pt(self, x, y):
        return (x * K + self.dx, y * K - H / 2)


def path_xml(points, closed):
    pts = "".join(
        f'<PathPointType Anchor="{f(x)} {f(y)}" LeftDirection="{f(x)} {f(y)}" RightDirection="{f(x)} {f(y)}"/>'
        for x, y in points)
    return (f'<Properties><PathGeometry><GeometryPathType PathOpen="{"false" if closed else "true"}">'
            f'<PathPointArray>{pts}</PathPointArray></GeometryPathType></PathGeometry></Properties>')


def rect_pts(sp, x, y, w, h):
    return [sp.pt(x, y), sp.pt(x, y + h), sp.pt(x + w, y + h), sp.pt(x + w, y)]


def oval_xml(sp, cx, cy, r):
    c = 0.5523 * r
    X, Y_ = sp.pt(cx, cy)
    R, C = r * K, c * K
    pts = [  # (anchor, left, right) going clockwise from the left point
        ((X - R, Y_), (X - R, Y_ + C), (X - R, Y_ - C)),
        ((X, Y_ - R), (X - C, Y_ - R), (X + C, Y_ - R)),
        ((X + R, Y_), (X + R, Y_ - C), (X + R, Y_ + C)),
        ((X, Y_ + R), (X + C, Y_ + R), (X - C, Y_ + R)),
    ]
    pp = "".join(f'<PathPointType Anchor="{f(p[0][0])} {f(p[0][1])}" LeftDirection="{f(p[1][0])} {f(p[1][1])}" '
                 f'RightDirection="{f(p[2][0])} {f(p[2][1])}"/>' for p in pts)
    return (f'<Properties><PathGeometry><GeometryPathType PathOpen="false"><PathPointArray>{pp}'
            f'</PathPointArray></GeometryPathType></PathGeometry></Properties>')


def stroke_attrs(style):
    o = B.OSTYLES[style]
    s = (f'AppliedObjectStyle={a(os_ref(style))} FillColor={a(color_ref(o["fill"]))} '
         f'StrokeColor={a(color_ref(o["stroke"]))} StrokeWeight="{f(o["weight"]) if o["stroke"] else 0}"')
    if o.get("dash"):
        s += f' StrokeType="StrokeStyle/$ID/Dashed" StrokeDashAndGap="{f(o["dash"][0])} {f(o["dash"][1])}"'
    elif o["stroke"]:
        s += ' StrokeType="StrokeStyle/$ID/Solid"'
    return s + ' EndCap="ButtEndCap" EndJoin="MiterEndJoin"'


def common(it, name=None):
    return (f'Self="{uid()}" ItemLayer="{LAYER_ID[it["layer"]]}" Name={a(name or it["name"])} '
            f'ItemTransform="1 0 0 1 0 0" Locked="false" Visible="true"')


# ---------------------------------------------------------------- stories
def para(style, content=""):
    body = f"<Content>{escape(content)}</Content>" if content else ""
    return (f'<ParagraphStyleRange AppliedParagraphStyle={a(ps_ref(style))}>'
            f'<CharacterStyleRange AppliedCharacterStyle="CharacterStyle/$ID/[No character style]">{body}'
            f'</CharacterStyleRange></ParagraphStyleRange>')


def add_story(inner):
    sid = uid("s")
    xml = (HEAD + f'<idPkg:Story {NS} DOMVersion="{DOM}"><Story Self="{sid}" AppliedTOCStyle="n" '
           f'TrackChanges="false" StoryTitle="$ID/" AppliedNamedGrid="n">'
           f'<StoryPreference OpticalMarginAlignment="false" OpticalMarginSize="12" FrameType="TextFrameType" '
           f'StoryOrientation="Horizontal" StoryDirection="LeftToRightDirection"/>'
           f'{inner}</Story></idPkg:Story>')
    STORIES.append((sid, xml))
    return sid


def text_frame_xml(it, sp, x, top, w, h, story_inner, first_base=None, name=None):
    sid = add_story(story_inner)
    tfp = (f'<TextFramePreference TextColumnCount="1" VerticalJustification="TopAlign" '
           + (f'FirstBaselineOffset="FixedHeight" MinimumFirstBaselineOffset="{f(first_base * K)}"'
              if first_base is not None else 'FirstBaselineOffset="AscentOffset"')
           + '><Properties><InsetSpacing type="list"><ListItem type="unit">0</ListItem><ListItem type="unit">0</ListItem>'
           '<ListItem type="unit">0</ListItem><ListItem type="unit">0</ListItem></InsetSpacing></Properties></TextFramePreference>')
    return (f'<TextFrame {common(it, name)} ParentStory="{sid}" PreviousTextFrame="n" NextTextFrame="n" '
            f'ContentType="TextType" AppliedObjectStyle={a(os_ref("PDP Text Frame"))} '
            f'FillColor="Swatch/None" StrokeColor="Swatch/None" StrokeWeight="0">'
            + path_xml(rect_pts(sp, x, top, w, h), True) + tfp + '</TextFrame>')


def table_story(it):
    n, m = len(it["rows"]), len(it["cols"])
    rows_h = [it["head_h"]] + [it["row_h"]] * n
    tid = uid("t")
    frame = "PDP Frame"
    line = "PDP Line"

    def edge(side, weight, color):
        if weight <= 0:
            return f'{side}EdgeStrokeWeight="0" '
        return (f'{side}EdgeStrokeWeight="{f(weight)}" {side}EdgeStrokeColor={a(color_ref(color))} '
                f'{side}EdgeStrokeType="StrokeStyle/$ID/Solid" {side}EdgeStrokeTint="100" ')

    def hline(r):
        """rule on the horizontal boundary above row r (0..n+1)"""
        if r == 0:
            return (0.6, "PDP Gold")
        if r == 1:
            return (0.5, frame)
        if r == n + 1:
            return (0.5, frame)
        return (0.35, line)

    x = [f'<Table Self="{tid}" HeaderRowCount="1" FooterRowCount="0" BodyRowCount="{n}" ColumnCount="{m}" '
         f'AppliedTableStyle="TableStyle/$ID/[Basic Table]" TableDirection="LeftToRightDirection" '
         f'SpaceBefore="0" SpaceAfter="0" TopBorderStrokeWeight="0" BottomBorderStrokeWeight="0" '
         f'LeftBorderStrokeWeight="0" RightBorderStrokeWeight="0">']
    for r, h in enumerate(rows_h):
        x.append(f'<Row Self="{tid}Row{r}" Name="{r}" SingleRowHeight="{f(h * K)}" MinimumHeight="{f(h * K)}" '
                 f'MaximumHeight="{f(h * K)}" AutoGrow="false"/>')
    for c, w in enumerate(it["cols"]):
        x.append(f'<Column Self="{tid}Col{c}" Name="{c}" SingleColumnWidth="{f(w * K)}"/>')
    for r in range(n + 1):
        for c in range(m):
            tw, tc = hline(r)
            bw, bc = hline(r + 1)
            lw = 0.35 if (r > 0 and c > 0) else 0
            rw = 0.35 if (r > 0 and c < m - 1) else 0
            fill = "Color/PDP Cream" if r == 0 else "Swatch/None"
            li = 0 if c == 0 else 2.5 * K
            ri = 0 if c == 0 else 2 * K
            if r == 0:
                content = para("Table Head Center" if c == 0 else "Table Head", it["head"][c])
            elif c == 0:
                content = para("Table Number", it["rows"][r - 1])
            else:
                content = para("Entry")
            x.append(f'<Cell Self="{tid}i{c}i{r}" Name="{c}:{r}" RowSpan="1" ColumnSpan="1" '
                     f'AppliedCellStyle="CellStyle/$ID/[None]" AppliedCellStylePriority="0" '
                     f'FillColor="{fill}" FillTint="100" VerticalJustification="CenterAlign" '
                     f'TopInset="0" BottomInset="0" LeftInset="{f(li)}" RightInset="{f(ri)}" '
                     + edge("Top", tw, tc) + edge("Bottom", bw, bc)
                     + edge("Left", lw, line) + edge("Right", rw, line) + f'>{content}</Cell>')
    x.append("</Table>")
    return (f'<ParagraphStyleRange AppliedParagraphStyle={a(ps_ref("Table Anchor"))}>'
            f'<CharacterStyleRange AppliedCharacterStyle="CharacterStyle/$ID/[No character style]">'
            + "".join(x) + '</CharacterStyleRange></ParagraphStyleRange>')


# ---------------------------------------------------------------- items
def item_xml(it, side):
    sp = Space(side)
    k = it["kind"]
    if k == "rect":
        return (f'<Rectangle {common(it)} ContentType="Unassigned" {stroke_attrs(it["style"])}>'
                + path_xml(rect_pts(sp, it["x"], it["y"], it["w"], it["h"]), True) + '</Rectangle>')
    if k == "path":
        return (f'<GraphicLine {common(it)} {stroke_attrs(it["style"])}>'
                + path_xml([sp.pt(*p) for p in it["pts"]], False) + '</GraphicLine>')
    if k in ("rules", "ticks"):
        segs = ([(it["x"], y, it["x"] + it["w"], y) for y in it["ys"]] if k == "rules" else it["segs"])
        lines = [(f'<GraphicLine {common(it, it["name"] + " — Line " + str(i + 1))} {stroke_attrs(it["style"])}>'
                  + path_xml([sp.pt(s[0], s[1]), sp.pt(s[2], s[3])], False) + '</GraphicLine>')
                 for i, s in enumerate(segs)]
        if len(lines) == 1:
            return lines[0]
        return f'<Group {common(it)}>' + "".join(lines) + '</Group>'
    if k == "dots":
        r = it["d"] / 2
        dots = [(f'<Oval {common(it, "Dot")} ContentType="Unassigned" {stroke_attrs(it["style"])}>'
                 + oval_xml(sp, it["x"] + c * it["step"], it["y"] + j * it["step"], r) + '</Oval>')
                for j in range(it["rows"]) for c in range(it["cols"])]
        return f'<Group {common(it)}>' + "".join(dots) + '</Group>'
    if k == "text":
        top = it["base"] - it["off"]
        return text_frame_xml(it, sp, it["x"], top, it["w"], it["h"], para(it["style"], it["text"]), first_base=it["off"])
    if k == "entry":
        return text_frame_xml(it, sp, it["x"], it["top"], it["w"], it["bottom"] - it["top"], para("Entry"),
                              first_base=it["off"])
    if k == "table":
        h = it["head_h"] + len(it["rows"]) * it["row_h"]
        return text_frame_xml(it, sp, it["x"], it["y"], it["w"] + 0.5, h + 4, table_story(it))
    raise ValueError(k)


def margin_xml(side):
    left, right = (B.M_OUTSIDE, B.M_INSIDE) if side == "L" else (B.M_INSIDE, B.M_OUTSIDE)
    return (f'<MarginPreference ColumnCount="{B.COLUMNS}" ColumnGutter="{f(B.GUTTER * K)}" Top="{f(B.M_TOP * K)}" '
            f'Bottom="{f(B.M_BOTTOM * K)}" Left="{f(left * K)}" Right="{f(right * K)}" '
            f'ColumnDirection="Horizontal" ColumnsPositions="0 {f((B.PAGE_W - B.M_INSIDE - B.M_OUTSIDE) * K)}"/>')


def page_xml(pid, name, side, master):
    tx = -W if side == "L" else 0
    return (f'<Page Self="{pid}" Name="{name}" AppliedMaster="{master}" GeometricBounds="0 0 {f(H)} {f(W)}" '
            f'ItemTransform="1 0 0 1 {f(tx)} {f(-H / 2)}" MasterPageTransform="1 0 0 1 0 0" '
            f'OverrideList="" TabOrder="" GridStartingPoint="TopOutside" UseMasterGrid="true">'
            f'<Properties><PageColor type="enumeration">UseMasterColor</PageColor></Properties>'
            + margin_xml(side) + '</Page>')


# ---------------------------------------------------------------- resources
def graphic_xml():
    base = [
        '<Color Self="Color/Black" Model="Process" Space="CMYK" ColorValue="0 0 0 100" ColorOverride="Specialblack" '
        'AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="Black" ColorEditable="false" ColorRemovable="false" '
        'Visible="true" SwatchCreatorID="7937"/>',
        '<Color Self="Color/Paper" Model="Process" Space="CMYK" ColorValue="0 0 0 0" ColorOverride="Specialpaper" '
        'AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="Paper" ColorEditable="true" ColorRemovable="false" '
        'Visible="true" SwatchCreatorID="7937"/>',
        '<Color Self="Color/Registration" Model="Registration" Space="CMYK" ColorValue="100 100 100 100" '
        'ColorOverride="Specialregistration" AlternateSpace="NoAlternateColor" AlternateColorValue="" Name="Registration" '
        'ColorEditable="false" ColorRemovable="false" Visible="true" SwatchCreatorID="7937"/>',
    ]
    for name, (cmyk, _) in B.COLORS.items():
        base.append(f'<Color Self={a("Color/" + name)} Model="Process" Space="CMYK" ColorValue="{" ".join(map(str, cmyk))}" '
                    f'ColorOverride="Normal" AlternateSpace="NoAlternateColor" AlternateColorValue="" Name={a(name)} '
                    f'ColorEditable="true" ColorRemovable="true" Visible="true" SwatchCreatorID="7937"/>')
    base.append('<Swatch Self="Swatch/None" Name="None" ColorEditable="false" ColorRemovable="false" Visible="true" SwatchCreatorID="7937"/>')
    grp = "".join(f'<ColorGroupSwatch Self="{uid()}" SwatchItemRef={a("Color/" + n)}/>' for n in B.COLORS)
    base.append(f'<ColorGroup Self="ColorGroup/Pattern Design Planner" Name="Pattern Design Planner" IsRootColorGroup="false">{grp}</ColorGroup>')
    for s in ("Solid", "Dashed", "Dotted"):
        base.append(f'<StrokeStyle Self="StrokeStyle/$ID/{s}" Name="$ID/{s}"/>')
    return HEAD + f'<idPkg:Graphic {NS} DOMVersion="{DOM}">' + "".join(base) + '</idPkg:Graphic>'


def styles_xml():
    align = {"left": "LeftAlign", "right": "RightAlign", "center": "CenterAlign"}
    ps = ['<ParagraphStyle Self="ParagraphStyle/$ID/[No paragraph style]" Name="$ID/[No paragraph style]" Imported="false"/>',
          '<ParagraphStyle Self="ParagraphStyle/$ID/NormalParagraphStyle" Name="$ID/NormalParagraphStyle" Imported="false">'
          '<Properties><BasedOn type="object">ParagraphStyle/$ID/[No paragraph style]</BasedOn></Properties></ParagraphStyle>']
    styles = dict(B.PSTYLES)
    styles["Table Anchor"] = dict(font="sans", style="Regular", size=2, leading=2, tracking=0, color="PDP Slate", caps=False, align="left")
    for name, s in styles.items():
        fam = B.FONTS[s["font"]]["family"]
        ps.append(f'<ParagraphStyle Self={a(ps_ref(name))} Name={a(name)} Imported="false" FontStyle={a(s["style"])} '
                  f'PointSize="{f(s["size"])}" Tracking="{s["tracking"]}" FillColor={a(color_ref(s["color"]))} '
                  f'Capitalization="{"AllCaps" if s["caps"] else "Normal"}" Justification="{align[s["align"]]}" '
                  f'Hyphenation="false" SpaceBefore="0" SpaceAfter="0" KerningMethod="$ID/Optical">'
                  f'<Properties><BasedOn type="object">ParagraphStyle/$ID/[No paragraph style]</BasedOn>'
                  f'<Leading type="unit">{f(s["leading"])}</Leading><AppliedFont type="string">{escape(fam)}</AppliedFont>'
                  f'</Properties></ParagraphStyle>')
    os_ = ['<ObjectStyle Self="ObjectStyle/$ID/[None]" Name="$ID/[None]"/>',
           '<ObjectStyle Self="ObjectStyle/$ID/[Normal Graphics Frame]" Name="$ID/[Normal Graphics Frame]">'
           '<Properties><BasedOn type="object">ObjectStyle/$ID/[None]</BasedOn></Properties></ObjectStyle>',
           '<ObjectStyle Self="ObjectStyle/$ID/[Normal Text Frame]" Name="$ID/[Normal Text Frame]">'
           '<Properties><BasedOn type="object">ObjectStyle/$ID/[None]</BasedOn></Properties></ObjectStyle>',
           '<ObjectStyle Self="ObjectStyle/$ID/[Normal Grid]" Name="$ID/[Normal Grid]">'
           '<Properties><BasedOn type="object">ObjectStyle/$ID/[None]</BasedOn></Properties></ObjectStyle>']
    for name, o in B.OSTYLES.items():
        dash = (f' StrokeType="StrokeStyle/$ID/Dashed" StrokeDashAndGap="{f(o["dash"][0])} {f(o["dash"][1])}"'
                if o.get("dash") else ' StrokeType="StrokeStyle/$ID/Solid"')
        os_.append(f'<ObjectStyle Self={a(os_ref(name))} Name={a(name)} EnableFill="true" EnableStroke="true" '
                   f'EnableStrokeAndCornerOptions="true" FillColor={a(color_ref(o["fill"]))} '
                   f'StrokeColor={a(color_ref(o["stroke"]))} StrokeWeight="{f(o["weight"]) if o["stroke"] else 0}"{dash}>'
                   f'<Properties><BasedOn type="object">ObjectStyle/$ID/[None]</BasedOn></Properties></ObjectStyle>')
    return (HEAD + f'<idPkg:Styles {NS} DOMVersion="{DOM}">'
            '<RootCharacterStyleGroup Self="u79"><CharacterStyle Self="CharacterStyle/$ID/[No character style]" '
            'Name="$ID/[No character style]" Imported="false"/></RootCharacterStyleGroup>'
            '<RootParagraphStyleGroup Self="u78">' + "".join(ps) + '</RootParagraphStyleGroup>'
            '<RootCellStyleGroup Self="u8c"><CellStyle Self="CellStyle/$ID/[None]" Name="$ID/[None]"/></RootCellStyleGroup>'
            '<RootTableStyleGroup Self="u8e"><TableStyle Self="TableStyle/$ID/[No table style]" Name="$ID/[No table style]"/>'
            '<TableStyle Self="TableStyle/$ID/[Basic Table]" Name="$ID/[Basic Table]">'
            '<Properties><BasedOn type="object">TableStyle/$ID/[No table style]</BasedOn></Properties></TableStyle>'
            '</RootTableStyleGroup>'
            '<RootObjectStyleGroup Self="u97">' + "".join(os_) + '</RootObjectStyleGroup>'
            '</idPkg:Styles>')


def preferences_xml():
    return (HEAD + f'<idPkg:Preferences {NS} DOMVersion="{DOM}">'
            f'<DocumentPreference PageHeight="{f(H)}" PageWidth="{f(W)}" PagesPerDocument="{len(B.PAGES)}" '
            f'FacingPages="true" DocumentBleedTopOffset="{f(B.BLEED * K)}" DocumentBleedBottomOffset="{f(B.BLEED * K)}" '
            f'DocumentBleedInsideOrLeftOffset="{f(B.BLEED * K)}" DocumentBleedOutsideOrRightOffset="{f(B.BLEED * K)}" '
            f'DocumentBleedUniformSize="true" SlugTopOffset="0" SlugBottomOffset="0" SlugInsideOrLeftOffset="0" '
            f'SlugRightOrOutsideOffset="0" DocumentSlugUniformSize="false" PreserveLayoutWhenShuffling="true" '
            f'AllowPageShuffle="true" OverprintBlack="true" PageBinding="LeftToRight" ColumnDirection="Horizontal" '
            f'Intent="PrintIntent" CreateTextFramesOnParentPages="false" StartPageNumber="1"/>'
            f'<MarginPreference ColumnCount="{B.COLUMNS}" ColumnGutter="{f(B.GUTTER * K)}" Top="{f(B.M_TOP * K)}" '
            f'Bottom="{f(B.M_BOTTOM * K)}" Left="{f(B.M_INSIDE * K)}" Right="{f(B.M_OUTSIDE * K)}" '
            f'ColumnDirection="Horizontal" ColumnsPositions="0 {f((B.PAGE_W - B.M_INSIDE - B.M_OUTSIDE) * K)}"/>'
            f'<ViewPreference HorizontalMeasurementUnits="Millimeters" VerticalMeasurementUnits="Millimeters" '
            f'RulerOrigin="PageOrigin" ShowRulers="true" ShowFrameEdges="true"/>'
            f'<GridPreference BaselineStart="{f(B.M_TOP * K)}" BaselineDivision="{f(B.UNIT * K)}" '
            f'BaselineGridRelativeOption="TopOfPageOfBaselineGridRelativeOption" BaselineColor="LightBlue" '
            f'BaselineGridShown="false"/>'
            f'<PasteboardPreference PasteboardMargins="{f(40 * K)} {f(20 * K)}"/>'
            f'<TransparencyPreference BlendingSpace="CMYK"/>'
            '</idPkg:Preferences>')


def spread_file(tag, self_id, attrs, pages_xml, items_xml):
    return (HEAD + f'<idPkg:{tag} {NS} DOMVersion="{DOM}"><{tag} Self="{self_id}" {attrs}>'
            + pages_xml + items_xml + f'</{tag}></idPkg:{tag}>')


# ---------------------------------------------------------------- build
def build(out_path):
    items = B.build_items()
    by_page = {}
    for it in items:
        by_page.setdefault(it["page"], []).append(it)

    files = {}

    # parent pages
    masters = {"A": ("uMasterA", "Working Page"), "B": ("uMasterB", "Divider")}
    for prefix, (mid, base) in masters.items():
        pages = page_xml(uid(), prefix, "L", "n") + page_xml(uid(), prefix, "R", "n")
        its = "".join(item_xml(it, "L") for it in by_page.get(f"{prefix}-L", []))
        its += "".join(item_xml(it, "R") for it in by_page.get(f"{prefix}-R", []))
        files[f"MasterSpreads/MasterSpread_{mid}.xml"] = spread_file(
            "MasterSpread", mid,
            f'Name="{prefix}-{base}" NamePrefix="{prefix}" BaseName={a(base)} ShowMasterItems="true" PageCount="2" '
            f'OverriddenPageItemProps="" PrimaryTextFrame="n" ItemTransform="1 0 0 1 0 0"',
            pages, its)

    # document spreads: [1] [2 3] [4 5] [6]
    groups = [[1], [2, 3], [4, 5], [6]]
    spread_ids, first_page = [], None
    pdef = {p["n"]: p for p in B.PAGES}
    for g in groups:
        sid = uid("sp")
        spread_ids.append(sid)
        pages, its = "", ""
        for n in g:
            pd = pdef[n]
            pid = uid("pg")
            first_page = first_page or pid
            pages += page_xml(pid, str(n), pd["side"], masters[pd["parent"]][0])
            its += "".join(item_xml(it, pd["side"]) for it in by_page.get(n, []))
        binding = 0 if (len(g) == 1 and pdef[g[0]]["side"] == "R") else 1
        files[f"Spreads/Spread_{sid}.xml"] = spread_file(
            "Spread", sid,
            f'PageCount="{len(g)}" BindingLocation="{binding}" AllowPageShuffle="true" ShowMasterItems="true" '
            f'PageTransitionType="None" FlattenerOverride="Default" ItemTransform="1 0 0 1 0 0"',
            pages, its)

    for sid, xml in STORIES:
        files[f"Stories/Story_{sid}.xml"] = xml

    files["Resources/Graphic.xml"] = graphic_xml()
    files["Resources/Styles.xml"] = styles_xml()
    files["Resources/Preferences.xml"] = preferences_xml()
    files["Resources/Fonts.xml"] = HEAD + f'<idPkg:Fonts {NS} DOMVersion="{DOM}"></idPkg:Fonts>'
    files["META-INF/container.xml"] = (
        HEAD + '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
        '<rootfiles><rootfile full-path="designmap.xml" media-type="text/xml"/></rootfiles></container>')

    layers = "".join(
        f'<Layer Self="{LAYER_ID[n]}" Name={a(n)} Visible="true" Locked="{"true" if n == "Background" else "false"}" '
        f'IgnoreWrap="false" ShowGuides="true" LockGuides="false" UI="true" Expendable="true" Printable="true">'
        f'<Properties><LayerColor type="enumeration">{c}</LayerColor></Properties></Layer>'
        for n, c in zip(reversed(B.LAYERS), ["Magenta", "Blue", "Gold", "Green", "Red", "LightBlue"]))  # top first
    design = (HEAD + f'<?aid style="50" type="document" readerVersion="6.0" featureSet="257" product="{DOM}(0)" ?>\n'
              f'<Document {NS} DOMVersion="{DOM}" Self="d" StoryList="{" ".join(s for s, _ in STORIES)}" '
              f'Name="PatternDesignPlanner_Interior" ZeroPoint="0 0" ActiveLayer="{LAYER_ID["Labels & Type"]}" '
              f'CMYKProfile="Coated FOGRA39 (ISO 12647-2:2004)" RGBProfile="sRGB IEC61966-2.1" '
              f'SolidColorIntent="UseColorSettings" AfterBlendingIntent="UseColorSettings" '
              f'DefaultImageIntent="UseColorSettings" RGBPolicy="PreserveEmbeddedProfiles" '
              f'CMYKPolicy="CombinationOfPreserveAndSafeCmyk" AccurateLABSpots="false">'
              '<idPkg:Graphic src="Resources/Graphic.xml"/>'
              '<idPkg:Fonts src="Resources/Fonts.xml"/>'
              '<idPkg:Styles src="Resources/Styles.xml"/>'
              '<idPkg:Preferences src="Resources/Preferences.xml"/>'
              + layers
              + "".join(f'<idPkg:MasterSpread src="MasterSpreads/MasterSpread_{m[0]}.xml"/>' for m in masters.values())
              + "".join(f'<idPkg:Spread src="Spreads/Spread_{s}.xml"/>' for s in spread_ids)
              + f'<Section Self="uSection1" Length="{len(B.PAGES)}" Name="" ContinueNumbering="false" '
                f'IncludeSectionPrefix="false" PageNumberStyle="Arabic" PageStart="{first_page}" SectionPrefix="" '
                f'PageNumberStart="1" Marker=""/>'
              + "".join(f'<idPkg:Story src="Stories/Story_{s}.xml"/>' for s, _ in STORIES)
              + '</Document>')
    files["designmap.xml"] = design

    with zipfile.ZipFile(out_path, "w") as z:
        z.writestr(zipfile.ZipInfo("mimetype"), "application/vnd.adobe.indesign-idml-package",
                   compress_type=zipfile.ZIP_STORED)
        for name, xml in files.items():
            z.writestr(name, xml.encode("utf-8"), compress_type=zipfile.ZIP_DEFLATED)
    return out_path, len(files)


if __name__ == "__main__":
    out, n = build(os.path.join(B.HERE, "PatternDesignPlanner_Interior.idml"))
    print(f"IDML: {out} ({n} package parts, {len(STORIES)} stories)")
