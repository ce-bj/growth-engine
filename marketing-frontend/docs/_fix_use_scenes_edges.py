# -*- coding: utf-8 -*-
"""Rewrite 使用场景 page: orthogonal edges only, no crossings."""
from pathlib import Path

DRAWIO = Path(__file__).with_name("AI智能落地页-运营链与访客链.drawio")

E = (
    "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=0;jettySize=0;"
    "html=1;strokeWidth=1.4;endArrow=block;endFill=1;fontSize=10;"
    "fontFamily=Microsoft YaHei;fontColor={fc};strokeColor={sc};"
    "exitX={ex};exitY={ey};exitDx=0;exitDy=0;"
    "entryX={enx};entryY={eny};entryDx=0;entryDy=0;{extra}"
)

BOX = (
    "rounded=1;whiteSpace=wrap;html=1;arcSize=8;fontFamily=Microsoft YaHei;"
    "fillColor={fill};strokeColor={stroke};strokeWidth={sw};fontSize={fs};"
    "fontColor={fc};{extra}"
)

DIA = (
    "rhombus;whiteSpace=wrap;html=1;fontFamily=Microsoft YaHei;fontStyle=1;"
    "fillColor=#FFF7E6;strokeColor=#DD6B20;strokeWidth=2;fontSize=11;"
)


def cell(cid, value, style, x, y, w, h, vertex=True):
    geom = f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry" />'
    kind = 'vertex="1"' if vertex else ""
    return (
        f'        <mxCell id="{cid}" value="{value}" style="{style}" '
        f'parent="1" {kind}>\n          {geom}\n        </mxCell>'
    )


def edge(eid, source, target, style, value=""):
    val = f' value="{value}"' if value else ""
    return (
        f'        <mxCell id="{eid}"{val} style="{style}" parent="1" '
        f'source="{source}" target="{target}" edge="1">\n'
        f'          <mxGeometry relative="1" as="geometry" />\n'
        f"        </mxCell>"
    )


def edge_pts(eid, source, target, style, points, value=""):
    val = f' value="{value}"' if value else ""
    pts = "\n".join(f'              <mxPoint x="{x}" y="{y}" />' for x, y in points)
    return (
        f'        <mxCell id="{eid}"{val} style="{style}" parent="1" '
        f'source="{source}" target="{target}" edge="1">\n'
        f'          <mxGeometry relative="1" as="geometry">\n'
        f'            <Array as="points">\n{pts}\n            </Array>\n'
        f"          </mxGeometry>\n"
        f"        </mxCell>"
    )


# --- coordinates ---
# actors
W, H = 250, 92
who = [
    (40, 96),
    (306, 96),
    (572, 96),
    (838, 96),
    (1104, 96),
    (1370, 96),
]
who_cx = [x + W / 2 for x, _ in who]
HUB_X, HUB_W = 40, 1580
hub_entry = [round((cx - HUB_X) / HUB_W, 4) for cx in who_cx]

# p1 bar drops to 4 qualify boxes
p_boxes = [(80, 424), (470, 424), (860, 424), (1250, 424)]
p_w, p_h = 280, 48
p_cx = [x + p_w / 2 for x, _ in p_boxes]
p1_entry = [round((cx - HUB_X) / HUB_W, 4) for cx in p_cx]

# merge bus entries from scene terminals (aligned to each column spine)
# 1y:145+75=220, 2c:500+110=610, 3c:925+75=1000, 3yes:1090+45=1135, 4c:1280+110=1390
bus_src_cx = [220, 610, 1000, 1135, 1390]
bus_entry = [round((cx - HUB_X) / HUB_W, 4) for cx in bus_src_cx]

human_cx = 480 + 90  # 570
auto_cx = 1030 + 90  # 1120
p1_h = round((human_cx - HUB_X) / HUB_W, 4)
p1_a = round((auto_cx - HUB_X) / HUB_W, 4)
hub_to_need = round((840 - HUB_X) / HUB_W, 4)

