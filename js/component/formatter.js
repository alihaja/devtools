/* ======================================================
   CONVERTERS & FORMATTERS
   - CSV <-> JSON
   - XML <-> JSON
   - Format / Minify: SQL, XML, HTML, JS, CSS
   Pure JS, browser-friendly (no external libs)
====================================================== */

/* ----------------------
   UTIL
------------------------*/
function $id(id){ return document.getElementById(id); }

function safeParseJSON(text) {
  try { return JSON.parse(text); } 
  catch(e) { return null; }
}

/* ----------------------
   CSV -> JSON
   - supports quoted fields with commas/newlines
   - options: delimiter (default ','), trim, headers (true/false)
------------------------*/
window.csvToJson = function(csvText, options = {}) {
  const delim = (options.delimiter || ",");
  const trimFields = options.trim !== false; // default true
  const hasHeaders = options.headers !== false; // default true

  // state machine parser to support quoted fields with newlines
  const rows = [];
  let cur = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i+1];

    if (ch === '"' ) {
      if (inQuotes && next === '"') { // escaped quote
        cur += '"';
        i++; // skip next
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delim) {
      row.push(trimFields ? cur.trim() : cur);
      cur = "";
      continue;
    }

    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      // handle CRLF: skip if next is newline
      if (ch === '\r' && next === '\n') { i++; } // skip LF
      row.push(trimFields ? cur.trim() : cur);
      rows.push(row);
      row = [];
      cur = "";
      continue;
    }

    cur += ch;
  }
  // push last
  if (cur !== "" || row.length) {
    row.push(trimFields ? cur.trim() : cur);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  if (hasHeaders) {
    const headers = rows[0].map(h => h || "");
    const out = [];
    for (let r = 1; r < rows.length; r++) {
      const obj = {};
      const rr = rows[r];
      for (let c = 0; c < headers.length; c++) {
        obj[ headers[c] || `col${c}` ] = rr[c] !== undefined ? rr[c] : "";
      }
      out.push(obj);
    }
    return out;
  } else {
    // array of arrays
    return rows;
  }
};

