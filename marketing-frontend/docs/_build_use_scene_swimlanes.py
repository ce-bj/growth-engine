# -*- coding: utf-8 -*-
"""Add sheet: 使用场景 泳道图. Style copied from 后台泳道."""
from pathlib import Path

DRAWIO = Path(__file__).with_name("AI智能落地页-运营链与访客链.drawio")

COL_W = 188
BOX_W = 168
BOX_H = 56
X0 = 130
PAD = 10
HDR_H = 40
FTR_H = 40
TITLE_GAP = 36

E = (
    "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=0;jettySize=0;"
    "html=1;strokeWidth=1.4;endArrow=block;endFill=1;fontSize=10;"
    "fontFamily=Microsoft YaHei;fontColor={fc};strokeColor={sc};"
    "exitX={ex};exitY={ey};exitDx=0;exitDy=0;"
    "entryX={enx};entryY={eny};entryDx=0;entryDy=0;{extra}"
)

USER_BOX = (
    "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#1B365D;"
    "fontColor=#FFFFFF;strokeColor=#1B365D;strokeWidth=1.5;fontSize=11;"
    "fontFamily=Microsoft YaHei;"
)
UI_BOX = (
    "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#FFFFFF;"
    "strokeColor=#2B6CB0;strokeWidth=1.5;fontSize=11;fontFamily=Microsoft YaHei;"
)
AGENT_BOX = (
    "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#FFFFFF;"
    "strokeColor=#6B46C1;strokeWidth=1.5;fontSize=11;fontFamily=Microsoft YaHei;"
)
KB_BOX = (
    "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#FFFFFF;"
    "strokeColor=#276749;strokeWidth=1.5;fontSize=11;fontFamily=Microsoft YaHei;"
)
SITE_BOX = (
    "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#FFFFFF;"
    "strokeColor=#2C7A7B;strokeWidth=1.5;fontSize=11;fontFamily=Microsoft YaHei;"
)
SITE_OK = (
    "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#C6F6D5;"
    "strokeColor=#276749;strokeWidth=1.5;fontSize=11;fontFamily=Microsoft YaHei;"
)
INQ_BOX = (
    "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#C6F6D5;"
    "strokeColor=#38A169;strokeWidth=1.5;fontSize=11;fontFamily=Microsoft YaHei;"
)
STAT_BOX = (
    "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#FFFAF0;"
    "strokeColor=#DD6B20;strokeWidth=1.5;fontSize=11;fontFamily=Microsoft YaHei;"
)
OPT_BOX = (
    "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#F7FAFC;"
    "strokeColor=#A0AEC0;strokeWidth=1.5;fontSize=11;fontFamily=Microsoft YaHei;dashed=1;"
)
SUB_BOX = (
    "shape=ext;double=1;rounded=1;whiteSpace=wrap;html=1;arcSize=8;"
    "fillColor=#EBF8FF;strokeColor=#2B6CB0;strokeWidth=2;fontSize=11;"
    "fontStyle=1;fontFamily=Microsoft YaHei;"
)
DIA = (
    "rhombus;whiteSpace=wrap;html=1;fillColor=#FFF7E6;strokeColor=#DD6B20;"
    "strokeWidth=2;fontSize=11;fontStyle=1;fontFamily=Microsoft YaHei;"
)
END = (
    "ellipse;whiteSpace=wrap;html=1;fillColor=#276749;fontColor=#FFFFFF;"
    "strokeColor=#276749;fontSize=12;fontStyle=1;fontFamily=Microsoft YaHei;"
)
TXT = (
    "text;html=1;strokeColor=none;fillColor=none;align=left;"
    "fontFamily=Microsoft YaHei;fontSize={fs};fontStyle={st};fontColor={fc};"
)

PAL = {
    "user": ("#EDF2F7", "#1B365D"),
    "cap": ("#EBF8FF", "#2B6CB0"),
    "agent": ("#FAF5FF", "#6B46C1"),
    "kb": ("#F0FFF4", "#276749"),
    "site": ("#E6FFFA", "#2C7A7B"),
    "inq": ("#C6F6D5", "#38A169"),
    "stat": ("#FFFAF0", "#DD6B20"),
    "opt": ("#F7FAFC", "#A0AEC0"),
}

