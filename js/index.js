/* ======================================================
   Utility Functions
====================================================== */
const $ = (id) => document.getElementById(id);

function copyToClipboard(elOrId, icon) {
  // Bisa terima id (string) atau element langsung
  const el = typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
  if (!el) return;

  const text = el.value !== undefined ? el.value : el.innerText;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    // Clipboard API modern
    navigator.clipboard.writeText(text).then(() => {
      if (icon) {
        const original = icon.textContent;
        icon.textContent = "✅";
        setTimeout(() => (icon.textContent = original), 1500);
      }
    }).catch(() => {
      fallbackCopy(text, icon);
    });
  } else {
    // Fallback lama
    fallbackCopy(text, icon);
  }
}

function fallbackCopy(text, icon) {
  const temp = document.createElement("textarea");
  temp.value = text;
  document.body.appendChild(temp);
  temp.select();
  temp.setSelectionRange(0, 99999);

  try {
    document.execCommand("copy");
    if (icon) {
      const original = icon.textContent;
      icon.textContent = "✅";
      setTimeout(() => (icon.textContent = original), 1500);
    }
  } catch {
    alert("❌ Clipboard not available.");
  }

  document.body.removeChild(temp);
}




// Remove comments from JSON (support // and /* ... */)
function stripJsonComments(json) {
  return json
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .replace(/\/\/.*$/gm, ""); // line comments
}

/* ======================================================
   Sidebar & Dark Mode
====================================================== */
document.querySelectorAll(".menu-link").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".menu-link")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const target = btn.getAttribute("data-tab");
    document
      .querySelectorAll(".tab-content")
      .forEach((tab) => tab.classList.remove("active"));
    document.getElementById(target).classList.add("active");
  });
});


/* Sidebar Tab Navigation */
document.querySelectorAll(".menu-link").forEach(btn => {
  btn.addEventListener("click", () => {
    // Reset menu highlight
    document.querySelectorAll(".menu-link").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Hide all sections
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));

    // Show chosen one
    const target = btn.dataset.tab;
    document.getElementById(target).classList.add("active");
  });
});



$("darkToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  $("darkToggle").textContent = document.body.classList.contains("dark-mode")
    ? "☀️"
    : "🌙";
});

$("sidebarToggle").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

/* ======================================================
   Textarea Utilities (Copy + Char Counter)
====================================================== */
// document.querySelectorAll("textarea").forEach((ta) => {
//   // Wrap textarea for styling
//   const wrap = document.createElement("div");
//   wrap.classList.add("textarea-wrap");
//   ta.parentNode.insertBefore(wrap, ta);
//   wrap.appendChild(ta);

//   // Add copy button
//   const btn = document.createElement("button");
//   btn.textContent = "📋";
//   btn.classList.add("copy-btn");
//   btn.addEventListener("click", () => copyToClipboard(ta.value, btn));
//   wrap.appendChild(btn);

//   // Add char counter
//   const counter = document.createElement("div");
//   counter.classList.add("char-counter");
//   counter.textContent = "0 char";
//   wrap.appendChild(counter);

//   ta.addEventListener("input", () => {
//     counter.textContent = `${ta.value.length} char`;
//   });
// });


document.querySelectorAll("textarea").forEach((ta) => {
  const wrap = document.createElement("div");
  wrap.classList.add("textarea-wrap");
  ta.parentNode.insertBefore(wrap, ta);
  wrap.appendChild(ta);

  // Tombol copy 📋
  const btn = document.createElement("button");
  btn.textContent = "📋";
  btn.classList.add("copy-btn");
  btn.addEventListener("click", () => copyToClipboard(ta, btn));
  wrap.appendChild(btn);

  // Counter jumlah karakter
  const counter = document.createElement("div");
  counter.classList.add("char-counter");
  counter.textContent = "0 char";
  wrap.appendChild(counter);

  ta.addEventListener("input", () => {
    counter.textContent = `${ta.value.length} char`;
  });
});


/* ======================================================
   JSON TOOLS (support comments)
====================================================== */
window.beautifyJson = function () {
  try {
    const clean = stripJsonComments($("inputJson").value);
    const obj = JSON.parse(clean);
    $("outputJson").value = JSON.stringify(obj, null, 2);
  } catch {
    $("outputJson").value = "Invalid JSON!";
  }
};

window.minifyJson = function () {
  try {
    const clean = stripJsonComments($("inputJson").value);
    const obj = JSON.parse(clean);
    $("outputJson").value = JSON.stringify(obj);
  } catch {
    $("outputJson").value = "Invalid JSON!";
  }
};

window.tryParseToOutput = function () {
  try {
    const clean = stripJsonComments($("inputJson").value);
    const obj = JSON.parse(clean);
    $("treeView").innerHTML = buildTree(obj);
  } catch {
    $("treeView").innerHTML = "<b>Invalid JSON!</b>";
  }
};

function buildTree(obj) {
  if (typeof obj !== "object" || obj === null)
    return `<span class="mono">${obj}</span>`;
  let html = "<ul>";
  for (const key in obj) {
    html += `<li><b>${key}</b>: ${buildTree(obj[key])}</li>`;
  }
  html += "</ul>";
  return html;
}

window.clearJson = function () {
  $("inputJson").value = "";
  $("outputJson").value = "";
  $("treeView").innerHTML = "";
};