page_form = round((140 - HUB_X) / HUB_W, 4)  # form center 40+100
page_stat = round((370 - HUB_X) / HUB_W, 4)  # stat 260+110
page_evo = round((710 - HUB_X) / HUB_W, 4)  # evo 500+210

rows = []

# title
rows.append(
    cell(
        "sc-t",
        "使用场景：谁来调用，访客怎么看到",
        "text;html=1;strokeColor=none;fillColor=none;align=left;fontFamily=Microsoft YaHei;fontSize=20;fontStyle=1;fontColor=#1B365D;",
        40,
        16,
        900,
        28,
    )
)
rows.append(
    cell(
        "sc-s",
        "上半触发出页，中段发布具备被看到的资格，下半访客从哪进。线只在各自通道里走，不斜穿、不叠线。",
        "text;html=1;strokeColor=none;fillColor=none;align=left;fontFamily=Microsoft YaHei;fontSize=12;fontColor=#4A5568;",
        40,
        44,
        1400,
        20,
    )
)
rows.append(
    cell(
        "sc-sec0",
        "一、谁、在什么情况下、怎么用（触发生成）",
        "text;html=1;strokeColor=none;fillColor=none;align=left;fontFamily=Microsoft YaHei;fontSize=14;fontStyle=1;fontColor=#1B365D;",
        40,
        68,
        560,
        22,
    )
)

who_vals = [
    (
        "sc-who1",
        "客户 / 运营&lt;br&gt;&lt;font style=&quot;font-size:10px&quot;&gt;何时：要给某一类采购做承接页&lt;br&gt;怎么用：打开生成界面。有 Ads/GSC 则选词；没有则直接推建议意图。确认方案后发布。&lt;/font&gt;",
        BOX.format(
            fill="#1B365D",
            stroke="#1B365D",
            sw="1.5",
            fs="11",
            fc="#FFFFFF",
            extra="",
        ),
    ),
    (
        "sc-who2",
        "SEO&lt;br&gt;&lt;font style=&quot;font-size:10px&quot;&gt;何时：做内链，但还没有对应意图页&lt;br&gt;怎么用：调用本功能，一次出「页 + 锚文本/内链」。已有页则只插链，不再出页。&lt;/font&gt;",
        BOX.format(
            fill="#1B365D",
            stroke="#1B365D",
            sw="1.5",
            fs="11",
            fc="#FFFFFF",
            extra="",
        ),
    ),
    (
        "sc-who3",
        "内容运营&lt;br&gt;&lt;font style=&quot;font-size:10px&quot;&gt;何时：发文 / 社媒需要可点的承接页&lt;br&gt;怎么用：有现成 URL 就引用；没有就调用本功能出页再插链。&lt;/font&gt;",
        BOX.format(
            fill="#1B365D",
            stroke="#1B365D",
            sw="1.5",
            fs="11",
            fc="#FFFFFF",
            extra="",
        ),
    ),
    (
        "sc-who4",
        "优化师（可选）&lt;br&gt;&lt;font style=&quot;font-size:10px&quot;&gt;何时：广告需要到达页&lt;br&gt;怎么用：通常只复制已发布真 URL 去贴。要新页才进生成。不改广告账户。&lt;/font&gt;",
        BOX.format(
            fill="#F7FAFC",
            stroke="#A0AEC0",
            sw="1.5",
            fs="12",
            fc="#1A202C",
            extra="dashed=1;",
        ),
    ),
    (
        "sc-who5",
        "其他 AI Agent&lt;br&gt;&lt;font style=&quot;font-size:10px&quot;&gt;何时：诊断到某词/某意图没有承接页，或获客任务需要落地 URL&lt;br&gt;怎么用：下任务调用本功能，不让客户直接对 Agent。&lt;/font&gt;",
        BOX.format(
            fill="#FAF5FF",
            stroke="#6B46C1",
            sw="1.5",
            fs="11",
            fc="#1A202C",
            extra="",
        ),
    ),
    (
        "sc-who6",
        "定时任务（自闭环）&lt;br&gt;&lt;font style=&quot;font-size:10px&quot;&gt;何时：定期扫新词或意图缺口&lt;br&gt;怎么用：有 Ads/GSC 则拉新词；没有则按档案推意图。走同一套出页。&lt;/font&gt;",
        BOX.format(
            fill="#FFFAF0",
            stroke="#DD6B20",
            sw="2",
            fs="11",
            fc="#1A202C",
            extra="",
        ),
    ),
]
for i, ((x, y), (cid, val, st)) in enumerate(zip(who, who_vals)):
    rows.append(cell(cid, val, st, x, y, W, H))

