(() => {
  const $ = id => document.getElementById(id);
  const fileInput = $("certFileInput");
  const pasteInput = $("certInput");
  const passwordInput = $("pfxPassword");
  const decodeBtn = $("certDecodeBtn");
  const results = $("certOutput");
  const chain = $("certChain");
  const actions = $("certActions");

  let parsedCerts = [];
  let parsedPrivateKey = null;

  // Enable decode button if input exists
  function updateButton() {
    decodeBtn.disabled = !(fileInput.files.length || pasteInput.value.trim());
  }
  fileInput.addEventListener("change", updateButton);
  pasteInput.addEventListener("input", updateButton);

  // Drag & drop
  const dropZone = $("certDropZone");
  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("dragover", e => e.preventDefault());
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      fileInput.dispatchEvent(new Event("change"));
    }
  });

  // Clear UI
  function clearUI() {
    results.textContent = "";
    chain.textContent = "";
    actions.style.display = "none";
    parsedCerts = [];
    parsedPrivateKey = null;
  }

  window.certDecoder_clear = function() {
    fileInput.value = "";
    pasteInput.value = "";
    passwordInput.value = "";
    clearUI();
    updateButton();
  };

  // Utility: read file as binary string
  function readFileAsBinary(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsBinaryString(file);
    });
  }

  // Utility: read file as text
  function readFileAsText(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsText(file);
    });
  }

  // Extract PEM blocks from text
  function extractPemBlocks(text) {
    const regex = /-----BEGIN (.+?)-----[\s\S]+?-----END \1-----/g;
    let match, blocks = [];
    while(match = regex.exec(text)) blocks.push(match[0]);
    return blocks;
  }

  // Parse PEM block to Forge object
  function parsePemBlock(block) {
    try {
      if(block.includes("PRIVATE KEY")){
        return { type: "privateKey", obj: forge.pki.privateKeyFromPem(block) };
      } else if(block.includes("CERTIFICATE")){
        return { type: "certificate", obj: forge.pki.certificateFromPem(block) };
      } else {
        return null;
      }
    } catch(e) {
      throw new Error("Invalid PEM format: " + e.message);
    }
  }

  // Parse PFX / PKCS#12 from binary
  function parsePFX(binary, password) {
    const p12Asn1 = forge.asn1.fromDer(binary);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
    let certs = [];
    let privateKey = null;

    // Extract certificates
    const bagsCert = p12.getBags({ bagType: forge.pki.oids.certBag });
    Object.values(bagsCert).forEach(bags => bags.forEach(b => certs.push(b.cert)));

    // Extract private key
    const keyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
    Object.values(keyBags).forEach(bags => {
      if(bags.length) privateKey = bags[0].key;
    });
    return { certs, privateKey };
  }

  // Main decode function
  window.certDecoder_decode = async function() {
    clearUI();
    try {
      let allText = pasteInput.value.trim();
      const password = passwordInput.value || "";

      // Read files
      for(const f of fileInput.files){
        const ext = f.name.split('.').pop().toLowerCase();
        if(ext === "pfx" || ext === "p12"){
          const binary = await readFileAsBinary(f);
          const { certs, privateKey } = parsePFX(binary, password);
          parsedCerts.push(...certs);
          if(privateKey) parsedPrivateKey = privateKey;
        } else {
          const text = await readFileAsText(f);
          allText += "\n" + text;
        }
      }

      if(allText.trim()){
        const blocks = extractPemBlocks(allText);
        blocks.forEach(block => {
          const parsed = parsePemBlock(block);
          if(parsed){
            if(parsed.type === "privateKey") parsedPrivateKey = parsed.obj;
            else if(parsed.type === "certificate") parsedCerts.push(parsed.obj);
          }
        });
      }

      if(!parsedCerts.length && !parsedPrivateKey){
        results.textContent = "❌ No valid certificate or private key found";
        return;
      }

      // Display PEM
      results.textContent = [
        parsedPrivateKey ? forge.pki.privateKeyToPem(parsedPrivateKey) : null,
        ...parsedCerts.map(c => forge.pki.certificateToPem(c))
      ].filter(Boolean).join("\n");

      // Display chain
      chain.innerHTML = parsedCerts.map((c,i)=>{
        const subj = c.subject.attributes.map(a=>a.shortName+"="+a.value).join(", ");
        const iss = c.issuer.attributes.map(a=>a.shortName+"="+a.value).join(", ");
        return `<div>Cert ${i+1}: Subject=${subj}, Issuer=${iss}</div>`;
      }).join("");

      actions.style.display = parsedCerts.length ? "inline-flex" : "none";
    } catch(e) {
      results.textContent = "❌ Failed: " + e.message;
    }
  };

  // Export PEM / DER
  window.certDecoder_export = function(format) {
    if(!parsedCerts.length && !parsedPrivateKey) return alert("Decode first!");
    let data, filename = "certificate";

    switch(format){
      case "pem":
        data = [
          parsedPrivateKey ? forge.pki.privateKeyToPem(parsedPrivateKey) : null,
          ...parsedCerts.map(c => forge.pki.certificateToPem(c))
        ].filter(Boolean).join("\n");
        filename += ".pem";
        break;

      case "der":
        // export all certificates as concatenated DER
        const derBytes = parsedCerts.map(c => {
          return forge.asn1.toDer(forge.pki.certificateToAsn1(c)).getBytes();
        }).join("");
        const arr = new Uint8Array([...derBytes].map(ch => ch.charCodeAt(0)));
        const blob = new Blob([arr], { type: "application/octet-stream" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename+".der";
        link.click();
        return;

      default: return alert("Unknown format");
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data], { type:"text/plain" }));
    link.download = filename;
    link.click();
  };

})();
