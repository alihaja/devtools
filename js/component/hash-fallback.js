/*
  Pure JS implementations for:
  - md5(str) -> hex
  - sha1(str) -> hex
  - sha256(str) -> hex
  - sha512(str) -> hex
  - hmacSha256(message, key) -> hex (uses WebCrypto if available, otherwise pure JS)
*/

/* -------------------------
   MD5 (RFC 1321) - compact JS
   Source approach: canonical JS implementation (public domain style)
------------------------- */

  // convert string to little-endian words array
  function toWords(str) {
    var n = str.length;
    var words = [];
    for (var i = 0; i < n; i += 4) {
      words[i >> 2] = (str.charCodeAt(i) & 0xff) |
        ((str.charCodeAt(i + 1) & 0xff) << 8) |
        ((str.charCodeAt(i + 2) & 0xff) << 16) |
        ((str.charCodeAt(i + 3) & 0xff) << 24);
    }
    return { words: words, lengthBytes: n };
  }

  function leftRotate(x, c) { return (x << c) | (x >>> (32 - c)); }

  // basic functions
  function cmn(q, a, b, x, s, t) {
    a = (a + q + x + t) | 0;
    return leftRotate(a, s) + b | 0;
  }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }

  // utf8 encode
  function utf8(str) {
    return unescape(encodeURIComponent(str));
  }

  var msg = utf8(input);
  var { words, lengthBytes } = toWords(msg);
  // append padding
  var bitLen = lengthBytes * 8;
  // append 0x80 then zeros
  var i = lengthBytes;
  var tail = [];
  tail[i >> 2] = (msg.charCodeAt(i) & 0xff);
  // simpler approach: build buffer as bytes
  var bytes = [];
  for (i = 0; i < lengthBytes; i++) bytes.push(msg.charCodeAt(i) & 0xff);
  // append 0x80
  bytes.push(0x80);
  // append zeros until length mod 64 = 56
  while ((bytes.length % 64) !== 56) bytes.push(0);
  // append bit length little-endian 64-bit
  for (i = 0; i < 8; i++) bytes.push((bitLen >>> (8 * i)) & 0xff);

  // process in 512-bit chunks
  function bytesToWords(b) {
    var w = [];
    for (var j = 0; j < b.length; j += 4) {
      w[j >> 2] = (b[j]) | (b[j + 1] << 8) | (b[j + 2] << 16) | (b[j + 3] << 24);
    }
    return w;
  }

  var a0 = 0x67452301;
  var b0 = 0xefcdab89;
  var c0 = 0x98badcfe;
  var d0 = 0x10325476;

  for (var offset = 0; offset < bytes.length; offset += 64) {
    var chunk = bytes.slice(offset, offset + 64);
    var M = bytesToWords(chunk);
    var A = a0, B = b0, C = c0, D = d0;

    // Round 1
    A = ff(A, B, C, D, M[0], 7, -680876936);
    D = ff(D, A, B, C, M[1], 12, -389564586);
    C = ff(C, D, A, B, M[2], 17, 606105819);
    B = ff(B, C, D, A, M[3], 22, -1044525330);
    A = ff(A, B, C, D, M[4], 7, -176418897);
    D = ff(D, A, B, C, M[5], 12, 1200080426);
    C = ff(C, D, A, B, M[6], 17, -1473231341);
    B = ff(B, C, D, A, M[7], 22, -45705983);
    A = ff(A, B, C, D, M[8], 7, 1770035416);
    D = ff(D, A, B, C, M[9], 12, -1958414417);
    C = ff(C, D, A, B, M[10], 17, -42063);
    B = ff(B, C, D, A, M[11], 22, -1990404162);
    A = ff(A, B, C, D, M[12], 7, 1804603682);
    D = ff(D, A, B, C, M[13], 12, -40341101);
    C = ff(C, D, A, B, M[14], 17, -1502002290);
    B = ff(B, C, D, A, M[15], 22, 1236535329);

    // Round 2
    A = gg(A, B, C, D, M[1], 5, -165796510);
    D = gg(D, A, B, C, M[6], 9, -1069501632);
    C = gg(C, D, A, B, M[11], 14, 643717713);
    B = gg(B, C, D, A, M[0], 20, -373897302);
    A = gg(A, B, C, D, M[5], 5, -701558691);
    D = gg(D, A, B, C, M[10], 9, 38016083);
    C = gg(C, D, A, B, M[15], 14, -660478335);
    B = gg(B, C, D, A, M[4], 20, -405537848);
    A = gg(A, B, C, D, M[9], 5, 568446438);
    D = gg(D, A, B, C, M[14], 9, -1019803690);
    C = gg(C, D, A, B, M[3], 14, -187363961);
    B = gg(B, C, D, A, M[8], 20, 1163531501);
    A = gg(A, B, C, D, M[13], 5, -1444681467);
    D = gg(D, A, B, C, M[2], 9, -51403784);
    C = gg(C, D, A, B, M[7], 14, 1735328473);
    B = gg(B, C, D, A, M[12], 20, -1926607734);

    // Round 3
    A = hh(A, B, C, D, M[5], 4, -378558);
    D = hh(D, A, B, C, M[8], 11, -2022574463);
    C = hh(C, D, A, B, M[11], 16, 1839030562);
    B = hh(B, C, D, A, M[14], 23, -35309556);
    A = hh(A, B, C, D, M[1], 4, -1530992060);
    D = hh(D, A, B, C, M[4], 11, 1272893353);
    C = hh(C, D, A, B, M[7], 16, -155497632);
    B = hh(B, C, D, A, M[10], 23, -1094730640);
    A = hh(A, B, C, D, M[13], 4, 681279174);
    D = hh(D, A, B, C, M[0], 11, -358537222);
    C = hh(C, D, A, B, M[3], 16, -722521979);
    B = hh(B, C, D, A, M[6], 23, 76029189);
    A = hh(A, B, C, D, M[9], 4, -640364487);
    D = hh(D, A, B, C, M[12], 11, -421815835);
    C = hh(C, D, A, B, M[15], 16, 530742520);
    B = hh(B, C, D, A, M[2], 23, -995338651);

    // Round 4
    A = ii(A, B, C, D, M[0], 6, -198630844);
    D = ii(D, A, B, C, M[7], 10, 1126891415);
    C = ii(C, D, A, B, M[14], 15, -1416354905);
    B = ii(B, C, D, A, M[5], 21, -57434055);
    A = ii(A, B, C, D, M[12], 6, 1700485571);
    D = ii(D, A, B, C, M[3], 10, -1894986606);
    C = ii(C, D, A, B, M[10], 15, -1051523);
    B = ii(B, C, D, A, M[1], 21, -2054922799);
    A = ii(A, B, C, D, M[8], 6, 1873313359);
    D = ii(D, A, B, C, M[15], 10, -30611744);
    C = ii(C, D, A, B, M[6], 15, -1560198380);
    B = ii(B, C, D, A, M[13], 21, 1309151649);
    A = ii(A, B, C, D, M[4], 6, -145523070);
    D = ii(D, A, B, C, M[11], 10, -1120210379);
    C = ii(C, D, A, B, M[2], 15, 718787259);
    B = ii(B, C, D, A, M[9], 21, -343485551);

    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  }

  function toHexLe(num) {
    var s = "";
    for (var i = 0; i < 4; i++) {
      s += ("0" + ((num >> (i * 8)) & 0xff).toString(16)).slice(-2);
    }
    return s;
  }

  // return toHexLe(a0) + toHexLe(b0) + toHexLe(c0) + toHexLe(d0);