rows = []


def cx(i, x0=X0):
    return x0 + i * COL_W


def bx(i, x0=X0):
    return cx(i, x0) + PAD


def vertex(cid, value, style, x, y, w, h):
    rows.append(
        f'        <mxCell id="{cid}" value="{value}" style="{style}" parent="1" vertex="1">\n'
        f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry" />\n'
        f"        </mxCell>"
    )


def edge(eid, source, target, sc, ex, ey, enx, eny, value="", extra="", fc=None, points=None):
    fc = fc or sc
    val = f' value="{value}"' if value else ""
    st = E.format(fc=fc, sc=sc, ex=ex, ey=ey, enx=enx, eny=eny, extra=extra)
    if points:
        pts = "\n".join(f'              <mxPoint x="{x}" y="{y}" />' for x, y in points)
        geom = (
            f'          <mxGeometry relative="1" as="geometry">\n'
            f'            <Array as="points">\n{pts}\n            </Array>\n'
            f"          </mxGeometry>\n"
        )
    else:
        geom = '          <mxGeometry relative="1" as="geometry" />\n'
    rows.append(
        f'        <mxCell id="{eid}"{val} style="{st}" parent="1" source="{source}" target="{target}" edge="1">\n'
        f"{geom}"
        f"        </mxCell>"
    )


def chrome(prefix, y_title, title, subtitle, columns, content_h):
    """columns: list of (header_name, pal_key, dashed)."""
    n = len(columns)
    y_hdr = y_title + TITLE_GAP
    y_bg = y_hdr + HDR_H
    y_ftr = y_bg + content_h
    total_w = n * COL_W
    vertex(
        f"{prefix}t",
        title,
        TXT.format(fs=16, st=1, fc="#1B365D"),
        X0,
        y_title,
        900,
        24,
    )
    vertex(
        f"{prefix}s",
        subtitle,
        TXT.format(fs=12, st=0, fc="#4A5568"),
        X0,
        y_title + 24,
        1100,
        18,
    )
    for i, (name, pal, dashed) in enumerate(columns):
        fill, stroke = PAL[pal]
        d = "dashed=1;" if dashed else ""
        hs = (
            f"rounded=0;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};"
            f"strokeWidth=2;fontColor={stroke};fontSize=14;fontStyle=1;"
            f"fontFamily=Microsoft YaHei;{d}"
        )
        vertex(f"{prefix}h{i}", name, hs, cx(i), y_hdr, COL_W, HDR_H)
        bs = (
            f"rounded=0;fillColor={fill};fillOpacity=28;strokeColor={stroke};"
            f"strokeWidth=2;{d}"
        )
        vertex(f"{prefix}bg{i}", "", bs, cx(i), y_bg, COL_W, content_h)
        vertex(f"{prefix}f{i}", name, hs, cx(i), y_ftr, COL_W, FTR_H)
    return y_bg, y_ftr + FTR_H, total_w


# ----- page title + legend -----
vertex(
    "usl-title",
    "使用场景 泳道图：每个角色对接哪些系统",
    TXT.format(fs=20, st=1, fc="#1B365D"),
    X0,
    20,
    900,
    28,
)
vertex(
    "usl-sub",
    "「后台泳道」整页在这里收成子流程「AI营销页生成能力」。本页只画各角色怎么接到系统；线不跨组、不斜穿。",
    TXT.format(fs=12, st=0, fc="#4A5568"),
    X0,
    50,
    1200,
    20,
)
vertex(
    "usl-leg1",
    "AI营销页生成能力&lt;br&gt;&lt;font style=&quot;font-size:10px&quot;&gt;子流程 = 后台泳道整页&lt;/font&gt;",
    SUB_BOX,
    130,
    76,
    220,
    52,
)
vertex(
    "usl-leg2",
    "虚线列 / 虚线框&lt;br&gt;&lt;font style=&quot;font-size:10px&quot;&gt;外部系统，本产品不改账户&lt;/font&gt;",
    OPT_BOX,
    370,
    76,
    220,
    52,
)
vertex(
    "usl-leg3",
    "实线列 = 本产品对接的系统&lt;br&gt;&lt;font style=&quot;font-size:10px&quot;&gt;生成能力 / 站点 / 询盘 / 统计 / 档案&lt;/font&gt;",
    UI_BOX,
    610,
    76,
    280,
    52,
)