/* ----------------------
   JSON -> CSV
   - Accepts array of objects or array of arrays
   - options: delimiter, headers (true/false), columns (array)
------------------------*/
window.jsonToCsv = function(jsonObj, options = {}) {
  const delim = (options.delimiter || ",");
  const headers = options.headers !== false;
  let arr;
  if (typeof jsonObj === "string") {
    try { arr = JSON.parse(jsonObj); } catch(e) { throw new Error("Invalid JSON"); }
  } else arr = jsonObj;

  if (!Array.isArray(arr)) throw new Error("Input must be an array");

  // if it's array of objects
  if (arr.length === 0) return "";

  const isArrayOfObjects = arr.every(it => typeof it === "object" && !Array.isArray(it));
  let cols = options.columns || null;

  if (isArrayOfObjects) {
    if (!cols) {
      cols = Object.keys(arr.reduce((acc, cur) => (Object.assign(acc, cur), acc), {}));
    }
    const rows = [];
    if (headers) rows.push(cols.join(delim));
    for (const obj of arr) {
      const line = cols.map(c => {
        let v = obj[c] !== undefined && obj[c] !== null ? String(obj[c]) : "";
        if (v.includes(delim) || v.includes('"') || v.includes('\n')) {
          v = '"' + v.replace(/"/g, '""') + '"';
        }
        return v;
      }).join(delim);
      rows.push(line);
    }
    return rows.join("\n");
  } else {
    // array of arrays
    const rows = arr.map(row => row.map(cell => {
      let v = cell === undefined || cell === null ? "" : String(cell);
      if (v.includes(delim) || v.includes('"') || v.includes('\n')) {
        v = '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    }).join(delim));
    return rows.join("\n");
  }
};

/* ----------------------
   XML -> JSON (browser DOMParser)
   - converts elements to objects:
     { tagName: { _attrs: {...}, _text: "...", child1: [...], child2: {...} } }
   - simpler style: element -> { _attrs, _text, children... }
------------------------*/
function nodeToObject(node) {
  // element node
  if (node.nodeType === 3) { // text
    return node.nodeValue.trim();
  }
  const obj = {};
  // attributes
  if (node.attributes && node.attributes.length) {
    obj._attrs = {};
    for (let i = 0; i < node.attributes.length; i++) {
      const a = node.attributes[i];
      obj._attrs[a.name] = a.value;
    }
  }
  // children
  const textParts = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === 3) {
      if (child.nodeValue.trim()) textParts.push(child.nodeValue.trim());
      continue;
    }
    const childName = child.nodeName;
    const childObj = nodeToObject(child);
    if (obj[childName] === undefined) obj[childName] = childObj;
    else {
      // force array
      if (!Array.isArray(obj[childName])) obj[childName] = [obj[childName]];
      obj[childName].push(childObj);
    }
  }
  if (textParts.length) obj._text = textParts.join(" ");
  return obj;
}

window.xmlToJson = function(xmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    const err = doc.querySelector("parsererror");
    if (err) throw new Error("Invalid XML");
    const root = doc.documentElement;
    const out = {};
    out[root.nodeName] = nodeToObject(root);
    return out;
  } catch (e) {
    throw new Error("XML parse error: " + e.message);
  }
};

/* ----------------------
   JSON -> XML
   - input: object or string
   - options: rootName
------------------------*/
function objToXml(obj, nodeName) {
  if (obj === null || obj === undefined) return "";
  if (typeof obj !== "object") {
    // text node
    return `<${nodeName}>${escapeXml(String(obj))}</${nodeName}>`;
  }
  // if object has _attrs and _text and child keys
  const attrs = obj._attrs ? Object.entries(obj._attrs).map(([k,v]) => ` ${k}="${escapeXml(v)}"`).join("") : "";
  const inner = [];
  if (obj._text) inner.push(escapeXml(obj._text));
  for (const key of Object.keys(obj)) {
    if (key === "_attrs" || key === "_text") continue;
    const val = obj[key];
    if (Array.isArray(val)) {
      for (const it of val) inner.push(objToXml(it, key));
    } else inner.push(objToXml(val, key));
  }
  return `<${nodeName}${attrs}>${inner.join("")}</${nodeName}>`;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

window.jsonToXml = function(jsonInput, options = {}) {
  let obj;
  if (typeof jsonInput === "string") obj = safeParseJSON(jsonInput);
  else obj = jsonInput;

  if (!obj || typeof obj !== "object") throw new Error("JSON root must be an object");

  const rootName = options.rootName || Object.keys(obj)[0];
  if (!rootName) throw new Error("Cannot determine root element name");
  const rootObj = obj[rootName];
  return objToXml(rootObj, rootName);
};

/* ----------------------
   PRETTY / MINIFY: XML & HTML using DOM
------------------------*/
window.formatXML = function(xmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    const err = doc.querySelector("parsererror");
    if (err) return xmlText; // return original if invalid
    // pretty print via recursion
    function serialize(node, indent = "") {
      if (node.nodeType === 3) return indent + node.nodeValue.trim() + "\n";
      let out = indent + `<${node.nodeName}`;
      if (node.attributes && node.attributes.length) {
        for (let i = 0; i < node.attributes.length; i++) {
          const a = node.attributes[i];
          out += ` ${a.name}="${a.value}"`;
        }
      }
      out += ">";
      const children = Array.from(node.childNodes).filter(n => !(n.nodeType === 3 && !n.nodeValue.trim()));
      if (children.length === 0) {
        out += `</${node.nodeName}>\n`;
        return out;
      }
      out += "\n";
      for (const c of children) out += serialize(c, indent + "  ");
      out += indent + `</${node.nodeName}>\n`;
      return out;
    }
    return serialize(doc.documentElement).trim();
  } catch (e) {
    return xmlText;
  }
};

window.minifyXML = function(xmlText) {
  // strip comments and collapse whitespace between tags
  return xmlText.replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .trim();
};

/* ----------------------
   HTML Format / Minify (simple DOM traversal)
------------------------*/
window.formatHTML = function(htmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    function serialize(node, indent = "") {
      const nl = "\n";
      let out = "";
      for (let i = 0; i < node.childNodes.length; i++) {
        const n = node.childNodes[i];
        if (n.nodeType === 3) { // text
          const t = n.nodeValue.trim();
          if (t) out += indent + t + nl;
        } else if (n.nodeType === 1) {
          out += indent + "<" + n.nodeName.toLowerCase();
          // attrs
          for (let j = 0; j < n.attributes.length; j++) {
            const a = n.attributes[j];
            out += ` ${a.name}="${a.value}"`;
          }
          out += ">" + nl;
          out += serialize(n, indent + "  ");
          out += indent + `</${n.nodeName.toLowerCase()}>` + nl;
        }
      }
      return out;
    }
    return serialize(doc.documentElement || doc, "");
  } catch (e) {
    return htmlText;
  }
};

window.minifyHTML = function(htmlText) {
  return htmlText
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
};

/* ----------------------
   JS Formatter / Minifier (very simple)
   - beautifyJS: add indentation for braces, keep strings & comments
   - minifyJS: remove comments and unnecessary whitespace (naive)
   Note: Not a full JS parser; good for many code formatting cases.
------------------------*/
window.formatJS = function(code) {
  // naive but practical pretty-printer
  let indent = 0;
  const IND = "  ";
  const tokens = code.replace(/\r\n/g, "\n").split(/(\{|\}|\;)/g);
  let out = "";
  for (let t of tokens) {
    if (t === "{") {
      out = out.trimEnd() + " " + t + "\n";
      indent++;
    } else if (t === "}") {
      indent = Math.max(0, indent - 1);
      out += IND.repeat(indent) + t + "\n";
    } else if (t === ";") {
      out = out.trimEnd() + t + "\n" + IND.repeat(indent);
    } else {
      out += t;
    }
    // ensure indentation at line starts
    out = out.replace(/\n\s*/g, "\n" + IND.repeat(indent));
  }
  // clean leading/trailing
  return out.trim();
};

window.minifyJS = function(code) {
  // remove /* */ and // comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, "");
  code = code.replace(/\/\/.*$/gm, "");
  // collapse whitespace
  return code.replace(/\s+/g, " ").replace(/\s?([{};,:()=<>+\-*\/])\s?/g, "$1").trim();
};

/* ----------------------
   CSS Formatter / Minify (simple)
------------------------*/
window.formatCSS = function(css) {
  // add newlines and indentation for blocks
  let out = "";
  let indent = 0;
  const lines = css.replace(/\r\n/g, "\n").split(/(\{|\})/g);
  for (let part of lines) {
    if (part === "{") {
      out = out.trimEnd() + " " + part + "\n";
      indent++;
    } else if (part === "}") {
      indent = Math.max(0, indent - 1);
      out += "  ".repeat(indent) + part + "\n";
    } else {
      // split semicolon separated rules
      const subs = part.split(";");
      for (let s of subs) {
        if (s.trim()) out += "  ".repeat(indent) + s.trim() + ";\n";
      }
    }
  }
  return out.trim();
};

window.minifyCSS = function(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s?([{}:;,])\s?/g, "$1")
    .trim();
};

