# Known limitations

- The rich-text editor supports bold, italic, underline, headings, lists,
  links, images, alignment, color, and highlight. Font family/size controls
  and table insertion are not included.
- Unsubscribes are global opt-outs; list-level unsubscribe preferences and a
  re-consent flow are pending.
- Segmentation supports nested AND/OR groups in the engine but the UI builder
  currently exposes a single flat group.
- Analytics covers combined and per-domain/per-campaign aggregates; the
  dashboard date filters and engagement charts are pending.
- Integration and end-to-end automated tests are pending.
- `exceljs` brings a transitive `uuid` dependency flagged by `npm audit` at
  moderate severity (the advisory covers v3/v5/v6 buffer checks, which the
  XLSX parse path does not use).
