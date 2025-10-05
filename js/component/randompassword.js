(function() {
  const randOutput = document.getElementById('randOutput');
  const randLength = document.getElementById('randLength');
  const copyBtn = document.getElementById('copyRandBtn');
  const generateBtn = document.getElementById('generateRandBtn');
  const includeLower = document.getElementById('includeLower');
  const includeUpper = document.getElementById('includeUpper');
  const includeNum = document.getElementById('includeNum');
  const includeSym = document.getElementById('includeSym');

  const strengthBar = document.getElementById('strengthBar');
  const strengthLabel = document.getElementById('strengthLabel');

  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numChars   = '0123456789';
  const symChars   = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  function generatePassword() {
    let charset = '';
    if (includeLower.checked) charset += lowerChars;
    if (includeUpper.checked) charset += upperChars;
    if (includeNum.checked)   charset += numChars;
    if (includeSym.checked)   charset += symChars;

    if (!charset) {
      alert('Please select at least one character type!');
      return;
    }

    const length = Math.min(Math.max(parseInt(randLength.value) || 16, 4), 128);
    let password = '';

    // Secure random (try crypto first, fallback ke Math.random)
    const array = new Uint32Array(length);
    if (window.crypto && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        password += charset[array[i] % charset.length];
      }
    } else {
      for (let i = 0; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }
    }

    randOutput.value = password;
    updateStrength(password);
  }

  function copyRandomPasswordToClipboard() {
    if (!randOutput.value) return;
    randOutput.select();
    document.execCommand('copy');
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy', 1000);
  }

  function updateStrength(password) {
    let score = 0;
    if (!password) score = 0;
    else {
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[a-z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
    }

    const percent = Math.min((score / 6) * 100, 100);
    strengthBar.style.width = percent + '%';

    let label = 'Weak';
    let color = '#ff4d4d';
    if (percent >= 50) { label = 'Medium'; color = '#f7b500'; }
    if (percent >= 80) { label = 'Strong'; color = '#4caf50'; }

    strengthBar.style.backgroundColor = color;
    strengthLabel.textContent = label;
  }

  generateBtn.addEventListener('click', generatePassword);
  copyBtn.addEventListener('click', copyRandomPasswordToClipboard);
  randOutput.addEventListener('input', e => updateStrength(e.target.value));

  // Auto generate once
  generatePassword();
})();
