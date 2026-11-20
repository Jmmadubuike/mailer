export interface TemplateColors {
  primary: string;
  background: string;
  text: string;
}

export const DEFAULT_TEMPLATE_COLORS: TemplateColors = {
  primary: "#4f46e5",
  background: "#f4f5f7",
  text: "#1f2937",
};

export function applyTemplateColors(
  html: string,
  colors: TemplateColors,
): string {
  return html
    .replace(/\{\{color_primary\}\}/g, colors.primary)
    .replace(/\{\{color_background\}\}/g, colors.background)
    .replace(/\{\{color_text\}\}/g, colors.text);
}
