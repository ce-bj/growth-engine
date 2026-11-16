/** 数据看板与智能体分析页共用的 antd 主题，对齐增长工作台门户蓝。 */
export const ACCENT = "#2f8bb8";
export const DANGER = "#cf1322";

export const BOARD_THEME = {
  token: {
    colorPrimary: ACCENT,
    colorInfo: ACCENT,
    borderRadius: 8,
    fontSize: 14,
    controlHeight: 32,
  },
  components: {
    Card: { headerFontSize: 15, headerHeight: 52, bodyPadding: 20 },
    Table: { cellPaddingBlockSM: 8, headerBg: "#f7f9fb" },
    Statistic: { contentFontSize: 30, titleFontSize: 13 },
  },
};
