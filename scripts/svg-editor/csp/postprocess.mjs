import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const pagePath = path.join("dist", "tools", "svg-editor", "index.html");
const html = await readFile(pagePath, "utf8");
const scriptHashes = Array.from(
  html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi),
  ([, attributes, content]) => {
    if (/\bsrc\s*=/i.test(attributes) || content.trim() === "") return null;
    const digest = createHash("sha256")
      .update(content, "utf8")
      .digest("base64");
    return `'sha256-${digest}'`;
  },
).filter((hash) => hash !== null);
const scriptSources = ["'self'", ...new Set(scriptHashes)].join(" ");
const policy = [
  "default-src 'none'",
  `script-src ${scriptSources}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
].join("; ");

const marker = 'data-svg-editor-csp="m1"';
const withPolicy = html.includes(marker)
  ? html.replace(
      /<meta\b[^>]*data-svg-editor-csp="m1"[^>]*>/i,
      `<meta http-equiv="Content-Security-Policy" content="${policy}" ${marker}>`,
    )
  : html.replace(
      /<head\b[^>]*>/i,
      (head) =>
        `${head}<meta http-equiv="Content-Security-Policy" content="${policy}" ${marker}>`,
    );

if (withPolicy === html && !html.includes(marker)) {
  throw new Error(`Could not inject the SVG editor CSP into ${pagePath}.`);
}

await writeFile(pagePath, withPolicy);
console.log(
  `Applied editor-page CSP with ${scriptHashes.length} inline script hash(es).`,
);
