const PRIMARY_API_ORIGIN = window.location.hostname === "link.doomsage.in" ? "" : "https://link.doomsage.in";
const FALLBACK_API_ORIGINS = [
  "https://us-central1-link-57c36.cloudfunctions.net/web"
];

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

function isFirebaseNotFoundError(payload) {
  if (!payload || typeof payload.error !== "string") {
    return false;
  }

  return payload.error.includes("The page could not be found") || payload.error.includes("NOT_FOUND");
}

async function requestShortenLink(body) {
  const apiOrigins = [PRIMARY_API_ORIGIN, ...FALLBACK_API_ORIGINS];
  let lastPayload = null;
  let lastStatus = 0;

  for (const origin of apiOrigins) {
    try {
      const response = await fetch(`${origin}/api/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const payload = await parseResponse(response);

      if (response.ok) {
        return { ok: true, payload };
      }

      lastPayload = payload;
      lastStatus = response.status;

      const shouldTryFallback =
        response.status === 404 && origin === PRIMARY_API_ORIGIN && isFirebaseNotFoundError(payload);

      if (!shouldTryFallback) {
        return { ok: false, payload, status: response.status };
      }
    } catch (error) {
      lastPayload = { error: "Unable to reach API. Please check Firebase deployment." };
      if (origin !== PRIMARY_API_ORIGIN) {
        return { ok: false, payload: lastPayload, status: 0 };
      }
    }
  }

  return { ok: false, payload: lastPayload || { error: "Request failed" }, status: lastStatus };
}

function initShortener() {
  const form = document.getElementById("shortener-form");
  const urlInput = document.getElementById("url");
  const customCodeInput = document.getElementById("customCode");
  const errorEl = document.getElementById("error");
  const resultEl = document.getElementById("result");
  const shortUrlEl = document.getElementById("shortUrl");
  const copyBtn = document.getElementById("copyBtn");
  const copyState = document.getElementById("copyState");
  const shortenBtn = document.getElementById("shortenBtn");
  const spinner = shortenBtn?.querySelector(".spinner");
  const btnLabel = shortenBtn?.querySelector(".btn-label");

  if (
    !form ||
    !urlInput ||
    !customCodeInput ||
    !errorEl ||
    !resultEl ||
    !shortUrlEl ||
    !copyBtn ||
    !copyState ||
    !shortenBtn ||
    !spinner ||
    !btnLabel
  ) {
    console.error("Shortener UI initialization failed: missing required elements.");
    return;
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
      const requestBody = {
        url,
        customCode: customCode || undefined
      };

      const requestResult = await requestShortenLink(requestBody);

      if (!requestResult.ok) {
        const fallbackHint =
          requestResult.status === 404 && isFirebaseNotFoundError(requestResult.payload)
            ? " Firebase Hosting rewrite may be misconfigured."
            : "";
        showError(
          `${requestResult.payload?.error || `Request failed (${requestResult.status})`}${fallbackHint}`
        );
        return;
      }

      if (!requestResult.payload?.shortUrl) {
        showError("Short URL was not returned by API. Check Firebase function logs.");
        return;
      }

      showResult(requestResult.payload.shortUrl);
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
}

initShortener();
