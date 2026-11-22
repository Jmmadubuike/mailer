import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3000";
const PORT = 9333;
const OUT = "docs/ui-ux-audit/screenshots";
const EMAIL = process.env.VISUAL_EMAIL;
const PASSWORD = process.env.VISUAL_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Set VISUAL_EMAIL and VISUAL_PASSWORD before running.");
  process.exit(2);
}

const ROUTES = [
  "/dashboard",
  "/dashboard/analytics",
  "/dashboard/audit-logs",
  "/dashboard/campaigns",
  "/dashboard/campaigns/new",
  "/dashboard/contacts",
  "/dashboard/contacts/import",
  "/dashboard/lists",
  "/dashboard/segments",
  "/dashboard/sending-domains",
  "/dashboard/settings",
  "/dashboard/suppressions",
  "/dashboard/team",
  "/dashboard/templates",
];
const WIDTHS = [320, 360, 375, 390, 414, 430, 768, 820, 1024, 1280, 1366, 1440, 1920];
const SHOT_ROUTES = [
  "/dashboard",
  "/dashboard/campaigns",
  "/dashboard/contacts",
  "/dashboard/team",
  "/dashboard/sending-domains",
  "/dashboard/analytics",
];
const SHOT_WIDTHS = [320, 375, 768, 1440];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const profile = mkdtempSync(join(tmpdir(), "mailer-chrome-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-gpu",
    "--window-size=1440,900",
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function getWsUrl() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((target) => target.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // retry
    }
    await sleep(200);
  }
  throw new Error("Chrome DevTools endpoint not reachable");
}

let ws;
let id = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "evaluate failed");
  }
  return result.result?.value;
}

async function navigate(url) {
  await send("Page.navigate", { url });
  for (let i = 0; i < 100; i += 1) {
    const ready = await evaluate("document.readyState");
    if (ready === "complete") {
      await sleep(400);
      return;
    }
    await sleep(200);
  }
}

async function setViewport(width, height) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
}

async function main() {
  const wsUrl = await getWsUrl();
  ws = new WebSocket(wsUrl);
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) entry.reject(new Error(message.error.message));
      else entry.resolve(message.result);
    }
  };
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await send("Page.enable");
  await send("Runtime.enable");

  await navigate(`${BASE}/login`);
  await evaluate(
    `(async () => {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '${EMAIL}', password: '${PASSWORD}' }),
      });
    })()`,
  );
  await sleep(500);
  const meStatus = await evaluate(
    `(async () => (await fetch('/api/auth/me')).status)()`,
  );
  console.log(`auth/me status: ${meStatus}`);

  const overflow = [];
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      await setViewport(width, 900);
      await navigate(`${BASE}${route}`);
      const metrics = await evaluate(
        `(() => ({
          sw: document.documentElement.scrollWidth,
          iw: window.innerWidth,
        }))()`,
      );
      if (metrics.sw > metrics.iw + 1) {
        overflow.push({ route, width, scrollWidth: metrics.sw, innerWidth: metrics.iw });
      }
    }
  }

  for (const route of SHOT_ROUTES) {
    for (const width of SHOT_WIDTHS) {
      await setViewport(width, 900);
      await navigate(`${BASE}${route}`);
      const shot = await send("Page.captureScreenshot", { format: "png" });
      const name = `${route.replace(/\//g, "_")}-${width}.png`;
      writeFileSync(join(OUT, name), Buffer.from(shot.data, "base64"));
    }
  }

  console.log("PAGE_OVERFLOW=" + JSON.stringify(overflow));
  console.log("SCREENSHOTS_DONE");
  chrome.kill();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  chrome.kill();
  process.exit(1);
});
