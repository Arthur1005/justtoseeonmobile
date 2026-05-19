const workspace = document.getElementById('projectWorkspace');
const modal = document.getElementById('modalOverlay');
const modalGallery = document.getElementById('modalGallery');
const modalTitle = document.getElementById('modalTitle');
const modalNotesPanel = document.getElementById('modalNotesPanel');
const notesToggleBtn  = document.getElementById('notesToggleBtn');
const modalCategory = document.getElementById('modalCategory');
const modalDescription = document.getElementById('modalDescription');
const btnResize = document.getElementById('btnResize');
const btnGrid = document.getElementById('btnGrid');
const btnChaos = document.getElementById('btnChaos');
const btn2A = document.getElementById('btn2a');
const btn2B = document.getElementById('btn2b');

const isMobile = window.innerWidth < window.innerHeight;

let step = 0;
let placeholder = document.createElement('div');
placeholder.className = 'dropPlaceholder';


let cursorX = 0;
let cursorY = 0;


function getAllCards() {
    return Array.from(document.querySelectorAll('.projectCard'));
}

let bouncers = [];

function startBounce() {
    stopBounce();
    const bounceW = isMobile ? window.innerHeight : window.innerWidth;
    const bounceH = isMobile ? window.innerWidth : window.innerHeight;
    bouncers = getAllCards().map(card => {
        const s = 0.6 + Math.random() * 0.6;
        return {
            el: card,
            x: Math.random() * (bounceW - 320 * s),
            y: Math.random() * (bounceH - 180 * s),
            vx: (0.2 + Math.random() * 0.4) * (Math.random() < 0.5 ? 1 : -1),
            vy: (0.2 + Math.random() * 0.4) * (Math.random() < 0.5 ? 1 : -1),
            scale: s,
            scaleDir: Math.random() < 0.5 ? 1 : -1,
            scaleSpeed: 0.001 + Math.random() * 0.002
        };
    });
    loop();
    bouncers.forEach(b => {
        b.el.style.position = 'absolute';
        b.el.style.left = '0';
        b.el.style.top = '0';
        b.el.style.width = '320px';
        b.el.classList.add('bouncing');
    });
}

function stopBounce() {
    bouncers.forEach(b => {
        b.el.classList.remove('bouncing');
        b.el.style.left = b.x + 'px';
        b.el.style.top = b.y + 'px';
        b.el.style.transform = 'scale(1)';
    });
    bouncers = [];
    noLoop();
}

// Category Filtering – getVisibleCards for Workbook B
function getVisibleCards() {
    const isAActive = btn2A.classList.contains('catBtnActiveGreen');
    const isBActive = btn2B.classList.contains('catBtnActiveGreen');
    return getAllCards().filter(card => {
        if (isAActive && card.classList.contains('dataCat2b')) return false;
        if (isBActive && card.classList.contains('dataCat2a')) return false;
        return true;
    });
}


// Random Layout – Bounce Animation for Workbook B
function randomizeLayout() {
    step = 0;
    removeCategorySections();
    workspace.classList.remove('gridActive');
    startBounce();
    btnResize.className = "controlBtn btnActiveGlow";
    btnGrid.className = "controlBtn btnDisabled";
}

function handleResize() {
    if (step === 1) { randomizeLayout(); return; }
    if (step !== 0) return;
    step = 1;
    bouncers.forEach(b => { b.scale = 1; b.scaleSpeed = 0; });
    btnResize.className = "controlBtn btnMuted";
    btnGrid.className = "controlBtn btnActiveGlow";
}

function handleGrid() {
    if (step === 2) {
        removeCategorySections();
        workspace.classList.remove('gridActive');
        startBounce();
        bouncers.forEach(b => { b.scale = 1; b.scaleSpeed = 0; });
        step = 1;
        btnResize.className = "controlBtn btnMuted";
        btnGrid.className = "controlBtn btnActiveGlow";
        return;
    }
    if (step !== 1) return;
    step = 2;
    stopBounce();
    applyGridLayout();
    btnGrid.className = "controlBtn btnGridDone";
}

