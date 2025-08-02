// DOM Elements
const uploadScreen = document.getElementById('uploadScreen');
const arScreen = document.getElementById('arScreen');
const mindInput = document.getElementById('mindInput');
const imageInput = document.getElementById('imageInput');
const modelInput = document.getElementById('modelInput');
const status = document.getElementById('status');
const startARBtn = document.getElementById('startARBtn');
const backBtn = document.getElementById('backBtn');

// File storage
let modelFile = null;
let modelBlobUrl = null;
let mindFile = null;
let imageFile = null;
let uploadedFiles = null;

// Screen management
function showUploadScreen() {
  uploadScreen.classList.add('active');
  arScreen.classList.remove('active');
}

function showARScreen() {
  uploadScreen.classList.remove('active');
  arScreen.classList.add('active');
  
  // Wait a moment for the screen to show, then initialize AR
  setTimeout(() => {
    initializeARScene();
  }, 100);
}

// Initialize AR scene
function initializeARScene() {
  // Apply uploaded files to AR scene
  if (uploadedFiles) {
    // Update MindAR target
    const scene = document.querySelector('a-scene');
    const cardImg = document.getElementById('card');
    
    if (scene && cardImg) {
      scene.setAttribute('mindar-image', `imageTargetSrc: ${uploadedFiles.mindUrl};`);
      cardImg.src = uploadedFiles.imageUrl;
      
      // Update 3D model if available
      if (modelBlobUrl) {
        const modelEl = document.getElementById('uploadedModel');
        if (modelEl) {
          modelEl.setAttribute('gltf-model', modelBlobUrl);
        }
      }
    }
  }
  
  // Ensure the scene is visible and starts
  const arScene = document.getElementById('arScene');
  if (arScene) {
    // Force scene to reinitialize if needed
    if (arScene.hasLoaded) {
      // Scene already loaded, just make sure it's running
      console.log('AR Scene already loaded');
    }
  }
}

// File validation and button state management
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

// Image compression utility
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

// Mind file input
mindInput.addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (file && file.name.endsWith('.mind')) {
    mindFile = file;
    status.textContent = '.mind file loaded successfully';
    status.style.borderLeftColor = '#667eea';
    updateButtonState();
  } else {
    mindFile = null;
    status.textContent = 'Please select a valid .mind file';
    status.style.borderLeftColor = '#ff4444';
    updateButtonState();
  }
});

// Image file input
imageInput.addEventListener('change', async function (event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    status.textContent = 'Processing image...';
    status.style.borderLeftColor = '#667eea';
    
    try {
      imageFile = file.size > 1024 * 1024 ? await compressImage(file) : file;
      status.textContent = 'Target image loaded successfully';
      updateButtonState();
    } catch (error) {
      imageFile = null;
      status.textContent = 'Error processing image. Please try again.';
      status.style.borderLeftColor = '#ff4444';
      updateButtonState();
    }
  } else {
    imageFile = null;
    status.textContent = 'Please select a valid image file (PNG/JPG)';
    status.style.borderLeftColor = '#ff4444';
    updateButtonState();
  }
});

// Model file input (optional)
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
    status.textContent = 'Please select a valid .glb or .gltf file';
    status.style.borderLeftColor = '#ff4444';
  }
});

// Start AR button
startARBtn.addEventListener('click', async function () {
  if (mindFile && imageFile) {
    startARBtn.disabled = true;
    startARBtn.textContent = 'Uploading files...';
    status.textContent = 'Uploading files to server... Please wait.';
    status.style.borderLeftColor = '#667eea';
    
    // Add loading class
    document.querySelector('.upload-container').classList.add('loading');

    const formData = new FormData();
    formData.append('mind', mindFile);
    formData.append('image', imageFile);

    try {
      const response = await fetch('/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      uploadedFiles = data;
      
      // Store file info for display
      sessionStorage.setItem('mindFileName', mindFile.name);
      sessionStorage.setItem('imageFileName', imageFile.name);
      if (modelFile) {
        sessionStorage.setItem('modelFileName', modelFile.name);
      }
      
      // Switch to AR screen
      showARScreen();
      
    } catch (err) {
      status.textContent = 'Upload failed. Please check your connection and try again.';
      status.style.borderLeftColor = '#ff4444';
      startARBtn.disabled = false;
      startARBtn.textContent = 'Start AR Experience';
      console.error('Upload error:', err);
    } finally {
      document.querySelector('.upload-container').classList.remove('loading');
    }
  }
});

// Back button
backBtn.addEventListener('click', function () {
  showUploadScreen();
});

// Initialize app
window.addEventListener('DOMContentLoaded', function () {
  // Check if we have previous session data
  const mindFileName = sessionStorage.getItem('mindFileName');
  const imageFileName = sessionStorage.getItem('imageFileName');
  
  if (mindFileName && imageFileName) {
    // If we have previous uploads, show upload screen but with info
    status.textContent = `Previous session: ${mindFileName} + ${imageFileName}. Upload new files or go back to AR.`;
    status.style.borderLeftColor = '#667eea';
  } else {
    status.textContent = 'Please upload all required files to start AR experience';
    status.style.borderLeftColor = '#667eea';
  }
  
  // Always start with upload screen
  showUploadScreen();
  
  // Wait for A-Frame to be ready
  if (typeof AFRAME !== 'undefined') {
    console.log('A-Frame loaded successfully');
  } else {
    // Wait for A-Frame to load
    window.addEventListener('load', () => {
      console.log('A-Frame should be loaded now');
    });
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function () {
  if (modelBlobUrl) URL.revokeObjectURL(modelBlobUrl);
});