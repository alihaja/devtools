// ===========================================
// ADVANCED SQL BEAUTIFIER + MINIFIER ENGINE
// Dimas Fathulyaqin
// ===========================================

// Smart Dialect Detection
function detectSqlDialect(sql) {
  const low = sql.toLowerCase();
  if (low.includes("begin try") || low.includes("declare @")) return "transactsql";
  if (low.includes("returns table") || low.includes("::")) return "postgresql";
  if (low.includes("`") || low.includes("engine=")) return "mysql";
  if (low.includes("begin\n") && low.includes("end;")) return "plsql";
  return "sql";
}

// Make comments formatting cleaner
function normalizeComments(sql) {
  return sql
    .replace(/\n?(\s*--)/g, "\n$1")      // inline comments on new line
    .replace(/\n?(\s*\/\*)/g, "\n$1")    // block comments start
    .replace(/(\*\/)\s*\n?/g, "$1\n");  // block comments end
}

// Beautify SQL, keep comments ✅
function beautifySql() {
  const input = document.getElementById("sqlInput");
  const output = document.getElementById("sqlOutput");

  let sql = input.value.trim();
  if (!sql) return output.value = "⚠️ Input Null.";

  try {
    const dialect = detectSqlDialect(sql);
    let formatted = sqlFormatter.format(sql, {
      language: dialect,
      tabWidth: 2,
      keywordCase: "upper",
      linesBetweenQueries: 1
    });

    formatted = normalizeComments(formatted);

    output.value = formatted;
  } catch (err) {
    console.error(err);
    output.value = "❌ Cannot Beautify SQL";
  }
}

// Minify SQL: remove comments + compact ✅
function minifySql() {
  const input = document.getElementById("sqlInput");
  const output = document.getElementById("sqlOutput");

  let sql = input.value.trim();
  if (!sql) return output.value = "⚠️ Input Null.";

  sql = sql
    .replace(/--.*$/gm, "")            // inline comment
    .replace(/\/\*[\s\S]*?\*\//gm, "") // block comment
    .replace(/\s+/g, " ")
    .replace(/\s*([(),;])\s*/g, "$1")
    .trim();

  output.value = sql;
}

// Clear ✅
function clearSql() {
  document.getElementById("sqlInput").value = "";
  document.getElementById("sqlOutput").value = "";
}
