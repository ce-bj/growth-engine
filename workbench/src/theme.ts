import type { ThemeConfig } from 'antd'

/** 内容区对齐内容发布智能体 indigo；顶栏仍用数字门户青绿 */
export const PORTAL = {
  brand: '#6366F1',
  brandHover: '#4F46E5',
  brandActive: '#4338CA',
  brandSoft: 'rgba(99, 102, 241, 0.12)',
  canvas: '#F5F7FB',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textSecondary: '#475569',
  textDim: '#94A3B8',
} as const

export const portalTheme: ThemeConfig = {
  token: {
    colorPrimary: PORTAL.brand,
    colorInfo: PORTAL.brand,
    colorBgLayout: PORTAL.canvas,
    colorBgContainer: PORTAL.surface,
    colorBorder: PORTAL.border,
    colorText: PORTAL.text,
    colorTextSecondary: PORTAL.textSecondary,
    borderRadius: 6,
    borderRadiusLG: 8,
    fontFamily:
      '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif',
    controlOutline: 'rgba(99, 102, 241, 0.28)',
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
      itemHoverBg: PORTAL.brandSoft,
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