SUB_TXT = (
    "AI营销页生成能力&lt;br&gt;"
    "&lt;font style=&quot;font-size:10px&quot;&gt;子流程：意图 → 方案 → 出稿 → 发布&lt;br&gt;详见「后台泳道」整页&lt;/font&gt;"
)

# ========== 1 客户/运营 ==========
y_bg, y_next, _ = chrome(
    "g1",
    148,
    "一、客户 / 运营",
    "对接系统：AI营销页生成能力、站点、询盘系统、统计埋点。何时：要给某一类采购做承接页。",
    [
        ("客户 / 运营", "user", False),
        ("AI营销页生成能力", "cap", False),
        ("站点", "site", False),
        ("询盘系统", "inq", False),
        ("统计埋点", "stat", False),
    ],
    640,
)
vertex("g1n1", "打开生成界面&lt;br&gt;准备做一页承接页", USER_BOX, bx(0), y_bg + 20, BOX_W, BOX_H)
vertex("g1n2", SUB_TXT, SUB_BOX, bx(1), y_bg + 16, BOX_W, 96)
vertex("g1n3", "发布站内真 URL&lt;br&gt;写 sitemap，可插内链 / 登记横幅", SITE_OK, bx(2), y_bg + 140, BOX_W, 64)
vertex("g1n4", "看到已发布链接", USER_BOX, bx(0), y_bg + 144, BOX_W, BOX_H)
vertex("g1n5", "营销页被访问&lt;br&gt;搜索直达 / 内链 / 横幅", SITE_OK, bx(2), y_bg + 236, BOX_W, BOX_H)
vertex("g1n6", "写入线索&lt;br&gt;page / 意图 / UTM", INQ_BOX, bx(3), y_bg + 236, BOX_W, BOX_H)
vertex("g1n7", "记 PV / 停留 / 提交", STAT_BOX, bx(4), y_bg + 332, BOX_W, BOX_H)
vertex("g1n8", "把数展示给用户&lt;br&gt;一期只出数", UI_BOX, bx(1), y_bg + 428, BOX_W, BOX_H)
vertex("g1n9", "看数", USER_BOX, bx(0), y_bg + 428, BOX_W, BOX_H)
vertex("g1n10", "结束", END, bx(0) + 14, y_bg + 524, 140, 40)
vertex(
    "g1n11",
    "自进化：下次意图排序、&lt;br&gt;内链 / 横幅强弱",
    AGENT_BOX,
    bx(1),
    y_bg + 516,
    BOX_W,
    BOX_H,
)
edge("g1e1", "g1n1", "g1n2", "#1B365D", 1, 0.5, 0, 0.35)
edge("g1e2", "g1n2", "g1n3", "#2C7A7B", 0.5, 1, 0.5, 0, "发布")
edge("g1e3", "g1n3", "g1n4", "#1B365D", 0, 0.5, 1, 0.5, "回 URL")
edge("g1e4", "g1n3", "g1n5", "#A0AEC0", 0.5, 1, 0.5, 0, "上线后", extra="dashed=1;")
edge("g1e5", "g1n5", "g1n6", "#38A169", 1, 0.5, 0, 0.5, "留资")
edge("g1e6", "g1n5", "g1n7", "#DD6B20", 0.5, 1, 0, 0.5, "记数")
edge("g1e7", "g1n6", "g1n8", "#2B6CB0", 0, 1, 1, 0.3, "回流")
edge("g1e8", "g1n7", "g1n8", "#DD6B20", 0, 0.5, 1, 0.7, "回流")
edge("g1e9", "g1n8", "g1n9", "#1B365D", 0, 0.5, 1, 0.5)
edge("g1e10", "g1n9", "g1n10", "#276749", 0.5, 1, 0.5, 0)
edge("g1e11", "g1n8", "g1n11", "#6B46C1", 0.5, 1, 0.5, 0, "自进化", extra="dashed=1;")

