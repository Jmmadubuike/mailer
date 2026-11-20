import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "a",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "strike",
  "br",
  "hr",
  "div",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "img",
  "button",
  "small",
  "sub",
  "sup",
  "figure",
  "figcaption",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "name", "target", "title", "rel"],
  img: ["src", "alt", "width", "height", "title"],
  td: ["colspan", "rowspan", "align", "valign", "width"],
  th: ["colspan", "rowspan", "align", "valign", "width"],
  table: ["width", "border", "cellpadding", "cellspacing", "align", "role"],
  "*": ["style", "class", "align", "bgcolor", "border"],
};

export function sanitizeEmailHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https", "cid"] },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
  });
}
