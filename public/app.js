const form = document.getElementById("shortener-form");
const urlInput = document.getElementById("url");
const customCodeInput = document.getElementById("customCode");
const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");
const shortUrlEl = document.getElementById("shortUrl");
const copyBtn = document.getElementById("copyBtn");
const copyState = document.getElementById("copyState");
const shortenBtn = document.getElementById("shortenBtn");
const spinner = shortenBtn.querySelector(".spinner");
const btnLabel = shortenBtn.querySelector(".btn-label");

const API_ORIGIN = window.location.hostname === "link.doomsage.in" ? "" : "https://link.doomsage.in";

function normalizeHttpUrl(value) {
  const sanitized = value.trim();
  if (!sanitized) {
    return "";
  }

  try {
    const absoluteUrl = new URL(sanitized);
    if (absoluteUrl.protocol === "http:" || absoluteUrl.protocol === "https:") {
      return absoluteUrl.toString();
    }
  } catch {
    // Continue with https fallback.
  }

  try {
    const withHttps = new URL(`https://${sanitized}`);
    if (withHttps.protocol === "http:" || withHttps.protocol === "https:") {
      return withHttps.toString();
    }
  } catch {
    return "";
  }

  return "";
}

function toggleLoading(loading) {
  shortenBtn.disabled = loading;
  spinner.classList.toggle("hidden", !loading);
  btnLabel.textContent = loading ? "Generating..." : "Shorten";
  shortenBtn.style.opacity = loading ? "0.75" : "1";
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
  resultEl.classList.add("hidden");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

function showResult(shortUrl) {
  shortUrlEl.textContent = shortUrl;
  shortUrlEl.href = shortUrl;
  resultEl.classList.remove("hidden");
  copyState.classList.add("hidden");
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(bodyText);
    } catch {
      return {};
    }
  }

  return { error: bodyText || "Unexpected server response" };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const rawUrl = urlInput.value.trim();
  const url = normalizeHttpUrl(rawUrl);
  const customCode = customCodeInput.value.trim();

  if (!rawUrl) {
    showError("Please enter a URL.");
    return;
  }

  if (!url) {
    showError("Invalid URL. Example: https://doomsage.in");
    return;
  }

  toggleLoading(true);

  try {
    const response = await fetch(`${API_ORIGIN}/api/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        customCode: customCode || undefined
      })
    });

    const payload = await parseResponse(response);

    if (!response.ok) {
      showError(payload.error || `Request failed (${response.status})`);
      return;
    }

    showResult(payload.shortUrl);
  } catch (error) {
    console.error(error);
    showError("Unable to reach API. If you are not on link.doomsage.in, deploy backend first.");
  } finally {
    toggleLoading(false);
  }
});

copyBtn.addEventListener("click", async () => {
  if (!shortUrlEl.textContent) {
    return;
  }

  try {
    await navigator.clipboard.writeText(shortUrlEl.textContent);
    copyState.textContent = "Copied!";
  } catch {
    copyState.textContent = "Copy failed. Please copy manually.";
  }

  copyState.classList.remove("hidden");
});