function extractSubCategory(cat) {
    const dashIdx = cat.lastIndexOf('–');
    if (dashIdx >= 0) return cat.slice(dashIdx + 1).trim();
    const hyphenIdx = cat.lastIndexOf('-');
    if (hyphenIdx >= 0) return cat.slice(hyphenIdx + 1).trim();
    return cat;
}

function buildCategorySections() {
    const visibleCards = getVisibleCards();
    const groups = new Map();
    const categoryOrder = [];
    visibleCards.forEach(card => {
        const cat = card.dataset.category || 'Other';
        if (!groups.has(cat)) { groups.set(cat, []); categoryOrder.push(cat); }
        groups.get(cat).push(card);
    });
    let currentWorkbook = null;
    categoryOrder.forEach(cat => {
        const wb = cat.startsWith('Workbook A') ? 'A' : cat.startsWith('Workbook B') ? 'B' : null;
        if (wb && wb !== currentWorkbook) {
            currentWorkbook = wb;
            const masterTitle = document.createElement('div');
            masterTitle.className = 'workbookMasterTitle';
            masterTitle.textContent = `Workbook ${wb}`;
            workspace.appendChild(masterTitle);
        }
        const section = document.createElement('div');
        section.className = 'categorySection';
        const title = document.createElement('div');
        title.className = 'categorySectionTitle';
        title.textContent = extractSubCategory(cat);
        section.appendChild(title);
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'categorySectionCards';
        groups.get(cat).forEach(card => cardsContainer.appendChild(card));
        section.appendChild(cardsContainer);
        workspace.appendChild(section);
    });
}

function removeCategorySections() {
    workspace.querySelectorAll('.categorySection').forEach(section => {
        section.querySelectorAll('.projectCard').forEach(card => workspace.appendChild(card));
        section.remove();
    });
    workspace.querySelectorAll('.workbookMasterTitle').forEach(el => el.remove());
    document.getElementById('canvas').classList.remove('gridScroll');
}

// Grid Layout – Category Rows with Scrollable Canvas
function applyGridLayout() {
    removeCategorySections();
    workspace.classList.add('gridActive');
    document.getElementById('canvas').classList.add('gridScroll');
    buildCategorySections();
}


function openModal(card) {
    const galleryEls = Array.from(card.querySelectorAll('.cardGallery img, .cardGallery video'));
    const slides = galleryEls.length > 0
        ? galleryEls.map(el => el.tagName === 'VIDEO'
            ? `<div class="modalImageSlide"><video class="modalImage" src="${el.src}" autoplay loop playsinline ${card.dataset.sound ? '' : 'muted'}></video></div>`
            : `<div class="modalImageSlide"><img class="modalImage" alt="Detail" src="${el.src}"/></div>`)
        : [`<div class="modalImageSlide"><img class="modalImage" alt="Detail" src="${card.dataset.img}"/></div>`];
    modalGallery.innerHTML = slides.join('');
    modalTitle.innerText = card.dataset.title;
    modalCategory.innerText = card.dataset.category ?? `Workbook ${card.classList.contains('dataCat2a') ? 'A' : 'B'}`;
    const descEl = card.querySelector('.cardDescription');
    modalDescription.innerHTML = descEl ? descEl.innerHTML : '';
    modal.classList.add('active');

    requestAnimationFrame(() => {
        const paneHeight = document.querySelector('.modalMediaPane').clientHeight;
        modalGallery.querySelectorAll('.modalImageSlide').forEach(slide => {
            slide.style.height = paneHeight + 'px';
        });
        modalGallery.querySelectorAll('video').forEach(v => v.play().catch(() => {}));
    });
}

