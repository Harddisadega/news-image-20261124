// news-image-20261124 — entry program (Node 22, standard library only).
// Takes the poster shipped in this repo (entry.png) and writes it to the
// output directory after checking it meets the bounty limits: a real PNG,
// at most 1 MiB, at most 1024x1024 pixels. Runs with no network.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const posterPath = join(repoRoot, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const outPath = join(outDir, "entry.png");

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const LIMIT_BYTES = 1024 * 1024;
const LIMIT_PX = 1024;

function fail(message) {
  throw new Error(`entry.png rejected: ${message}`);
}

function checkPoster(bytes) {
  if (bytes.length === 0) fail("file is empty");
  const signature = PNG_SIGNATURE.every((byte, i) => bytes[i] === byte);
  if (!signature) fail("first 8 bytes are not the PNG signature");
  if (bytes.length > LIMIT_BYTES) {
    fail(`${bytes.length} bytes exceeds the ${LIMIT_BYTES} byte limit`);
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width > LIMIT_PX || height > LIMIT_PX) {
    fail(`dimensions ${width}x${height} exceed the ${LIMIT_PX}x${LIMIT_PX} limit`);
  }
  return { width, height };
}

if (!existsSync(posterPath)) fail(`missing ${posterPath}`);

const poster = readFileSync(posterPath);
const { width, height } = checkPoster(poster);

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, poster);

// Read the file back and confirm the copy is byte-identical to the poster.
const writtenBack = readFileSync(outPath);
if (!writtenBack.equals(poster)) {
  fail("read-back mismatch: output differs from the poster in the repo");
}

const digest = createHash("sha256").update(poster).digest("hex");
console.log(`ok: ${outPath} — ${width}x${height}, ${poster.length} bytes, sha256=${digest}`);
