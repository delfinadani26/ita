const PRIMARY = "#0A2040";
const ACCENT = "#D4A017";
const ACCENT_LIGHT = "#F0C040";
const SUCCESS = "#2ECC71";
const DANGER = "#E74C3C";
const WARNING = "#F39C12";
const INFO = "#3498DB";

export const Colors = {
  primary: PRIMARY,
  primaryLight: "#1A3560",
  primaryDark: "#051020",
  accent: ACCENT,
  accentLight: ACCENT_LIGHT,
  accentDark: "#A07810",
  success: SUCCESS,
  successLight: "#A9DFBF",
  danger: DANGER,
  warning: WARNING,
  warningLight: "#F8D7A8",
  info: INFO,
  infoLight: "#AED6F1",
  white: "#FFFFFF",
  offWhite: "#F7F8FA",
  lightGray: "#F0F2F5",
  mediumGray: "#C8CDD5",
  darkGray: "#6B7280",
  text: "#0D1B2A",
  textSecondary: "#4B5E72",
  textLight: "#8A9BB0",
  border: "#E0E5EB",
  cardBg: "#FFFFFF",
  tabBar: PRIMARY,
  background: "#F7F8FA",
};

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: Colors.primary,
    tabIconDefault: "#8A9BB0",
    tabIconSelected: Colors.accent,
  },
};