# ========== 2 SEO ==========
y_bg, y_next, _ = chrome(
    "g2",
    y_next + 48,
    "二、SEO",
    "对接系统：AI营销页生成能力、站点。何时：做内链但还没有对应意图页。已有页则只插链，不进子流程。",
    [
        ("SEO", "user", False),
        ("AI营销页生成能力", "cap", False),
        ("站点", "site", False),
    ],
    520,
)
vertex("g2n1", "做内链，需要对应意图页", USER_BOX, bx(0), y_bg + 16, BOX_W, BOX_H)
vertex("g2d1", "已有对应意图页？", DIA, bx(0) + 9, y_bg + 96, 150, 70)
vertex("g2n2", "只插入锚文本 / 内链&lt;br&gt;不再出页", SITE_OK, bx(2), y_bg + 104, BOX_W, BOX_H)
vertex("g2n3", "结束（只插链）", END, bx(2) + 14, y_bg + 188, 140, 40)
vertex("g2n4", "调用本功能&lt;br&gt;一次出「页 + 链」", USER_BOX, bx(0), y_bg + 188, BOX_W, BOX_H)
vertex("g2n5", SUB_TXT, SUB_BOX, bx(1), y_bg + 260, BOX_W, 88)
vertex("g2n6", "新页真 URL&lt;br&gt;并插入首页 / 栏目 / 产品页内链", SITE_OK, bx(2), y_bg + 372, BOX_W, 64)
vertex("g2n7", "结束（出页+链）", END, bx(0) + 14, y_bg + 452, 140, 40)
edge("g2e1", "g2n1", "g2d1", "#1B365D", 0.5, 1, 0.5, 0)
edge("g2e2", "g2d1", "g2n2", "#276749", 1, 0.5, 0, 0.5, "是")
edge("g2e3", "g2n2", "g2n3", "#276749", 0.5, 1, 0.5, 0)
edge("g2e4", "g2d1", "g2n4", "#DD6B20", 0.5, 1, 0.5, 0, "否")
edge("g2e5", "g2n4", "g2n5", "#2B6CB0", 1, 0.5, 0, 0.35)
edge("g2e6", "g2n5", "g2n6", "#2C7A7B", 0.5, 1, 0.5, 0, "发布+插链")
edge("g2e7", "g2n6", "g2n7", "#276749", 0, 1, 1, 0.5)

# ========== 3 内容运营 ==========
y_bg, y_next, _ = chrome(
    "g3",
    y_next + 48,
    "三、内容运营",
    "对接系统：AI营销页生成能力、站点。何时：发文 / 社媒需要可点的承接页。有 URL 就引用，没有再出页。",
    [
        ("内容运营", "user", False),
        ("AI营销页生成能力", "cap", False),
        ("站点", "site", False),
    ],
    520,
)
vertex("g3n1", "发文 / 社媒需要可点承接页", USER_BOX, bx(0), y_bg + 16, BOX_W, BOX_H)
vertex("g3d1", "已有真 URL？", DIA, bx(0) + 9, y_bg + 96, 150, 70)
vertex("g3n2", "在文章 / 栏目里引用该 URL", SITE_OK, bx(2), y_bg + 104, BOX_W, BOX_H)
vertex("g3n3", "结束（只引用）", END, bx(2) + 14, y_bg + 188, 140, 40)
vertex("g3n4", "调用本功能出页", USER_BOX, bx(0), y_bg + 188, BOX_W, BOX_H)
vertex("g3n5", SUB_TXT, SUB_BOX, bx(1), y_bg + 260, BOX_W, 88)
vertex("g3n6", "新页真 URL&lt;br&gt;插入内容页 / 栏目内链", SITE_OK, bx(2), y_bg + 372, BOX_W, 64)
vertex("g3n7", "结束（出页+引用）", END, bx(0) + 14, y_bg + 452, 140, 40)
edge("g3e1", "g3n1", "g3d1", "#1B365D", 0.5, 1, 0.5, 0)
edge("g3e2", "g3d1", "g3n2", "#276749", 1, 0.5, 0, 0.5, "是")
edge("g3e3", "g3n2", "g3n3", "#276749", 0.5, 1, 0.5, 0)
edge("g3e4", "g3d1", "g3n4", "#DD6B20", 0.5, 1, 0.5, 0, "否")
edge("g3e5", "g3n4", "g3n5", "#2B6CB0", 1, 0.5, 0, 0.35)
edge("g3e6", "g3n5", "g3n6", "#2C7A7B", 0.5, 1, 0.5, 0, "发布+插链")
edge("g3e7", "g3n6", "g3n7", "#276749", 0, 1, 1, 0.5)