rows.append(
    cell(
        "sc-hub",
        "本功能：意图 → 方案 → 出稿 → 发布&lt;br&gt;&lt;font style=&quot;font-size:10px&quot;&gt;六类调用都进这一条。有词用词；没词直接推建议意图类型。不手填关键词。&lt;/font&gt;",
        BOX.format(
            fill="#EBF8FF",
            stroke="#2B6CB0",
            sw="2",
            fs="13",
            fc="#1B365D",
            extra="fontStyle=1;",
        ),
        40,
        208,
        1580,
        48,
    )
)

# who → hub, parallel verticals
who_colors = [
    ("#1B365D", ""),
    ("#1B365D", ""),
    ("#1B365D", ""),
    ("#A0AEC0", "dashed=1;"),
    ("#6B46C1", ""),
    ("#DD6B20", ""),
]
who_labels = ["", "", "", "要新页", "", ""]
for i in range(6):
    sc, extra = who_colors[i]
    st = E.format(fc=sc, sc=sc, ex=0.5, ey=1, enx=hub_entry[i], eny=0, extra=extra)
    rows.append(edge(f"sc-w{i+1}", f"sc-who{i+1}", "sc-hub", st, who_labels[i]))

rows.append(
    cell(
        "sc-human",
        "推给客户确认方案&lt;br&gt;再发布",
        BOX.format(
            fill="#FFFFFF",
            stroke="#2B6CB0",
            sw="1.5",
            fs="12",
            fc="#1A202C",
            extra="",
        ),
        480,
        276,
        180,
        56,
    )
)
rows.append(
    cell(
        "sc-need",
        "有对外承诺&lt;br&gt;或不可代笔缺口？",
        DIA,
        760,
        268,
        160,
        72,
    )
)
rows.append(
    cell(
        "sc-auto",
        "可自动走完发布",
        BOX.format(
            fill="#C6F6D5",
            stroke="#276749",
            sw="2",
            fs="13",
            fc="#1A202C",
            extra="fontStyle=1;",
        ),
        1030,
        276,
        180,
        56,
    )
)

rows.append(
    edge(
        "sc-hubd",
        "sc-hub",
        "sc-need",
        E.format(fc="#2B6CB0", sc="#2B6CB0", ex=hub_to_need, ey=1, enx=0.5, eny=0, extra=""),
    )
)
rows.append(
    edge(
        "sc-ny",
        "sc-need",
        "sc-human",
        E.format(fc="#DD6B20", sc="#DD6B20", ex=0, ey=0.5, enx=1, eny=0.5, extra=""),
        "是",
    )
)
rows.append(
    edge(
        "sc-nn",
        "sc-need",
        "sc-auto",
        E.format(fc="#276749", sc="#276749", ex=1, ey=0.5, enx=0, eny=0.5, extra=""),
        "否",
    )
)

rows.append(
    cell(
        "sc-sec1",
        "二、发布之后：让这页具备被看到的资格",
        "text;html=1;strokeColor=none;fillColor=none;align=left;fontFamily=Microsoft YaHei;fontSize=14;fontStyle=1;fontColor=#1B365D;",
        40,
        336,
        400,
        20,
    )
)
rows.append(
    cell(
        "sc-p1",
        "发布站内真 URL（不是预览 HTML）。确认后的页和自动发布的页，都从这里发出。",
        BOX.format(
            fill="#C6F6D5",
            stroke="#276749",
            sw="2",
            fs="13",
            fc="#1A202C",
            extra="fontStyle=1;",
        ),
        40,
        360,
        1580,
        44,
    )
)
rows.append(
    edge(
        "sc-hp",
        "sc-human",
        "sc-p1",
        E.format(fc="#276749", sc="#276749", ex=0.5, ey=1, enx=p1_h, eny=0, extra=""),
    )
)
rows.append(
    edge(
        "sc-ap",
        "sc-auto",
        "sc-p1",
        E.format(fc="#276749", sc="#276749", ex=0.5, ey=1, enx=p1_a, eny=0, extra=""),
    )
)