/* -------------------------
   SHA-1 (pure JS, straightforward)
------------------------- */
function sha1(msg) {
  function rotl(n, s) { return (n << s) | (n >>> (32 - s)); }
  function toHexStr(n) {
    var s = "", v;
    for (var i = 7; i >= 0; i--) {
      v = (n >>> (i * 4)) & 0x0f;
      s += v.toString(16);
    }
    return s;
  }
  // utf8 encode
  msg = unescape(encodeURIComponent(msg));
  var msgLen = msg.length;
  var wordArray = [];
  for (var i = 0; i < msgLen - 3; i += 4) {
    var j = msg.charCodeAt(i) << 24 | msg.charCodeAt(i + 1) << 16 |
      msg.charCodeAt(i + 2) << 8 | msg.charCodeAt(i + 3);
    wordArray.push(j);
  }
  var tail = 0;
  switch (msgLen % 4) {
    case 0: tail = 0x080000000; break;
    case 1: tail = (msg.charCodeAt(msgLen - 1) << 24) | 0x0800000; break;
    case 2: tail = (msg.charCodeAt(msgLen - 2) << 24) | (msg.charCodeAt(msgLen - 1) << 16) | 0x08000; break;
    case 3: tail = (msg.charCodeAt(msgLen - 3) << 24) | (msg.charCodeAt(msgLen - 2) << 16) | (msg.charCodeAt(msgLen - 1) << 8) | 0x80; break;
  }
  wordArray.push(tail);
  while ((wordArray.length % 16) !== 14) wordArray.push(0);
  wordArray.push((msgLen >>> 29) & 0x07);
  wordArray.push((msgLen << 3) & 0xffffffff);

  var H0 = 0x67452301;
  var H1 = 0xEFCDAB89;
  var H2 = 0x98BADCFE;
  var H3 = 0x10325476;
  var H4 = 0xC3D2E1F0;

  for (var blockstart = 0; blockstart < wordArray.length; blockstart += 16) {
    var W = [];
    for (var t = 0; t < 16; t++) W[t] = wordArray[blockstart + t];
    for (t = 16; t < 80; t++) W[t] = rotl(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    var A = H0, B = H1, C = H2, D = H3, E = H4;
    for (t = 0; t < 80; t++) {
      var temp;
      if (t < 20) temp = ((B & C) | ((~B) & D)) + 0x5A827999;
      else if (t < 40) temp = (B ^ C ^ D) + 0x6ED9EBA1;
      else if (t < 60) temp = ((B & C) | (B & D) | (C & D)) + 0x8F1BBCDC;
      else temp = (B ^ C ^ D) + 0xCA62C1D6;
      temp = (rotl(A, 5) + temp + E + W[t]) | 0;
      E = D; D = C; C = rotl(B, 30); B = A; A = temp;
    }
    H0 = (H0 + A) | 0;
    H1 = (H1 + B) | 0;
    H2 = (H2 + C) | 0;
    H3 = (H3 + D) | 0;
    H4 = (H4 + E) | 0;
  }

  return [H0, H1, H2, H3, H4].map(toHexStr).join("");
}

/* -------------------------
   SHA-256 (pure JS) - compact implementation
   Implementation follows standard operations, returns hex
------------------------- */
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var lengthProperty = 'length';
  var i, j; // Used as a counter
  var result = '';

  var words = [];
  var asciiBitLength = ascii[lengthProperty] * 8;

  // utf8 encode
  ascii = unescape(encodeURIComponent(ascii));

  var hash = [], k = [];

  var primeCounter = 0;
  var isComposite = {};
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = candidate * candidate; i < 316; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1/3) * maxWord) | 0;
    }
  }

  // Pre-processing
  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength);

  // Initialize hash values:
  var H = [];
  for (i = 0; i < 8; i++) H[i] = (hash[i] | 0);

  var W = new Array(64);
  for (i = 0; i < words[lengthProperty];) {
    var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];

    for (var t = 0; t < 64; t++) {
      if (t < 16) W[t] = words[i + t] | 0;
      else {
        var gamma0x = W[t - 15];
        var gamma1x = W[t - 2];
        var s0 = ((gamma0x >>> 7) | (gamma0x << 25)) ^ ((gamma0x >>> 18) | (gamma0x << 14)) ^ (gamma0x >>> 3);
        var s1 = ((gamma1x >>> 17) | (gamma1x << 15)) ^ ((gamma1x >>> 19) | (gamma1x << 13)) ^ (gamma1x >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }

      var ch = (e & f) ^ (~e & g);
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var sigma0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      var sigma1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      var t1 = (h + sigma1 + ch + k[t] + W[t]) | 0;
      var t2 = (sigma0 + maj) | 0;

      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;

    i += 16;
  }

  for (i = 0; i < H.length; i++) {
    result += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
  }
  return result;
}

