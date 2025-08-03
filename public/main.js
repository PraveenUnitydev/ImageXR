const uploadScreen = document.getElementById('uploadScreen');
const arScreen = document.getElementById('arScreen');
const mindInput = document.getElementById('mindInput');
const imageInput = document.getElementById('imageInput');
const modelInput = document.getElementById('modelInput');
const status = document.getElementById('status');
const startARBtn = document.getElementById('startARBtn');
const backBtn = document.getElementById('backBtn');

let modelFile = null;
let modelBlobUrl = null;
let mindFile = null;
let mindBlobUrl = null;
let imageFile = null;
let imageBlobUrl = null;

function showUploadScreen() {
  uploadScreen.classList.add('active');
  arScreen.classList.remove('active');
  
  document.dispatchEvent(new CustomEvent('screenChange', {
    detail: { screen: 'upload' }
  }));
}

function showARScreen() {
  uploadScreen.classList.remove('active');
  arScreen.classList.add('active');
  
  document.dispatchEvent(new CustomEvent('screenChange', {
    detail: { screen: 'ar' }
  }));
  
  setTimeout(() => {
    rebuildCompleteScene();
  }, 200);
}

function rebuildCompleteScene() {
  console.log('Rebuilding complete AR scene');
  
  const arScreen = document.getElementById('arScreen');
  
  const sceneHTML = `
    <button id="newBackBtn" class="back-button">← Back to Upload</button>
    <a-scene 
      shadow="type: pcfsoft; autoUpdate: true"
      renderer="antialias: true; shadowMap.enabled: true"
      mindar-image="imageTargetSrc: ${mindBlobUrl}; maxTrack: 1; autoStart: true; uiLoading: no; uiScanning: no; uiError: no"
      vr-mode-ui="enabled: false" 
      device-orientation-permission-ui="enabled: false">

      <a-entity light="type: directional; castShadow: true; intensity: 1.2; color: #FFFFFF" position="8 12 5"></a-entity>
      <a-entity light="type: ambient; intensity: 0.6; color: #B8D4FF"></a-entity>

      <a-assets>
        <img id="cardNew" src="${imageBlobUrl}" crossorigin="anonymous" />
      </a-assets>

      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

      <a-entity mindar-image-target="targetIndex: 0">
        ${modelBlobUrl ? 
          `<a-gltf-model 
            rotation="90 0 0" 
            position="0 0.1 0" 
            scale="0.4 0.4 0.4" 
            gltf-model="${modelBlobUrl}">
          </a-gltf-model>` :
          `<a-box 
            position="0 0.1 0" 
            rotation="0 45 0" 
            color="#4CC3D9" 
            animation="property: rotation; to: 0 405 0; loop: true; dur: 10000">
          </a-box>
          <a-text 
            value="Target Found!" 
            position="0 0.5 0" 
            align="center" 
            color="#FFF">
          </a-text>`
        }
      </a-entity>
    </a-scene>
  `;
  
  arScreen.innerHTML = sceneHTML;
  
  document.getElementById('newBackBtn').addEventListener('click', function() {
    showUploadScreen();
    startARBtn.disabled = false;
    startARBtn.textContent = 'Start AR Experience';
  });
  
  console.log('Scene rebuilt with uploaded files');
}

function updateButtonState() {
  if (mindFile && imageFile) {
    startARBtn.disabled = false;
    startARBtn.textContent = 'Start AR Experience';
    status.textContent = 'All files loaded! Ready to start AR experience.';
    status.style.borderLeftColor = '#4CAF50';
  } else {
    startARBtn.disabled = true;
    startARBtn.textContent = 'Upload Required Files First';
    let needed = [];
    if (!mindFile) needed.push('.mind file');
    if (!imageFile) needed.push('target image');
    status.textContent = `Required: ${needed.join(' and ')}`;
    status.style.borderLeftColor = '#ff4444';
  }
}