/* ----------------------
   SQL Formatter / Minifier (heuristic)
   - beautify: uppercase keywords and newline before major clauses
   - minify: collapse spaces
------------------------*/
const SQL_KEYWORDS = [
  "select","from","where","group by","order by","having","join","left join","right join",
  "inner join","outer join","on","limit","offset","values","insert into","update","set","delete","create","alter","drop"
];

window.formatSQL = function(sql) {
  if (!sql) return "";
  let s = sql.replace(/\s+/g, " ").trim();
  // lowercase for matching, but we'll uppercase keywords
  for (const kw of SQL_KEYWORDS.sort((a,b)=>b.length-a.length)) {
    const re = new RegExp("\\b" + kw + "\\b", "ig");
    s = s.replace(re, kw.toUpperCase());
  }
  // add newlines before major clauses
  s = s.replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|INSERT INTO|VALUES|UPDATE|SET|DELETE)\b/g, "\n$1");
  // indent lines after first
  const lines = s.split("\n").map((ln, idx) => idx === 0 ? ln.trim() : "  " + ln.trim());
  return lines.join("\n").trim();
};

window.minifySQL = function(sql) {
  return sql.replace(/\s+/g, " ").trim();
};

/* ----------------------
   XML <-> JSON Convenience wrappers for UI usage
   (return stringified JSON or XML)
------------------------*/
window.xmlToJsonString = function(xmlText) {
  try {
    const obj = window.xmlToJson(xmlText);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return "⚠️ " + e.message;
  }
};