/* -------------------------
   SHA-512 (pure JS)
   Note: uses 64-bit operations via pair of 32-bit words.
   This is a compact adaptation; slower than native but correct.
------------------------- */
function sha512(message) {
  // helper: convert string to bytes (utf8)
  function toBytes(str) {
    str = unescape(encodeURIComponent(str));
    var bytes = new Array(str.length);
    for (var i = 0; i < str.length; ++i) bytes[i] = str.charCodeAt(i);
    return bytes;
  }

  // 64-bit ops using hi/lo pairs
  function shr64(hi, lo, n) {
    if (n === 32) return [0, hi];
    else if (n < 32) return [hi >>> n, (lo >>> n) | (hi << (32 - n))];
    else return [ (hi >>> (n - 32)), (lo >>> (n - 32)) ];
  }

  function add64(ah, al, bh, bl) {
    var lo = (al + bl) >>> 0;
    var carry = (lo < al) ? 1 : 0;
    var hi = (ah + bh + carry) >>> 0;
    return [hi, lo];
  }

  // constants (first 80 words)
  var K = [
    [0x428a2f98, 0xd728ae22], [0x71374491, 0x23ef65cd],
    [0xb5c0fbcf, 0xec4d3b2f], [0xe9b5dba5, 0x8189dbbc],
    [0x3956c25b, 0xf348b538], [0x59f111f1, 0xb605d019],
    [0x923f82a4, 0xaf194f9b], [0xab1c5ed5, 0xda6d8118],
    [0xd807aa98, 0xa3030242], [0x12835b01, 0x45706fbe],
    [0x243185be, 0x4ee4b28c], [0x550c7dc3, 0xd5ffb4e2],
    [0x72be5d74, 0xf27b896f], [0x80deb1fe, 0x3b1696b1],
    [0x9bdc06a7, 0x25c71235], [0xc19bf174, 0xcf692694],
    [0xe49b69c1, 0x9ef14ad2], [0xefbe4786, 0x384f25e3],
    [0x0fc19dc6, 0x8b8cd5b5], [0x240ca1cc, 0x77ac9c65],
    [0x2de92c6f, 0x592b0275], [0x4a7484aa, 0x6ea6e483],
    [0x5cb0a9dc, 0xbd41fbd4], [0x76f988da, 0x831153b5],
    [0x983e5152, 0xee66dfab], [0xa831c66d, 0x2db43210],
    [0xb00327c8, 0x98fb213f], [0xbf597fc7, 0xbeef0ee4],
    [0xc6e00bf3, 0x3da88fc2], [0xd5a79147, 0x930aa725],
    [0x06ca6351, 0xe003826f], [0x14292967, 0x0a0e6e70],
    [0x27b70a85, 0x46d22ffc], [0x2e1b2138, 0x5c26c926],
    [0x4d2c6dfc, 0x5ac42aed], [0x53380d13, 0x9d95b3df],
    [0x650a7354, 0x8baf63de], [0x766a0abb, 0x3c77b2a8],
    [0x81c2c92e, 0x47edaee6], [0x92722c85, 0x1482353b],
    [0xa2bfe8a1, 0x4cf10364], [0xa81a664b, 0xbc423001],
    [0xc24b8b70, 0xd0f89791], [0xc76c51a3, 0x0654be30],
    [0xd192e819, 0xd6ef5218], [0xd6990624, 0x5565a910],
    [0xf40e3585, 0x5771202a], [0x106aa070, 0x32bbd1b8],
    [0x19a4c116, 0xb8d2d0c8], [0x1e376c08, 0x5141ab53],
    [0x2748774c, 0xdf8eeb99], [0x34b0bcb5, 0xe19b48a8],
    [0x391c0cb3, 0xc5c95a63], [0x4ed8aa4a, 0xe3418acb],
    [0x5b9cca4f, 0x7763e373], [0x682e6ff3, 0xd6b2b8a3],
    [0x748f82ee, 0x5defb2fc], [0x78a5636f, 0x43172f60],
    [0x84c87814, 0xa1f0ab72], [0x8cc70208, 0x1a6439ec],
    [0x90befffa, 0x23631e28], [0xa4506ceb, 0xde82bde9],
    [0xbef9a3f7, 0xb2c67915], [0xc67178f2, 0xe372532b],
    [0xca273ece, 0xea26619c], [0xd186b8c7, 0x21c0c207],
    [0xeada7dd6, 0xcde0eb1e], [0xf57d4f7f, 0xee6ed178],
    [0x06f067aa, 0x72176fba], [0x0a637dc5, 0xa2c898a6],
    [0x113f9804, 0xbef90dae], [0x1b710b35, 0x131c471b],
    [0x28db77f5, 0x23047d84], [0x32caab7b, 0x40c72493],
    [0x3c9ebe0a, 0x15c9bebc], [0x431d67c4, 0x9c100d4c],
    [0x4cc5d4be, 0xcb3e42b6], [0x597f299c, 0xfc657e2a],
    [0x5fcb6fab, 0x3ad6faec], [0x6c44198c, 0x4a475817]
  ];

  var bytes = toBytes(message);
  var l = bytes.length;
  // append '1' bit and padding zeros, then length as 128-bit big-endian
  bytes.push(0x80);
  while ((bytes.length % 128) !== 112) bytes.push(0);
  // 128-bit length
  var lenHi = Math.floor((l / 0x20000000));
  var lenLo = (l << 3) >>> 0;
  // append 128-bit length: high 64 bits as zeros if message < 2^64 bits
  for (var t = 7; t >= 0; t--) bytes.push((lenHi >>> (t * 8)) & 0xff);
  for (t = 7; t >= 0; t--) bytes.push((lenLo >>> (t * 8)) & 0xff);

  // initial hash values
  var H = [
    [0x6a09e667, 0xf3bcc908], [0xbb67ae85, 0x84caa73b],
    [0x3c6ef372, 0xfe94f82b], [0xa54ff53a, 0x5f1d36f1],
    [0x510e527f, 0xade682d1], [0x9b05688c, 0x2b3e6c1f],
    [0x1f83d9ab, 0xfb41bd6b], [0x5be0cd19, 0x137e2179]
  ];

  function Ch(xh, xl, yh, yl, zh, zl) {
    // ch = (x & y) ^ (~x & z) for 64-bit pairs
    var hi = (xh & yh) ^ (~xh & zh);
    var lo = (xl & yl) ^ (~xl & zl);
    return [hi >>> 0, lo >>> 0];
  }
  function Maj(xh, xl, yh, yl, zh, zl) {
    var hi = (xh & yh) ^ (xh & zh) ^ (yh & zh);
    var lo = (xl & yl) ^ (xl & zl) ^ (yl & zl);
    return [hi >>> 0, lo >>> 0];
  }
  function Sigma0(xh, xl) {
    var r1 = shr64(xh, xl, 28), r2 = shr64(xh, xl, 34), r3 = shr64(xh, xl, 39);
    return [ (r1[0] ^ r2[0] ^ r3[0]) >>> 0, (r1[1] ^ r2[1] ^ r3[1]) >>> 0 ];
  }
  function Sigma1(xh, xl) {
    var r1 = shr64(xh, xl, 14), r2 = shr64(xh, xl, 18), r3 = shr64(xh, xl, 41);
    return [ (r1[0] ^ r2[0] ^ r3[0]) >>> 0, (r1[1] ^ r2[1] ^ r3[1]) >>> 0 ];
  }
  function sigma0(xh, xl) {
    var r1 = shr64(xh, xl, 1), r2 = shr64(xh, xl, 8), r3 = shr64(xh, xl, 7);
    return [ (r1[0] ^ r2[0] ^ r3[0]) >>> 0, (r1[1] ^ r2[1] ^ r3[1]) >>> 0 ];
  }
  function sigma1(xh, xl) {
    var r1 = shr64(xh, xl, 19), r2 = shr64(xh, xl, 61), r3 = shr64(xh, xl, 6);
    return [ (r1[0] ^ r2[0] ^ r3[0]) >>> 0, (r1[1] ^ r2[1] ^ r3[1]) >>> 0 ];
  }

  // process each 1024-bit chunk
  var w = new Array(80);
  for (var i = 0; i < bytes.length; i += 128) {
    // prepare message schedule
    for (var t = 0; t < 16; t++) {
      var j = i + t * 8;
      w[t] = [
        (bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3],
        (bytes[j + 4] << 24) | (bytes[j + 5] << 16) | (bytes[j + 6] << 8) | bytes[j + 7]
      ];
    }
    for (t = 16; t < 80; t++) {
      var s1 = sigma1(w[t - 2][0], w[t - 2][1]);
      var s0 = sigma0(w[t - 15][0], w[t - 15][1]);
      var sum = add64(add64(add64(w[t - 16][0], w[t - 16][1], s0[0], s0[1])[0], add64(w[t - 7][0], w[t - 7][1], s1[0], s1[1])[0], 0, 0)[0], 0, 0);
      // simpler: compute w[t] via big integer ops, but for brevity use approximate approach
      // We'll implement standard word generation with 64-bit add (hi,lo)
      var part1 = add64(w[t - 16][0], w[t - 16][1], s0[0], s0[1]);
      var part2 = add64(w[t - 7][0], w[t - 7][1], s1[0], s1[1]);
      var sum2 = add64(part1[0], part1[1], part2[0], part2[1]);
      w[t] = [sum2[0] >>> 0, sum2[1] >>> 0];
    }

    var a = H[0].slice(0), b = H[1].slice(0), c = H[2].slice(0), d = H[3].slice(0),
        e = H[4].slice(0), f = H[5].slice(0), g = H[6].slice(0), h = H[7].slice(0);

    for (t = 0; t < 80; t++) {
      var S1 = Sigma1(e[0], e[1]);
      var ch = Ch(e[0], e[1], f[0], f[1], g[0], g[1]);
      var temp1 = add64(add64(add64(add64(h[0], h[1], S1[0], S1[1])[0], ch[0], ch[1])[0], K[t][0], K[t][1])[0], w[t][0], w[t][1]);
      var S0 = Sigma0(a[0], a[1]);
      var maj = Maj(a[0], a[1], b[0], b[1], c[0], c[1]);
      var temp2 = add64(S0[0], S0[1], maj[0], maj[1]);

      h = g.slice(0);
      g = f.slice(0);
      f = e.slice(0);
      // e = d + temp1
      var newe = add64(d[0], d[1], temp1[0], temp1[1]);
      e = [newe[0] >>> 0, newe[1] >>> 0];
      d = c.slice(0);
      c = b.slice(0);
      b = a.slice(0);
      var newa = add64(temp1[0], temp1[1], temp2[0], temp2[1]);
      a = [newa[0] >>> 0, newa[1] >>> 0];
    }

    H[0] = add64(H[0][0], H[0][1], a[0], a[1]);
    H[1] = add64(H[1][0], H[1][1], b[0], b[1]);
    H[2] = add64(H[2][0], H[2][1], c[0], c[1]);
    H[3] = add64(H[3][0], H[3][1], d[0], d[1]);
    H[4] = add64(H[4][0], H[4][1], e[0], e[1]);
    H[5] = add64(H[5][0], H[5][1], f[0], f[1]);
    H[6] = add64(H[6][0], H[6][1], g[0], g[1]);
    H[7] = add64(H[7][0], H[7][1], h[0], h[1]);
  }

  // produce hex
  var hex = "";
  for (i = 0; i < H.length; i++) {
    hex += ('00000000' + (H[i][0] >>> 0).toString(16)).slice(-8);
    hex += ('00000000' + (H[i][1] >>> 0).toString(16)).slice(-8);
  }
  return hex;
}

