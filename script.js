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
const canvasWrapper = document.querySelector('.canvas-wrapper');

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

// Elegant SVG Stickers
const stickers = [
    // Sparkle
    `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z"/></svg>`,
    // Star (Solid)
    `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>`,
    // Lips/Kiss
    `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.5C12 21.5 4 15.5 3 13C2 10.5 4.5 8 7 9.5C8 10.1 10 11.5 12 12.5C14 11.5 16 10.1 17 9.5C19.5 8 22 10.5 21 13C20 15.5 12 21.5 12 21.5Z"/><path d="M12 15C9 14 6 13.5 3 13C6 11 9 12 12 12.5C15 12 18 11 21 13C18 13.5 15 14 12 15Z" fill="#ff4d85"/></svg>`,
    // Heart
    `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    // Butterfly
    `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22 6C20 4 16 3 12 9C8 3 4 4 2 6C0 8 1 12 5 13C3 15 2 19 5 21C8 23 11 19 12 17C13 19 16 23 19 21C22 19 21 15 19 13C23 12 24 8 22 6ZM12 15C11 12 11 10 12 7C13 10 13 12 12 15Z"/></svg>`,
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

// Bulletproof Image Upload Logic
imageUpload.addEventListener('change', handleImageUpload);
imageUpload.addEventListener('dragover', () => uploadOverlay.classList.add('dragover'));
imageUpload.addEventListener('dragleave', () => uploadOverlay.classList.remove('dragover'));
imageUpload.addEventListener('drop', () => uploadOverlay.classList.remove('dragover'));

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
            // Fully remove the upload overlay to ensure it doesn't block interactions
            uploadOverlay.remove();
            interactiveLayer.classList.remove('hidden');
            interactiveLayer.classList.add('active');
            renderCanvas();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
}