p_vals = [
    (
        "sc-p2",
        "写入 sitemap&lt;br&gt;允许爬虫收录 → 场景1",
        BOX.format(fill="#FFFFFF", stroke="#2B6CB0", sw="1.5", fs="12", fc="#1A202C", extra=""),
    ),
    (
        "sc-p3",
        "插入站内内链&lt;br&gt;首页 / 栏目 / 产品页 → 场景2",
        BOX.format(fill="#FFFFFF", stroke="#2B6CB0", sw="1.5", fs="12", fc="#1A202C", extra=""),
    ),
    (
        "sc-p4",
        "登记横幅规则&lt;br&gt;错页才出，爬虫走原页 → 场景3",
        BOX.format(fill="#FFFFFF", stroke="#2B6CB0", sw="1.5", fs="12", fc="#1A202C", extra=""),
    ),
    (
        "sc-p5",
        "复制 URL 给优化师（可选）&lt;br&gt;已有页不进生成 → 场景4",
        BOX.format(
            fill="#F7FAFC",
            stroke="#A0AEC0",
            sw="1.5",
            fs="12",
            fc="#1A202C",
            extra="dashed=1;",
        ),
    ),
]
for (x, y), (cid, val, st) in zip(p_boxes, p_vals):
    rows.append(cell(cid, val, st, x, y, p_w, p_h))

p_ids = ["sc-p2", "sc-p3", "sc-p4", "sc-p5"]
p_edge_extra = ["", "", "", "dashed=1;"]
p_edge_col = ["#2B6CB0", "#2B6CB0", "#2B6CB0", "#A0AEC0"]
for i, tid in enumerate(p_ids):
    rows.append(
        edge(
            f"sc-e1{i+2}",
            "sc-p1",
            tid,
            E.format(
                fc=p_edge_col[i],
                sc=p_edge_col[i],
                ex=p1_entry[i],
                ey=1,
                enx=0.5,
                eny=0,
                extra=p_edge_extra[i],
            ),
        )
    )

# section 3
rows.append(
    cell(
        "sc-sec2",
        "三、访客怎么进来（四列各自向下，底部才汇合）",
        "text;html=1;strokeColor=none;fillColor=none;align=left;fontFamily=Microsoft YaHei;fontSize=14;fontStyle=1;fontColor=#1B365D;",
        40,
        488,
        640,
        20,
    )
)

# light column bands
band = "rounded=0;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};strokeWidth=1;dashed={d};fontColor=none;fillOpacity=40;connectable=0;movable=0;"
rows.append(cell("sc-band1", "", band.format(fill="#EBF8FF", stroke="#BEE3F8", d=0), 40, 512, 360, 300))
rows.append(cell("sc-band2", "", band.format(fill="#EBF8FF", stroke="#BEE3F8", d=0), 430, 512, 360, 300))
rows.append(cell("sc-band3", "", band.format(fill="#FFFAF0", stroke="#FBD38D", d=0), 820, 512, 360, 300))
rows.append(cell("sc-band4", "", band.format(fill="#F7FAFC", stroke="#CBD5E0", d=1), 1210, 512, 360, 300))

