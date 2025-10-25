function runCompareQuery() {
  const rawA = $("compareInputQuery1").value || "";
  const rawB = $("compareInputQuery2").value || "";
  const caseSensitive = !!$("caseSensitiveTextQuery").checked;
  const onlyDiff = !!$("onlyDiffQuery").checked;
  const output = $("compareResultQuery");
  output.innerHTML = "";

  if (!rawA && !rawB) {
    output.innerHTML = "<pre>No input</pre>";
    return;
  }

  const beautify = (sql) => {
    if (!sql.trim()) return "";
    try {
      return sqlFormatter.format(sql);
    } catch {
      return sql;
    }
  };

  const left = caseSensitive ? beautify(rawA) : beautify(rawA).toLowerCase();
  const right = caseSensitive ? beautify(rawB) : beautify(rawB).toLowerCase();

  const leftLines = left.split(/\r?\n/);
  const rightLines = right.split(/\r?\n/);
  const max = Math.max(leftLines.length, rightLines.length);

  const dmp = new diff_match_patch();
  let htmlLeft = "", htmlRight = "";
  let hasDiff = false;

  const tokenize = (sql) => sql.split(/(\s+|,|\.|\(|\)|=|<>|!=|>=|<=|>|<|;)/).filter(Boolean);
  const escapeHtml = (str) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  for (let i = 0; i < max; i++) {
    const L = leftLines[i] || "";
    const R = rightLines[i] || "";

    const Ltokens = tokenize(L);
    const Rtokens = tokenize(R);

    // Join tokens with a unique character
    const joinChar = "\0";
    const Ljoin = Ltokens.join(joinChar);
    const Rjoin = Rtokens.join(joinChar);

    // Diff tanpa semantic cleanup untuk presisi token
    const diffs = dmp.diff_main(Ljoin, Rjoin);
    // dmp.diff_cleanupSemantic(diffs); // di-comment supaya tidak melebar
    dmp.diff_cleanupEfficiency(diffs); // optional, tetap ringan

    diffs.forEach(([op, text]) => {
      const tokens = text.split(joinChar).filter(Boolean);
      tokens.forEach(tok => {
        const safe = escapeHtml(tok);
        if (op === 0) {
          htmlLeft += safe;
          htmlRight += safe;
        } else if (op === -1) {
          hasDiff = true;
          htmlLeft += `<span class="removed">${safe}</span>`;
        } else if (op === 1) {
          hasDiff = true;
          htmlRight += `<span class="added">${safe}</span>`;
        }
      });
    });

    htmlLeft += "<br>";
    htmlRight += "<br>";
  }

  if (onlyDiff && !hasDiff) {
    output.innerHTML = "<pre>No differences</pre>";
    return;
  }

  output.innerHTML = `
    <div class="compare-table">
      <div class="compare-header"><div>Query 1</div><div>Query 2</div></div>
      <div class="compare-row diff">
        <pre class="left">${htmlLeft || "&nbsp;"}</pre>
        <pre class="right">${htmlRight || "&nbsp;"}</pre>
      </div>
    </div>`;
}
