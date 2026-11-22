import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3000";
const PORT = 9334;
const EMAIL = process.env.VISUAL_EMAIL;
const PASSWORD = process.env.VISUAL_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Set VISUAL_EMAIL and VISUAL_PASSWORD before running.");
  process.exit(2);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = mkdtempSync(join(tmpdir(), "mailer-kbd-"));
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
      await sleep(400);
      return;
    }
    await sleep(200);
  }
}

async function key(key, code, windowsVirtualKeyCode, text = undefined) {
  await send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key,
    code,
    windowsVirtualKeyCode,
    text,
    unmodifiedText: text,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    windowsVirtualKeyCode,
  });
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
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await navigate(`${BASE}/login`);
  const labelsAssociated = await evaluate(
    `!!document.querySelector('label[for="email"]') && !!document.querySelector('label[for="password"]')`,
  );
  await evaluate(`document.getElementById('email').focus()`);
  await send("Input.insertText", { text: EMAIL });
  await key("Tab", "Tab", 9);
  const focusAfterEmailTab = await evaluate(
    `document.activeElement ? document.activeElement.id : null`,
  );
  await evaluate(`document.getElementById('password').focus()`);
  await send("Input.insertText", { text: PASSWORD });
  await evaluate(`document.querySelector('button[type="submit"]').focus()`);
  await key("Enter", "Enter", 13, "\r");
  await sleep(1500);
  let pathAfterLogin = await evaluate("location.pathname");
  if (pathAfterLogin !== "/dashboard") {
    await evaluate(`document.querySelector('form').requestSubmit()`);
    await sleep(1500);
    pathAfterLogin = await evaluate("location.pathname");
  }

  await send("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await navigate(`${BASE}/dashboard`);
  const navButton = await evaluate(
    `!!document.querySelector('button[aria-label="Open navigation"]')`,
  );
  if (navButton) {
    await evaluate(
      `document.querySelector('button[aria-label="Open navigation"]').click()`,
    );
  }
  const navOpened = navButton
    ? await evaluate(
        `document.querySelector('header button').getAttribute('aria-expanded')`,
      )
    : "missing";
  await key("Escape", "Escape", 27);
  const navClosed = navButton
    ? await evaluate(
        `document.querySelector('header button').getAttribute('aria-expanded')`,
      )
    : "missing";

  await navigate(`${BASE}/dashboard/contacts`);
  const addButton = await evaluate(
    `!!Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Add contact')`,
  );
  if (addButton) {
    await evaluate(
      `Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Add contact').click()`,
    );
    await sleep(300);
  }
  const dialogOpened = addButton
    ? await evaluate(`!!document.querySelector('[role="dialog"]')`)
    : false;
  const focusTrapped = addButton
    ? await evaluate(
        `!!(document.activeElement && document.activeElement.closest('[role="dialog"]'))`,
      )
    : false;
  await key("Escape", "Escape", 27);
  const dialogClosed = await evaluate(`!document.querySelector('[role="dialog"]')`);

  console.log(
    JSON.stringify({
      loginLabelsAssociated: labelsAssociated,
      loginFocusOrderEmailToPassword: focusAfterEmailTab === "password",
      loginReachedDashboard: pathAfterLogin === "/dashboard",
      mobileNavOpenedWithEnter: navOpened === "true",
      mobileNavClosedWithEscape: navClosed === "false",
      dialogOpenedWithEnter: dialogOpened,
      dialogFocusTrapped: focusTrapped,
      dialogClosedWithEscape: dialogClosed,
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
