// image-compressor.js
(function () {
  // DOM Elements
  const fileInput = document.getElementById('imgFileInput');
  const compressBtn = document.getElementById('compressBtn');
  const downloadBtn = document.getElementById('downloadImgBtn');
  const previewEl = document.getElementById('imgPreview');
  const qualityInput = document.getElementById('imgQualityInput'); // 0.1 - 1.0
  const maxWidthInput = document.getElementById('imgMaxWidth');
  const maxHeightInput = document.getElementById('imgMaxHeight');

  // Store uploaded file
  let uploadedFile = null;
  let compressedBlob = null;

  // Handle file selection
  fileInput.addEventListener('change', function (e) {
    if (!e.target.files || !e.target.files[0]) return;
    uploadedFile = e.target.files[0];
    compressedBlob = null;
    showPreview(uploadedFile);
  });

  // Show preview
  function showPreview(file) {
    const reader = new FileReader();
    reader.onload = function (evt) {
      previewEl.innerHTML = '';
      const img = document.createElement('img');
      img.src = evt.target.result;
      img.style.maxWidth = '100%';
      previewEl.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  // Compress image
  compressBtn.addEventListener('click', function () {
    if (!uploadedFile) return alert('Please select an image first!');
    const quality = parseFloat(qualityInput.value) || 0.8;
    const maxWidth = parseInt(maxWidthInput.value, 10) || 1024;
    const maxHeight = parseInt(maxHeightInput.value, 10) || 1024;

    compressImage(uploadedFile, quality, maxWidth, maxHeight);
  });

  function compressImage(file, quality, maxWidth, maxHeight) {
    const reader = new FileReader();
    reader.onload = function (evt) {
      const img = new Image();
      img.onload = function () {
        // Resize while keeping aspect ratio
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        if (h > maxHeight) {
          w = Math.round((w * maxHeight) / h);
          h = maxHeight;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        // Convert to Blob (PNG/JPG)
        if (canvas.toBlob) {
          canvas.toBlob(
            function (blob) {
              compressedBlob = blob;
              showCompressedPreview(blob);
            },
            file.type === 'image/png' ? 'image/png' : 'image/jpeg',
            quality
          );
        } else {
          // Fallback for IE11
          const dataURL = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
          compressedBlob = dataURLToBlob(dataURL);
          showCompressedPreview(compressedBlob);
        }
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  function showCompressedPreview(blob) {
    previewEl.innerHTML = '';
    const url = URL.createObjectURL(blob);
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    previewEl.appendChild(img);
  }

  // Download
  downloadBtn.addEventListener('click', function () {
    if (!compressedBlob) return alert('Please compress an image first!');
    if (window.navigator.msSaveBlob) {
      // IE11
      window.navigator.msSaveBlob(compressedBlob, 'compressed_image.png');
    } else {
      const url = URL.createObjectURL(compressedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'compressed_image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  });

  function dataURLToBlob(dataURL) {
    const parts = dataURL.split(',');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mimeString });
  }
})();
