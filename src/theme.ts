import type { ThemeConfig } from 'antd'

/** 数字门户品牌青 + 冰蓝控制台 token */
export const ICE = {
  brand: '#3B9FD0',
  brandHover: '#2F8BB8',
  brandActive: '#2779A3',
  brandSoft: 'rgba(59, 159, 208, 0.12)',
  glow: '#7DD3F0',
  navy: '#0B1F33',
  navy2: '#0E2A45',
  canvas: '#F3F8FC',
  surface: '#FFFFFF',
  border: '#D7E6F0',
  text: '#1E293B',
  textSecondary: '#64748B',
} as const

export const iceTheme: ThemeConfig = {
  token: {
    colorPrimary: ICE.brand,
    colorInfo: ICE.brand,
    colorBgLayout: ICE.canvas,
    colorBgContainer: ICE.surface,
    colorBorder: ICE.border,
    colorText: ICE.text,
    colorTextSecondary: ICE.textSecondary,
    borderRadius: 8,
    borderRadiusLG: 12,
    fontFamily:
      '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif',
    fontFamilyCode: '"IBM Plex Mono", "Cascadia Mono", "SF Mono", Consolas, monospace',
    controlOutline: 'rgba(59, 159, 208, 0.28)',
  },
  components: {
    Layout: {
      siderBg: 'transparent',
      triggerBg: 'rgba(11, 31, 51, 0.55)',
      triggerColor: '#7DD3F0',
      headerBg: ICE.surface,
      headerColor: ICE.text,
      headerHeight: 72,
      headerPadding: '0 28px',
      bodyBg: ICE.canvas,
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemColor: 'rgba(186, 220, 236, 0.82)',
      darkItemHoverBg: 'rgba(125, 211, 240, 0.08)',
      darkItemHoverColor: '#E8F7FC',
      darkItemSelectedBg: 'rgba(59, 159, 208, 0.22)',
      darkItemSelectedColor: ICE.glow,
      itemBorderRadius: 8,
      itemMarginInline: 4,
      itemMarginBlock: 4,
      itemHeight: 42,
      iconSize: 16,
    },
    Button: {
      primaryShadow: '0 4px 12px rgba(59, 159, 208, 0.28)',
    },
  },
}

export const iceSelectTheme: ThemeConfig = {
  token: {
    colorPrimary: ICE.brand,
    colorBgContainer: 'rgba(14, 42, 69, 0.72)',
    colorBorder: 'rgba(125, 211, 240, 0.2)',
    colorText: '#E8F7FC',
    colorTextPlaceholder: '#7AA3B8',
    colorBgElevated: ICE.navy2,
    colorTextQuaternary: '#7AA3B8',
    borderRadius: 8,
  },
}
