// DOM Elements
const uploadScreen = document.getElementById('uploadScreen');
const arScreen = document.getElementById('arScreen');
const mindInput = document.getElementById('mindInput');
const imageInput = document.getElementById('imageInput');
const modelInput = document.getElementById('modelInput');
const status = document.getElementById('status');
const startARBtn = document.getElementById('startARBtn');
const backBtn = document.getElementById('backBtn');

// File storage (client-side)
let modelFile = null;
let modelBlobUrl = null;
let mindFile = null;
let mindBlobUrl = null;
let imageFile = null;
let imageBlobUrl = null;

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

// Initialize AR scene with client-side files
function initializeARScene() {
  if (mindBlobUrl && imageBlobUrl) {
    console.log('Initializing AR scene with uploaded files');
    
    // Get the scene element
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('A-Frame scene not found');
      return;
    }

    // Stop the current AR system if running
    if (scene.systems && scene.systems['mindar-image-system']) {
      scene.systems['mindar-image-system'].stop();
    }

    // Update the card image source first
    const cardImg = document.getElementById('card');
    if (cardImg) {
      cardImg.src = imageBlobUrl;
      console.log('Updated card image source');
    }

    // Wait for image to load, then reinitialize MindAR
    const img = new Image();
    img.onload = function() {
      console.log('Image loaded, reinitializing MindAR');
      
      // Remove and recreate the mindar-image attribute to force reinitialization
      scene.removeAttribute('mindar-image');
      
      // Wait a frame then add the new configuration
      setTimeout(() => {
        scene.setAttribute('mindar-image', {
          imageTargetSrc: mindBlobUrl,
          maxTrack: 1,
          showStats: false,
          autoStart: true,
          uiLoading: 'no',
          uiScanning: 'no',
          uiError: 'no'
        });
        
        // Update 3D model if available
        if (modelBlobUrl) {
          const modelEl = document.getElementById('uploadedModel');
          if (modelEl) {
            modelEl.setAttribute('gltf-model', modelBlobUrl);
            modelEl.setAttribute('visible', 'true');
            console.log('Updated 3D model');
          }
        }
        
        console.log('MindAR reinitialized with new target');
      }, 100);
    };
    
    img.onerror = function() {
      console.error('Error loading target image');
      status.textContent = 'Error loading target image';
      status.style.borderLeftColor = '#ff4444';
    };
    
    img.src = imageBlobUrl;
  } else {
    console.error('Missing required files for AR initialization');
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
    // Clean up previous blob URL
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

// Image file input
imageInput.addEventListener('change', async function (event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    status.textContent = 'Processing image...';
    status.style.borderLeftColor = '#667eea';
    
    try {
      // Clean up previous blob URL
      if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
      
      // Compress if needed
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

// Model file input (optional)
modelInput.addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
    // Clean up previous blob URL
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

// Start AR button - No server upload needed!
startARBtn.addEventListener('click', function () {
  if (mindFile && imageFile) {
    startARBtn.disabled = true;
    startARBtn.textContent = 'Initializing AR...';
    status.textContent = 'Setting up AR experience...';
    status.style.borderLeftColor = '#667eea';
    
    // Add loading class
    document.querySelector('.upload-container').classList.add('loading');

    // Create blob URLs if not already created
    if (!mindBlobUrl && mindFile) {
      mindBlobUrl = URL.createObjectURL(mindFile);
    }
    if (!imageBlobUrl && imageFile) {
      imageBlobUrl = URL.createObjectURL(imageFile);
    }
    if (!modelBlobUrl && modelFile) {
      modelBlobUrl = URL.createObjectURL(modelFile);
    }

    // Give some time for blob URLs to be ready
    setTimeout(() => {
      showARScreen();
      document.querySelector('.upload-container').classList.remove('loading');
    }, 500);
  }
});

// Back button
backBtn.addEventListener('click', function () {
  // Stop AR system when going back
  const scene = document.querySelector('a-scene');
  if (scene && scene.systems && scene.systems['mindar-image-system']) {
    scene.systems['mindar-image-system'].stop();
  }
  
  showUploadScreen();
  
  // Reset button state
  startARBtn.disabled = false;
  startARBtn.textContent = 'Start AR Experience';
});

// Initialize app
window.addEventListener('DOMContentLoaded', function () {
  status.textContent = 'Please upload all required files to start AR experience';
  status.style.borderLeftColor = '#667eea';
  
  // Always start with upload screen
  showUploadScreen();
  
  // Wait for A-Frame to be ready
  if (typeof AFRAME !== 'undefined') {
    console.log('A-Frame loaded successfully');
    
    // Add event listeners for AR events
    document.addEventListener('DOMContentLoaded', () => {
      const scene = document.querySelector('a-scene');
      if (scene) {
        scene.addEventListener('loaded', () => {
          console.log('A-Frame scene loaded');
        });
      }
    });
  } else {
    window.addEventListener('load', () => {
      console.log('A-Frame should be loaded now');
    });
  }
  
  // Add MindAR event listeners for debugging
  document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene) {
      scene.addEventListener('arReady', () => {
        console.log('AR is ready');
      });
      
      scene.addEventListener('arError', (event) => {
        console.error('AR Error:', event.detail);
        status.textContent = 'AR initialization failed. Please try again.';
        status.style.borderLeftColor = '#ff4444';
      });
    }
  });
});

// Cleanup on page unload
window.addEventListener('beforeunload', function () {
  // Clean up all blob URLs to prevent memory leaks
  if (modelBlobUrl) URL.revokeObjectURL(modelBlobUrl);
  if (mindBlobUrl) URL.revokeObjectURL(mindBlobUrl);
  if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
});