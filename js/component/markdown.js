(function () {
  const mdInput = document.getElementById('mdInput');
  const mdPreview = document.getElementById('mdPreview');

  if (!mdInput || !mdPreview) return;

  // Safe fallback untuk hljs
  const safeHLJS = window.hljs ? window.hljs : {
    highlight: (code) => ({ value: code }),
    highlightAuto: (code) => ({ value: code }),
    getLanguage: () => false
  };

  // Configure Marked - full GFM + list fix
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true,
    smartLists: true,
    smartypants: true,
    pedantic: false, // biar parser GFM lebih akurat
    highlight: function (code, lang) {
      try {
        if (lang && safeHLJS.getLanguage(lang)) {
          return safeHLJS.highlight(code, { language: lang }).value;
        }
        return safeHLJS.highlightAuto(code).value;
      } catch {
        return code;
      }
    }
  });

  // Fix list edge-case (tanpa newline antar list)
  function normalizeMarkdown(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/(\d+\.\s[^\n]+)/g, '\n$1') // ensure ordered lists start on new line
      .replace(/(\*\s[^\n]+)/g, '\n$1')    // ensure unordered lists start on new line
      .trim();
  }

  function renderMarkdown() {
    const raw = normalizeMarkdown(mdInput.value || '');
    const html = marked.parse(raw);
    mdPreview.innerHTML = html;

    // Copy button di code blocks
    mdPreview.querySelectorAll('pre').forEach(pre => {
      if (!pre.querySelector('.copy-btn-code')) {
        const btn = document.createElement('button');
        btn.textContent = 'Copy';
        btn.className = 'copy-btn-code';
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(pre.textContent).then(() => {
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = 'Copy', 1200);
          }).catch(() => alert('Clipboard not supported'));
        });
        pre.appendChild(btn);
      }
    });
  }

  mdInput.addEventListener('input', renderMarkdown);
  renderMarkdown();
})();