function renderCanvas() {
    if (!currentImage) return;
    
    // Set canvas dimensions based on image, bounded by window to prevent huge DOM nodes
    const maxWidth = window.innerWidth - 700; // Account for two 320px sidebars + padding
    const maxHeight = window.innerHeight - 150; // Account for header and padding
    
    let w = currentImage.width;
    let h = currentImage.height;
    
    if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w = w * ratio;
        h = h * ratio;
    }
    
    // Set internal canvas resolution
    canvas.width = currentImage.width;
    canvas.height = currentImage.height;
    
    // Set CSS display size for the wrapper so everything scales nicely
    canvasWrapper.style.width = \`\${w}px\`;
    canvasWrapper.style.height = \`\${h}px\`;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw base image
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    
    // Apply CSS filter to canvas element for live preview
    canvas.style.filter = currentFilter;
}

// Filter Logic: Soft 2000s camera vibe (refined)
btnBlessify.addEventListener('click', () => {
    // A sophisticated slightly warm, high contrast look
    currentFilter = 'contrast(1.15) brightness(1.05) saturate(1.2) sepia(0.2) hue-rotate(-5deg)';
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

document.addEventListener('mousedown', (e) => {
    if (activeElement && !activeElement.contains(e.target) && !e.target.closest('.action-btn') && !e.target.closest('.sticker-btn')) {
        activeElement.classList.remove('selected');
        activeElement = null;
    }
});

function makeDraggable(el) {
    el.addEventListener('mousedown', dragStart);
    
    function dragStart(e) {
        if(e.target.classList.contains('delete-btn')) return;
        
        isDragging = true;
        if (activeElement) activeElement.classList.remove('selected');
        activeElement = el;
        activeElement.classList.add('selected');
        
        startX = e.clientX;
        startY = e.clientY;
        
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
    }
    
    el.addEventListener('wheel', (e) => {
        if (activeElement !== el) return;
        e.preventDefault();
        
        let scale = parseFloat(el.dataset.scale || 1);
        scale += e.deltaY * -0.001;
        scale = Math.min(Math.max(0.2, scale), 5);
        
        el.dataset.scale = scale;
        
        const style = window.getComputedStyle(el);
        const matrix = new DOMMatrixReadOnly(style.transform);
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
    textEl.style.fontSize = '64px';
    
    // Assign a soft premium color
    const colors = ['#ffffff', '#ff4d85', '#d90429', '#e5e5e5'];
    textEl.style.color = colors[Math.floor(Math.random() * colors.length)];
    
    // Center it relative to the wrapper size
    const wrapperRect = canvasWrapper.getBoundingClientRect();
    const startX = wrapperRect.width / 2;
    const startY = wrapperRect.height / 2;
    
    // Position absolutely at 0,0 and use transform to move to center
    textEl.style.left = '0';
    textEl.style.top = '0';
    // Offset by half its estimated width/height to truly center, but translate is easier
    textEl.style.transform = \`translate(\${startX - 100}px, \${startY - 40}px) scale(1)\`;
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
    
    stickerEl.style.width = '100px';
    stickerEl.style.height = '100px';
    
    const colors = ['#ffffff', '#ff4d85', '#d90429', '#e5e5e5'];
    stickerEl.style.color = colors[Math.floor(Math.random() * colors.length)];
    
    const wrapperRect = canvasWrapper.getBoundingClientRect();
    const startX = wrapperRect.width / 2;
    const startY = wrapperRect.height / 2;
    
    stickerEl.style.left = '0';
    stickerEl.style.top = '0';
    stickerEl.style.transform = \`translate(\${startX - 50}px, \${startY - 50}px) scale(1)\`;
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
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const eCtx = exportCanvas.getContext('2d');
    
    eCtx.filter = currentFilter;
    eCtx.drawImage(currentImage, 0, 0, exportCanvas.width, exportCanvas.height);
    eCtx.filter = 'none'; 
    
    // Scale factor between the on-screen wrapper and the actual image resolution
    const wrapperRect = canvasWrapper.getBoundingClientRect();
    const scaleX = exportCanvas.width / wrapperRect.width;
    const scaleY = exportCanvas.height / wrapperRect.height;
    
    const elements = interactiveLayer.querySelectorAll('.draggable-element');
    
    async function exportFinal() {
        for (let el of elements) {
            const style = window.getComputedStyle(el);
            const matrix = new DOMMatrixReadOnly(style.transform);
            const elScale = parseFloat(el.dataset.scale || 1);
            
            // Get center position in screen coordinates relative to wrapper
            const elRect = el.getBoundingClientRect();
            const centerX_screen = (elRect.left - wrapperRect.left) + elRect.width / 2;
            const centerY_screen = (elRect.top - wrapperRect.top) + elRect.height / 2;
            
            // Convert screen coordinates to export canvas coordinates
            const centerX_export = centerX_screen * scaleX;
            const centerY_export = centerY_screen * scaleY;
            
            // Adjust the element scale by the canvas scaling factor
            // Assuming uniform scaling (object-fit: contain ensures aspect ratio is maintained)
            const finalScale = elScale * scaleX;

            if (el.classList.contains('draggable-text')) {
                eCtx.save();
                eCtx.translate(centerX_export, centerY_export);
                eCtx.scale(finalScale, finalScale);
                eCtx.font = \`\${style.fontSize} \${style.fontFamily}\`;
                eCtx.fillStyle = style.color;
                eCtx.textAlign = 'center';
                eCtx.textBaseline = 'middle';
                
                eCtx.shadowColor = 'rgba(0,0,0,0.5)';
                eCtx.shadowBlur = 10;
                eCtx.shadowOffsetX = 0;
                eCtx.shadowOffsetY = 4;
                
                eCtx.fillText(el.childNodes[0].textContent, 0, 0);
                eCtx.restore();
            } else if (el.classList.contains('draggable-sticker')) {
                const svg = el.querySelector('svg');
                // intrinsic size logic
                const w = parseFloat(style.width);
                const h = parseFloat(style.height);
                
                if(!svg.getAttribute('width')) svg.setAttribute('width', w);
                if(!svg.getAttribute('height')) svg.setAttribute('height', h);
                
                svg.style.color = style.color;
                
                const svgStr = new XMLSerializer().serializeToString(svg);
                
                await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        eCtx.save();
                        eCtx.translate(centerX_export, centerY_export);
                        eCtx.scale(finalScale, finalScale);
                        
                        eCtx.shadowColor = 'rgba(0,0,0,0.4)';
                        eCtx.shadowBlur = 15;
                        eCtx.shadowOffsetX = 0;
                        eCtx.shadowOffsetY = 5;
                        
                        eCtx.drawImage(img, -img.width/2, -img.height/2);
                        eCtx.restore();
                        resolve();
                    };
                    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
                });
            }
        }
        
        const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = 'blessify-studio.jpg';
        link.href = dataUrl;
        link.click();
    }
    
    exportFinal();
});

init();
