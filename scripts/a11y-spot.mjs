import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3000";
const PORT = 9335;
const EMAIL = process.env.VISUAL_EMAIL;
const PASSWORD = process.env.VISUAL_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Set VISUAL_EMAIL and VISUAL_PASSWORD before running.");
  process.exit(2);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = mkdtempSync(join(tmpdir(), "mailer-a11y-"));
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

let ws;
let id = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    const timer = setTimeout(() => {
      pending.delete(messageId);
      reject(new Error(`CDP timeout: ${method}`));
    }, 15000);
    pending.get(messageId).timer = timer;
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}

async function navigate(url) {
  await send("Page.navigate", { url });
  for (let i = 0; i < 100; i += 1) {
    if ((await evaluate("document.readyState")) === "complete") {
      await sleep(500);
      return;
    }
    await sleep(200);
  }
}

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

async function main() {
  ws = new WebSocket(await getWsUrl());
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id);
      clearTimeout(entry.timer);
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

  await navigate(`${BASE}/dashboard/contacts`);
  await evaluate(
    `Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Add contact').click()`,
  );
  await sleep(300);
  const dialogOpened = await evaluate(`!!document.querySelector('[role="dialog"]')`);
  const focusTrapped = await evaluate(
    `!!(document.activeElement && document.activeElement.closest('[role="dialog"]'))`,
  );
  await send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await sleep(200);
  const dialogClosed = await evaluate(`!document.querySelector('[role="dialog"]')`);

  console.log(
    JSON.stringify({
      dialogOpenedViaClick: dialogOpened,
      focusMovedInsideDialog: focusTrapped,
      dialogClosedViaEscape: dialogClosed,
    }),
  );

  chrome.kill();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  chrome.kill();
  process.exit(1);
});
