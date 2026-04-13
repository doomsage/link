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

<<<<<<< codex/build-full-stack-url-shortener-app-er7cxr
const API_ORIGIN = window.location.hostname === "link.doomsage.in" ? "" : "https://link.doomsage.in";

=======
>>>>>>> main
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

<<<<<<< codex/build-full-stack-url-shortener-app-er7cxr
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

=======
>>>>>>> main
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const url = urlInput.value.trim();
  const customCode = customCodeInput.value.trim();

  if (!url) {
    showError("Please enter a URL.");
    return;
  }

  toggleLoading(true);

  try {
<<<<<<< codex/build-full-stack-url-shortener-app-er7cxr
    const response = await fetch(`${API_ORIGIN}/api/shorten`, {
=======
    const response = await fetch("/api/shorten", {
>>>>>>> main
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        customCode: customCode || undefined
      })
    });

<<<<<<< codex/build-full-stack-url-shortener-app-er7cxr
    const payload = await parseResponse(response);

    if (!response.ok) {
      showError(payload.error || `Request failed (${response.status})`);
=======
    const payload = await response.json();

    if (!response.ok) {
      showError(payload.error || "Failed to create short URL.");
>>>>>>> main
      return;
    }

    showResult(payload.shortUrl);
  } catch (error) {
    console.error(error);
<<<<<<< codex/build-full-stack-url-shortener-app-er7cxr
    showError("Unable to reach API. If you are not on link.doomsage.in, deploy backend first.");
=======
    showError("Network error. Please try again.");
>>>>>>> main
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
