export interface TemplateColors {
  primary: string;
  background: string;
  text: string;
  gradient: string;
}

export const DEFAULT_TEMPLATE_COLORS: TemplateColors = {
  primary: "#2563eb",
  background: "#f4f5f7",
  text: "#1f2937",
  gradient: "linear-gradient(135deg, #2563eb 0%, #16a34a 100%)",
};

export function applyTemplateColors(
  html: string,
  colors: TemplateColors,
): string {
  return html
    .replace(/\{\{color_primary\}\}/g, colors.primary)
    .replace(/\{\{color_background\}\}/g, colors.background)
    .replace(/\{\{color_text\}\}/g, colors.text)
    .replace(/\{\{color_gradient\}\}/g, colors.gradient);
}