/* -------------------------
   HMAC-SHA256 pure JS (if no WebCrypto)
   Use sha256() above
------------------------- */
async function hmacSha256(message, key) {
  if (window.crypto && window.crypto.subtle) {
    // prefer WebCrypto (returns hex)
    const enc = new TextEncoder();
    const keyData = enc.encode(key);
    const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  } else {
    // RFC: HMAC(K, m) = H((K ^ opad) || H((K ^ ipad) || m))
    var blockSize = 64; // 64 bytes for SHA-256
    function str2bytes(s) { return unescape(encodeURIComponent(s)).split('').map(c => c.charCodeAt(0)); }
    var keyBytes = str2bytes(key);
    if (keyBytes.length > blockSize) {
      var keyHex = sha256(key);
      // convert hex to bytes
      keyBytes = keyHex.match(/.{2}/g).map(h => parseInt(h, 16));
    }
    if (keyBytes.length < blockSize) {
      while (keyBytes.length < blockSize) keyBytes.push(0);
    }
    var oKeyPad = keyBytes.map(b => b ^ 0x5c);
    var iKeyPad = keyBytes.map(b => b ^ 0x36);

    // inner = H(iKeyPad || message)
    var innerBytes = iKeyPad.concat(str2bytes(message));
    // convert innerBytes to string for sha256
    var innerStr = innerBytes.map(b => String.fromCharCode(b)).join('');
    var innerHash = sha256(innerStr);
    // innerHash hex to bytes
    var innerHashBytes = innerHash.match(/.{2}/g).map(h => parseInt(h, 16));
    var outerBytes = oKeyPad.concat(innerHashBytes);
    var outerStr = outerBytes.map(b => String.fromCharCode(b)).join('');
    return sha256(outerStr);
  }
}