window.jsonToXmlString = function(jsonText, options={}) {
  try {
    const obj = typeof jsonText === "string" ? JSON.parse(jsonText) : jsonText;
    return window.jsonToXml(obj, options);
  } catch(e) {
    return "⚠️ Invalid JSON: " + e.message;
  }
}


/* ----------------------
   Quick helpers to wire to UI buttons (example)
   - Not required; you can call core functions above directly
------------------------*/
window.uiCsvToJson = function(inputId, outputId, opts) {
  try {
    const txt = $id(inputId).value;
    const json = csvToJson(txt, opts);
    const pretty = JSON.stringify(json, null, 2);
    $id(outputId).value = pretty;
  } catch(e) {
    $id(outputId).value = "⚠️ " + e.message;
  }
};

// window.uiJsonToCsv = function(inputId, outputId, opts) {
//   try {
//     const txt = $id(inputId).value;
//     const json = JSON.parse(txt);
//     $id(outputId).value = jsonToCsv(json, opts);
//   } catch(e) {
//     $id(outputId).value = "⚠️ " + e.message;
//   }
// };

window.uiJsonToCsv = function(inputId, outputId, opts) {
  try {
    let json = JSON.parse($id(inputId).value);
    if (!Array.isArray(json)) json = [json]; // <--- wrap object jadi array
    $id(outputId).value = jsonToCsv(json, opts);
  } catch(e) {
    $id(outputId).value = "⚠️ " + e.message;
  }
};


window.uiXmlToJson = function(inputId, outputId) {
  try {
    const txt = $id(inputId).value;
    $id(outputId).value = xmlToJsonString(txt);
  } catch(e) {
    $id(outputId).value = "⚠️ " + e.message;
  }
};

window.uiJsonToXml = function(inputId, outputId, rootName) {
  try {
    let txt = $id(inputId).value;
    let obj = JSON.parse(txt);

    // jika input array atau rootName tidak ada di keys, wrap
    if (!rootName) rootName = Object.keys(obj)[0] || "root";
    if (!obj.hasOwnProperty(rootName)) obj = {[rootName]: obj};

    $id(outputId).value = jsonToXmlString(obj, {rootName});
  } catch(e) {
    $id(outputId).value = "⚠️ " + e.message;
  }
};



window.uiFormat = function(type, inputId, outputId) {
  const txt = $id(inputId).value;
  try {
    let out = txt;
    switch(type) {
      case "xml": out = formatXML(txt); break;
      case "html": out = formatHTML(txt); break;
      case "js": out = formatJS(txt); break;
      case "css": out = formatCSS(txt); break;
      case "sql": out = formatSQL(txt); break;
    }
    $id(outputId).value = out;
  } catch(e) { $id(outputId).value = "⚠️ " + e.message; }
};

window.uiMinify = function(type, inputId, outputId) {
  const txt = $id(inputId).value;
  try {
    let out = txt;
    switch(type) {
      case "xml": out = minifyXML(txt); break;
      case "html": out = minifyHTML(txt); break;
      case "js": out = minifyJS(txt); break;
      case "css": out = minifyCSS(txt); break;
      case "sql": out = minifySQL(txt); break;
    }
    $id(outputId).value = out;
  } catch(e) { $id(outputId).value = "⚠️ " + e.message; }
}

/* ======================================================
   END OF CONVERTERS & FORMATTERS
====================================================== */
