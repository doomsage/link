const SUPABASE_URL = window.SUPABASE_CONFIG?.url || "";
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.anonKey || "";
const APP_ORIGIN = window.location.origin;
const CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const MIN_CODE_LENGTH = 5;
const MAX_CODE_LENGTH = 7;
const MAX_GENERATION_RETRIES = 12;

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

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase config missing. Set public/config.js with url + anonKey.");
  }

  if (!window.supabase?.createClient) {
    throw new Error("Supabase SDK failed to load.");
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

function setupNotFoundState(message) {
  const resultEl = document.getElementById("result");
  const errorEl = document.getElementById("error");
  const form = document.getElementById("shortener-form");
  const subtitle = document.querySelector(".subtitle");

  if (form) {
    form.classList.add("hidden");
  }

  if (resultEl) {
    resultEl.classList.add("hidden");
  }

  if (subtitle) {
    subtitle.textContent = "Short link not found.";
  }

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }
}

async function resolveCodeFromPath() {
  const code = window.location.pathname.replace(/^\/+/, "").trim();
  if (!code) {
    return false;
  }

  if (code.includes(".")) {
    return false;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("links")
    .select("url")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    setupNotFoundState("Unable to resolve code right now. Please try again later.");
    return true;
  }

  if (!data?.url) {
    setupNotFoundState("This short code does not exist.");
    return true;
  }

  window.location.replace(data.url);
  return true;
}

async function codeExists(supabase, code) {
  const { data, error } = await supabase
    .from("links")
    .select("code")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.code);
}

async function createUniqueRandomCode(supabase) {
  for (let attempt = 0; attempt < MAX_GENERATION_RETRIES; attempt += 1) {
    const candidate = randomCode(randomCodeLength());
    const exists = await codeExists(supabase, candidate);
    if (!exists) {
      return candidate;
    }
  }

  throw new Error("Could not generate a unique code. Please try again.");
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
    const normalizedUrl = normalizeHttpUrl(rawUrl);
    const customCode = customCodeInput.value.trim();

    if (!rawUrl) {
      showError("Please enter a URL.");
      return;
    }

    if (!normalizedUrl) {
      showError("Invalid URL. Example: https://doomsage.in");
      return;
    }

    if (customCode && !isValidCustomCode(customCode)) {
      showError("Custom code must be alphanumeric and 3-40 characters.");
      return;
    }

    toggleLoading(true);

    try {
      const supabase = getSupabaseClient();
      const code = customCode || (await createUniqueRandomCode(supabase));

      const { error } = await supabase
        .from("links")
        .insert({
          code,
          url: normalizedUrl
        });

      if (error) {
        if (error.code === "23505") {
          showError(customCode ? "Code already taken" : "Please retry. Random code collision happened.");
          return;
        }

        showError("Failed to create short URL. Please check Supabase setup.");
        return;
      }

      showResult(`${APP_ORIGIN}/${code}`);
    } catch (error) {
      console.error(error);
      showError(error.message || "Unable to reach Supabase.");
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

(async () => {
  try {
    const handled = await resolveCodeFromPath();
    if (handled) {
      return;
    }
  } catch (error) {
    console.error(error);
    setupNotFoundState("Supabase is not configured correctly.");
    return;
  }

  initShortener();
})();
