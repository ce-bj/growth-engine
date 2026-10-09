export const readyData = {
  "checks": [
    {
      "api": true,
      "code": "llms",
      "desc": "这是一份放在网站里、专门给 AI 看的“网站说明书”。它用简短的文字告诉 ChatGPT、豆包这些 AI 引擎：我们公司是做什么的、有哪些产品、哪些页面最值得看。",
      "detail": {
        "props": {
          "content": "",
          "domain": "cndemo.xuoumaill.cn",
          "mode": "upload"
        },
        "type": "llms"
      },
      "hasDetail": true,
      "icon": "file-text",
      "note": "已手动上传 llms.txt，包含品牌摘要、产品目录、核心页面链接",
      "status": "ready",
      "title": "llms.txt 配置",
      "why": "没有这份说明书，AI 引擎需要自己一点点摸索你的网站，可能找不到产品信息，或者抓错内容。有了它，AI 一眼就能看到你的品牌介绍和产品目录，用户问相关问题时，AI 更容易找到你。"
    },
    {
      "api": true,
      "code": "schema",
      "desc": "这是给 AI 看的“产品标签”。就像超市商品上的条形码一样，它把产品的名称、价格、品牌、库存等关键信息，用 AI 能直接读懂的方式标注出来。",
      "detail": {
        "props": {
          "rows": [
            {
              "brief": "公司信息",
              "code": "home",
              "configured": true,
              "json": "<script type=\"application/ld+json\">\n{\n  \"@context\": \"https://schema.org\",\n  \"@graph\": [\n    {\n      \"@type\": \"Organization\",\n      \"@id\": \"https://cndemo.xuoumaill.cn/#organization\",\n      \"name\": \"XX Technology Co., Ltd.\",\n      \"alternateName\": \"XX Technology\",\n      \"legalName\": \"XX Technology Co., Ltd.\",\n      \"url\": \"https://cndemo.xuoumaill.cn\",\n      \"logo\": \"https://cndemo.xuoumaill.cn/images/logo.png\",\n      \"description\": \"Founded in 2015, a leading domestic intelligent manufacturing solutions provider focusing on industrial robotics R&D and factory digitalization, serving over 500 manufacturing customers worldwide.\",\n      \"foundingDate\": \"2015\",\n      \"numberOfEmployees\": {\n        \"@type\": \"QuantitativeValue\",\n        \"value\": 789,\n        \"unitText\": \"workers\"\n      },\n      \"areaServed\": [\n        {\n          \"@type\": \"Country\",\n          \"name\": \"China\"\n        },\n        {\n          \"@type\": \"Country\",\n          \"name\": \"Worldwide\"\n        }\n      ],\n      \"address\": {\n        \"@type\": \"PostalAddress\",\n        \"addressCountry\": \"CN\"\n      },\n      \"contactPoint\": {\n        \"@type\": \"ContactPoint\",\n        \"contactType\": \"customer service\",\n        \"availableLanguage\": [\"English\", \"Chinese\"]\n      },\n      \"knowsAbout\": [\n        \"Website design and development\",\n        \"UI/UX design\",\n        \"Web hosting services\",\n        \"Circuit breaker manufacturing\",\n        \"Industrial robotics\",\n        \"Factory digitalization\"\n      ],\n      \"sameAs\": [\n        \"https://weibo.com/yourprofile\",\n        \"https://www.zhihu.com/org/yourprofile\",\n        \"https://www.linkedin.com/company/yourcompany\"\n      ],\n      \"award\": [\n        \"38 patents\",\n        \"Serving 30 of the world's top 500 companies\"\n      ]\n    },\n    {\n      \"@type\": \"WebSite\",\n      \"@id\": \"https://cndemo.xuoumaill.cn/#website\",\n      \"url\": \"https://cndemo.xuoumaill.cn\",\n      \"name\": \"XX Technology Co.\",\n      \"alternateName\": \"XX Tech Demo Site\",\n      \"description\": \"Demo website showcasing website design, web hosting, and UI/UX design services, plus circuit breaker product catalog.\",\n      \"inLanguage\": [\"zh-CN\", \"en\"],\n      \"publisher\": {\n        \"@id\": \"https://cndemo.xuoumaill.cn/#organization\"\n      },\n      \"potentialAction\": {\n        \"@type\": \"SearchAction\",\n        \"target\": {\n          \"@type\": \"EntryPoint\",\n          \"urlTemplate\": \"https://cndemo.xuoumaill.cn/search?q={search_term_string}\"\n        },\n        \"query-input\": \"required name=search_term_string\"\n      }\n    },\n    {\n      \"@type\": \"WebPage\",\n      \"@id\": \"https://cndemo.xuoumaill.cn/#webpage\",\n      \"url\": \"https://cndemo.xuoumaill.cn/\",\n      \"name\": \"XX Technology Co. - Intelligent Manufacturing Solutions\",\n      \"description\": \"Leading provider of industrial robotics, factory digitalization, website design services, and circuit breaker products. Serving 500+ manufacturing customers worldwide.\",\n      \"isPartOf\": {\n        \"@id\": \"https://cndemo.xuoumaill.cn/#website\"\n      },\n      \"about\": {\n        \"@id\": \"https://cndemo.xuoumaill.cn/#organization\"\n      },\n      \"primaryImageOfPage\": \"https://cndemo.xuoumaill.cn/images/hero.jpg\",\n      \"datePublished\": \"2021-11-12\",\n      \"dateModified\": \"2026-10-06\",\n      \"inLanguage\": \"zh-CN\"\n    },\n    {\n      \"@type\": \"FAQPage\",\n      \"@id\": \"https://cndemo.xuoumaill.cn/#faqpage\",\n      \"mainEntity\": [\n        {\n          \"@type\": \"Question\",\n          \"name\": \"What are the regular maintenance tasks of a website?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Regular website maintenance work is the key to ensure website security, stable operation and user experience. Maintenance work includes updating website content, checking and fixing website links, backing up data, conducting regular security checks, fixing vulnerabilities and optimizing performance. These tasks help to ensure that the website operates effectively in the long term and provides a good user experience.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"What is the difference between UI and UX in web design?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"UI (User Interface) and UX (User Experience) are two important aspects of website design. UI focuses on the look and feel, layout and visual elements of a website, while UX focuses on the overall feel and interactive experience of a user on a website, including ease of use, navigation, interaction and more. Great UI design usually enhances the user's UX experience.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"What types of web hosting services are available?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Web hosting services can be categorized into shared hosting, virtual private server (VPS), dedicated server and cloud hosting. Shared hosting is where multiple websites share a single server resource, VPS is a virtual private server, dedicated servers are exclusive servers, and cloud hosting provides hosting solutions based on cloud services, with each type having different characteristics and applicable scenarios.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"What is the purpose of a website traffic statistics tool?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Traffic statistics tools such as Google Analytics help analyze website access data, including visitor sources, visits, and user behavior. By understanding this data, website owners can understand the audience, adjust the content and design of the website to enhance the user experience and increase conversions.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"How to choose the right website building technology for you?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"The choice of website building technology needs to be based on one's skill level and website needs. If you are familiar with programming, you can choose to write your own code using HTML, CSS, JavaScript, and so on. Alternatively, consider using existing frameworks or libraries such as Bootstrap, React, etc. to simplify the development process.\"\n          }\n        },\n        {\n          \"@type\": \"Question\",\n          \"name\": \"How do I get started with my own website?\",\n          \"acceptedAnswer\": {\n            \"@type\": \"Answer\",\n            \"text\": \"Setting up a website starts with selecting a domain name, which is the address of the website. Then choose the right hosting provider, the host is where the website files and data are stored. Next writing the website code or designing the pages and finally uploading the website files to the server. This way the website can be accessed and viewed on the internet.\"\n          }\n        }\n      ]\n    },\n    {\n      \"@type\": \"Service\",\n      \"@id\": \"https://cndemo.xuoumaill.cn/#service\",\n      \"serviceType\": \"Website Design and Development\",\n      \"name\": \"Website Design & Development Services\",\n      \"provider\": {\n        \"@id\": \"https://cndemo.xuoumaill.cn/#organization\"\n      },\n      \"areaServed\": \"Worldwide\",\n      \"description\": \"Professional website design and development services including UI/UX design, custom website development, web hosting, and ongoing maintenance support.\",\n      \"hasOfferCatalog\": {\n        \"@type\": \"OfferCatalog\",\n        \"name\": \"Website Service Packages\",\n        \"itemListElement\": [\n          {\n            \"@type\": \"Offer\",\n            \"itemOffered\": {\n              \"@type\": \"Service\",\n              \"name\": \"Website Maintenance Service\",\n              \"description\": \"Regular website maintenance including content updates, security checks, data backups, and performance optimization to ensure stable and secure operation.\"\n            }\n          },\n          {\n            \"@type\": \"Offer\",\n            \"itemOffered\": {\n              \"@type\": \"Service\",\n              \"name\": \"UI/UX Design Service\",\n              \"description\": \"Professional user interface and user experience design focusing on visual aesthetics, layout, navigation, and interactive experience optimization.\"\n            }\n          },\n          {\n            \"@type\": \"Offer\",\n            \"itemOffered\": {\n              \"@type\": \"Service\",\n              \"name\": \"Web Hosting Service\",\n              \"description\": \"Multiple hosting options including shared hosting, VPS, dedicated server, and cloud hosting solutions for different website needs.\"\n            }\n          },\n          {\n            \"@type\": \"Offer\",\n            \"itemOffered\": {\n              \"@type\": \"Service\",\n              \"name\": \"Custom Website Development\",\n              \"description\": \"End-to-end custom website development from domain registration, design, coding, to server deployment and launch.\"\n            }\n          }\n        ]\n      }\n    }\n  ]\n}\n</script>",
              "label": "首页",
              "loaded": true,
              "type": "Organization"
            },
            {
              "brief": "产品",
              "code": "product",
              "configured": true,
              "json": "<script type=\"application/ld+json\">\n{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"Product\",\n  \"name\": \"<(产品名称)>\",\n  \"image\": \"<(产品封面图URL)>\",\n  \"description\": \"<(产品概要)>\",\n  \"brand\": {\n    \"@type\": \"Brand\",\n    \"name\": \"<(网站名称)>\"\n  },\n  \"offers\": {\n    \"@type\": \"Offer\",\n    \"url\": \"<(页面地址)>\",\n    \"availability\": \"https://schema.org/InStock\",\n    \"itemCondition\": \"https://schema.org/NewCondition\"\n  },\n  \"priceSpecification\": {\n    \"@type\": \"PriceSpecification\",\n    \"price\": \"\",\n    \"priceCurrency\": \"<(币种)>\",\n    \"referenceQuantity\": {\n        \"@type\": \"QuantitativeValue\",\n        \"unitText\": \"<(询盘报价)>\"\n    },\n    \"businessFunction\": \"http://purl.org/goodrelations/v1#RequestForQuotation\"\n  },\n  \"manufacturer\": {\n    \"@id\": \"<(网站域名)>#organization\"\n  }\n}\n</script>",
              "label": "产品详情页",
              "loaded": true,
              "type": "Product"
            },
            {
              "brief": "介绍内容",
              "code": "intro",
              "configured": true,
              "json": "<script type=\"application/ld+json\">\n{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"Organization\",\n  \"name\": \"<(网站名称)>\",\n  \"description\": \"<(概要描述)>\",\n  \"logo\": {\n    \"@type\": \"ImageObject\",\n    \"url\": \"<(企业logo图片地址)>\"\n  },\n  \"url\": \"<(网站域名)>\"\n}\n</script>",
              "label": "介绍内容页",
              "loaded": true,
              "type": "Organization"
            },
            {
              "brief": "文章",
              "code": "news",
              "configured": true,
              "json": "<script type=\"application/ld+json\">\n{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"Article\",\n  \"headline\": \"<(资讯标题)>\",\n  \"image\": \"<(封面图)>\",\n  \"description\": \"<(资讯概要)>\",\n  \"keywords\": \"<(标签)>\",\n  \"datePublished\": \"<(发布时间)>\",\n  \"dateModified\": \"<(修改时间)>\",\n  \"mainEntityOfPage\": {\n    \"@type\": \"WebPage\",\n    \"@id\": \"<(页面地址)>\"\n  },\n  \"author\": {\n    \"@type\": \"Organization\",\n    \"name\": \"<(作者)>\",\n    \"url\": \"<(网站域名)>\"\n   },\n  \"publisher\": {\n    \"@type\": \"Organization\",\n    \"name\": \"<(网站名称)>\",\n    \"logo\": {\n      \"@type\": \"ImageObject\",\n      \"url\": \"<(企业logo图片地址)>\"\n    }\n  }\n}\n</script>",
              "label": "文章页",
              "loaded": true,
              "type": "Article"
            },
            {
              "brief": "常见问题",
              "code": "faq",
              "configured": true,
              "json": "<script type=\"application/ld+json\">\n{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"FAQPage\",\n  \"mainEntity\": [\n    {\n      \"@type\": \"Question\",\n      \"name\": \"<(问题)>\",\n      \"acceptedAnswer\": {\n        \"@type\": \"Answer\",\n        \"text\": \"<(概要描述)>\"\n      }\n    },\n  ],\n  \"mainEntityOfPage\": {\n    \"@type\": \"WebPage\",\n    \"@id\": \"<(页面地址)>\"\n  }\n}\n</script>",
              "label": "FAQ页",
              "loaded": true,
              "type": "FAQPage"
            }
          ]
        },
        "type": "schema"
      },
      "hasDetail": true,
      "icon": "code",
      "note": "核心页面已配置 5 类标签：公司信息、产品、介绍内容、文章、常见问题",
      "status": "ready",
      "title": "Schema JSON-LD 结构化数据",
      "why": "没有这个标签，AI 只能从网页大段文字里“猜”你的产品信息，容易看错或看漏。有了它，AI 能准确知道“这是哪款产品、多少钱”，在回答用户问题时可以直接引用你的产品信息。"
    },
    {
      "api": true,
      "code": "robots",
      "desc": "这是网站的“访客规则”，明确告诉各个 AI 引擎（比如 ChatGPT、豆包、文心一言等）：欢迎来抓取我网站的内容。",
      "detail": {
        "props": {
          "enabled": true,
          "sitemap": "Sitemap: https://cndemo.xuoumaill.cn/sitemap.xml"
        },
        "type": "robots"
      },
      "hasDetail": true,
      "icon": "robot",
      "note": "国内外 AI 引擎全部放行：豆包、DeepSeek、文心一言、通义千问、Google、ChatGPT、Claude 等",
      "status": "ready",
      "title": "robots.txt AI 爬虫准入",
      "why": "如果规则写得不清楚，部分 AI 引擎会默认不抓取你的网站，等于把产品信息挡在 AI 门外。我们已经明确对全部主流 AI 引擎开放访问，确保你的网站内容能被它们收录。"
    },
    {
      "code": "ssr",
      "desc": "这是一种让网页在“打开瞬间就准备好全部内容”的方式。不需要用户和 AI 等待加载，一打开就能看到完整的页面。",
      "hasDetail": false,
      "icon": "globe",
      "note": "全站采用即时内容输出，打开即可看到完整内容",
      "status": "ready",
      "title": "服务端渲染 SSR",
      "why": "AI 不像人那样有耐心等待。如果网页要等一会儿才显示内容，AI 可能看到一个空白页就走了，完全抓不到产品信息。我们的网站在 AI 访问时立刻呈现全部内容，确保产品信息不被漏掉。"
    },
    {
      "api": true,
      "code": "https",
      "desc": "HTTPS 是网站的“安全锁”，它加密了用户和网站之间的所有信息传输，防止数据被窃取。浏览器地址栏显示的小锁图标就是它。",
      "detail": null,
      "hasDetail": false,
      "icon": "shield",
      "note": "全站启用安全加密，达到最高安全级别",
      "status": "ready",
      "title": "HTTPS 安全协议",
      "why": "主流 AI 引擎只信任有安全锁的网站。没有安全锁，AI 可能认为你的网站不安全，降低信任度甚至不收录内容。我们的网站已启用最高级别的安全加密。"
    },
    {
      "api": true,
      "code": "sitemap",
      "desc": "这是一份网站的“目录清单”，把网站所有页面的地址列出来，方便 AI 引擎快速找到全部内容。",
      "detail": null,
      "hasDetail": false,
      "icon": "file-check",
      "note": "站点地图已生成，AI 引擎可通过它发现全部页面",
      "status": "ready",
      "title": "XML Sitemap 站点地图",
      "why": "没有这份目录，AI 可能漏掉网站深处的页面，比如某个产品详情页。有了它，AI 能系统地发现并收录你网站的每一个页面，让产品信息更全面地被 AI 引用。"
    },
    {
      "api": true,
      "code": "opengraph",
      "desc": "这是网页分享时的“名片”。当别人把你的网页链接分享到微信、朋友圈或 AI 平台时，名片决定了显示什么标题、描述和图片。",
      "detail": {
        "props": {
          "checks": [
            {
              "code": "base",
              "label": "og:title · og:description · og:url",
              "ok": true,
              "text": "已配置"
            },
            {
              "action": "",
              "code": "image",
              "label": "og:image",
              "ok": true,
              "text": "已配置"
            }
          ]
        },
        "type": "og"
      },
      "hasDetail": true,
      "icon": "external-link",
      "note": "首页分享标题、描述、图片均已配置",
      "status": "ready",
      "title": "Open Graph 标签",
      "why": "AI 在回答问题时，会参考这张“名片”来理解你的页面。如果名片信息不全，AI 可能用错误的标题和描述介绍你的产品。分享标题、描述和图片缺少的部分补充完整后，AI 才能准确介绍你的页面。"
    }
  ],
  "optimizeSections": [
    {
      "brief": "品牌名称、核心卖点、联系方式全站叫法不统一",
      "code": "brand",
      "icon": "tag",
      "items": [
        {
          "action": {
            "icon": "check",
            "ignorable": true,
            "text": "同意并自动优化"
          },
          "auto": true,
          "explain": "同一个品牌，首页写「越通紧固件」，产品页和关于我们页写「越通五金」。AI 每次读到不一样的名称，都会重新判断这是不是同一家公司，品牌印象越读越散。",
          "id": "brand-name",
          "proposal": "越通紧固件",
          "proposalField": "品牌统一称谓",
          "result": "全站品牌名称已统一为「越通紧固件」（共修改 5 处）",
          "suggest": "全站统一为「越通紧固件」，已在 3 个页面发现 5 处不一致，AI 可一次性改完",
          "tags": [
            "首页 · 越通紧固件",
            "产品页 · 越通五金",
            "关于我们 · 越通五金"
          ],
          "title": "品牌名称表述不一致"
        },
        {
          "action": {
            "icon": "check",
            "ignorable": true,
            "text": "同意并自动优化"
          },
          "auto": true,
          "explain": "首页写「20 年制造经验」，关于我们写「深耕行业二十年」，产品页写「十余年沉淀」。三种说法让 AI 无法确认企业的真实实力。",
          "id": "brand-selling",
          "proposal": "20 年紧固件制造经验",
          "proposalField": "统一卖点表述",
          "result": "核心卖点已统一为「20 年紧固件制造经验」",
          "suggest": "统一为「20 年紧固件制造经验」，保持全站口径一致",
          "tags": [
            "首页 · 20 年制造经验",
            "关于我们 · 深耕行业二十年",
            "产品页 · 十余年沉淀"
          ],
          "title": "核心卖点表述不一致"
        },
        {
          "action": {
            "icon": "check",
            "ignorable": true,
            "text": "同意并自动优化"
          },
          "auto": true,
          "explain": "页脚写「河北省邯郸市永年区」，联系我们页写「邯郸永年标准件产业园」；联系电话有两种格式。AI 提取企业信息时可能给出错误答案。",
          "id": "brand-contact",
          "proposal": "河北省邯郸市永年区 · 0310-88888888",
          "proposalField": "统一地址与电话",
          "result": "联系方式与地址已统一为工商注册信息",
          "suggest": "统一使用工商注册地址与统一格式的联系电话，由 AI 一键替换全站",
          "tags": [
            "页脚 · 河北省邯郸市永年区",
            "联系我们 · 邯郸永年标准件产业园"
          ],
          "title": "联系方式与地址表述不一致"
        }
      ],
      "purpose": "同一个品牌，在官网首页、产品页、关于我们页可能出现不同的名称和说法；同一个卖点，销售讲的、网页写的也可能对不上。AI 每次读到不一样的表述，都会重新判断这到底是不是同一家公司，品牌印象越读越散。",
      "subtitle": "让 AI 在任何页面看到的都是同一个品牌",
      "theme": "brand",
      "title": "品牌一致性检测与自动优化",
      "value": "把全站的品牌名称、产品叫法、核心卖点统一成一套说法，AI 在任何页面读到的都是同一个品牌、同一套产品，识别得准、记得住。"
    },
    {
      "brief": "FAQ 缺失、产品详情信息不足、图片缺文字说明、营销化表达过多",
      "code": "readable",
      "icon": "book-open",
      "items": [
        {
          "action": {
            "icon": "check",
            "ignorable": true,
            "text": "确认并自动上线"
          },
          "auto": true,
          "explain": "全站未检测到 FAQ 问答内容。AI 回答客户问题时，最需要的就是成对的问答内容，没有它就失去了最容易被引用的素材。",
          "id": "readable-faq",
          "proposal": "起订量、交期、材质、认证、包装",
          "proposalField": "FAQ 覆盖范围",
          "result": "12 条 FAQ 已自动生成并上线到网站",
          "suggest": "AI 已根据企业知识库自动生成 12 条常见问答（起订量、交期、材质、认证、包装等），确认后即上线到网站",
          "tags": [],
          "title": "FAQ 问答内容缺失"
        },
        {
          "action": {
            "form": {
              "placeholder": "填写原始资料，AI 会整理成网站内容",
              "submit": "提交并进入 AI 生成"
            },
            "icon": "edit",
            "ignorable": false,
            "text": "去补充资料"
          },
          "auto": false,
          "explain": "「六角螺栓 M8×30」详情页正文只有 80 字，缺少技术参数表、适用场景和选型建议。AI 读到这么少的信息，无法在回答中引用这款产品的细节。",
          "id": "readable-product",
          "result": "资料已提交，AI 已生成结构化产品详情并上线",
          "suggest": "需补充产品的技术参数表与应用场景说明，AI 会自动整理成结构化内容",
          "tags": [
            "/products/hex-bolt-m8x30 · 正文 80 字"
          ],
          "title": "产品详情页信息不足"
        },
        {
          "action": {
            "icon": "check",
            "ignorable": true,
            "text": "同意并自动优化"
          },
          "auto": true,
          "explain": "3 张产品主图没有文字说明。AI 读不到图片内容，等于这些图片对 AI 不存在。",
          "id": "readable-image",
          "proposal": "规格、材质、表面处理",
          "proposalField": "图片说明包含",
          "result": "3 张产品图片说明已由 AI 自动补全",
          "suggest": "AI 可结合产品知识库自动为每张图片补全说明文字（含规格、材质、表面处理）",
          "tags": [
            "产品图 1 · 无说明",
            "产品图 2 · 无说明",
            "产品图 3 · 无说明"
          ],
          "title": "产品图片缺少文字说明"
        },
        {
          "action": {
            "icon": "check",
            "ignorable": true,
            "text": "同意并自动优化"
          },
          "auto": true,
          "explain": "页面出现「匠心品质」「极致工艺」「行业领航者」等描述。这类形容词 AI 无法理解，也无法用于回答客户的具体问题，等于白写了。",
          "id": "readable-marketing",
          "proposal": "通过 ISO 9001 认证，年产能 5 万吨",
          "proposalField": "改后表述",
          "result": "营销化表达已改写为可被 AI 理解的事实性描述",
          "suggest": "改写为 AI 和客户都能直接理解的事实表达，例如「通过 ISO 9001 认证，年产能 5 万吨」",
          "tags": [
            "首页 · 匠心品质、极致工艺",
            "关于我们 · 行业领航者"
          ],
          "title": "过度营销化表达"
        }
      ],
      "purpose": "AI 抓到的往往是一堆无法理解的内容——图片里的文字、格式混乱的参数表、堆砌的营销形容词。AI 理解不了，就不会在回答客户问题时引用你的产品。",
      "subtitle": "把 AI 无法理解的表达，改成 AI 和客户都能直接理解的语言",
      "theme": "readable",
      "title": "AI 可读性优化",
      "value": "把网站内容改写成 AI 和客户都能直接理解的语言，并补齐 FAQ 与产品详情页的关键信息，AI 才能准确理解并引用你的产品。"
    },
    {
      "brief": "资质证书、真实客户案例等可信证据缺失",
      "code": "trust",
      "icon": "shield-check",
      "items": [
        {
          "action": {
            "form": {
              "placeholder": "也可直接粘贴证书信息（证书名称、发证机构、编号、有效期）",
              "submit": "提交并进入 AI 生成",
              "type": "upload"
            },
            "icon": "upload",
            "ignorable": false,
            "text": "去上传证书"
          },
          "auto": false,
          "explain": "未检测到认证证书、荣誉资质相关内容。资质是 AI 判断企业是否可信的第一类证据，缺失时很难被 AI 放进候选名单。",
          "id": "trust-cert",
          "result": "证书已提交，AI 已整理为结构化内容并上线",
          "suggest": "上传营业执照、ISO 体系认证、产品检测报告等证书，AI 会自动整理成结构化内容并上线",
          "tags": [
            "未检测到资质证书内容"
          ],
          "title": "资质证书"
        },
        {
          "action": {
            "form": {
              "placeholder": "填写原始资料，AI 会整理成网站内容",
              "submit": "提交并进入 AI 生成"
            },
            "icon": "edit",
            "ignorable": false,
            "text": "去补充案例"
          },
          "auto": false,
          "explain": "未检测到客户案例内容。AI 在推荐企业时，真实案例是最有说服力的证据，能直接说明“这家企业确实交付过”。",
          "id": "trust-case",
          "result": "案例资料已提交，AI 已生成案例内容并上线",
          "suggest": "补充 2-3 个典型案例（客户行业、需求、交付内容、成果），AI 会自动扩写成案例页",
          "tags": [
            "未检测到客户案例内容"
          ],
          "title": "真实客户案例"
        }
      ],
      "purpose": "AI 在推荐企业时越来越看重证据——资质证书、真实案例、交付流程、客户反馈、服务承诺。但很多企业这些内容并不齐全，AI 找不到证据，就很难把你放进候选名单。",
      "subtitle": "为 AI 提供可信证据，AI 才敢把你放进候选名单",
      "theme": "trust",
      "title": "AI 可信性优化",
      "value": "AI 先帮你检测可信内容的缺口，再引导你补齐最关键的资质证书和客户案例。这些内容补齐后，AI 在比选时会更有依据地信任你。"
    }
  ],
  "llmsText": "# llms.txt\n# 数字门户集团有限公司\n> 数字门户集团有限公司以黄金采、选、氰、冶为主导产业，面向黄金矿业和贵金属投资等领域，提供黄金生产、冶炼及矿山资源综合利用服务。\n数字门户集团有限公司位于山东省招远市，属地方大型国有控股企业，现有职工4700人。数字门户股份有限公司承载集团公司黄金主业，下辖姜家窑、阜山、北截、张家岭、金华山五个矿区，年自产黄金5吨，年冶炼成品金15吨，是上海黄金交易所国际标准金锭提供商，经营范围涉及职业培训、现代服务、贵金属投资等领域。地址：山东省某某市288号，邮箱：888@111.com，电话：400-600-5555。\n\n## 关于中矿\n- [关于中矿](https://cndemo.xuoumaill.cn/jianjie/1.html): 介绍数字门户集团有限公司的基本情况，包括以黄金采、选、氰、冶为主导产业，经营范围涉及旅游、服务、贵金属投资等领域。\n- [集团荣誉](https://cndemo.xuoumaill.cn/rongyu.html): 展示数字门户集团有限公司获得的各项荣誉和成就，体现企业在黄金产业及相关领域的实力和认可。\n\n## 集团文化\n- [集团文化](https://cndemo.xuoumaill.cn/qywh.html): 阐述数字门户集团有限公司的企业文化理念、价值观和精神内涵，展示企业的文化建设和员工风貌。\n- [党群之窗](https://cndemo.xuoumaill.cn/news/70.html): 发布数字门户集团有限公司党群工作动态，包括党建活动、工会工作、企业文化活动等内容。\n\n## 集团产业\n- [集团产业](https://cndemo.xuoumaill.cn/jtcy.html): 介绍数字门户集团有限公司的产业布局，涵盖黄金采选、冶炼、旅游、服务、贵金属投资等主要业务板块。\n- [某某大酒店](https://cndemo.xuoumaill.cn/product/29.html): 介绍某某大酒店的基本情况，包括占地100亩、建筑面积5.18万平方米，按五星级标准兴建，集住宿、餐饮、商务、会议、休闲、娱乐、健身等功能于一体。\n- [山东某某培训学校](https://cndemo.xuoumaill.cn/product/31.html): 介绍某某学校，总投资4.68亿元，以安全生产技术实操训练和体验式安全教育为特色，取得山东省安全生产培训机构资质。\n- [数字门户金业股份有限公司](https://cndemo.xuoumaill.cn/product/33.html): 介绍数字门户金业股份有限公司，专业从事黄金生产，下辖姜家窑、阜山、北截、张家岭、金华山五个矿区，年自产黄金5吨，年冶炼成品金15吨，是上海黄金交易所会员单位。\n- [黄金博物馆](https://cndemo.xuoumaill.cn/product/22.html): 介绍黄金博物馆，总投资4.8亿元，占地10.67万平方米，是国内规模最大、现代化元素最多、功能最全的黄金主题旅游景点，是全国科普教育基地和国家AAAA级景区。\n\n## 新闻中心\n- [新闻中心](https://cndemo.xuoumaill.cn/news/8/): 汇总数字门户集团有限公司的各类新闻资讯，包括集团新闻、公司新闻、集团公告等栏目入口。\n- [集团新闻](https://cndemo.xuoumaill.cn/news/1/): 发布数字门户集团有限公司的公司新闻，报道企业重大事件、生产经营动态、项目进展等最新消息。\n- [集团公告](https://cndemo.xuoumaill.cn/news/6/): 发布数字门户集团有限公司的官方公告，包括重要通知、招标信息、人事变动等需要公开告知的内容。\n- [专题活动](https://cndemo.xuoumaill.cn/news/68.html): 汇总数字门户金业举办的各类专题活动报道，包括活动内容、参与情况和相关成果。\n- [社会责任](https://cndemo.xuoumaill.cn/news/5/): 介绍数字门户金业在社会责任方面的实践与成果，涵盖员工关怀、社区共建等内容。\n- [安全生产](https://cndemo.xuoumaill.cn/news/9/): 发布数字门户金业安全生产相关新闻，包括安全培训、检查、事故预防措施等。\n- [绿色矿山](https://cndemo.xuoumaill.cn/news/10/): 展示数字门户金业在绿色矿山建设方面的进展，包括环保措施、生态修复和节能减排。\n- [社会公益](https://cndemo.xuoumaill.cn/news/11/): 记录数字门户金业参与的社会公益活动，如捐赠、志愿服务、扶贫济困等。\n- [党群之窗](https://cndemo.xuoumaill.cn/news/18/): 报道数字门户金业党建和群团工作动态，包括党组织活动、工会和共青团工作。\n- [开展内部审计专题讲座](https://cndemo.xuoumaill.cn/news/1.html): 报道数字门户金业举办内部审计专题讲座的情况，包括讲座内容、讲师信息和员工反馈。\n\n## 社会责任\n- [社会责任](https://cndemo.xuoumaill.cn/zeren/1602621351839301632.html): 详细阐述数字门户金业的社会责任理念、实践案例和未来规划，体现企业担当。\n\n## 对外合作\n- [对外合作](https://cndemo.xuoumaill.cn/hezuo/1.html): 介绍数字门户金业对外合作项目、合作伙伴及合作成果，寻求共赢发展机会。\n- [物资求购](https://cndemo.xuoumaill.cn/wuzi/1.html): 发布数字门户金业物资采购需求，包括物资种类、规格、数量及联系方式。\n- [原料求购](https://cndemo.xuoumaill.cn/hezuo/3.html): 公布数字门户金业原料采购信息，涉及矿石、药剂等原料的求购要求和标准。\n\n## 联系方式\n- [联系方式](https://cndemo.xuoumaill.cn/contactus.html): 提供数字门户金业的地址、电话、邮箱等联系信息，方便客户和合作伙伴咨询。\n- [在线留言](https://cndemo.xuoumaill.cn/liuyan.html): 提供在线留言表单，访客可填写姓名、电话、邮箱和留言内容，用于联系数字门户金业股份有限公司。\n\n## seo标签\n- [seo标签](https://cndemo.xuoumaill.cn/seoList.html): 列出网站使用的SEO标签，用于优化搜索引擎收录和关键词排名。\n\n## 2026 年固体废物污染防治信息公告\n- [2026 年固体废物污染防治信息公告](https://cndemo.xuoumaill.cn/news_detail/63.html): 发布数字门户金业股份有限公司2026年固体废物污染防治信息，包括废物产生、贮存、处置等情况。\n- [某某市数字门户有限公司矿山废弃资源综合利用项目验收公示](https://cndemo.xuoumaill.cn/news_detail/64.html): 公示某某市数字门户有限公司矿山废弃资源综合利用项目的验收情况，包括验收报告和专家意见。\n- [数字门户集团党员服务暖民心 美化环境焕新貌](https://cndemo.xuoumaill.cn/news_detail/66.html): 报道数字门户集团党员开展志愿服务活动，美化社区环境，提升居民生活质量。\n\n## Optional\n- [robots.txt](https://cndemo.xuoumaill.cn/robots.txt): robots.txt，说明搜索引擎和 AI 抓取本站时的访问规则。\n- [Sitemap](https://cndemo.xuoumaill.cn/sitemap.xml): Sitemap，提供本站页面结构，供搜索引擎和 AI 抓取。\n",
  "crawlerTabs": [
    {
      "code": "",
      "key": "all",
      "label": "全部",
      "count": 393
    },
    {
      "code": "ClaudeBot",
      "key": "ClaudeBot",
      "label": "Claude",
      "count": 239
    },
    {
      "code": "OAI-SearchBot",
      "key": "OAI-SearchBot",
      "label": "OpenAI",
      "count": 58
    },
    {
      "code": "Bytespider",
      "key": "Bytespider",
      "label": "豆包",
      "count": 45
    },
    {
      "code": "GPTBot",
      "key": "GPTBot",
      "label": "GPT",
      "count": 35
    },
    {
      "code": "GoogleOther",
      "key": "GoogleOther",
      "label": "Google",
      "count": 10
    },
    {
      "code": "meta-externalagent",
      "key": "meta-externalagent",
      "label": "Meta",
      "count": 2
    },
    {
      "code": "PerplexityBot",
      "key": "PerplexityBot",
      "label": "Perplexity",
      "count": 1
    },
    {
      "code": "ChatGPT-User",
      "key": "ChatGPT-User",
      "label": "ChatGPT",
      "count": 1
    },
    {
      "code": "CCBot",
      "key": "CCBot",
      "label": "Common Crawl",
      "count": 1
    },
    {
      "code": "Amazonbot",
      "key": "Amazonbot",
      "label": "亚马逊",
      "count": 1
    }
  ],
  "crawlerSeries": {
    "all": {
      "total": 379,
      "avg": "12.6",
      "max": 98,
      "trend": [
        {
          "count": 7,
          "date": "09-10"
        },
        {
          "count": 5,
          "date": "09-11"
        },
        {
          "count": 12,
          "date": "09-12"
        },
        {
          "count": 18,
          "date": "09-13"
        },
        {
          "count": 18,
          "date": "09-14"
        },
        {
          "count": 18,
          "date": "09-15"
        },
        {
          "count": 41,
          "date": "09-16"
        },
        {
          "count": 29,
          "date": "09-17"
        },
        {
          "count": 28,
          "date": "09-18"
        },
        {
          "count": 5,
          "date": "09-19"
        },
        {
          "count": 5,
          "date": "09-20"
        },
        {
          "count": 4,
          "date": "09-21"
        },
        {
          "count": 5,
          "date": "09-22"
        },
        {
          "count": 5,
          "date": "09-23"
        },
        {
          "count": 5,
          "date": "09-24"
        },
        {
          "count": 6,
          "date": "09-25"
        },
        {
          "count": 5,
          "date": "09-26"
        },
        {
          "count": 6,
          "date": "09-27"
        },
        {
          "count": 5,
          "date": "09-28"
        },
        {
          "count": 4,
          "date": "09-29"
        },
        {
          "count": 7,
          "date": "09-30"
        },
        {
          "count": 98,
          "date": "10-01"
        },
        {
          "count": 4,
          "date": "10-02"
        },
        {
          "count": 4,
          "date": "10-03"
        },
        {
          "count": 4,
          "date": "10-04"
        },
        {
          "count": 3,
          "date": "10-05"
        },
        {
          "count": 15,
          "date": "10-06"
        },
        {
          "count": 13,
          "date": "10-07"
        },
        {
          "count": 0,
          "date": "10-08"
        },
        {
          "count": 0,
          "date": "10-09"
        }
      ],
      "rows": [
        {
          "bot": "ClaudeBot",
          "duration": "0.061",
          "path": "/sitemap.xml",
          "status": 200,
          "time": "2026-10-09 09:43:56",
          "ua": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)"
        },
        {
          "bot": "ClaudeBot",
          "duration": "0.01",
          "path": "/robots.txt",
          "status": 200,
          "time": "2026-10-09 09:43:55",
          "ua": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)"
        },
        {
          "bot": "Bytespider",
          "duration": "0.054",
          "path": "/robots.txt",
          "status": 200,
          "time": "2026-10-09 08:14:40",
          "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/7.0 Mobile Safari/537.36 (compatible; Bytespider; https://bytedance.sg.larkoffice.com/docx/K5bxdypulop3IIxrJb0lOjLVgFe)"
        },
        {
          "bot": "GPTBot",
          "duration": "0.014",
          "path": "/npublic/libs/core/'.concat(o,'",
          "status": 404,
          "time": "2026-10-09 07:12:58",
          "ua": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)"
        },
        {
          "bot": "GPTBot",
          "duration": "0.007",
          "path": "/npublic/libs/core/').concat(e,'",
          "status": 404,
          "time": "2026-10-09 07:12:57",
          "ua": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)"
        },
        {
          "bot": "GPTBot",
          "duration": "0.008",
          "path": "/manifest.json",
          "status": 200,
          "time": "2026-10-09 07:12:53",
          "ua": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)"
        },
        {
          "bot": "OAI-SearchBot",
          "duration": "0.009",
          "path": "/robots.txt",
          "status": 200,
          "time": "2026-10-09 07:12:40",
          "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36; compatible; OAI-SearchBot/1.4; robots.txt; +https://openai.com/searchbot"
        },
        {
          "bot": "GPTBot",
          "duration": "0.02",
          "path": "/sitemap.xml",
          "status": 200,
          "time": "2026-10-09 07:12:40",
          "ua": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)"
        },
        {
          "bot": "OAI-SearchBot",
          "duration": "0.07",
          "path": "/robots.txt",
          "status": 200,
          "time": "2026-10-08 22:13:39",
          "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot"
        }
      ]
    },
    "ClaudeBot": {
      "total": 239,
      "avg": "8.0",
      "max": 96,
      "trend": [
        {
          "count": 0,
          "date": "09-10"
        },
        {
          "count": 0,
          "date": "09-11"
        },
        {
          "count": 4,
          "date": "09-12"
        },
        {
          "count": 13,
          "date": "09-13"
        },
        {
          "count": 12,
          "date": "09-14"
        },
        {
          "count": 13,
          "date": "09-15"
        },
        {
          "count": 13,
          "date": "09-16"
        },
        {
          "count": 26,
          "date": "09-17"
        },
        {
          "count": 24,
          "date": "09-18"
        },
        {
          "count": 2,
          "date": "09-19"
        },
        {
          "count": 2,
          "date": "09-20"
        },
        {
          "count": 2,
          "date": "09-21"
        },
        {
          "count": 2,
          "date": "09-22"
        },
        {
          "count": 2,
          "date": "09-23"
        },
        {
          "count": 2,
          "date": "09-24"
        },
        {
          "count": 2,
          "date": "09-25"
        },
        {
          "count": 2,
          "date": "09-26"
        },
        {
          "count": 2,
          "date": "09-27"
        },
        {
          "count": 2,
          "date": "09-28"
        },
        {
          "count": 2,
          "date": "09-29"
        },
        {
          "count": 3,
          "date": "09-30"
        },
        {
          "count": 96,
          "date": "10-01"
        },
        {
          "count": 0,
          "date": "10-02"
        },
        {
          "count": 2,
          "date": "10-03"
        },
        {
          "count": 2,
          "date": "10-04"
        },
        {
          "count": 0,
          "date": "10-05"
        },
        {
          "count": 3,
          "date": "10-06"
        },
        {
          "count": 2,
          "date": "10-07"
        },
        {
          "count": 2,
          "date": "10-08"
        },
        {
          "count": 2,
          "date": "10-09"
        }
      ],
      "rows": [
        {
          "bot": "ClaudeBot",
          "duration": "0.061",
          "path": "/sitemap.xml",
          "status": 200,
          "time": "2026-10-09 09:43:56",
          "ua": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)"
        },
        {
          "bot": "ClaudeBot",
          "duration": "0.01",
          "path": "/robots.txt",
          "status": 200,
          "time": "2026-10-09 09:43:55",
          "ua": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)"
        }
      ]
    },
    "OAI-SearchBot": {
      "total": 58,
      "avg": "1.9",
      "max": 3,
      "trend": [
        {
          "count": 2,
          "date": "09-10"
        },
        {
          "count": 3,
          "date": "09-11"
        },
        {
          "count": 3,
          "date": "09-12"
        },
        {
          "count": 2,
          "date": "09-13"
        },
        {
          "count": 3,
          "date": "09-14"
        },
        {
          "count": 2,
          "date": "09-15"
        },
        {
          "count": 3,
          "date": "09-16"
        },
        {
          "count": 2,
          "date": "09-17"
        },
        {
          "count": 2,
          "date": "09-18"
        },
        {
          "count": 2,
          "date": "09-19"
        },
        {
          "count": 2,
          "date": "09-20"
        },
        {
          "count": 1,
          "date": "09-21"
        },
        {
          "count": 2,
          "date": "09-22"
        },
        {
          "count": 2,
          "date": "09-23"
        },
        {
          "count": 2,
          "date": "09-24"
        },
        {
          "count": 1,
          "date": "09-25"
        },
        {
          "count": 2,
          "date": "09-26"
        },
        {
          "count": 2,
          "date": "09-27"
        },
        {
          "count": 2,
          "date": "09-28"
        },
        {
          "count": 1,
          "date": "09-29"
        },
        {
          "count": 3,
          "date": "09-30"
        },
        {
          "count": 1,
          "date": "10-01"
        },
        {
          "count": 2,
          "date": "10-02"
        },
        {
          "count": 1,
          "date": "10-03"
        },
        {
          "count": 1,
          "date": "10-04"
        },
        {
          "count": 1,
          "date": "10-05"
        },
        {
          "count": 3,
          "date": "10-06"
        },
        {
          "count": 2,
          "date": "10-07"
        },
        {
          "count": 2,
          "date": "10-08"
        },
        {
          "count": 1,
          "date": "10-09"
        }
      ],
      "rows": [
        {
          "bot": "OAI-SearchBot",
          "duration": "0.009",
          "path": "/robots.txt",
          "status": 200,
          "time": "2026-10-09 07:12:40",
          "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36; compatible; OAI-SearchBot/1.4; robots.txt; +https://openai.com/searchbot"
        },
        {
          "bot": "OAI-SearchBot",
          "duration": "0.07",
          "path": "/robots.txt",
          "status": 200,
          "time": "2026-10-08 22:13:39",
          "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot"
        }
      ]
    },
    "Bytespider": {
      "total": 45,
      "avg": "1.5",
      "max": 24,
      "trend": [
        {
          "count": 4,
          "date": "09-10"
        },
        {
          "count": 0,
          "date": "09-11"
        },
        {
          "count": 4,
          "date": "09-12"
        },
        {
          "count": 2,
          "date": "09-13"
        },
        {
          "count": 2,
          "date": "09-14"
        },
        {
          "count": 2,
          "date": "09-15"
        },
        {
          "count": 24,
          "date": "09-16"
        },
        {
          "count": 0,
          "date": "09-17"
        },
        {
          "count": 1,
          "date": "09-18"
        },
        {
          "count": 0,
          "date": "09-19"
        },
        {
          "count": 0,
          "date": "09-20"
        },
        {
          "count": 0,
          "date": "09-21"
        },
        {
          "count": 0,
          "date": "09-22"
        },
        {
          "count": 0,
          "date": "09-23"
        },
        {
          "count": 0,
          "date": "09-24"
        },
        {
          "count": 1,
          "date": "09-25"
        },
        {
          "count": 0,
          "date": "09-26"
        },
        {
          "count": 0,
          "date": "09-27"
        },
        {
          "count": 0,
          "date": "09-28"
        },
        {
          "count": 0,
          "date": "09-29"
        },
        {
          "count": 0,
          "date": "09-30"
        },
        {
          "count": 0,
          "date": "10-01"
        },
        {
          "count": 1,
          "date": "10-02"
        },
        {
          "count": 0,
          "date": "10-03"
        },
        {
          "count": 0,
          "date": "10-04"
        },
        {
          "count": 1,
          "date": "10-05"
        },
        {
          "count": 1,
          "date": "10-06"
        },
        {
          "count": 0,
          "date": "10-07"
        },
        {
          "count": 1,
          "date": "10-08"
        },
        {
          "count": 1,
          "date": "10-09"
        }
      ],
      "rows": [
        {
          "bot": "Bytespider",
          "duration": "0.054",
          "path": "/robots.txt",
          "status": 200,
          "time": "2026-10-09 08:14:40",
          "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/7.0 Mobile Safari/537.36 (compatible; Bytespider; https://bytedance.sg.larkoffice.com/docx/K5bxdypulop3IIxrJb0lOjLVgFe)"
        }
      ]
    },
    "GPTBot": {
      "total": 35,
      "avg": "1.2",
      "max": 4,
      "trend": [
        {
          "count": 1,
          "date": "09-10"
        },
        {
          "count": 1,
          "date": "09-11"
        },
        {
          "count": 1,
          "date": "09-12"
        },
        {
          "count": 1,
          "date": "09-13"
        },
        {
          "count": 1,
          "date": "09-14"
        },
        {
          "count": 1,
          "date": "09-15"
        },
        {
          "count": 1,
          "date": "09-16"
        },
        {
          "count": 1,
          "date": "09-17"
        },
        {
          "count": 1,
          "date": "09-18"
        },
        {
          "count": 1,
          "date": "09-19"
        },
        {
          "count": 1,
          "date": "09-20"
        },
        {
          "count": 1,
          "date": "09-21"
        },
        {
          "count": 1,
          "date": "09-22"
        },
        {
          "count": 1,
          "date": "09-23"
        },
        {
          "count": 1,
          "date": "09-24"
        },
        {
          "count": 1,
          "date": "09-25"
        },
        {
          "count": 1,
          "date": "09-26"
        },
        {
          "count": 1,
          "date": "09-27"
        },
        {
          "count": 1,
          "date": "09-28"
        },
        {
          "count": 1,
          "date": "09-29"
        },
        {
          "count": 1,
          "date": "09-30"
        },
        {
          "count": 1,
          "date": "10-01"
        },
        {
          "count": 1,
          "date": "10-02"
        },
        {
          "count": 1,
          "date": "10-03"
        },
        {
          "count": 1,
          "date": "10-04"
        },
        {
          "count": 1,
          "date": "10-05"
        },
        {
          "count": 3,
          "date": "10-06"
        },
        {
          "count": 1,
          "date": "10-07"
        },
        {
          "count": 1,
          "date": "10-08"
        },
        {
          "count": 4,
          "date": "10-09"
        }
      ],
      "rows": [
        {
          "bot": "GPTBot",
          "duration": "0.014",
          "path": "/npublic/libs/core/'.concat(o,'",
          "status": 404,
          "time": "2026-10-09 07:12:58",
          "ua": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)"
        },
        {
          "bot": "GPTBot",
          "duration": "0.007",
          "path": "/npublic/libs/core/').concat(e,'",
          "status": 404,
          "time": "2026-10-09 07:12:57",
          "ua": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)"
        },
        {
          "bot": "GPTBot",
          "duration": "0.008",
          "path": "/manifest.json",
          "status": 200,
          "time": "2026-10-09 07:12:53",
          "ua": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)"
        },
        {
          "bot": "GPTBot",
          "duration": "0.02",
          "path": "/sitemap.xml",
          "status": 200,
          "time": "2026-10-09 07:12:40",
          "ua": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)"
        }
      ]
    },
    "GoogleOther": {
      "total": 10,
      "avg": "0.3",
      "max": 8,
      "trend": [
        {
          "count": 0,
          "date": "09-10"
        },
        {
          "count": 0,
          "date": "09-11"
        },
        {
          "count": 0,
          "date": "09-12"
        },
        {
          "count": 0,
          "date": "09-13"
        },
        {
          "count": 0,
          "date": "09-14"
        },
        {
          "count": 0,
          "date": "09-15"
        },
        {
          "count": 0,
          "date": "09-16"
        },
        {
          "count": 0,
          "date": "09-17"
        },
        {
          "count": 0,
          "date": "09-18"
        },
        {
          "count": 0,
          "date": "09-19"
        },
        {
          "count": 0,
          "date": "09-20"
        },
        {
          "count": 0,
          "date": "09-21"
        },
        {
          "count": 0,
          "date": "09-22"
        },
        {
          "count": 0,
          "date": "09-23"
        },
        {
          "count": 0,
          "date": "09-24"
        },
        {
          "count": 1,
          "date": "09-25"
        },
        {
          "count": 0,
          "date": "09-26"
        },
        {
          "count": 1,
          "date": "09-27"
        },
        {
          "count": 0,
          "date": "09-28"
        },
        {
          "count": 0,
          "date": "09-29"
        },
        {
          "count": 0,
          "date": "09-30"
        },
        {
          "count": 0,
          "date": "10-01"
        },
        {
          "count": 0,
          "date": "10-02"
        },
        {
          "count": 0,
          "date": "10-03"
        },
        {
          "count": 0,
          "date": "10-04"
        },
        {
          "count": 0,
          "date": "10-05"
        },
        {
          "count": 0,
          "date": "10-06"
        },
        {
          "count": 8,
          "date": "10-07"
        },
        {
          "count": 0,
          "date": "10-08"
        },
        {
          "count": 0,
          "date": "10-09"
        }
      ],
      "rows": []
    },
    "meta-externalagent": {
      "total": 2,
      "avg": "0.1",
      "max": 1,
      "trend": [
        {
          "count": 0,
          "date": "09-10"
        },
        {
          "count": 1,
          "date": "09-11"
        },
        {
          "count": 0,
          "date": "09-12"
        },
        {
          "count": 0,
          "date": "09-13"
        },
        {
          "count": 0,
          "date": "09-14"
        },
        {
          "count": 0,
          "date": "09-15"
        },
        {
          "count": 0,
          "date": "09-16"
        },
        {
          "count": 0,
          "date": "09-17"
        },
        {
          "count": 0,
          "date": "09-18"
        },
        {
          "count": 0,
          "date": "09-19"
        },
        {
          "count": 0,
          "date": "09-20"
        },
        {
          "count": 0,
          "date": "09-21"
        },
        {
          "count": 0,
          "date": "09-22"
        },
        {
          "count": 0,
          "date": "09-23"
        },
        {
          "count": 0,
          "date": "09-24"
        },
        {
          "count": 0,
          "date": "09-25"
        },
        {
          "count": 0,
          "date": "09-26"
        },
        {
          "count": 0,
          "date": "09-27"
        },
        {
          "count": 0,
          "date": "09-28"
        },
        {
          "count": 0,
          "date": "09-29"
        },
        {
          "count": 0,
          "date": "09-30"
        },
        {
          "count": 0,
          "date": "10-01"
        },
        {
          "count": 0,
          "date": "10-02"
        },
        {
          "count": 0,
          "date": "10-03"
        },
        {
          "count": 0,
          "date": "10-04"
        },
        {
          "count": 0,
          "date": "10-05"
        },
        {
          "count": 1,
          "date": "10-06"
        },
        {
          "count": 0,
          "date": "10-07"
        },
        {
          "count": 0,
          "date": "10-08"
        },
        {
          "count": 0,
          "date": "10-09"
        }
      ],
      "rows": []
    },
    "PerplexityBot": {
      "total": 1,
      "avg": "0.0",
      "max": 1,
      "trend": [
        {
          "count": 0,
          "date": "09-10"
        },
        {
          "count": 0,
          "date": "09-11"
        },
        {
          "count": 0,
          "date": "09-12"
        },
        {
          "count": 0,
          "date": "09-13"
        },
        {
          "count": 0,
          "date": "09-14"
        },
        {
          "count": 0,
          "date": "09-15"
        },
        {
          "count": 0,
          "date": "09-16"
        },
        {
          "count": 0,
          "date": "09-17"
        },
        {
          "count": 0,
          "date": "09-18"
        },
        {
          "count": 0,
          "date": "09-19"
        },
        {
          "count": 0,
          "date": "09-20"
        },
        {
          "count": 0,
          "date": "09-21"
        },
        {
          "count": 0,
          "date": "09-22"
        },
        {
          "count": 0,
          "date": "09-23"
        },
        {
          "count": 0,
          "date": "09-24"
        },
        {
          "count": 0,
          "date": "09-25"
        },
        {
          "count": 0,
          "date": "09-26"
        },
        {
          "count": 0,
          "date": "09-27"
        },
        {
          "count": 0,
          "date": "09-28"
        },
        {
          "count": 0,
          "date": "09-29"
        },
        {
          "count": 0,
          "date": "09-30"
        },
        {
          "count": 0,
          "date": "10-01"
        },
        {
          "count": 0,
          "date": "10-02"
        },
        {
          "count": 0,
          "date": "10-03"
        },
        {
          "count": 0,
          "date": "10-04"
        },
        {
          "count": 0,
          "date": "10-05"
        },
        {
          "count": 1,
          "date": "10-06"
        },
        {
          "count": 0,
          "date": "10-07"
        },
        {
          "count": 0,
          "date": "10-08"
        },
        {
          "count": 0,
          "date": "10-09"
        }
      ],
      "rows": []
    },
    "ChatGPT-User": {
      "total": 1,
      "avg": "0.0",
      "max": 1,
      "trend": [
        {
          "count": 0,
          "date": "09-10"
        },
        {
          "count": 0,
          "date": "09-11"
        },
        {
          "count": 0,
          "date": "09-12"
        },
        {
          "count": 0,
          "date": "09-13"
        },
        {
          "count": 0,
          "date": "09-14"
        },
        {
          "count": 0,
          "date": "09-15"
        },
        {
          "count": 0,
          "date": "09-16"
        },
        {
          "count": 0,
          "date": "09-17"
        },
        {
          "count": 0,
          "date": "09-18"
        },
        {
          "count": 0,
          "date": "09-19"
        },
        {
          "count": 0,
          "date": "09-20"
        },
        {
          "count": 0,
          "date": "09-21"
        },
        {
          "count": 0,
          "date": "09-22"
        },
        {
          "count": 0,
          "date": "09-23"
        },
        {
          "count": 0,
          "date": "09-24"
        },
        {
          "count": 0,
          "date": "09-25"
        },
        {
          "count": 0,
          "date": "09-26"
        },
        {
          "count": 0,
          "date": "09-27"
        },
        {
          "count": 0,
          "date": "09-28"
        },
        {
          "count": 0,
          "date": "09-29"
        },
        {
          "count": 0,
          "date": "09-30"
        },
        {
          "count": 0,
          "date": "10-01"
        },
        {
          "count": 0,
          "date": "10-02"
        },
        {
          "count": 0,
          "date": "10-03"
        },
        {
          "count": 0,
          "date": "10-04"
        },
        {
          "count": 0,
          "date": "10-05"
        },
        {
          "count": 1,
          "date": "10-06"
        },
        {
          "count": 0,
          "date": "10-07"
        },
        {
          "count": 0,
          "date": "10-08"
        },
        {
          "count": 0,
          "date": "10-09"
        }
      ],
      "rows": []
    },
    "CCBot": {
      "total": 1,
      "avg": "0.0",
      "max": 1,
      "trend": [
        {
          "count": 0,
          "date": "09-10"
        },
        {
          "count": 0,
          "date": "09-11"
        },
        {
          "count": 0,
          "date": "09-12"
        },
        {
          "count": 0,
          "date": "09-13"
        },
        {
          "count": 0,
          "date": "09-14"
        },
        {
          "count": 0,
          "date": "09-15"
        },
        {
          "count": 0,
          "date": "09-16"
        },
        {
          "count": 0,
          "date": "09-17"
        },
        {
          "count": 0,
          "date": "09-18"
        },
        {
          "count": 0,
          "date": "09-19"
        },
        {
          "count": 0,
          "date": "09-20"
        },
        {
          "count": 0,
          "date": "09-21"
        },
        {
          "count": 0,
          "date": "09-22"
        },
        {
          "count": 0,
          "date": "09-23"
        },
        {
          "count": 0,
          "date": "09-24"
        },
        {
          "count": 0,
          "date": "09-25"
        },
        {
          "count": 0,
          "date": "09-26"
        },
        {
          "count": 0,
          "date": "09-27"
        },
        {
          "count": 0,
          "date": "09-28"
        },
        {
          "count": 0,
          "date": "09-29"
        },
        {
          "count": 0,
          "date": "09-30"
        },
        {
          "count": 0,
          "date": "10-01"
        },
        {
          "count": 0,
          "date": "10-02"
        },
        {
          "count": 0,
          "date": "10-03"
        },
        {
          "count": 0,
          "date": "10-04"
        },
        {
          "count": 0,
          "date": "10-05"
        },
        {
          "count": 1,
          "date": "10-06"
        },
        {
          "count": 0,
          "date": "10-07"
        },
        {
          "count": 0,
          "date": "10-08"
        },
        {
          "count": 0,
          "date": "10-09"
        }
      ],
      "rows": []
    },
    "Amazonbot": {
      "total": 1,
      "avg": "0.0",
      "max": 1,
      "trend": [
        {
          "count": 0,
          "date": "09-10"
        },
        {
          "count": 0,
          "date": "09-11"
        },
        {
          "count": 0,
          "date": "09-12"
        },
        {
          "count": 0,
          "date": "09-13"
        },
        {
          "count": 0,
          "date": "09-14"
        },
        {
          "count": 0,
          "date": "09-15"
        },
        {
          "count": 0,
          "date": "09-16"
        },
        {
          "count": 0,
          "date": "09-17"
        },
        {
          "count": 0,
          "date": "09-18"
        },
        {
          "count": 0,
          "date": "09-19"
        },
        {
          "count": 0,
          "date": "09-20"
        },
        {
          "count": 0,
          "date": "09-21"
        },
        {
          "count": 0,
          "date": "09-22"
        },
        {
          "count": 0,
          "date": "09-23"
        },
        {
          "count": 0,
          "date": "09-24"
        },
        {
          "count": 0,
          "date": "09-25"
        },
        {
          "count": 0,
          "date": "09-26"
        },
        {
          "count": 0,
          "date": "09-27"
        },
        {
          "count": 0,
          "date": "09-28"
        },
        {
          "count": 0,
          "date": "09-29"
        },
        {
          "count": 0,
          "date": "09-30"
        },
        {
          "count": 0,
          "date": "10-01"
        },
        {
          "count": 0,
          "date": "10-02"
        },
        {
          "count": 0,
          "date": "10-03"
        },
        {
          "count": 0,
          "date": "10-04"
        },
        {
          "count": 0,
          "date": "10-05"
        },
        {
          "count": 1,
          "date": "10-06"
        },
        {
          "count": 0,
          "date": "10-07"
        },
        {
          "count": 0,
          "date": "10-08"
        },
        {
          "count": 0,
          "date": "10-09"
        }
      ],
      "rows": []
    }
  }
}