function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function () {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
}

// Event Listeners
mindInput.addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (file && file.name.endsWith('.mind')) {
    if (mindBlobUrl) URL.revokeObjectURL(mindBlobUrl);
    mindFile = file;
    mindBlobUrl = URL.createObjectURL(file);
    status.textContent = '.mind file loaded successfully';
    status.style.borderLeftColor = '#667eea';
    updateButtonState();
  } else {
    mindFile = null;
    if (mindBlobUrl) {
      URL.revokeObjectURL(mindBlobUrl);
      mindBlobUrl = null;
    }
    status.textContent = 'Please select a valid .mind file';
    status.style.borderLeftColor = '#ff4444';
    updateButtonState();
  }
});

imageInput.addEventListener('change', async function (event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    status.textContent = 'Processing image...';
    status.style.borderLeftColor = '#667eea';
    
    try {
      if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
      const processedFile = file.size > 1024 * 1024 ? await compressImage(file) : file;
      imageFile = processedFile;
      imageBlobUrl = URL.createObjectURL(processedFile);
      status.textContent = 'Target image loaded successfully';
      updateButtonState();
    } catch (error) {
      imageFile = null;
      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
        imageBlobUrl = null;
      }
      status.textContent = 'Error processing image. Please try again.';
      status.style.borderLeftColor = '#ff4444';
      updateButtonState();
    }
  } else {
    imageFile = null;
    if (imageBlobUrl) {
      URL.revokeObjectURL(imageBlobUrl);
      imageBlobUrl = null;
    }
    status.textContent = 'Please select a valid image file (PNG/JPG)';
    status.style.borderLeftColor = '#ff4444';
    updateButtonState();
  }
});

modelInput.addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
    if (modelBlobUrl) URL.revokeObjectURL(modelBlobUrl);
    modelBlobUrl = URL.createObjectURL(file);
    modelFile = file;
    status.textContent = `3D model "${file.name}" loaded successfully`;
    status.style.borderLeftColor = '#4CAF50';
  } else if (file) {
    modelFile = null;
    if (modelBlobUrl) {
      URL.revokeObjectURL(modelBlobUrl);
      modelBlobUrl = null;
    }
    status.textContent = 'Please select a valid .glb or .gltf file';
    status.style.borderLeftColor = '#ff4444';
  }
});

startARBtn.addEventListener('click', function () {
  if (mindFile && imageFile) {
    startARBtn.disabled = true;
    startARBtn.textContent = 'Initializing AR...';
    status.textContent = 'Setting up AR experience...';
    status.style.borderLeftColor = '#667eea';
    
    document.querySelector('.upload-container').classList.add('loading');

    if (!mindBlobUrl && mindFile) {
      mindBlobUrl = URL.createObjectURL(mindFile);
    }
    if (!imageBlobUrl && imageFile) {
      imageBlobUrl = URL.createObjectURL(imageFile);
    }
    if (!modelBlobUrl && modelFile) {
      modelBlobUrl = URL.createObjectURL(modelFile);
    }

    setTimeout(() => {
      showARScreen();
      document.querySelector('.upload-container').classList.remove('loading');
    }, 800);
  }
});

if (backBtn) {
  backBtn.addEventListener('click', function () {
    showUploadScreen();
    startARBtn.disabled = false;
    startARBtn.textContent = 'Start AR Experience';
  });
}

window.addEventListener('DOMContentLoaded', function () {
  status.textContent = 'Please upload all required files to start AR experience';
  status.style.borderLeftColor = '#667eea';
  showUploadScreen();
  
  if (typeof AFRAME !== 'undefined') {
    console.log('A-Frame loaded successfully');
  }
});

window.addEventListener('beforeunload', function () {
  if (modelBlobUrl) URL.revokeObjectURL(modelBlobUrl);
  if (mindBlobUrl) URL.revokeObjectURL(mindBlobUrl);
  if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
});