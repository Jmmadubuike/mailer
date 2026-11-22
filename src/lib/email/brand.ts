import "server-only";
import { getEnv } from "@/config/env";
import { DEFAULT_TEMPLATE_COLORS } from "@/lib/templates/colors";

export const BRAND_NAME = getEnv().EMAIL_FROM_NAME;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function brandedLayout(opts: {
  heading: string;
  body: string;
  cta?: string;
  ctaHref?: string;
}): string {
  const name = escapeHtml(BRAND_NAME);
  const button = opts.cta
    ? `<p style="margin:24px 0 0"><a href="${escapeHtml(
        opts.ctaHref ?? "#",
      )}" style="display:inline-block;background-color:{{color_primary}};color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:6px;font-size:14px;font-weight:600">${opts.cta}</a></p>`
    : "";
  return (
    `<div style="background-color:{{color_background}};font-family:Arial,Helvetica,sans-serif;padding:32px 16px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%"><tr><td style="background-color:#ffffff;border-radius:10px;overflow:hidden">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:22px 32px;border-bottom:4px solid {{color_primary}}"><span style="color:{{color_primary}};font-size:20px;font-weight:700;letter-spacing:0.5px">${name}</span></td></tr>` +
    `<tr><td style="padding:36px 32px 28px">` +
    `<h1 style="color:{{color_text}};font-size:22px;margin:0 0 16px;font-weight:700">${opts.heading}</h1>` +
    `<p style="color:{{color_text}};font-size:15px;line-height:1.65;margin:0">${opts.body}</p>` +
    button +
    `</td></tr>` +
    `<tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.7">` +
    `<p style="margin:0">${name}</p>` +
    `<p style="margin:8px 0 0">You&rsquo;re receiving this because you subscribed. <a href="{{unsubscribe_url}}" style="color:#64748b">Unsubscribe</a></p>` +
    `</td></tr>` +
    `</table></td></tr></table></td></tr></table></div>`
  );
}

export function transactionalLayout(opts: {
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
}): string {
  const name = escapeHtml(BRAND_NAME);
  const primary = DEFAULT_TEMPLATE_COLORS.primary;
  const background = DEFAULT_TEMPLATE_COLORS.background;
  const text = DEFAULT_TEMPLATE_COLORS.text;
  const button = opts.cta
    ? `<p style="margin:24px 0 0"><a href="${escapeHtml(
        opts.cta.href,
      )}" style="display:inline-block;background-color:${primary};color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:6px;font-size:14px;font-weight:600">${opts.cta.label}</a></p>`
    : "";
  return (
    `<div style="background-color:${background};font-family:Arial,Helvetica,sans-serif;padding:32px 16px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%"><tr><td style="background-color:#ffffff;border-radius:10px;overflow:hidden">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:22px 32px;border-bottom:4px solid ${primary}"><span style="color:${primary};font-size:20px;font-weight:700;letter-spacing:0.5px">${name}</span></td></tr>` +
    `<tr><td style="padding:36px 32px 28px">` +
    `<h1 style="color:${text};font-size:22px;margin:0 0 16px;font-weight:700">${opts.title}</h1>` +
    opts.bodyHtml +
    button +
    `</td></tr>` +
    `<tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.7">` +
    `<p style="margin:0">${name}</p>` +
    `</td></tr>` +
    `</table></td></tr></table></td></tr></table></div>`
  );
}
