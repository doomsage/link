const express = require("express");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));

const CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const MIN_CODE_LENGTH = 5;
const MAX_CODE_LENGTH = 7;
const MAX_GENERATION_RETRIES = 12;

function sanitizeInput(value = "") {
  return String(value).trim();
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeHttpUrl(value) {
  const sanitized = sanitizeInput(value);
  if (!sanitized) {
    return "";
  }

  if (isValidHttpUrl(sanitized)) {
    return sanitized;
  }

  const withHttps = `https://${sanitized}`;
  if (isValidHttpUrl(withHttps)) {
    return withHttps;
  }

  return "";
}

function isValidCustomCode(value) {
  return /^[a-zA-Z0-9]{3,40}$/.test(value);
}

function randomCode(length) {
  let output = "";
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * CODE_ALPHABET.length);
    output += CODE_ALPHABET[idx];
  }
  return output;
}

function randomCodeLength() {
  return MIN_CODE_LENGTH + Math.floor(Math.random() * (MAX_CODE_LENGTH - MIN_CODE_LENGTH + 1));
}

async function codeExists(code) {
  const doc = await db.collection("links").doc(code).get();
  return doc.exists;
}

async function createUniqueCode() {
  for (let attempt = 0; attempt < MAX_GENERATION_RETRIES; attempt += 1) {
    const candidate = randomCode(randomCodeLength());
    if (!(await codeExists(candidate))) {
      return candidate;
    }
  }
  throw new Error("Could not generate a unique code. Please try again.");
}

app.post("/api/shorten", async (req, res) => {
  const rawUrl = sanitizeInput(req.body?.url);
  const normalizedUrl = normalizeHttpUrl(rawUrl);
  const rawCustomCode = sanitizeInput(req.body?.customCode);

  if (!rawUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  if (!normalizedUrl) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  if (rawCustomCode && !isValidCustomCode(rawCustomCode)) {
    return res.status(400).json({
      error: "Custom code must be alphanumeric and 3-40 characters long"
    });
  }

  try {
    let code = rawCustomCode;

    if (code) {
      if (await codeExists(code)) {
        return res.status(409).json({ error: "Code already taken" });
      }
    } else {
      code = await createUniqueCode();
    }

    await db
      .collection("links")
      .doc(code)
      .set({
        code,
        url: normalizedUrl
      });

    return res.status(201).json({
      code,
      shortUrl: `https://link.doomsage.in/${code}`
    });
  } catch (error) {
    console.error("Error creating short link", error);
    return res.status(500).json({ error: "Failed to create short URL" });
  }
});

app.get("/:code", async (req, res, next) => {
  const code = sanitizeInput(req.params.code);

  if (!code || code.startsWith("api")) {
    return next();
  }

  try {
    const doc = await db.collection("links").doc(code).get();

    if (!doc.exists) {
      return res.status(404).sendFile("404.html", { root: "public" });
    }

    const { url } = doc.data();
    if (!isValidHttpUrl(url)) {
      return res.status(404).sendFile("404.html", { root: "public" });
    }

    return res.redirect(302, url);
  } catch (error) {
    console.error("Error resolving code", error);
    return res.status(500).json({ error: "Server error" });
  }
});

app.get("*", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

exports.web = onRequest(
  {
    cors: true,
    maxInstances: 10
  },
  app
);