h_style_main = BOX.format(
    fill="#EBF8FF", stroke="#2B6CB0", sw="2", fs="13", fc="#2B6CB0", extra="fontStyle=1;"
)
h_style_org = BOX.format(
    fill="#FFFAF0", stroke="#DD6B20", sw="2", fs="13", fc="#C05621", extra="fontStyle=1;"
)
h_style_opt = BOX.format(
    fill="#F7FAFC", stroke="#A0AEC0", sw="2", fs="13", fc="#718096", extra="fontStyle=1;dashed=1;"
)
rows.append(
    cell(
        "sc-h1",
        "场景1 ★ 搜索直达&lt;br&gt;&lt;font style=&quot;font-size:11px&quot;&gt;自然流量主路径&lt;/font&gt;",
        h_style_main,
        40,
        512,
        360,
        44,
    )
)
rows.append(
    cell(
        "sc-h2",
        "场景2 站内内链&lt;br&gt;&lt;font style=&quot;font-size:11px&quot;&gt;已进站&lt;/font&gt;",
        h_style_main,
        430,
        512,
        360,
        44,
    )
)
rows.append(
    cell(
        "sc-h3",
        "场景3 SSR 横幅&lt;br&gt;&lt;font style=&quot;font-size:11px&quot;&gt;已进站，落在错页&lt;/font&gt;",
        h_style_org,
        820,
        512,
        360,
        44,
    )
)
rows.append(
    cell(
        "sc-h4",
        "场景4 广告（可选）&lt;br&gt;&lt;font style=&quot;font-size:11px&quot;&gt;优化师贴 URL&lt;/font&gt;",
        h_style_opt,
        1210,
        512,
        360,
        44,
    )
)

wht = BOX.format(fill="#FFFFFF", stroke="#2B6CB0", sw="1.5", fs="12", fc="#1A202C", extra="")
grn = BOX.format(fill="#C6F6D5", stroke="#276749", sw="2", fs="13", fc="#1A202C", extra="fontStyle=1;")
org = BOX.format(fill="#FFFAF0", stroke="#DD6B20", sw="1.5", fs="12", fc="#1A202C", extra="")
opt = BOX.format(fill="#F7FAFC", stroke="#A0AEC0", sw="1.5", fs="12", fc="#1A202C", extra="dashed=1;")

# scene 1 — 是向下，否向左，两条线不共用通道
rows.append(cell("sc-1a", "访客搜意图关键词", wht, 110, 572, 220, 36))
rows.append(cell("sc-1d", "结果里有这张页？", DIA, 145, 628, 150, 64))
rows.append(cell("sc-1y", "点蓝链直达营销页", grn, 145, 716, 150, 36))
rows.append(cell("sc-1n", "未收录/没排上&lt;br&gt;不承诺生成即排名", org, 42, 640, 96, 48))
rows.append(
    edge("sc-e1a", "sc-h1", "sc-1a", E.format(fc="#2B6CB0", sc="#2B6CB0", ex=0.5, ey=1, enx=0.5, eny=0, extra=""))
)
rows.append(
    edge("sc-e1b", "sc-1a", "sc-1d", E.format(fc="#2B6CB0", sc="#2B6CB0", ex=0.5, ey=1, enx=0.5, eny=0, extra=""))
)
rows.append(
    edge(
        "sc-e1y",
        "sc-1d",
        "sc-1y",
        E.format(fc="#276749", sc="#276749", ex=0.5, ey=1, enx=0.5, eny=0, extra=""),
        "是",
    )
)
rows.append(
    edge(
        "sc-e1n",
        "sc-1d",
        "sc-1n",
        E.format(fc="#DD6B20", sc="#DD6B20", ex=0, ey=0.5, enx=1, eny=0.5, extra=""),
        "否",
    )
)

# scene 2
rows.append(cell("sc-2a", "访客进首页 / 栏目 / 产品页", wht, 500, 572, 220, 36))
rows.append(cell("sc-2b", "页上有本营销页内链", wht, 500, 632, 220, 36))
rows.append(cell("sc-2c", "点击内链打开营销页", grn, 500, 716, 220, 36))
rows.append(
    edge("sc-e2a", "sc-h2", "sc-2a", E.format(fc="#2B6CB0", sc="#2B6CB0", ex=0.5, ey=1, enx=0.5, eny=0, extra=""))
)
rows.append(
    edge("sc-e2b", "sc-2a", "sc-2b", E.format(fc="#2B6CB0", sc="#2B6CB0", ex=0.5, ey=1, enx=0.5, eny=0, extra=""))
)
rows.append(
    edge("sc-e2c", "sc-2b", "sc-2c", E.format(fc="#276749", sc="#276749", ex=0.5, ey=1, enx=0.5, eny=0, extra=""))
)

