const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const uploadOverlay = document.getElementById('uploadOverlay');
const imageUpload = document.getElementById('imageUpload');
const btnBlessify = document.getElementById('btnBlessify');
const btnResetFilter = document.getElementById('btnResetFilter');
const btnAddText = document.getElementById('btnAddText');
const btnExport = document.getElementById('btnExport');
const interactiveLayer = document.getElementById('interactiveLayer');
const stickerPalette = document.getElementById('stickerPalette');

let currentImage = null;
let currentFilter = 'none';

// Fonts mapped from CSS
const fonts = [
    'AstonScript',
    'Maratre',
    'MolliesScript',
    'Exmouth',
    'NoirAtelier'
];

// Aesthetic SVGs for stickers
const stickers = [
    // Sparkle
    `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z"/></svg>`,
    // Star / Cross
    `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"/></svg>`,
    // Moon
    `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    // Heart
    `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    // Rose (simplified)
    `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8 2 4 5 4 9C4 13.5 12 22 12 22C12 22 20 13.5 20 9C20 5 16 2 12 2ZM12 6C13.1 6 14 6.9 14 8C14 9.1 13.1 10 12 10C10.9 10 10 9.1 10 8C10 6.9 10.9 6 12 6Z"/></svg>`,
    // Diamond
    `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 12L12 22L22 12L12 2Z"/></svg>`
];

// Initialize UI
function init() {
    // Populate sticker palette
    stickers.forEach((svgStr, index) => {
        const btn = document.createElement('button');
        btn.className = 'sticker-btn';
        btn.innerHTML = svgStr;
        btn.onclick = () => addSticker(index);
        stickerPalette.appendChild(btn);
    });
}

// Image Upload Logic
imageUpload.addEventListener('change', handleImageUpload);
uploadOverlay.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadOverlay.style.background = 'rgba(255, 255, 255, 0.1)';
});
uploadOverlay.addEventListener('dragleave', (e) => {
    uploadOverlay.style.background = 'var(--glass-bg)';
});
uploadOverlay.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadOverlay.style.background = 'var(--glass-bg)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        loadImage(e.dataTransfer.files[0]);
    }
});

