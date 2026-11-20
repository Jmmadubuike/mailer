import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  extractVariables,
  renderTemplate,
} from "./render";

describe("renderTemplate", () => {
  it("resolves standard variables", () => {
    const output = renderTemplate("Hello {{first_name}}, welcome!", {
      first_name: "Ada",
    });
    expect(output).toBe("Hello Ada, welcome!");
  });

  it("resolves nested custom fields", () => {
    const output = renderTemplate(
      "{{custom_fields.industry}}",
      { custom_fields: { industry: "Software" } },
    );
    expect(output).toBe("Software");
  });

  it("applies inline defaults for missing values", () => {
    const output = renderTemplate(
      "Hello {{first_name | default: there}}",
      {},
    );
    expect(output).toBe("Hello there");
  });

  it("leaves missing variables empty when no default is provided", () => {
    const output = renderTemplate("Hi {{first_name}}!", {});
    expect(output).toBe("Hi !");
  });

  it("resolves current_year", () => {
    const output = renderTemplate("{{current_year}}", {});
    expect(output).toBe(String(new Date().getFullYear()));
  });

  it("escapes HTML in inserted values", () => {
    const output = renderTemplate("{{name}}", { name: "<script>" });
    expect(output).toBe("&lt;script&gt;");
  });

  it("does not HTML-escape when html is disabled", () => {
    const output = renderTemplate(
      "Subject for {{name}}",
      { name: "A & B" },
      {},
      { html: false },
    );
    expect(output).toBe("Subject for A & B");
  });
});

describe("extractVariables", () => {
  it("returns unique variable names", () => {
    expect(
      extractVariables("{{first_name}} {{first_name}} {{custom_fields.industry}}"),
    ).toEqual(["first_name", "custom_fields.industry"]);
  });
});

describe("escapeHtml", () => {
  it("escapes ampersands and brackets", () => {
    expect(escapeHtml("<a href='x'>&")).toBe(
      "&lt;a href=&#39;x&#39;&gt;&amp;",
    );
  });
});