// Click to Enlarge – Fullscreen Cleanup on Close for Workbook B
function closeModal() {
    document.querySelector('.modalMediaPane').classList.remove('galleryFullscreen');
    modal.classList.remove('active');
    modalNotesPanel.classList.remove('active');
    isOverImg = false;
    isOverSingleImg = false;

    notesToggleBtn.classList.remove('active');
    setTimeout(() => {
        modalGallery.innerHTML = '';
    }, 300);
}

modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

document.querySelector('.modalContainer').addEventListener('click', (e) => {
    if (!modalNotesPanel.classList.contains('active')) return;
    if (!modalNotesPanel.contains(e.target) && !notesToggleBtn.contains(e.target)) {
        modalNotesPanel.classList.remove('active');
        notesToggleBtn.classList.remove('active');
    }
});

// Scroll Down Cursor – Single Image Exclusion for Workbook B
modalGallery.addEventListener('mouseenter', () => {
    const count = modalGallery.querySelectorAll('.modalImageSlide').length;
    if (count > 1) isOverImg = true;
    else isOverSingleImg = true;
});
modalGallery.addEventListener('mouseleave', () => { isOverImg = false; isOverSingleImg = false; });

// Click to Enlarge – Fullscreen Gallery for Workbook B
const modalMediaPane = document.querySelector('.modalMediaPane');
modalGallery.addEventListener('click', (e) => {
    if (isMobile) return;
    const slide = e.target.closest('.modalImageSlide');
    if (!slide) return;
    const isFullscreen = modalMediaPane.classList.toggle('galleryFullscreen');
    if (isFullscreen) slide.scrollIntoView({ behavior: 'instant' });
});


let draggedElement = null;
let startX = 0;
let startY = 0;
let isDragging = false;
let offset = { x: 0, y: 0 };
const THRESHOLD = 8;

workspace.addEventListener('mousedown', (e) => {
    // Category Filtering – Block Drag on Inactive Cards for Workbook B
    const card = e.target.closest('.projectCard');
    if (!card) return;
    const isAActive = btn2A.classList.contains('catBtnActiveGreen');
    const isBActive = btn2B.classList.contains('catBtnActiveGreen');
    if (isAActive && card.classList.contains('dataCat2b')) return;
    if (isBActive && card.classList.contains('dataCat2a')) return;

    draggedElement = card;
    startX = e.clientX;
    startY = e.clientY;

    const rect = card.getBoundingClientRect();
    offset.x = e.clientX - rect.left;
    offset.y = e.clientY - rect.top;
});

document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;

    if (bouncers.length === 0) redraw();

    if (!draggedElement) return;
    if (bouncers.length > 0) return;

    const dist = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));

    if (!isDragging && dist > THRESHOLD) {
        isDragging = true;
        draggedElement.classList.add('dragging');

        if (step === 2) {
            draggedElement.after(placeholder);
            draggedElement.style.position = 'fixed';
            draggedElement.style.width = `${placeholder.offsetWidth}px`;
            draggedElement.style.height = `${placeholder.offsetHeight}px`;
            draggedElement.style.zIndex = "1000";
        }
    }

    if (isDragging) {
        if (step < 2) {
            const wsRect = workspace.getBoundingClientRect();
            const leftPercent = ((e.clientX - offset.x - wsRect.left) / wsRect.width) * 100;
            const topPercent = ((e.clientY - offset.y - wsRect.top) / wsRect.height) * 100;
            draggedElement.style.left = `${leftPercent}%`;
            draggedElement.style.top = `${topPercent}%`;
        } else {
            draggedElement.style.left = `${e.clientX - offset.x}px`;
            draggedElement.style.top = `${e.clientY - offset.y}px`;

            const visibleCards = getVisibleCards();
            let hoveredCard = null;

            for (let card of visibleCards) {
                if (card === draggedElement) continue;
                const rect = card.getBoundingClientRect();
                if (e.clientX > rect.left && e.clientX < rect.right && e.clientY > rect.top && e.clientY < rect.bottom) {
                    hoveredCard = card;
                    break;
                }
            }

            if (hoveredCard) {
                const rect = hoveredCard.getBoundingClientRect();
                const isAfter = (e.clientX > rect.left + rect.width / 2);
                if (isAfter) {
                    hoveredCard.after(placeholder);
                } else {
                    hoveredCard.before(placeholder);
                }
            }
        }
    }
});

