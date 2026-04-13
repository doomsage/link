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

  const url = urlInput.value.trim();
  const customCode = customCodeInput.value.trim();

  if (!url) {
    showError("Please enter a URL.");
    return;
  }

  toggleLoading(true);

  try {
    const response = await fetch("/api/shorten", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        customCode: customCode || undefined
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      showError(payload.error || "Failed to create short URL.");
      return;
    }

    showResult(payload.shortUrl);
  } catch (error) {
    console.error(error);
    showError("Network error. Please try again.");
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