# ========== 4 优化师 ==========
y_bg, y_next, _ = chrome(
    "g4",
    y_next + 48,
    "四、优化师（可选）",
    "对接系统：站点（拿真 URL）、广告平台（外部，不改账户）。要新页时经过客户/运营 + 生成能力。默认不进子流程。",
    [
        ("优化师", "opt", True),
        ("客户 / 运营", "user", False),
        ("AI营销页生成能力", "cap", False),
        ("站点", "site", False),
        ("广告平台（外部）", "opt", True),
    ],
    600,
)
vertex("g4n1", "广告需要到达页", OPT_BOX, bx(0), y_bg + 16, BOX_W, BOX_H)
vertex("g4d1", "已有真 URL？", DIA, bx(0) + 9, y_bg + 96, 150, 70)
vertex("g4n2", "请运营先出一页", USER_BOX, bx(1), y_bg + 104, BOX_W, BOX_H)
vertex("g4n3", "复制已发布真 URL", OPT_BOX, bx(0), y_bg + 188, BOX_W, BOX_H)
vertex("g4n4", "把 URL 贴进广告&lt;br&gt;本产品不改广告账户", OPT_BOX, bx(4), y_bg + 188, BOX_W, BOX_H)
vertex("g4n5", "结束（只用已有页）", END, bx(4) + 14, y_bg + 268, 140, 40)
vertex("g4n6", SUB_TXT, SUB_BOX, bx(2), y_bg + 280, BOX_W, 88)
vertex("g4n7", "发布站内真 URL", SITE_OK, bx(3), y_bg + 392, BOX_W, BOX_H)
vertex("g4n8", "拿到新页 URL 并复制", OPT_BOX, bx(0), y_bg + 392, BOX_W, BOX_H)
vertex("g4n9", "把新 URL 贴进广告", OPT_BOX, bx(4), y_bg + 480, BOX_W, BOX_H)
vertex("g4n10", "结束（新页投放）", END, bx(4) + 14, y_bg + 552, 140, 40)
edge("g4e1", "g4n1", "g4d1", "#A0AEC0", 0.5, 1, 0.5, 0, extra="dashed=1;")
edge("g4e2", "g4d1", "g4n3", "#A0AEC0", 0.5, 1, 0.5, 0, "是", extra="dashed=1;")
edge("g4e3", "g4n3", "g4n4", "#A0AEC0", 1, 0.5, 0, 0.5, "复制去贴", extra="dashed=1;")
edge("g4e4", "g4n4", "g4n5", "#A0AEC0", 0.5, 1, 0.5, 0, extra="dashed=1;")
edge("g4e5", "g4d1", "g4n2", "#1B365D", 1, 0.5, 0, 0.5, "否")
edge("g4e6", "g4n2", "g4n6", "#2B6CB0", 0.5, 1, 0, 0.35)
edge("g4e7", "g4n6", "g4n7", "#2C7A7B", 1, 0.5, 0, 0.5, "发布")
edge("g4e8", "g4n7", "g4n8", "#A0AEC0", 0, 0.5, 1, 0.5, "回 URL")
edge("g4e9", "g4n8", "g4n9", "#A0AEC0", 1, 0.5, 0, 0.5, extra="dashed=1;")
edge("g4e10", "g4n9", "g4n10", "#A0AEC0", 0.5, 1, 0.5, 0, extra="dashed=1;")