document.addEventListener('mouseup', () => {
    if (!draggedElement) return;

    if (!isDragging) {
        openModal(draggedElement);
    } else {
        if (step === 2) {
            placeholder.replaceWith(draggedElement);
        }
    }

    draggedElement.classList.remove('dragging');
    draggedElement = null;
    isDragging = false;
    if (placeholder.parentNode) placeholder.remove();
});


// Category Filtering – Button Toggle, CSS :has() Does the Rest for Workbook B
function openCategory(event) {
    const btn = event.currentTarget;
    const wasActive = btn.classList.contains('catBtnActiveGreen');
    document.querySelectorAll('.catBtn').forEach(b => {
        b.classList.remove('catBtnActiveGreen');
        b.classList.add('catBtnInactive');
    });
    if (!wasActive) {
        btn.classList.remove('catBtnInactive');
        btn.classList.add('catBtnActiveGreen');
    }
    if (step === 2) applyGridLayout();
}

btn2A.addEventListener('click', openCategory);
btn2B.addEventListener('click', openCategory);


notesToggleBtn.onclick = () => {
    if (modalNotesPanel.classList.contains('active')) {
        modalNotesPanel.classList.remove('active');
        notesToggleBtn.classList.remove('active');
    } else {
        modalNotesPanel.classList.add('active');
        notesToggleBtn.classList.add('active');
    }
};

document.getElementById('modalBackBtn').addEventListener('click', closeModal);
btnResize.addEventListener('click', handleResize);
btnGrid.addEventListener('click', handleGrid);
btnChaos.addEventListener('click', () => {
    if (bouncers.length > 0) {
        stopBounce();
        step = 1;
        btnResize.className = "controlBtn btnMuted";
        btnGrid.className = "controlBtn btnActiveGlow";
    } else {
        randomizeLayout();
    }
});

let isOverImg = false;
let isOverSingleImg = false;
let hoveredCardTitle = '';

function attachScrollbarVisibility(el) {
    let timer;
    el.addEventListener('scroll', () => {
        el.classList.add('is-scrolling');
        clearTimeout(timer);
        timer = setTimeout(() => el.classList.remove('is-scrolling'), 800);
    });
}
attachScrollbarVisibility(modalGallery);
attachScrollbarVisibility(modalDescription);

window.addEventListener('load', () => {
    randomizeLayout();
    attachScrollbarVisibility(document.getElementById('canvas'));

    getAllCards().forEach(card => {
        card.addEventListener('mouseenter', () => { hoveredCardTitle = card.dataset.title ?? ''; });
        card.addEventListener('mouseleave', () => { hoveredCardTitle = ''; });
    });

    document.querySelectorAll('.cardGallery').forEach(img => {
        const imgs = img.querySelectorAll('img');
        if (imgs.length > 1) {
            img.addEventListener('mouseenter', () => { isOverImg = true; });
            img.addEventListener('mouseleave', () => { isOverImg = false; });
        };
    });


});




// p5
let greenColor;
function setup() {
   let canvas = createCanvas(windowWidth, windowHeight);
   canvas.style("position", "fixed");
   canvas.style("top", "0");
   canvas.style("left", "0");
   canvas.style("z-index", "1000");
   canvas.style("pointer-events", "none");
   greenColor = color('#2ff801');
   noLoop();
}

function mouseMoved() {
   if (bouncers.length === 0) redraw();
}

