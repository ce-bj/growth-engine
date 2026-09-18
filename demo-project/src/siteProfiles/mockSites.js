/** 本地 Demo 两站完整档案。字段名与填写模板一致，值写成完整句子/条目，不用短标签。 */

export const MOCK_SITES = [
  {
    id: "site-cn",
    header: {
      网站名称: "北京阀门有限公司",
      域名: "www.bj-valve.com",
      主要语言: "中文",
      最近抽取日期: "2026-08-20",
    },
    status: "saved",
    savedAt: "2026-08-20 18:00",
    pendingFields: [],
    sections: {
      "1. 企业是谁": {
        企业全称: "北京阀门有限公司",
        对外品牌名: "京阀",
        一句话定位: "生产工业阀门，给水务、供热、石化和电力管网供货。",
        所在地: "北京市大兴区",
        成立年份: "1998",
        "官网「关于我们」要点（3～6 句，用网站原意，不扩写）":
          "公司成立于1998年，工厂在北京大兴。\n主营闸阀、截止阀、球阀、蝶阀、止回阀。\n产品按国家标准及客户图纸生产。\n可按项目配套供货。\n国内销售，同时承接出口订单。",
      },
      "2. 做什么行业、卖给谁": {
        一级行业: "工业设备",
        二级行业: "阀门",
        "下游应用行业 / 场景": "给排水、供热、石化、电力、市政管网",
        "目标买家（工厂 / 贸易商 / 工程承包商 / 品牌方等）":
          "水务公司、工程承包商、设备成套厂、阀门贸易商",
        "主要目标市场（国家或地区）": "中国、东南亚、中东",
      },
      "3. 卖什么": {
        "主营产品 / 服务（列表）":
          "闸阀\n截止阀\n球阀\n蝶阀\n止回阀\n按图纸加工\n项目配套供货",
        "当前主推（最多 5 个，名称以网站为准）":
          "弹性座封闸阀\n法兰球阀\n对夹蝶阀\n不锈钢截止阀\n止回阀",
        "产品中心入口 URL": "https://www.bj-valve.com/products",
        "常见 HS 编码（网站或资料里有才填，没有就空着待补充）": "8481.80",
      },
      "4. 品牌/企业文化": {
        "品牌/企业口号": "做可靠的工业阀门",
        "对外自称（我们 / 公司全称 / 品牌名）": "北京阀门有限公司",
        "语气（专业克制 / 外贸开发信 / 偏国内官网等）": "偏国内官网，专业克制",
        必须用的说法: "北京阀门有限公司\n工业阀门",
        禁止用的说法: "全球领先\n世界一流\n军工品质",
      },
      "5. 怎么联系": {
        对外电话: "010-61234567",
        "对外邮箱：（网站上给买家看的）": "sales@bj-valve.com",
        "默认收件邮箱：（留言通知、运营报告、开发信/营销回信；可与对外邮箱不同。没有则先用对外邮箱预填，客户确认后再生效）":
          "ops@bj-valve.com",
        地址: "北京市大兴区金辅路8号",
        "表单 / 询盘入口": "https://www.bj-valve.com/contact",
      },
      "6. 网站上有什么栏目": {
        nav: [
          {
            栏目: "首页",
            "入口 URL": "https://www.bj-valve.com/",
            "这一栏主要是什么": "公司介绍与产品入口",
          },
          {
            栏目: "产品中心",
            "入口 URL": "https://www.bj-valve.com/products",
            "这一栏主要是什么": "阀门分类与产品列表",
          },
          {
            栏目: "关于我们",
            "入口 URL": "https://www.bj-valve.com/about",
            "这一栏主要是什么": "公司简介、工厂",
          },
          {
            栏目: "新闻资讯",
            "入口 URL": "https://www.bj-valve.com/news",
            "这一栏主要是什么": "工厂与项目动态",
          },
          {
            栏目: "联系我们",
            "入口 URL": "https://www.bj-valve.com/contact",
            "这一栏主要是什么": "电话、邮箱、询盘表单",
          },
        ],
        extras: {
          关于我们: "https://www.bj-valve.com/about",
          产品中心: "https://www.bj-valve.com/products",
          "新闻 / 资讯": "https://www.bj-valve.com/news",
          联系我们: "https://www.bj-valve.com/contact",
        },
      },
      "7. 企业优势": {
        "核心卖点（条列，尽量带认证 / 年限 / 产能等原话）":
          "1998年建厂\n闸阀、球阀、蝶阀可按国标及图纸生产\n通过 ISO 9001\n可按项目配套供货",
        "资质与证书（名称即可）": "ISO 9001\n特种设备生产许可证",
        "可公开的客户或案例（名称 + 一句话）":
          "华北某水务公司：供水管网闸阀改造供货。\n某石化厂：循环水蝶阀供货。",
        "工厂 / 产能 / 交付能力（网站有才写）":
          "大兴工厂，机加工与装配。交期按合同。",
      },
      "8. 商务与售后口径": {
        "质保与售后（原话或摘要）": "质保期12个月，以合同为准。",
        "起订 / 交期 / 付款（原话或摘要）":
          "常规型号现货或30天内交货。付款方式 T/T，具体以合同为准。",
        "包装与物流（原话或摘要）": "木箱包装。国内汽运。出口按客户指定港口。",
      },
    },
  },
  {
    id: "site-en",
    header: {
      网站名称: "Beijing Valve Co., Ltd.",
      域名: "en.bj-valve.com",
      主要语言: "English",
      最近抽取日期: "2026-08-20",
    },
    status: "saved",
    savedAt: "2026-08-20 18:00",
    pendingFields: [],
    sections: {
      "1. 企业是谁": {
        企业全称: "Beijing Valve Co., Ltd.",
        对外品牌名: "BJ Valve",
        一句话定位:
          "Industrial valves for water supply, heating, petrochemical and power piping.",
        所在地: "Daxing, Beijing, China",
        成立年份: "1998",
        "官网「关于我们」要点（3～6 句，用网站原意，不扩写）":
          "Founded in 1998. Factory in Daxing, Beijing.\nGate, globe, ball, butterfly and check valves.\nMade to GB standards and customer drawings.\nProject supply available.\nExport orders accepted.",
      },
      "2. 做什么行业、卖给谁": {
        一级行业: "Industrial Equipment",
        二级行业: "Valves",
        "下游应用行业 / 场景":
          "Water supply and drainage, district heating, petrochemical, power, municipal piping",
        "目标买家（工厂 / 贸易商 / 工程承包商 / 品牌方等）":
          "Water utilities, EPC contractors, equipment packagers, valve traders",
        "主要目标市场（国家或地区）": "Southeast Asia, Middle East, Africa",
      },
      "3. 卖什么": {
        "主营产品 / 服务（列表）":
          "Gate valves\nGlobe valves\nBall valves\nButterfly valves\nCheck valves\nMade-to-drawing\nProject supply",
        "当前主推（最多 5 个，名称以网站为准）":
          "Resilient seated gate valve\nFlanged ball valve\nWafer butterfly valve\nStainless steel globe valve\nCheck valve",
        "产品中心入口 URL": "https://en.bj-valve.com/products",
        "常见 HS 编码（网站或资料里有才填，没有就空着待补充）": "8481.80",
      },
      "4. 品牌/企业文化": {
        "品牌/企业口号": "Reliable industrial valves",
        "对外自称（我们 / 公司全称 / 品牌名）": "Beijing Valve / we",
        "语气（专业克制 / 外贸开发信 / 偏国内官网等）": "外贸开发信",
        必须用的说法: "Beijing Valve Co., Ltd.\nindustrial valves",
        禁止用的说法: "world-leading\nNo.1 in the world\nmilitary-grade",
      },
      "5. 怎么联系": {
        对外电话: "+86-10-61234567",
        "对外邮箱：（网站上给买家看的）": "export@bj-valve.com",
        "默认收件邮箱：（留言通知、运营报告、开发信/营销回信；可与对外邮箱不同。没有则先用对外邮箱预填，客户确认后再生效）":
          "ops@bj-valve.com",
        地址: "No. 8 Jinfu Road, Daxing, Beijing, China",
        "表单 / 询盘入口": "https://en.bj-valve.com/contact",
      },
      "6. 网站上有什么栏目": {
        nav: [
          {
            栏目: "Home",
            "入口 URL": "https://en.bj-valve.com/",
            "这一栏主要是什么": "Company overview and product entry",
          },
          {
            栏目: "Products",
            "入口 URL": "https://en.bj-valve.com/products",
            "这一栏主要是什么": "Valve categories and product list",
          },
          {
            栏目: "About Us",
            "入口 URL": "https://en.bj-valve.com/about",
            "这一栏主要是什么": "Company profile and factory",
          },
          {
            栏目: "News",
            "入口 URL": "https://en.bj-valve.com/news",
            "这一栏主要是什么": "Factory and project updates",
          },
          {
            栏目: "Contact",
            "入口 URL": "https://en.bj-valve.com/contact",
            "这一栏主要是什么": "Phone, email, inquiry form",
          },
        ],
        extras: {
          关于我们: "https://en.bj-valve.com/about",
          产品中心: "https://en.bj-valve.com/products",
          "新闻 / 资讯": "https://en.bj-valve.com/news",
          联系我们: "https://en.bj-valve.com/contact",
        },
      },
      "7. 企业优势": {
        "核心卖点（条列，尽量带认证 / 年限 / 产能等原话）":
          "Factory since 1998\nGate, ball and butterfly valves to GB and drawings\nISO 9001\nProject supply",
        "资质与证书（名称即可）": "ISO 9001\nSpecial Equipment Manufacturing License",
        "可公开的客户或案例（名称 + 一句话）":
          "A North China water utility: gate valves for a water-main upgrade.\nA petrochemical plant: butterfly valves for circulating water.",
        "工厂 / 产能 / 交付能力（网站有才写）":
          "Daxing factory, machining and assembly. Lead time per contract.",
      },
      "8. 商务与售后口径": {
        "质保与售后（原话或摘要）": "12-month warranty, subject to contract.",
        "起订 / 交期 / 付款（原话或摘要）":
          "Stock or 30 days for standard models. Payment T/T, subject to contract.",
        "包装与物流（原话或摘要）":
          "Wooden cases. Sea freight to the port named by the buyer.",
      },
    },
  },
];