# scene 3 — 是向右，否向下，避免和是线叠在一起
rows.append(cell("sc-3a", "访客打开某个站内 URL", wht, 890, 572, 220, 36))
rows.append(cell("sc-3d", "已是该意图营销页？", DIA, 925, 628, 150, 64))
rows.append(cell("sc-3yes", "已在本页", grn, 1090, 640, 90, 40))
rows.append(cell("sc-3n", "否：规则匹配才出横幅", org, 925, 716, 150, 36))
rows.append(cell("sc-3c", "点击横幅打开营销页", grn, 925, 772, 150, 36))
rows.append(
    edge("sc-e3a", "sc-h3", "sc-3a", E.format(fc="#2B6CB0", sc="#2B6CB0", ex=0.5, ey=1, enx=0.5, eny=0, extra=""))
)
rows.append(
    edge("sc-e3b", "sc-3a", "sc-3d", E.format(fc="#2B6CB0", sc="#2B6CB0", ex=0.5, ey=1, enx=0.5, eny=0, extra=""))
)
rows.append(
    edge(
        "sc-e3y",
        "sc-3d",
        "sc-3yes",
        E.format(fc="#276749", sc="#276749", ex=1, ey=0.5, enx=0, eny=0.5, extra=""),
        "是",
    )
)
rows.append(
    edge(
        "sc-e3n",
        "sc-3d",
        "sc-3n",
        E.format(fc="#DD6B20", sc="#DD6B20", ex=0.5, ey=1, enx=0.5, eny=0, extra=""),
        "否",
    )
)
rows.append(
    edge("sc-e3c", "sc-3n", "sc-3c", E.format(fc="#276749", sc="#276749", ex=0.5, ey=1, enx=0.5, eny=0, extra=""))
)

# scene 4
rows.append(cell("sc-4a", "优化师把真 URL 贴进广告", opt, 1280, 572, 220, 36))
rows.append(cell("sc-4b", "访客点击广告", opt, 1280, 632, 220, 36))
rows.append(cell("sc-4c", "打开营销页（UTM）", opt, 1280, 716, 220, 36))
rows.append(
    edge(
        "sc-e4a",
        "sc-h4",
        "sc-4a",
        E.format(fc="#A0AEC0", sc="#A0AEC0", ex=0.5, ey=1, enx=0.5, eny=0, extra="dashed=1;"),
    )
)
rows.append(
    edge(
        "sc-e4b",
        "sc-4a",
        "sc-4b",
        E.format(fc="#A0AEC0", sc="#A0AEC0", ex=0.5, ey=1, enx=0.5, eny=0, extra="dashed=1;"),
    )
)
rows.append(
    edge(
        "sc-e4c",
        "sc-4b",
        "sc-4c",
        E.format(fc="#A0AEC0", sc="#A0AEC0", ex=0.5, ey=1, enx=0.5, eny=0, extra="dashed=1;"),
    )
)

# bus + page
rows.append(
    cell(
        "sc-bus",
        "进入营销页（四条路在此汇合；场景1「没排上」在本列结束，不汇入）",
        BOX.format(
            fill="#C6F6D5",
            stroke="#276749",
            sw="2",
            fs="13",
            fc="#1A202C",
            extra="fontStyle=1;",
        ),
        40,
        828,
        1580,
        36,
    )
)
rows.append(
    cell(
        "sc-page",
        "营销页：首屏回答这一次意图",
        BOX.format(
            fill="#C6F6D5",
            stroke="#276749",
            sw="2",
            fs="13",
            fc="#1A202C",
            extra="fontStyle=1;",
        ),
        40,
        880,
        1580,
        40,
    )
)

bus_sources = ["sc-1y", "sc-2c", "sc-3c", "sc-3yes", "sc-4c"]
bus_extra = ["", "", "", "", "dashed=1;"]
bus_col = ["#276749", "#276749", "#276749", "#276749", "#A0AEC0"]
for i, sid in enumerate(bus_sources):
    rows.append(
        edge(
            f"sc-m{i+1}",
            sid,
            "sc-bus",
            E.format(
                fc=bus_col[i],
                sc=bus_col[i],
                ex=0.5,
                ey=1,
                enx=bus_entry[i],
                eny=0,
                extra=bus_extra[i],
            ),
        )
    )