function draw() {
  clear();
  fill(greenColor);
  noStroke();
  circle(cursorX, cursorY, 10);

  if (!modal.classList.contains('active')) {
    const bW = isMobile ? window.innerHeight : width;
    const bH = isMobile ? window.innerWidth : height;
    bouncers.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;

      const cardW = 320 * b.scale;
      const cardH = 180 * b.scale;

      if (b.x < 0)             { b.x = 0;             b.vx =  Math.abs(b.vx); }
      if (b.y < 0)             { b.y = 0;             b.vy =  Math.abs(b.vy); }
      if (b.x + cardW > bW)    { b.x = bW - cardW;    b.vx = -Math.abs(b.vx); }
      if (b.y + cardH > bH)    { b.y = bH - cardH;    b.vy = -Math.abs(b.vy); }

      b.scale += b.scaleDir * b.scaleSpeed;
      if (b.scale > 1.4 || b.scale < 0.4) b.scaleDir *= -1;
      b.scale = Math.max(0.4, Math.min(1.4, b.scale));

      b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) scale(${b.scale})`;
    });
  }

  if (hoveredCardTitle && !modal.classList.contains('active')) {
        showCardTitle();
  }

  if (modal.classList.contains('active')) {
    if (modalMediaPane.classList.contains('galleryFullscreen')) {
      if (isOverImg) {
        scrollDownExit();
      } else {
        clickToExit();
      }
    } else if (isOverImg) {
      scrollDown();
    } else if (isOverSingleImg) {
      clickEnlarge();
    }
  }
}

function showCardTitle() {
    textSize(16);
    const w = textWidth(hoveredCardTitle) + 24;
    rectMode(CENTER);
    fill(30, 30, 30, 230);
    stroke(255, 255, 255, 51);
    strokeWeight(1);
    rect(cursorX - 2, cursorY - 2, w, 40);
    noStroke();
    fill(greenColor);
    textAlign(CENTER, CENTER);
    text(hoveredCardTitle, cursorX, cursorY);
}

function scrollDownExit() {
    textSize(16);
    rectMode(CENTER);
    fill(30, 30, 30, 230);
    stroke(255, 255, 255, 51);
    strokeWeight(1);
    rect(cursorX - 2, cursorY - 2, 340, 40);
    noStroke();
    fill(greenColor);
    textAlign(CENTER, CENTER);
    text('Scroll Down & Click Again to Exit', cursorX, cursorY);
}

function clickToExit() {
    textSize(16);
    rectMode(CENTER);
    fill(30, 30, 30, 230);
    stroke(255, 255, 255, 51);
    strokeWeight(1);
    rect(cursorX - 2, cursorY - 2, 210, 40);
    noStroke();
    fill(greenColor);
    textAlign(CENTER, CENTER);
    text('Click Again to Exit', cursorX, cursorY);
}

function clickEnlarge() {
    textSize(16);
    rectMode(CENTER);
    fill(30, 30, 30, 230);
    stroke(255, 255, 255, 51);
    strokeWeight(1);
    rect(cursorX - 2, cursorY - 2, 180, 40);
    noStroke();
    fill(greenColor);
    textAlign(CENTER, CENTER);
    text('Click to Enlarge', cursorX, cursorY);
}

// Scroll Down Cursor – Label Update for Workbook B
function scrollDown() {
    textSize(16);
    rectMode(CENTER);
    fill(30, 30, 30, 230);
    stroke(255, 255, 255, 51);
    strokeWeight(1);
    rect(cursorX - 2, cursorY - 2, 280, 40);
    noStroke();
    fill(greenColor);
    textAlign(CENTER, CENTER);
    text('Scroll Down & Click to Enlarge', cursorX, cursorY);
}




// Declaration

// I acknowledge the use of Stitch to draft my website's initial layout, and I build beyond that; 12 hours image is made on the purpose of experimentation with Stitch.
// I acknowledge the use of Claude to fetch code from my other project; answer questions when I asked; indentify bug in code; change large amount of code at once (e.g. path of images).
// I prompted the model to ask me clarifying questions about my draft and the flow of my logic. I used the output to refine my central thesis statement and to decide how to order the argument for my essay.
// A full record of prompts and outputs is available upon request.


