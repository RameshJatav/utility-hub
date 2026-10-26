
const $ = (selector) => document.querySelector(selector);

$("#year").textContent = new Date().getFullYear();

// Toast notifications
let toastTimer;

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 2200);
}

// Dark mode
const themeBtn = $("#themeBtn");

function applyTheme(dark) {
  document.documentElement.classList.toggle("dark", dark);
  themeBtn.textContent = dark ? "☀️" : "🌙";
  themeBtn.setAttribute(
    "aria-label",
    dark ? "Switch to light mode" : "Switch to dark mode"
  );
}

let savedTheme = null;

try {
  savedTheme = localStorage.getItem("utilityhub-theme");
} catch {}

applyTheme(
  savedTheme ? savedTheme === "dark" :
  window.matchMedia("(prefers-color-scheme: dark)").matches
);

themeBtn.addEventListener("click", () => {
  const dark = !document.documentElement.classList.contains("dark");
  applyTheme(dark);

  try {
    localStorage.setItem("utilityhub-theme", dark ? "dark" : "light");
  } catch {}

});

// Word counter
const counterText = $("#counterText");

function updateCounter() {
  const text = counterText.value;
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const sentences = text.trim()
    ? (text.match(/[.!?]+(?=\s|$)/g) || []).length
    : 0;

  $("#words").textContent = words;
  $("#chars").textContent = text.length;
  $("#sentences").textContent = sentences;
}

counterText.addEventListener("input", updateCounter);

$('[data-action="clear-counter"]').addEventListener("click", () => {
  counterText.value = "";
  updateCounter();
});

// Password generator
const passLength = $("#passLength");

passLength.addEventListener("input", () => {
  $("#lengthValue").textContent = passLength.value;
});

function secureRandomIndex(max) {
  const limit = Math.floor(256 / max) * max;
  const array = new Uint8Array(1);

  do {
    crypto.getRandomValues(array);
  } while (array[0] >= limit);

  return array[0] % max;
}

function generateSecurePassword(length, groups) {
  const all = groups.join("");
  const chars = groups.map(group => group[secureRandomIndex(group.length)]);

  while (chars.length < length) {
    chars.push(all[secureRandomIndex(all.length)]);
  }

  // Securely shuffle the generated characters.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

$("#generatePassword").addEventListener("click", () => {
  const groups = [];

  if ($("#passUpper").checked) groups.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if ($("#passLower").checked) groups.push("abcdefghijklmnopqrstuvwxyz");
  if ($("#passNumber").checked) groups.push("0123456789");
  if ($("#passSymbol").checked) groups.push("!@#$%^&*()-_=+");

  if (!groups.length) {
    toast("Select at least one character type.");
    return;
  }

  if (!window.crypto?.getRandomValues) {
    toast("Secure password generation is not supported here.");
    return;
  }

  $("#passwordOutput").value = generateSecurePassword(
    Number(passLength.value),
    groups
  );
});

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const temp = document.createElement("textarea");
      temp.value = text;
      temp.style.position = "fixed";
      temp.style.opacity = "0";
      document.body.appendChild(temp);
      temp.select();

      const success = document.execCommand("copy");
      temp.remove();

      if (!success) throw new Error("Copy failed");
    }

    toast("Copied successfully!");
  } catch {
    toast("Copy failed. Please select and copy the text manually.");
  }
}

$("#copyPassword").addEventListener("click", () => {
  const value = $("#passwordOutput").value;
  if (value) copyText(value);
  else toast("Generate a password first.");
});

// QR code generator
$("#generateQR").addEventListener("click", () => {
  const value = $("#qrText").value.trim();
  const result = $("#qrResult");

  result.replaceChildren();

  if (!value) {
    toast("Please enter some text or a URL.");
    return;
  }

  // The QR service receives the entered text.
  const img = document.createElement("img");
  img.alt = "Generated QR code";
  img.width = 180;
  img.height = 180;
  img.loading = "lazy";

  img.addEventListener("error", () => {
    result.textContent = "QR code unavailable. Check your internet connection.";
  }, { once: true });

  const link = document.createElement("a");
  link.href =
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
    encodeURIComponent(value);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open QR image";
  link.className = "text-indigo-600 underline text-sm";

  img.src = link.href;
  result.append(img, link);
});

// Text case converter
const caseText = $("#caseText");

function toTitleCase(text) {
  return text.toLocaleLowerCase().replace(
    /(^|[\s-])(\p{L})/gu,
    (match, separator, letter) => separator + letter.toLocaleUpperCase()
  );
}

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", async () => {
    switch (button.dataset.action) {
      case "upper":
        caseText.value = caseText.value.toLocaleUpperCase();
        break;

      case "lower":
        caseText.value = caseText.value.toLocaleLowerCase();
        break;

      case "title":
        caseText.value = toTitleCase(caseText.value);
        break;

      case "copy-case":
        if (caseText.value) await copyText(caseText.value);
        else toast("Enter some text first.");
        break;
    }
  });
});

// Notes: stored only in this browser
const notesText = $("#notesText");

try {
  notesText.value = localStorage.getItem("utilityhub-notes") || "";
} catch {
  $("#notesStatus").textContent = "Browser storage is unavailable.";
}

$("#saveNotes").addEventListener("click", () => {
  try {
    localStorage.setItem("utilityhub-notes", notesText.value);
    $("#notesStatus").textContent = "Saved in this browser.";
    toast("Notes saved!");
  } catch {
    $("#notesStatus").textContent = "Unable to save notes in this browser.";
  }
});

$("#clearNotes").addEventListener("click", () => {
  notesText.value = "";

  try {
    localStorage.removeItem("utilityhub-notes");
    $("#notesStatus").textContent = "Notes cleared.";
  } catch {
    $("#notesStatus").textContent = "Text cleared; browser storage unavailable.";
  }
});

// Search/filter tools
$("#searchInput").addEventListener("input", event => {
  const query = event.target.value.toLowerCase().trim();
  const cards = document.querySelectorAll(".tool-card");
  let visible = 0;

  cards.forEach(card => {
    const matches = card.dataset.name.includes(query) ||
      card.textContent.toLowerCase().includes(query);

    card.classList.toggle("hidden", !matches);

    if (matches) visible++;
  });

  $("#noResults").classList.toggle("hidden", visible !== 0);
});
