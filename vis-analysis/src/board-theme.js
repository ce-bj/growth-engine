/** 访客洞察 / 优化策略的主色，对齐工作台规范 #3989FF。 */
export const ACCENT = "#3989FF";
/** 数据分析总览原来的门户蓝。 */
export const PORTAL_BLUE = "#2f8bb8";
export const DANGER = "#cf1322";

export const BOARD_THEME = {
  token: {
    colorPrimary: ACCENT,
    colorInfo: ACCENT,
    colorBorderSecondary: "#e7ebf3",
    borderRadius: 6,
    borderRadiusLG: 8,
    fontSize: 14,
    controlHeight: 40,
  },
  components: {
    Card: { headerFontSize: 16, headerHeight: 56, bodyPadding: 24, borderRadiusLG: 8 },
    Button: { borderRadius: 6, controlHeight: 40 },
    Table: { cellPaddingBlockSM: 8, headerBg: "#f7f9fb" },
    Statistic: { contentFontSize: 30, titleFontSize: 13 },
  },
};

export const BOARD_BLUE_THEME = {
  ...BOARD_THEME,
  token: {
    ...BOARD_THEME.token,
    colorPrimary: PORTAL_BLUE,
    colorInfo: PORTAL_BLUE,
    borderRadius: 8,
    controlHeight: 32,
  },
  components: {
    ...BOARD_THEME.components,
    Button: { borderRadius: 8, controlHeight: 32 },
  },
};
