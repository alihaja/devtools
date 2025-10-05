(function(){
  var qrContainer = document.getElementById('qrCanvas'); // sekarang pake div
  var generateBtn = document.getElementById('generateQRBtn');
  var downloadBtn = document.getElementById('downloadQRBtn');

  function generateQR() {
    var text = document.getElementById('qrText').value.trim();
    if(!text) return alert('Enter text or URL!');

    var size = parseInt(document.getElementById('qrSizeInput').value,10) || 256;
    var fg = document.getElementById('qrFg').value || '#000000';
    var bg = document.getElementById('qrBg').value || '#ffffff';
    var ecl = document.getElementById('qrECL').value || 'M';

    // Clear previous QR
    qrContainer.innerHTML = "";

    var correctLevel = QRCode.CorrectLevel.M;
    switch(ecl){
      case 'L': correctLevel = QRCode.CorrectLevel.L; break;
      case 'Q': correctLevel = QRCode.CorrectLevel.Q; break;
      case 'H': correctLevel = QRCode.CorrectLevel.H; break;
    }

    // Generate QR
    new QRCode(qrContainer, {
      text: text,
      width: size,
      height: size,
      colorDark: fg,
      colorLight: bg,
      correctLevel: correctLevel
    });
  }

  function downloadQR() {
    var canvas = qrContainer.querySelector('canvas');
    if(!canvas) return alert('Generate QR first!');

    var dataURL = canvas.toDataURL('image/png');

    if(window.navigator.msSaveBlob){
      var byteString = atob(dataURL.split(',')[1]);
      var ab = new ArrayBuffer(byteString.length);
      var ia = new Uint8Array(ab);
      for(var i=0;i<byteString.length;i++) ia[i]=byteString.charCodeAt(i);
      var blob = new Blob([ab], {type:'image/png'});
      window.navigator.msSaveBlob(blob,'qrcode.png');
    } else {
      var link = document.createElement('a');
      link.href = dataURL;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  generateBtn.addEventListener('click', generateQR);
  downloadBtn.addEventListener('click', downloadQR);
})();