# ========== 5 其他 AI Agent ==========
y_bg, y_next, _ = chrome(
    "g5",
    y_next + 48,
    "五、其他 AI Agent",
    "对接系统：AI营销页生成能力、客户/运营（确认闸门）、站点。客户不直接对 Agent；有对外承诺必须停人确认。",
    [
        ("其他 AI Agent", "agent", False),
        ("客户 / 运营", "user", False),
        ("AI营销页生成能力", "cap", False),
        ("站点", "site", False),
    ],
    600,
)
vertex("g5n1", "诊断到缺口&lt;br&gt;或获客任务需要落地 URL", AGENT_BOX, bx(0), y_bg + 16, BOX_W, BOX_H)
vertex("g5n2", "下任务调用本功能&lt;br&gt;不让客户直接对 Agent", AGENT_BOX, bx(0), y_bg + 96, BOX_W, BOX_H)
vertex("g5n3", SUB_TXT, SUB_BOX, bx(2), y_bg + 88, BOX_W, 88)
vertex("g5d1", "有对外承诺或&lt;br&gt;不可代笔缺口？", DIA, bx(2) + 9, y_bg + 200, 150, 78)
vertex("g5n4", "确认方案后再发布", USER_BOX, bx(1), y_bg + 212, BOX_W, BOX_H)
vertex("g5n5", "发布（确认后或自动）", SITE_OK, bx(2), y_bg + 308, BOX_W, BOX_H)
vertex("g5n6", "站内真 URL", SITE_OK, bx(3), y_bg + 308, BOX_W, BOX_H)
vertex("g5n7", "把 URL 交回任务", AGENT_BOX, bx(0), y_bg + 404, BOX_W, BOX_H)
vertex("g5n8", "结束", END, bx(0) + 14, y_bg + 492, 140, 40)
edge("g5e1", "g5n1", "g5n2", "#6B46C1", 0.5, 1, 0.5, 0)
edge("g5e2", "g5n2", "g5n3", "#2B6CB0", 1, 0.5, 0, 0.45)
edge("g5e3", "g5n3", "g5d1", "#DD6B20", 0.5, 1, 0.5, 0)
edge("g5e4", "g5d1", "g5n4", "#DD6B20", 0, 0.5, 1, 0.5, "是")
edge("g5e5", "g5n4", "g5n5", "#276749", 0.5, 1, 0, 0.5, "确认后")
edge("g5e6", "g5d1", "g5n5", "#276749", 0.5, 1, 0.5, 0, "否")
edge("g5e7", "g5n5", "g5n6", "#2C7A7B", 1, 0.5, 0, 0.5, "发布")
edge("g5e8", "g5n6", "g5n7", "#6B46C1", 0, 1, 1, 0.5, "回 URL")
edge("g5e9", "g5n7", "g5n8", "#276749", 0.5, 1, 0.5, 0)

