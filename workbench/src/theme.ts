import type { ThemeConfig } from 'antd'

/** 内容区按增长工作台设计规范；顶栏仍用数字门户青绿 */
export const PORTAL = {
  brand: '#3989FF',
  brandHover: '#1F6FDB',
  brandActive: '#1A5BB8',
  brandSoft: '#EEF6FF',
  brandHoverBg: '#DBEBFF',
  brandBorder: '#B9D9FF',
  brandBar: '#3F89F6',
  canvas: '#F5F7FB',
  surface: '#FFFFFF',
  border: '#E7EBF3',
  text: '#0F172A',
  textSecondary: '#475569',
  textDim: '#94A3B8',
} as const

export const portalTheme: ThemeConfig = {
  token: {
    colorPrimary: PORTAL.brand,
    colorPrimaryHover: PORTAL.brandHover,
    colorPrimaryActive: PORTAL.brandActive,
    colorPrimaryBg: PORTAL.brandSoft,
    colorPrimaryBgHover: PORTAL.brandHoverBg,
    colorPrimaryBorder: PORTAL.brandBorder,
    colorInfo: PORTAL.brand,
    colorBgLayout: PORTAL.canvas,
    colorBgContainer: PORTAL.surface,
    colorBorder: PORTAL.border,
    colorBorderSecondary: PORTAL.border,
    colorSplit: PORTAL.border,
    colorText: PORTAL.text,
    colorTextSecondary: PORTAL.textSecondary,
    colorTextTertiary: PORTAL.textDim,
    borderRadius: 6,
    borderRadiusLG: 8,
    fontSize: 14,
    fontFamily:
      '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif',
    fontFamilyCode: '"IBM Plex Mono", "SF Mono", Consolas, monospace',
    controlHeight: 40,
    controlHeightSM: 32,
    controlOutline: 'rgba(57, 137, 255, 0.28)',
  },
  components: {
    Layout: {
      headerBg: PORTAL.brand,
      headerColor: '#ffffff',
      headerHeight: 56,
      headerPadding: '0 20px',
      siderBg: PORTAL.surface,
      lightSiderBg: PORTAL.surface,
      bodyBg: PORTAL.canvas,
      triggerBg: PORTAL.canvas,
      triggerColor: PORTAL.brand,
      lightTriggerBg: PORTAL.canvas,
      lightTriggerColor: PORTAL.brand,
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: PORTAL.textSecondary,
      itemHoverBg: PORTAL.brandHoverBg,
      itemHoverColor: PORTAL.brand,
      itemSelectedBg: PORTAL.brandSoft,
      itemSelectedColor: PORTAL.brand,
      itemActiveBg: PORTAL.brandSoft,
      itemBorderRadius: 6,
      itemMarginInline: 8,
      itemMarginBlock: 2,
      itemHeight: 40,
      iconSize: 16,
    },
  },
}

/** @deprecated 旧冰蓝主题名，指向门户主题 */
export const iceTheme = portalTheme
export const ICE = PORTAL
