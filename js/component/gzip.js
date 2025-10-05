(function(){
  const textInput = document.getElementById('gzipTextInput');
  const textOutput = document.getElementById('gzipTextOutput');
  const textCompressBtn = document.getElementById('gzipTextCompressBtn');
  const textDecompressBtn = document.getElementById('gzipTextDecompressBtn');
  const textDownloadBtn = document.getElementById('gzipTextDownloadBtn');

  const fileInput = document.getElementById('gzipFileInput');
  const fileCompressBtn = document.getElementById('gzipFileCompressBtn');
  const fileDecompressBtn = document.getElementById('gzipFileDecompressBtn');
  const fileInfo = document.getElementById('gzipFileInfo');

  const encoder = window.TextEncoder ? new TextEncoder() : { encode: str => Uint8Array.from([...str].map(c=>c.charCodeAt(0))) };
  const decoder = window.TextDecoder ? new TextDecoder() : { decode: arr => String.fromCharCode(...arr) };

  // ======= TEXT MODE =======
  function compressText() {
    if(!textInput.value) return alert('Enter text!');
    const uint8 = encoder.encode(textInput.value);
    const compressed = pako.gzip(uint8);
    textOutput.value = uint8ToBase64(compressed);
  }

  function decompressText() {
    if(!textInput.value) return alert('Enter compressed Base64!');
    try {
      const compressed = base64ToUint8(textInput.value.trim());
      const decompressed = pako.ungzip(compressed);
      textOutput.value = decoder.decode(decompressed);
    } catch(e) {
      alert('Invalid GZIP Base64!');
    }
  }

  function downloadText() {
    if(!textOutput.value) return alert('Nothing to download!');
    const blob = new Blob([textOutput.value], {type:'text/plain'});
    downloadBlob(blob, 'gzip-output.txt');
  }

  // ======= FILE MODE =======
  function compressFile() {
    const file = fileInput.files[0];
    if(!file) return alert('Select a file!');
    const reader = new FileReader();
    reader.onload = e => {
      const data = new Uint8Array(e.target.result);
      const compressed = pako.gzip(data);
      const blob = new Blob([compressed], {type:'application/gzip'});
      downloadBlob(blob, file.name + '.gz');
    };
    reader.readAsArrayBuffer(file);
  }

  function decompressFile() {
    const file = fileInput.files[0];
    if(!file) return alert('Select a .gz file!');
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const decompressed = pako.ungzip(data);
        const blob = new Blob([decompressed], {type:'application/octet-stream'});
        const originalName = file.name.replace(/\.gz$/, '') || 'decompressed';
        downloadBlob(blob, originalName);
      } catch(err) {
        alert('Failed to decompress: Invalid GZIP file!');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ======= HELPERS =======
  function uint8ToBase64(uint8) {
    let binary = '';
    const chunk = 0x8000;
    for(let i=0;i<uint8.length;i+=chunk){
      const sub = uint8.subarray(i,i+chunk);
      binary += String.fromCharCode(...sub);
    }
    return btoa(binary);
  }

  function base64ToUint8(base64) {
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) arr[i] = binary.charCodeAt(i);
    return arr;
  }

  function downloadBlob(blob, filename) {
    if(window.navigator.msSaveBlob){
      window.navigator.msSaveBlob(blob, filename);
    } else {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // ======= EVENTS =======
  textCompressBtn.addEventListener('click', compressText);
  textDecompressBtn.addEventListener('click', decompressText);
  textDownloadBtn.addEventListener('click', downloadText);

  fileCompressBtn.addEventListener('click', compressFile);
  fileDecompressBtn.addEventListener('click', decompressFile);
})();