# ========== 6 定时任务 ==========
y_bg, y_next, _ = chrome(
    "g6",
    y_next + 48,
    "六、定时任务（自闭环）",
    "对接系统：Ads/GSC（可选）、网站档案、AI营销页生成能力、客户/运营（确认闸门）、站点、统计埋点。走同一套出页。",
    [
        ("定时任务", "stat", False),
        ("Ads / GSC（可选）", "opt", True),
        ("网站档案", "kb", False),
        ("AI营销页生成能力", "cap", False),
        ("客户 / 运营", "user", False),
        ("站点", "site", False),
        ("统计埋点", "stat", False),
    ],
    720,
)
vertex("g6n1", "到点扫描&lt;br&gt;新词或意图缺口", STAT_BOX, bx(0), y_bg + 16, BOX_W, BOX_H)
vertex("g6d1", "有 Ads / GSC&lt;br&gt;授权？", DIA, bx(0) + 9, y_bg + 96, 150, 70)
vertex("g6n2", "拉广告词 / GSC 自然搜索词", OPT_BOX, bx(1), y_bg + 104, BOX_W, BOX_H)
vertex("g6n3", "不手填关键词&lt;br&gt;按档案推建议意图", STAT_BOX, bx(0), y_bg + 192, BOX_W, BOX_H)
vertex("g6n4", "提供行业 / 主推产品 / 品牌&lt;br&gt;以及建议意图类型", KB_BOX, bx(2), y_bg + 192, BOX_W, BOX_H)
vertex("g6n5", SUB_TXT, SUB_BOX, bx(3), y_bg + 280, BOX_W, 88)
vertex("g6d2", "有对外承诺或&lt;br&gt;不可代笔缺口？", DIA, bx(3) + 9, y_bg + 392, 150, 78)
vertex("g6n6", "确认方案后再发布", USER_BOX, bx(4), y_bg + 404, BOX_W, BOX_H)
vertex("g6n7", "发布（确认后或自动）", SITE_OK, bx(3), y_bg + 500, BOX_W, BOX_H)
vertex("g6n8", "站内真 URL&lt;br&gt;sitemap / 内链 / 横幅规则", SITE_OK, bx(5), y_bg + 500, BOX_W, 64)
vertex("g6n9", "记数回流&lt;br&gt;询盘 / PV / 提交，并回写缺口优先级", STAT_BOX, bx(6), y_bg + 500, BOX_W, 64)
vertex("g6n10", "自进化已记入下次扫描", STAT_BOX, bx(6), y_bg + 600, BOX_W, BOX_H)
vertex("g6n11", "结束（等待下次）", END, bx(5) + 14, y_bg + 608, 140, 40)
edge("g6e1", "g6n1", "g6d1", "#DD6B20", 0.5, 1, 0.5, 0)
edge("g6e2", "g6d1", "g6n2", "#A0AEC0", 1, 0.5, 0, 0.5, "是", extra="dashed=1;")
edge("g6e3", "g6n2", "g6n5", "#2B6CB0", 0.5, 1, 0.35, 0, extra="dashed=1;")
edge("g6e4", "g6d1", "g6n3", "#DD6B20", 0.5, 1, 0.5, 0, "否")
edge("g6e5", "g6n3", "g6n4", "#276749", 1, 0.5, 0, 0.5, "查档案")
edge("g6e6", "g6n4", "g6n5", "#2B6CB0", 1, 0.5, 0, 0.55)
edge("g6e7", "g6n5", "g6d2", "#DD6B20", 0.5, 1, 0.5, 0)
edge("g6e8", "g6d2", "g6n6", "#DD6B20", 1, 0.5, 0, 0.5, "是")
edge("g6e9", "g6n6", "g6n7", "#276749", 0, 1, 1, 0.5, "确认后")
edge("g6e10", "g6d2", "g6n7", "#276749", 0.5, 1, 0.5, 0, "否")
edge("g6e11", "g6n7", "g6n8", "#2C7A7B", 1, 0.5, 0, 0.5, "发布")
edge("g6e12", "g6n8", "g6n9", "#DD6B20", 1, 0.5, 0, 0.5, "上线后", extra="dashed=1;")
edge("g6e13", "g6n9", "g6n10", "#E53E3E", 0.5, 1, 0.5, 0, "记入", extra="dashed=1;")
edge("g6e14", "g6n8", "g6n11", "#276749", 0.5, 1, 0.5, 0)

vertex(
    "usl-note",
    "子流程「AI营销页生成能力」= 现有「后台泳道」完整流程，此处不再展开 Agent / 知识库内部步骤。"
    "SEO / 内容运营 / 优化师在已有页时不进子流程。"
    "Agent 与定时走同一套出页；有对外承诺或不可代笔缺口必须停在客户确认。"
    "广告平台、Ads/GSC 是外部可选，产品不改其账户。",
    "shape=note;whiteSpace=wrap;html=1;size=14;fillColor=#FFFFCC;strokeColor=#D69E2E;"
    "align=left;spacingLeft=8;fontSize=11;fontColor=#4A5568;fontFamily=Microsoft YaHei;",
    X0,
    y_next + 24,
    1316,
    56,
)

page_h = y_next + 100
body = "\n".join(rows)
diagram = f"""  <diagram id="use-scene-swimlanes" name="使用场景 泳道图">
    <mxGraphModel dx="1400" dy="800" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1720" pageHeight="{page_h}" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
{body}
      </root>
    </mxGraphModel>
  </diagram>"""

text = DRAWIO.read_text(encoding="utf-8")
if 'id="use-scene-swimlanes"' in text:
    start = text.find('<diagram id="use-scene-swimlanes"')
    while start > 0 and text[start - 1] in " \t":
        start -= 1
    end = text.find("</mxfile>")
    text = text[:start] + text[end:]

import re

text = re.sub(r'pages="\d+"', 'pages="5"', text, count=1)
end = text.find("</mxfile>")
if end < 0:
    raise SystemExit("no mxfile end")
DRAWIO.write_text(text[:end] + diagram + "\n" + text[end:], encoding="utf-8")
print("wrote use-scene-swimlanes, pageHeight", page_h, "cells", len(rows))