rows.append(
    edge(
        "sc-bp",
        "sc-bus",
        "sc-page",
        E.format(fc="#276749", sc="#276749", ex=0.5, ey=1, enx=0.5, eny=0, extra=""),
    )
)

rows.append(cell("sc-form", "留资 → 询盘", wht, 40, 940, 200, 40))
rows.append(cell("sc-stat", "记 PV / 停留 / 提交", org, 260, 940, 220, 40))
rows.append(
    cell(
        "sc-evo",
        "自进化（要能看见）&lt;br&gt;询盘、横幅点击、提交 → 下次意图排序、内链/横幅强弱",
        BOX.format(
            fill="#FAF5FF",
            stroke="#6B46C1",
            sw="2",
            fs="12",
            fc="#6B46C1",
            extra="fontStyle=1;",
        ),
        500,
        932,
        420,
        56,
    )
)
rows.append(
    cell(
        "sc-feed",
        "回写给定时任务&lt;br&gt;下次优先这些缺口（不再拉线穿过全图）",
        BOX.format(
            fill="#FFFAF0",
            stroke="#DD6B20",
            sw="2",
            fs="12",
            fc="#C05621",
            extra="fontStyle=1;dashed=1;",
        ),
        940,
        932,
        400,
        56,
    )
)

rows.append(
    edge(
        "sc-mf",
        "sc-page",
        "sc-form",
        E.format(fc="#38A169", sc="#38A169", ex=page_form, ey=1, enx=0.5, eny=0, extra=""),
    )
)
rows.append(
    edge(
        "sc-ms",
        "sc-page",
        "sc-stat",
        E.format(fc="#DD6B20", sc="#DD6B20", ex=page_stat, ey=1, enx=0.5, eny=0, extra=""),
    )
)
rows.append(
    edge(
        "sc-me",
        "sc-page",
        "sc-evo",
        E.format(fc="#6B46C1", sc="#6B46C1", ex=page_evo, ey=1, enx=0.5, eny=0, extra="dashed=1;"),
    )
)
rows.append(
    edge(
        "sc-ef",
        "sc-evo",
        "sc-feed",
        E.format(fc="#E53E3E", sc="#E53E3E", ex=1, ey=0.5, enx=0, eny=0.5, extra="dashed=1;"),
        "喂回",
    )
)

rows.append(
    cell(
        "sc-note",
        "真人三条：客户/运营出页，SEO 出页+链，内容运营引用或出页。优化师默认不进生成，只拿 URL。Agent 与定时走同一套出页；有对外承诺必须停在人确认。访客四条路不变。横幅不对爬虫；营销页必须能被收录。",
        "shape=note;whiteSpace=wrap;html=1;size=14;fillColor=#FFFFCC;strokeColor=#D69E2E;align=left;spacingLeft=8;fontSize=11;fontColor=#4A5568;fontFamily=Microsoft YaHei;",
        40,
        1010,
        1580,
        44,
    )
)

body = "\n".join(rows)
diagram = f"""  <diagram id="use-scenes" name="使用场景">
    <mxGraphModel dx="2087" dy="1176" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1680" pageHeight="1080" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
{body}
      </root>
    </mxGraphModel>
  </diagram>"""

text = DRAWIO.read_text(encoding="utf-8")
start = text.find('<diagram id="use-scenes"')
end = text.find("</mxfile>")
if start < 0 or end < 0:
    raise SystemExit(f"markers not found start={start} end={end}")
while start > 0 and text[start - 1] in " \t":
    start -= 1
DRAWIO.write_text(text[:start] + diagram + "\n" + text[end:], encoding="utf-8")
print("rewrote use-scenes", DRAWIO)
print("who entries", hub_entry)
print("p1 entries", p1_entry)
print("bus entries", bus_entry)