/* ======================================================
   COMPARE TOOLS (JSON table + text highlight)
====================================================== */
window.runCompare = function () {
  var a = $("compareInput1").value || "";
  var b = $("compareInput2").value || "";
  a = caseSensitive ? a : a.toLowerCase();
  b = caseSensitive ? b : b.toLowerCase();
  const type = $("compareType").value;
  const caseSensitive = !!$("caseSensitiveText").checked;
  const onlyDiff = !!$("onlyDiff").checked;
  $("compareResult").innerHTML = "";

  // ===== JSON TABLE COMPARE =====
  if (type === "json") {
    try {
      const A = JSON.parse(stripJsonComments(a));
      const B = JSON.parse(stripJsonComments(b));
      const rows = [];
      jsonCompareTable(A, B, "$", rows);

      let html = `
        <table class="json-table">
          <thead>
            <tr>
              <th>Path</th>
              <th>JSON 1</th>
              <th>JSON 2</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      rows.forEach((r) => {
        if (onlyDiff && r.status === "Same") return;
        html += `
          <tr class="${r.status === "Different" ? "diff" : ""}">
            <td>${escapeHtml(r.path)}</td>
            <td>${escapeHtml(JSON.stringify(r.a))}</td>
            <td>${escapeHtml(JSON.stringify(r.b))}</td>
            <td>${r.status}</td>
          </tr>`;
      });

      html += "</tbody></table>";
      $("compareResult").innerHTML = html;
    } catch {
      $("compareResult").innerHTML = "<pre>Invalid JSON input!</pre>";
    }
    return;
  }

  // ===== TEXT / QUERY COMPARE =====
  const left = caseSensitive ? a : a.toLowerCase();
  const right = caseSensitive ? b : b.toLowerCase();
  const leftLines = left.split(/\r?\n/);
  const rightLines = right.split(/\r?\n/);
  const max = Math.max(leftLines.length, rightLines.length);

  let html = `<div class="compare-table">
    <div class="compare-header"><div>Text 1</div><div>Text 2</div></div>`;

  for (let i = 0; i < max; i++) {
    const L = leftLines[i] || "";
    const R = rightLines[i] || "";
    const diff = L !== R;
    if (onlyDiff && !diff) continue;

    const highlightedL = diff ? highlightDiff(L, R) : escapeHtml(L);
    const highlightedR = diff ? highlightDiff(R, L) : escapeHtml(R);

    html += `
      <div class="compare-row${diff ? " diff" : ""}">
        <pre class="left">${highlightedL}</pre>
        <pre class="right">${highlightedR}</pre>
      </div>`;
  }

  html += "</div>";
  $("compareResult").innerHTML = html || "<pre>No differences</pre>";
};

window.clearCompare = function () {
  $("compareInput1").value = "";
  $("compareInput2").value = "";
  $("compareResult").innerHTML = "";
};

function highlightDiff(source, compareTo) {
  const src = source.split("");
  const cmp = compareTo.split("");
  let result = "";
  const maxLen = Math.max(src.length, cmp.length);
  for (let i = 0; i < maxLen; i++) {
    if (src[i] !== cmp[i]) {
      result += `<span class="char-diff">${escapeHtml(src[i] || "")}</span>`;
    } else {
      result += escapeHtml(src[i] || "");
    }
  }
  return result;
}

function escapeHtml(str) {
  if (str === undefined) return "";
  return String(str)
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Build recursive JSON table rows
function jsonCompareTable(a, b, path, rows) {
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    rows.push({
      path,
      a,
      b,
      status: a === b ? "Same" : "Different",
    });
    return;
  }

  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const newPath = `${path}.${key}`;
    if (typeof a[key] === "object" && typeof b[key] === "object") {
      jsonCompareTable(a[key], b[key], newPath, rows);
    } else {
      const same = JSON.stringify(a[key]) === JSON.stringify(b[key]);
      rows.push({
        path: newPath,
        a: a[key],
        b: b[key],
        status: same ? "Same" : "Different",
      });
    }
  }
}

/* ======================================================
   ENCODER / DECODER
====================================================== */
window.base64Encode = function () {
  $("encoderOutput").value = btoa($("encoderInput").value);
};
window.base64Decode = function () {
  try {
    $("encoderOutput").value = atob($("encoderInput").value);
  } catch {
    $("encoderOutput").value = "Invalid Base64!";
  }
};
window.clearEncoder = function () {
  $("encoderInput").value = "";
  $("encoderOutput").value = "";
};

/* ======================================================
   CONVERTER
====================================================== */
window.urlEncode = function () {
  $("converterOutput").value = encodeURIComponent($("converterInput").value);
};
window.urlDecode = function () {
  $("converterOutput").value = decodeURIComponent($("converterInput").value);
};
window.clearConverter = function () {
  $("converterInput").value = "";
  $("converterOutput").value = "";
};

/* ======================================================
   UUID GENERATOR (Support HTTP & HTTPS)
====================================================== */
window.generateUUID = function () {
  let uuid;
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    // Browser modern
    uuid = window.crypto.randomUUID();
  } else {
    // Fallback manual (RFC4122 v4)
    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  $("uuidOutput").value = uuid;
};

window.clearUUID = function () {
  $("uuidOutput").value = "";
};


/* ======================================================
   REGEX TESTER (fix empty pattern)
====================================================== */
function regexTest() {
  const pattern = document.getElementById("regexPattern").value.trim();
  const flags = document.getElementById("regexFlags").value.trim();
  const text = document.getElementById("regexText").value;
  const replace = document.getElementById("regexReplace").value;

  const matchesBox = document.getElementById("regexMatches");
  const replaceBox = document.getElementById("regexReplacePreview");
  const groupBox = document.getElementById("regexGroups");

  matchesBox.innerHTML = "";
  replaceBox.innerHTML = "";
  groupBox.innerHTML = "";

  if (!pattern) {
    matchesBox.textContent = "⚠️ Please enter a regex pattern.";
    return;
  }

  try {
    const regex = new RegExp(pattern, flags || "g");
    const matches = [...text.matchAll(regex)];

    if (matches.length === 0) {
      matchesBox.textContent = "No matches found.";
      return;
    }

    // Highlight matches in text
    const highlighted = text.replace(regex, m => `<mark>${m}</mark>`);
    matchesBox.innerHTML = `<strong>Matches:</strong><br><pre>${highlighted}</pre>`;

    // Replacement preview
    if (replace) {
      const replaced = text.replace(regex, replace);
      replaceBox.innerHTML = `<strong>Replace Preview:</strong><br><pre>${replaced}</pre>`;
    }

    // Capture groups table
    const groupNames = Object.keys(matches[0].groups || {});
    if (matches[0].length > 1 || groupNames.length) {
      let html = "<strong>Captured Groups:</strong><table><tr>";
      matches[0].forEach((_, i) => (html += `<th>Group ${i}</th>`));
      html += "</tr>";

      matches.forEach(m => {
        html += "<tr>";
        m.forEach(g => (html += `<td>${g ?? ""}</td>`));
        html += "</tr>";
      });
      html += "</table>";
      groupBox.innerHTML = html;
    }

  } catch (e) {
    matchesBox.textContent = "⚠️ Invalid regex pattern.";
  }
}

function clearRegex() {
  ["regexPattern", "regexFlags", "regexText", "regexReplace"].forEach(id => {
    document.getElementById(id).value = "";
  });
  ["regexMatches", "regexReplacePreview", "regexGroups"].forEach(id => {
    document.getElementById(id).innerHTML = "";
  });
}



/* ======================================================
   MISC (HASH GENERATOR, HTTP/HTTPS safe)
====================================================== */
window.sha256Hash = async function () {
  const text = $("hashInput").value;
  let hashHex = "";

  if (window.crypto && window.crypto.subtle) {
    // Modern browser + HTTPS
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    // Fallback SHA-256 (pure JS, jalan di HTTP juga)
    hashHex = sha256Fallback(text);
  }

  $("hashOutput").value = hashHex;
};

window.clearMisc = function () {
  $("hashInput").value = "";
  $("hashOutput").value = "";
};

/* ======================================================
   Pure JS SHA-256 Fallback
   (based on Stanford JS Crypto library)
====================================================== */
function sha256Fallback(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var lengthProperty = 'length';
  var i, j; // Used as a counter across the whole file
  var result = '';

  var words = [];
  var asciiBitLength = ascii[lengthProperty] * 8;

  var hash = sha256Fallback.h = sha256Fallback.h || [];
  var k = sha256Fallback.k = sha256Fallback.k || [];
  var primeCounter = k[lengthProperty];

  var isComposite = {};
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1/3) * maxWord) | 0;
    }
  }

  ascii += '\x80'; // Append Ƈ' bit (plus zero padding)
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00'; // More zero padding
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return; // ASCII check
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength);

  for (j = 0; j < words[lengthProperty];) {
    var w = words.slice(j, j += 16);
    var oldHash = hash;
    // This is now the undefinedworking hash", often labelled as variables a...g
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      var w15 = w[i - 15], w2 = w[i - 2];

      var a = hash[0], e = hash[4];
      var temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
          w[i - 16]
          + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
          + w[i - 7]
          + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
        ) | 0
        );

      var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      var b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? 0 : '') + b.toString(16);
    }
  }
  return result;
}


/* ======================================================
   Sidebar Toggle (Desktop + Mobile)
====================================================== */

/* Sidebar Toggle Universal */
(function () {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const toggleBtn = document.getElementById("sidebarToggle");

  if (!sidebar || !toggleBtn) return;

  // Handle desktop collapse
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    document.body.classList.toggle("sidebar-collapsed");

    // Optional: close all details when collapsed
    if (sidebar.classList.contains("collapsed")) {
      sidebar.querySelectorAll("details").forEach(d => d.removeAttribute("open"));
    }
  });

  // Handle mobile overlay
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("show");
  });

  // Auto close sidebar on tab change (for mobile)
  document.querySelectorAll(".menu-link").forEach(btn => {
    btn.addEventListener("click", () => {
      if (window.innerWidth < 900) {
        sidebar.classList.remove("active");
        overlay.classList.remove("show");
      }
    });
  });
})();

// ================================
// Sidebar Menu Group Toggle
// ================================
(function() {
  document.querySelectorAll('.menu-group-header').forEach(header => {
    header.addEventListener('click', () => {
      const group = header.parentElement;
      group.classList.toggle('open');

      // Smooth animation
      const content = group.querySelector('.menu-group-content');
      if (group.classList.contains('open')) {
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = null;
      }
    });
  });
})();




/* ======================================================
   CRON PARSER
====================================================== */
window.parseCron = function () {
  const input = $("cronInput").value.trim();
  const resultEl = $("cronResult");

  if (!input) {
    resultEl.innerHTML = "<pre>⚠️ Please enter a cron expression.</pre>";
    return;
  }

  const parts = input.split(/\s+/);

  if (parts.length < 5 || parts.length > 7) {
    resultEl.innerHTML = "<pre>⚠️ Invalid cron format. Must have 5 (UNIX), 6 (with seconds), or 7 parts (with year).</pre>";
    return;
  }

  let sec = "*", min, hour, day, month, weekday, year = "*";

  if (parts.length === 5) {
    // standard cron
    [min, hour, day, month, weekday] = parts;
  } else if (parts.length === 6) {
    // quartz cron (with seconds)
    [sec, min, hour, day, month, weekday] = parts;
  } else if (parts.length === 7) {
    // quartz cron (with seconds + year)
    [sec, min, hour, day, month, weekday, year] = parts;
  }

  const explainPart = (val, type) => {
    if (val === "*") return `every ${type}`;
    if (val.includes("*/")) return `every ${val.split("*/")[1]} ${type}(s)`;
    if (val.includes(",")) return `${type}s: ${val}`;
    return `${type}: ${val}`;
  };

  let explanation = `
Seconds → ${explainPart(sec, "second")}
Minutes → ${explainPart(min, "minute")}
Hours   → ${explainPart(hour, "hour")}
Day     → ${explainPart(day, "day")}
Month   → ${explainPart(month, "month")}
Weekday → ${explainPart(weekday, "weekday")}
Year    → ${year === "*" ? "every year" : year}
  `;

  // generate next runs
  const nextRuns = [];
  try {
    const now = new Date();
    let count = 0;
    let check = new Date(now);

    while (nextRuns.length < 10 && count < 200000) {
      check.setSeconds(check.getSeconds() + 1);
      count++;
      if (matchCron(check, { sec, min, hour, day, month, weekday, year })) {
        nextRuns.push(check.toString());
      }
    }
  } catch (err) {
    console.error(err);
  }

  resultEl.innerHTML = `
<pre>
Expression: ${input}

Explanation:
${explanation}

Next Runs:
${nextRuns.join("\n")}
</pre>`;
};

function matchCron(date, { sec, min, hour, day, month, weekday, year }) {
  const checks = [
    matchPart(sec, date.getSeconds()),
    matchPart(min, date.getMinutes()),
    matchPart(hour, date.getHours()),
    matchPart(day, date.getDate()),
    matchPart(month, date.getMonth() + 1),
    matchPart(weekday, date.getDay()),
    year === "*" ? true : parseInt(year, 10) === date.getFullYear()
  ];
  return checks.every(Boolean);
}

function matchPart(part, value) {
  if (part === "*" || part === "?") return true;
  if (part.includes("*/")) {
    const step = parseInt(part.split("*/")[1], 10);
    return value % step === 0;
  }
  if (part.includes(",")) {
    return part.split(",").map(v => parseInt(v, 10)).includes(value);
  }
  return parseInt(part, 10) === value;
}

window.generateCron = function({ includeSeconds = true, includeYear = false } = {}) {
  const dtInput = document.getElementById("cronDateTime").value;
  const resultEl = $("cronResult");

  if (!dtInput) {
    resultEl.innerHTML = "<pre>⚠️ Please select a date/time.</pre>";
    return;
  }

  const dt = new Date(dtInput);

  const sec = dt.getSeconds();
  const min = dt.getMinutes();
  const hour = dt.getHours();
  const day = dt.getDate();
  const month = dt.getMonth() + 1;
  const weekday = "*"; // fleksibel, bisa juga dt.getDay()
  const year = dt.getFullYear();

  let cronExpr = "";

  if (includeSeconds) cronExpr += sec + " ";
  cronExpr += `${min} ${hour} ${day} ${month} ${weekday}`;
  if (includeYear) cronExpr += " " + year;

  resultEl.innerHTML = `<pre>Generated Cron Expression:\n${cronExpr}</pre>`;

  $("cronInput").value = cronExpr;
};


/* -----------------------
   Generate Cron from Exact Date/Time
-------------------------*/
function generateCronFromPicker() {
  const dtInput = document.getElementById("cronDateTime").value;
  const includeSeconds = document.getElementById("includeSeconds").checked;
  const includeYear = document.getElementById("includeYear").checked;
  const resultEl = document.getElementById("cronResult");

  if (!dtInput) {
    resultEl.innerHTML = "<pre>⚠️ Please select a date/time.</pre>";
    return;
  }

  const dt = new Date(dtInput);
  const sec = dt.getSeconds();
  const min = dt.getMinutes();
  const hour = dt.getHours();
  const day = dt.getDate();
  const month = dt.getMonth() + 1;
  const weekday = "*"; // fleksibel, bisa dt.getDay()
  const year = dt.getFullYear();

  let cronExpr = "";
  if (includeSeconds) cronExpr += sec + " ";
  cronExpr += `${min} ${hour} ${day} ${month} ${weekday}`;
  if (includeYear) cronExpr += " " + year;

  resultEl.innerHTML = `<pre>Generated Exact Cron Expression:\n${cronExpr}</pre>`;
  document.getElementById("cronInput").value = cronExpr;
}

/* -----------------------
   Generate Cron Interval (Flexible, sampai detik)
-------------------------*/
function generateCronIntervalFromUI() {
  const resultEl = document.getElementById("cronResult");

  const seconds = parseInt(document.getElementById("intervalSeconds").value) || 0;
  const minutes = parseInt(document.getElementById("intervalMinutes").value) || 0;
  const hours = parseInt(document.getElementById("intervalHours").value) || 0;
  const days = parseInt(document.getElementById("intervalDays").value) || 0;

  // Bangun cron expression
  let cronExpr = "";
  cronExpr += seconds ? `*/${seconds}` : "0"; // detik
  cronExpr += " " + (minutes ? `*/${minutes}` : "*"); // menit
  cronExpr += " " + (hours ? `*/${hours}` : "*"); // jam
  cronExpr += " " + (days ? `*/${days}` : "*"); // hari
  cronExpr += " * *"; // bulan & weekday default *

  resultEl.innerHTML = `<pre>Generated Interval Cron Expression:\n${cronExpr}</pre>`;
  document.getElementById("cronInput").value = cronExpr;
}



window.clearCron = function () {
  // Kosongkan parser input dan result
  document.getElementById("cronInput").value = "";
  document.getElementById("cronResult").innerHTML = "";

  // Kosongkan datetime picker
  document.getElementById("cronDateTime").value = "";

  // Kosongkan interval inputs
  document.getElementById("intervalSeconds").value = "";
  document.getElementById("intervalMinutes").value = "";
  document.getElementById("intervalHours").value = "";
  document.getElementById("intervalDays").value = "";
};



/* ======================================================
   JWT TOOLS
====================================================== */
function base64urlEncode(str) {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

function checkClaims(payload) {
  const now = Math.floor(Date.now() / 1000);
  let status = [];

  // Expiration (exp)
  if (payload.exp) {
    if (now > payload.exp) {
      status.push(`⚠️ Token expired at ${new Date(payload.exp * 1000).toLocaleString()}`);
    } else {
      const remain = payload.exp - now;
      status.push(`✅ Expires in ${Math.floor(remain / 60)}m ${remain % 60}s`);
    }
  }

  // Not Before (nbf)
  if (payload.nbf) {
    if (now < payload.nbf) {
      status.push(`⚠️ Token not valid before ${new Date(payload.nbf * 1000).toLocaleString()}`);
    } else {
      status.push(`✅ Token is past 'nbf' and valid`);
    }
  }

  // Issued At (iat)
  if (payload.iat) {
    status.push(`ℹ️ Issued at ${new Date(payload.iat * 1000).toLocaleString()}`);
  }

  if (status.length === 0) {
    return "ℹ️ No exp/nbf/iat claims found.";
  }
  return status.join("\n");
}

window.decodeJWT = () => {
  try {
    const token = $("jwtInput").value.trim();
    const [h, p, s] = token.split(".");
    const header = JSON.parse(base64urlDecode(h));
    const payload = JSON.parse(base64urlDecode(p));

    const claimStatus = checkClaims(payload);

    $("jwtResult").innerText =
      "Header:\n" + JSON.stringify(header, null, 2) +
      "\n\nPayload:\n" + JSON.stringify(payload, null, 2) +
      "\n\nSignature:\n" + s +
      "\n\n" + claimStatus;
  } catch (err) {
    $("jwtResult").innerText = "⚠️ Invalid JWT";
  }
};

window.verifyJWT = async () => {
  try {
    const token = $("jwtInput").value.trim();
    const secret = $("jwtSecret").value;
    if (!secret) {
      $("jwtResult").innerText = "⚠️ Please provide a secret key.";
      return;
    }
    const [h, p, s] = token.split(".");
    const data = h + "." + p;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
    const sigBytes = Array.from(new Uint8Array(signature))
      .map(b => String.fromCharCode(b))
      .join("");
    const expectedSig = base64urlEncode(sigBytes);

    const payload = JSON.parse(base64urlDecode(p));
    const claimStatus = checkClaims(payload);

    $("jwtResult").innerText = 
      (expectedSig === s 
        ? "✅ Signature VALID" 
        : "❌ Signature INVALID\n\nExpected: " + expectedSig + "\nGot: " + s
      ) + "\n\n" + claimStatus;
  } catch (err) {
    $("jwtResult").innerText = "⚠️ Verification failed: " + err.message;
  }
};

window.encodeJWT = async () => {
  try {
    const payloadText = $("jwtInput").value.trim();
    const secret = $("jwtSecret").value;
    if (!secret) {
      $("jwtResult").innerText = "⚠️ Please provide a secret key.";
      return;
    }

    const header = { alg: "HS256", typ: "JWT" };
    const h = base64urlEncode(JSON.stringify(header));
    const p = base64urlEncode(payloadText);

    const data = h + "." + p;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
    const sigBytes = Array.from(new Uint8Array(signature))
      .map(b => String.fromCharCode(b))
      .join("");
    const sig = base64urlEncode(sigBytes);

    $("jwtResult").innerText = data + "." + sig;
  } catch (err) {
    $("jwtResult").innerText = "⚠️ Encode failed: " + err.message;
  }
};

window.clearJWT = () => {
  $("jwtInput").value = "";
  $("jwtSecret").value = "";
  $("jwtResult").innerText = "";
};




/* ======================================================
   YAML ⇆ JSON
   (⚠️ butuh jsyaml di index.html)
====================================================== */
window.yamlToJson = () => {
  try {
    const text = $("yamlInput").value;
    const obj = jsyaml.load(text);
    $("yamlOutput").value = JSON.stringify(obj, null, 2);
  } catch {
    $("yamlOutput").value = "Invalid YAML";
  }
};

window.jsonToYaml = () => {
  try {
    const obj = JSON.parse($("yamlInput").value);
    $("yamlOutput").value = jsyaml.dump(obj);
  } catch {
    $("yamlOutput").value = "Invalid JSON";
  }
};

/* ======================================================
   EPOCH / DATETIME CONVERTER
====================================================== */
window.epochToDate = () => {
  try {
    const val = parseInt($("timeInput").value.trim(), 10);
    $("timeResult").innerText = new Date(val * 1000).toString();
  } catch {
    $("timeResult").innerText = "Invalid epoch";
  }
};

window.dateToEpoch = () => {
  try {
    const d = new Date($("timeInput").value.trim());
    $("timeResult").innerText = Math.floor(d.getTime() / 1000);
  } catch {
    $("timeResult").innerText = "Invalid date";
  }
};

/* ======================================================
   TEXT UTILITIES
====================================================== */
window.toUpper = () => {
  $("textUtilsOutput").value = $("textUtilsInput").value.toUpperCase();
};

window.toLower = () => {
  $("textUtilsOutput").value = $("textUtilsInput").value.toLowerCase();
};

window.toSnake = () => {
  $("textUtilsOutput").value = $("textUtilsInput").value
    .replace(/\s+/g, "_").toLowerCase();
};

window.toPascal = () => {
  $("textUtilsOutput").value = $("textUtilsInput").value
    .replace(/(\w)(\w*)/g, (_, a, b) => a.toUpperCase() + b.toLowerCase())
    .replace(/\s+/g, "");
};

window.sortLines = () => {
  $("textUtilsOutput").value = $("textUtilsInput").value
    .split("\n").sort().join("\n");
};

window.uniqueLines = () => {
  $("textUtilsOutput").value = [...new Set($("textUtilsInput").value.split("\n"))].join("\n");
};

/* ======================================================
   COLOR TOOLS
====================================================== */
window.convertColor = () => {
  const input = $("colorInput").value.trim();
  let result = "";
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input)) {
    const hex = input.substring(1);
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
    result = `RGB(${r},${g},${b})`;
  } else if (/^rgb/i.test(input)) {
    const nums = input.match(/\d+/g).map(Number);
    result = "#" + ((1 << 24) + (nums[0]<<16) + (nums[1]<<8) + nums[2]).toString(16).slice(1);
  } else {
    result = "Invalid color format";
  }
  $("colorResult").innerText = result;
  $("colorResult").style.background = input;
  $("colorResult").style.color = "#fff";
  $("colorResult").style.padding = "10px";
};


// ==========================
// Color Tools JS
// ==========================

// Convert color input to Hex, RGB, HSL
function convertColor() {
  const input = document.getElementById('colorInput').value.trim();
  const resultEl = document.getElementById('colorResult');
  resultEl.innerHTML = '';

  const rgb = parseColor(input);
  if (!rgb) {
    resultEl.textContent = 'Invalid color!';
    return;
  }

  const hex = rgbToHex(...rgb);
  const hsl = rgbToHsl(...rgb);

  resultEl.innerHTML = `
    <div style="margin-bottom:8px;">Hex: <span>${hex}</span></div>
    <div style="margin-bottom:8px;">RGB: <span>${rgb.join(', ')}</span></div>
    <div>HSL: <span>${hsl.join(', ')}</span></div>
  `;
}

// ==========================
// Palette Generator
// ==========================

const paletteModes = ['base','complementary','analogous','triadic','tetradic','shades'];

// Convert color input to Hex, RGB, HSL
function convertColor() {
  const input = document.getElementById('colorInput').value.trim();
  const resultEl = document.getElementById('colorResult');
  resultEl.innerHTML = '';

  const rgb = parseColor(input);
  if (!rgb) {
    resultEl.textContent = 'Invalid color!';
    return;
  }

  const hex = rgbToHex(...rgb);
  const hsl = rgbToHsl(...rgb);

  resultEl.innerHTML = `
    <div>Hex: <span>${hex}</span></div>
    <div>RGB: <span>${rgb.join(', ')}</span></div>
    <div>HSL: <span>${hsl.join(', ')}</span></div>
  `;
}

// ==========================
// Generate Advanced Palette
// ==========================
// Global untuk simpan warna terakhir yang di-generate
let generatedPalette = [];

// Generate palette advanced
function generatePalette() {
  const input = document.getElementById('colorInput').value.trim();
  const resultEl = document.getElementById('colorGradient');
  resultEl.innerHTML = '';
  generatedPalette = []; // reset

  const rgb = parseColor(input);
  if (!rgb) {
    resultEl.textContent = 'Invalid color!';
    return;
  }

  paletteModes.forEach(mode => {
    const colors = getPalette(rgb, mode);
    generatedPalette.push(...colors.map(c => rgbToHex(...c))); // simpan semua ke global

    // Container per mode
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.marginBottom = '12px';
    container.style.gap = '6px';

    const label = document.createElement('span');
    label.textContent = mode + ':';
    label.style.fontWeight = '600';
    label.style.marginRight = '6px';
    container.appendChild(label);

    // Swatches
    colors.forEach(c => {
      const hex = rgbToHex(...c);
      const swatch = document.createElement('div');
      swatch.className = 'palette-swatch';
      swatch.style.backgroundColor = hex;
      swatch.title = hex;
      swatch.style.width = '40px';
      swatch.style.height = '40px';
      swatch.style.cursor = 'pointer';
      swatch.style.border = '1px solid #aaa';
      swatch.style.borderRadius = '4px';
      swatch.onclick = () => copyToClipboardColor(hex);
      container.appendChild(swatch);
    });

    // Optional gradient preview
    const gradient = document.createElement('div');
    gradient.style.flex = '1';
    gradient.style.height = '24px';
    gradient.style.borderRadius = '4px';
    gradient.style.marginLeft = '6px';
    gradient.style.background = `linear-gradient(to right, ${colors.map(c => rgbToHex(...c)).join(',')})`;
    container.appendChild(gradient);

    resultEl.appendChild(container);
  });
}

// ==========================
// Helpers
// ==========================

// Parse input color string → [r,g,b]
function parseColor(str) {
  const div = document.createElement('div');
  div.style.color = str;
  document.body.appendChild(div);
  const cs = getComputedStyle(div).color;
  document.body.removeChild(div);
  const match = cs.match(/\d+/g);
  return match ? match.map(Number) : null;
}

// RGB to Hex
function rgbToHex(r,g,b){
  r = Math.round(Math.min(Math.max(r,0),255));
  g = Math.round(Math.min(Math.max(g,0),255));
  b = Math.round(Math.min(Math.max(b,0),255));
  return "#" + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}


// RGB to HSL
function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0, s=0, l=(max+min)/2;
  if(max!==min){
    const d=max-min;
    s=l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
    }
    h*=60;
  }
  return [h, s, l]; // angka murni 0–1
}


// Generate palette by mode
function getPalette([r,g,b], mode='base') {
  const base = [r,g,b];
  switch(mode){
    case 'base': return [base];
    case 'complementary': return [base, [(r+180)%256,(g+180)%256,(b+180)%256]];
    case 'analogous': return [base, [(r+30)%256,(g+30)%256,(b+30)%256], [(r-30+256)%256,(g-30+256)%256,(b-30+256)%256]];
    case 'triadic': return [base, [(r+120)%256,(g+120)%256,(b+120)%256], [(r+240)%256,(g+240)%256,(b+240)%256]];
    case 'tetradic': return [base, [(r+90)%256,(g+90)%256,(b+90)%256], [(r+180)%256,(g+180)%256,(b+180)%256], [(r+270)%256,(g+270)%256,(b+270)%256]];
    case 'shades': return Array.from({length:5}, (_,i)=>base.map(x=>Math.max(0, x-i*30)));
    default: return [base];
  }
}

// Copy to clipboard
function copyToClipboardColor(color){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(color).then(()=>showToast(color+' copied!'))
      .catch(()=>fallbackCopy(color));
  } else fallbackCopy(color);
}

function fallbackCopy(text){
  const temp = document.createElement('textarea');
  temp.value = text;
  document.body.appendChild(temp);
  temp.select();
  document.execCommand('copy');
  document.body.removeChild(temp);
  showToast(text+' copied!');
}

// Toast kecil non-blocking
function showToast(msg){
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.background = 'rgba(0,0,0,0.7)';
  toast.style.color = '#fff';
  toast.style.padding = '8px 12px';
  toast.style.borderRadius = '4px';
  toast.style.zIndex = 9999;
  toast.style.fontSize = '13px';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.5s';

  document.body.appendChild(toast);

  // Tampilkan toast
  requestAnimationFrame(()=>toast.style.opacity='1');

  // Tetap 5 detik, lalu hilang
  setTimeout(()=>{
    toast.style.opacity='0';
    toast.addEventListener('transitionend', ()=>{
      if(toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }, 5000); // 5000 ms = 5 detik
}

// ==========================
// Interactive Gradient & Export
// ==========================
function showGradient(colors) {
  const gradientEl = document.getElementById('colorGradient');
  gradientEl.innerHTML = ''; // clear previous
  const gradientDiv = document.createElement('div');
  gradientDiv.style.height = '40px';
  gradientDiv.style.borderRadius = '6px';
  gradientDiv.style.border = '1px solid #aaa';
  gradientDiv.style.cursor = 'pointer';
  
  const gradientStr = colors.map(c => rgbToHex(...c)).join(', ');
  gradientDiv.style.background = `linear-gradient(to right, ${gradientStr})`;
  gradientDiv.title = 'Click to copy CSS gradient';
  
  gradientDiv.onclick = () => {
    copyToClipboardText(`background: linear-gradient(to right, ${gradientStr});`);
    alert('CSS gradient copied!');
  };

  gradientEl.appendChild(gradientDiv);
}

// Generate gradient + swatches together
function generatePaletteWithGradient() {
  const input = document.getElementById('colorInput').value.trim();
  const baseRgb = parseColor(input);
  if (!baseRgb) return alert('Invalid color!');

  // Example: generate analogous colors for gradient
  const gradientColors = getPalette(baseRgb, 'analogous');
  showGradient(gradientColors);
  
  // Also show swatches
  generatePalette();
}

document.getElementById('downloadPaletteBtn').addEventListener('click', () => {
  // Ambil warna dari palette yang sudah di-generate
  const paletteColors = generatedPalette || []; // pastikan `generatedPalette` di-set saat generatePalette()
  exportPalettePNG(paletteColors);
});


// Optional: export palette as PNG
function exportPalettePNG(colors){
  if(!colors || colors.length === 0) return alert('No colors to export!');
  
  const canvas = document.createElement('canvas');
  const pixelSize = 50; // tiap swatch 50px
  canvas.width = colors.length * pixelSize;
  canvas.height = pixelSize;

  const ctx = canvas.getContext('2d');
  colors.forEach((c, i) => {
    ctx.fillStyle = rgbToHex(...c);
    ctx.fillRect(i * pixelSize, 0, pixelSize, pixelSize);
  });

  canvas.toBlob(function(blob){
    if(blob){
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'palette.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert('Failed to generate PNG.');
    }
  });
}



/* ======================================================
   STRING INSPECTOR (HTTP/HTTPS safe, all browsers)
====================================================== */
window.inspectString = () => {
  const str = $("stringInput").value;
  const length = str.length;

  // Fallback: kalau TextEncoder tidak tersedia (browser lama / IE)
  const bytes = (window.TextEncoder)
    ? new TextEncoder().encode(str).length
    : encodeURIComponent(str).replace(/%../g, "x").length;

  const unique = [...new Set(str)].join("");
  $("stringResult").innerText =
    `Length: ${length}\nBytes: ${bytes}\nUnique chars: ${unique}`;
};

/* ======================================================
   HASH GENERATOR (WITH FALLBACKS)
====================================================== */
// pastikan hash-fallbacks.js di-include dulu di index.html sebelum index.js

async function generateHash() {
  const text = document.getElementById("hashInput").value;
  const algo = document.getElementById("hashAlgo").value;
  const key = document.getElementById("hmacKey").value;
  const output = document.getElementById("hashOutput");

  if (!text.trim()) {
    output.value = "⚠️ Please enter text.";
    return;
  }

  let hashValue = "";

  try {
    // CRC32
    if (algo === "crc32") {
      if (typeof crc32 !== "undefined") {
        hashValue = crc32(text);
      } else {
        hashValue = "⚠️ CRC32 not implemented.";
      }
    }

    // HMAC
    else if (algo === "hmac") {
      if (!key.trim()) {
        output.value = "⚠️ HMAC requires a secret key.";
        return;
      }
      hashValue = await hmacSha256(text, key);
    }

    // MD5, SHA1, SHA256, SHA512
    else {
      if (window.crypto && window.crypto.subtle) {
        // pakai WebCrypto kalau tersedia
        const encoder = new TextEncoder();
        const data = encoder.encode(text);

        // Mapping agar cocok dengan WebCrypto
        const algoMap = {
          "md5": null,        // WebCrypto tidak dukung MD5
          "sha1": "SHA-1",
          "sha256": "SHA-256",
          "sha512": "SHA-512"
        };

        if (algoMap[algo]) {
          const digest = await crypto.subtle.digest(algoMap[algo], data);
          hashValue = Array.from(new Uint8Array(digest))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
        } else if (algo === "md5") {
          // fallback
          hashValue = md5(text);
        }
      } else {
        // fallback manual
        switch (algo) {
          case "md5": hashValue = md5(text); break;
          case "sha1": hashValue = sha1(text); break;
          case "sha256": hashValue = sha256(text); break;
          case "sha512": hashValue = sha512(text); break;
        }
      }
    }

    output.value = hashValue;
  } catch (err) {
    output.value = "⚠️ Error: " + err.message;
    console.error(err);
  }
}

// clear textarea
function clearHashConv() {
  document.getElementById("hashInput").value = "";
  document.getElementById("hashOutput").value = "";
  document.getElementById("hmacKey").value = "";
}


function clearMisc() {
  ["hashInput", "hashOutput"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

/* ======================================================
   CRC32
====================================================== */
function crc32(str) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ str.charCodeAt(i)) & 0xFF];
  }
  return ((crc ^ (-1)) >>> 0).toString(16);
}
const crc32Table = (() => {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
})();

/* ======================================================
   HMAC-SHA256
====================================================== */
async function hmacSha256(message, key) {
  if (window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder();
    const keyData = enc.encode(key);
    const msgData = enc.encode(message);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    return Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, "0")).join("");
  } else {
    // fallback manual pakai sha256 + xor key
    return sha256(key + message);
  }
}

/* ======================================================
   SIMPLE FALLBACKS (MD5, SHA1, SHA256, SHA512)
   ⚠️ NOTE: ini versi ringan, bukan super optimal.
   Untuk akurasi full, sebaiknya load implementasi murni.
====================================================== */
function md5(str) {
  // placeholder MD5 fallback (ringan)
  return hexFallback(str, "MD5");
}
function sha1(str) {
  return hexFallback(str, "SHA1");
}
function sha256(str) {
  return hexFallback(str, "SHA256");
}
function sha512(str) {
  return hexFallback(str, "SHA512");
}

// Dummy hex generator supaya ga error (kamu bisa ganti dgn lib full)
function hexFallback(str, name) {
  let hex = "";
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  return `[${name}-FALLBACK] ` + hex;
}



/* ======================================================
   STRING CONVERTER TOOLS
====================================================== */
function toBase64() {
  const input = document.getElementById("strConvInput").value;
  try {
    document.getElementById("strConvOutput").value = btoa(unescape(encodeURIComponent(input || "")));
  } catch {
    document.getElementById("strConvOutput").value = "⚠️ Gagal encode ke Base64.";
  }
}

function fromBase64() {
  const input = document.getElementById("strConvInput").value;
  try {
    document.getElementById("strConvOutput").value = decodeURIComponent(escape(atob(input || "")));
  } catch {
    document.getElementById("strConvOutput").value = "⚠️ Invalid Base64 string.";
  }
}

function toHex() {
  const input = document.getElementById("strConvInput").value;
  document.getElementById("strConvOutput").value = Array.from(input)
    .map(ch => ch.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

function fromHex() {
  const input = document.getElementById("strConvInput").value.replace(/\s+/g, "");
  if (!/^[0-9a-fA-F]+$/.test(input)) {
    document.getElementById("strConvOutput").value = "⚠️ Invalid Hex string.";
    return;
  }
  document.getElementById("strConvOutput").value = input
    .match(/.{1,2}/g)
    .map(byte => String.fromCharCode(parseInt(byte, 16)))
    .join("");
}

function toBinary() {
  const input = document.getElementById("strConvInput").value;
  document.getElementById("strConvOutput").value = Array.from(input)
    .map(ch => ch.charCodeAt(0).toString(2).padStart(8, "0"))
    .join(" ");
}

function fromBinary() {
  const input = document.getElementById("strConvInput").value.trim();
  if (!/^[01\s]+$/.test(input)) {
    document.getElementById("strConvOutput").value = "⚠️ Invalid binary string.";
    return;
  }
  document.getElementById("strConvOutput").value = input
    .split(/\s+/)
    .map(b => String.fromCharCode(parseInt(b, 2)))
    .join("");
}

function clearStringConv() {
  document.getElementById("strConvInput").value = "";
  document.getElementById("strConvOutput").value = "";
}




/* ======================================================
   JSON PATH EVALUATOR TOOLS
====================================================== */
// JSONPath Evaluator
function evaluateJsonPath() {
  const inputEl = document.getElementById('jsonPathInput');
  const queryEl = document.getElementById('jsonPathQuery');
  const resultEl = document.getElementById('jsonPathResult');

  let json;
  try {
    json = JSON.parse(inputEl.value);
  } catch (e) {
    resultEl.value = 'Invalid JSON!';
    return;
  }

  const query = queryEl.value.trim();
  if (!query) {
    resultEl.value = 'Please enter a JSONPath query.';
    return;
  }

  try {
    const result = jsonPathEvaluate(json, query);
    resultEl.value = JSON.stringify(result, null, 2);
  } catch (e) {
    resultEl.value = 'Error: ' + e.message;
  }
}

// Clear JSONPath input/output
function clearJsonPath() {
  document.getElementById('jsonPathInput').value = '';
  document.getElementById('jsonPathQuery').value = '';
  document.getElementById('jsonPathResult').value = '';
   const fileInput = document.getElementById('jsonPathFile');
  if (fileInput) fileInput.value = ''; // reset file input
}

// Import JSON file
document.getElementById('jsonPathFile')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    document.getElementById('jsonPathInput').value = ev.target.result;
  };
  reader.readAsText(file);
});

// Advanced JSONPath evaluator
function jsonPathEvaluate(obj, path) {
  if (!path.startsWith('$')) throw new Error('Path must start with $');
  const result = [];

  function traverse(current, tokens) {
    if (!current) return;
    if (tokens.length === 0) {
      result.push(current);
      return;
    }

    const token = tokens.shift();

    // Recursive descent
    if (token === '..') {
      if (typeof current === 'object') {
        for (const key in current) {
          traverse(current[key], [...tokens]);
          traverse(current[key], tokens);
        }
      }
      return;
    }

    // Wildcard *
    if (token === '*') {
      if (Array.isArray(current)) {
        current.forEach(item => traverse(item, [...tokens]));
      } else if (typeof current === 'object') {
        Object.values(current).forEach(val => traverse(val, [...tokens]));
      }
      return;
    }

    // Property + optional array index/slice
    const propMatch = token.match(/^([^\[\]]+)?(\[.*\])?$/);
    if (propMatch) {
      const prop = propMatch[1];
      const arrPart = propMatch[2];

      let next = current;
      if (prop) next = next[prop];

      if (!arrPart) {
        traverse(next, tokens);
        return;
      }

      // Array index or slice
      const arrContent = arrPart.slice(1, -1).trim();

      // Slice [start:end]
      const sliceMatch = arrContent.match(/^(-?\d*):(-?\d*)$/);
      if (sliceMatch && Array.isArray(next)) {
        let start = sliceMatch[1] === '' ? 0 : parseInt(sliceMatch[1]);
        let end = sliceMatch[2] === '' ? next.length : parseInt(sliceMatch[2]);
        if (start < 0) start += next.length;
        if (end < 0) end += next.length;
        const sliced = next.slice(start, end);
        sliced.forEach(item => traverse(item, [...tokens]));
        return;
      }

      // Single index or comma-separated
      if (Array.isArray(next)) {
        const indexes = arrContent.split(',').map(i => parseInt(i.trim()));
        indexes.forEach(i => {
          if (!isNaN(i) && next[i] !== undefined) traverse(next[i], [...tokens]);
        });
        return;
      }
    }
  }

  // Tokenize path: split by dot, but keep array indices
  const pathTokens = path.replace(/\['([^']+)'\]/g, '.$1').split('.').filter(Boolean).slice(1);
  traverse(obj, pathTokens);
  return result;
}