function handleImageUpload(e) {
    if (e.target.files && e.target.files[0]) {
        loadImage(e.target.files[0]);
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            uploadOverlay.classList.add('hidden');
            interactiveLayer.classList.add('active');
            renderCanvas();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
}

function renderCanvas() {
    if (!currentImage) return;
    
    // Set canvas dimensions based on image, bounded by window size to prevent massive canvases in memory
    const maxWidth = window.innerWidth * 0.6;
    const maxHeight = window.innerHeight * 0.8;
    
    let w = currentImage.width;
    let h = currentImage.height;
    
    if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w = w * ratio;
        h = h * ratio;
    }
    
    canvas.width = w;
    canvas.height = h;
    
    // Ensure interactive layer matches canvas size
    interactiveLayer.style.width = \`\${w}px\`;
    interactiveLayer.style.height = \`\${h}px\`;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw base image
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    
    // Apply CSS filter to canvas element for live preview
    canvas.style.filter = currentFilter;
}

// Filter Logic (Dark & Moody instead of full sepia)
btnBlessify.addEventListener('click', () => {
    // A dark, contrasty, slightly warm filter
    currentFilter = 'brightness(0.85) contrast(1.15) sepia(0.2) saturate(0.9)';
    renderCanvas();
});

btnResetFilter.addEventListener('click', () => {
    currentFilter = 'none';
    renderCanvas();
});


// Interactive Elements Logic
let activeElement = null;
let isDragging = false;
let startX, startY, initialX, initialY;

// Deselect when clicking outside
document.addEventListener('mousedown', (e) => {
    if (activeElement && !activeElement.contains(e.target) && !e.target.closest('.action-btn') && !e.target.closest('.sticker-btn')) {
        activeElement.classList.remove('selected');
        activeElement = null;
    }
});

function makeDraggable(el) {
    el.addEventListener('mousedown', dragStart);
    
    function dragStart(e) {
        if(e.target.classList.contains('delete-btn')) return; // Ignore delete button clicks
        
        isDragging = true;
        if (activeElement) activeElement.classList.remove('selected');
        activeElement = el;
        activeElement.classList.add('selected');
        
        startX = e.clientX;
        startY = e.clientY;
        
        // Get current transform translate values
        const style = window.getComputedStyle(el);
        const matrix = new DOMMatrixReadOnly(style.transform);
        initialX = matrix.m41;
        initialY = matrix.m42;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }
    
    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        const newX = initialX + dx;
        const newY = initialY + dy;
        
        el.style.transform = \`translate(\${newX}px, \${newY}px) scale(\${el.dataset.scale || 1})\`;
    }
    
    function dragEnd() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', dragEnd);
        
        // Update initial values for next drag
        const style = window.getComputedStyle(el);
        const matrix = new DOMMatrixReadOnly(style.transform);
        initialX = matrix.m41;
        initialY = matrix.m42;
    }
    
    // Add scroll to scale
    el.addEventListener('wheel', (e) => {
        if (activeElement !== el) return;
        e.preventDefault();
        
        let scale = parseFloat(el.dataset.scale || 1);
        scale += e.deltaY * -0.001;
        scale = Math.min(Math.max(0.5, scale), 5); // limits
        
        el.dataset.scale = scale;
        
        const style = window.getComputedStyle(el);
        const matrix = new DOMMatrixReadOnly(style.transform);
        // keep current translation
        el.style.transform = \`translate(\${matrix.m41}px, \${matrix.m42}px) scale(\${scale})\`;
    });
}

function createDeleteBtn(el) {
    const btn = document.createElement('button');
    btn.innerHTML = '×';
    btn.className = 'delete-btn';
    btn.onclick = (e) => {
        e.stopPropagation();
        el.remove();
        if(activeElement === el) activeElement = null;
    };
    return btn;
}

// Add Text
btnAddText.addEventListener('click', () => {
    if (!currentImage) return alert("Please upload an image first.");
    
    const textStr = prompt("Enter your text:", "blessed");
    if (!textStr) return;
    
    const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
    
    const textEl = document.createElement('div');
    textEl.className = 'draggable-element draggable-text selected';
    textEl.innerText = textStr;
    textEl.style.fontFamily = randomFont;
    textEl.style.fontSize = '48px';
    
    // Center it initially
    textEl.style.transform = \`translate(0px, 0px) scale(1)\`;
    textEl.dataset.scale = 1;
    
    textEl.appendChild(createDeleteBtn(textEl));
    
    if(activeElement) activeElement.classList.remove('selected');
    activeElement = textEl;
    
    interactiveLayer.appendChild(textEl);
    makeDraggable(textEl);
});

// Add Sticker
function addSticker(index) {
    if (!currentImage) return alert("Please upload an image first.");
    
    const stickerEl = document.createElement('div');
    stickerEl.className = 'draggable-element draggable-sticker selected';
    stickerEl.innerHTML = stickers[index];
    
    stickerEl.style.width = '80px';
    stickerEl.style.height = '80px';
    stickerEl.style.color = '#fff';
    
    stickerEl.style.transform = \`translate(0px, 0px) scale(1)\`;
    stickerEl.dataset.scale = 1;
    
    stickerEl.appendChild(createDeleteBtn(stickerEl));
    
    if(activeElement) activeElement.classList.remove('selected');
    activeElement = stickerEl;
    
    interactiveLayer.appendChild(stickerEl);
    makeDraggable(stickerEl);
}

// Export
btnExport.addEventListener('click', () => {
    if (!currentImage) return;
    
    if(activeElement) {
        activeElement.classList.remove('selected');
        activeElement = null;
    }
    
    // Create an offscreen canvas to combine everything
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const eCtx = exportCanvas.getContext('2d');
    
    // 1. Draw base image with filter
    eCtx.filter = currentFilter;
    eCtx.drawImage(currentImage, 0, 0, exportCanvas.width, exportCanvas.height);
    eCtx.filter = 'none'; // reset filter for overlays
    
    // 2. Draw interactive elements
    const elements = interactiveLayer.querySelectorAll('.draggable-element');
    elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const matrix = new DOMMatrixReadOnly(style.transform);
        const tx = matrix.m41;
        const ty = matrix.m42;
        const scale = parseFloat(el.dataset.scale || 1);
        
        // Calculate center of element relative to interactiveLayer
        const rect = el.getBoundingClientRect();
        const layerRect = interactiveLayer.getBoundingClientRect();
        
        const centerX = (rect.left - layerRect.left) + rect.width / 2;
        const centerY = (rect.top - layerRect.top) + rect.height / 2;
        
        eCtx.save();
        eCtx.translate(centerX, centerY);
        
        if (el.classList.contains('draggable-text')) {
            eCtx.scale(scale, scale);
            eCtx.font = \`\${style.fontSize} \${style.fontFamily}\`;
            eCtx.fillStyle = style.color;
            eCtx.textAlign = 'center';
            eCtx.textBaseline = 'middle';
            
            // Add slight shadow to match CSS
            eCtx.shadowColor = 'rgba(0,0,0,0.8)';
            eCtx.shadowBlur = 4;
            eCtx.shadowOffsetX = 2;
            eCtx.shadowOffsetY = 2;
            
            // Note: childNodes[0] is the text node, because childNodes[1] is the delete button
            eCtx.fillText(el.childNodes[0].textContent, 0, 0);
        } else if (el.classList.contains('draggable-sticker')) {
            // Draw SVG to canvas
            const svgStr = new XMLSerializer().serializeToString(el.querySelector('svg'));
            const img = new Image();
            const svg = new Blob([svgStr], {type: 'image/svg+xml;charset=utf-8'});
            const url = DOMURL.createObjectURL(svg);
            
            // Wait for image to load before drawing (requires async handling, but since it's a blob it's usually instant, 
            // though to be perfectly safe we should do it async. For a simple app, we can use a callback approach).
            // To keep the export sync for this version, we will just use it. If it fails, we need async.
        }
        
        eCtx.restore();
    });
    
    // To properly export SVGs we need an async approach.
    async function exportFinal() {
        for (let el of elements) {
            if (el.classList.contains('draggable-sticker')) {
                const style = window.getComputedStyle(el);
                const scale = parseFloat(el.dataset.scale || 1);
                
                const rect = el.getBoundingClientRect();
                const layerRect = interactiveLayer.getBoundingClientRect();
                const centerX = (rect.left - layerRect.left) + rect.width / 2;
                const centerY = (rect.top - layerRect.top) + rect.height / 2;
                
                const svg = el.querySelector('svg');
                // Ensure SVG has intrinsic size for canvas drawing
                if(!svg.getAttribute('width')) svg.setAttribute('width', rect.width / scale);
                if(!svg.getAttribute('height')) svg.setAttribute('height', rect.height / scale);
                
                const svgStr = new XMLSerializer().serializeToString(svg);
                
                await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        eCtx.save();
                        eCtx.translate(centerX, centerY);
                        eCtx.scale(scale, scale);
                        eCtx.shadowColor = 'rgba(0,0,0,0.6)';
                        eCtx.shadowBlur = 4;
                        eCtx.shadowOffsetX = 2;
                        eCtx.shadowOffsetY = 2;
                        
                        eCtx.drawImage(img, -img.width/2, -img.height/2);
                        eCtx.restore();
                        resolve();
                    };
                    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
                });
            }
        }
        
        // Trigger download
        const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.download = 'blessify-aesthetic.jpg';
        link.href = dataUrl;
        link.click();
    }
    
    exportFinal();
});

init();
