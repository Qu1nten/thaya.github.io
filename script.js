// --- MODAL LOGIC (Only runs if modal exists) ---
const modal = document.getElementById('imageModal');

if (modal) {
    const images = document.querySelectorAll('.image-grid img');
    const modalImage = document.getElementById('modalImage');
    const modalAltText = document.getElementById('modalAltText');
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');

    let currentIndex = 0;

    // Variables for Zoom and Pan
    let scale = 1;
    let pointX = 0;
    let pointY = 0;
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    function isMobile() {
        return window.innerWidth <= 768 || window.matchMedia('(hover: none)').matches;
    }

    function setTransform() {
        modalImage.style.transform = `translate(-50%, -50%) translate(${pointX}px, ${pointY}px) scale(${scale})`;
    }

    function resetZoom() {
        scale = 1;
        pointX = 0;
        pointY = 0;
        isDragging = false;
        setTransform();
    }

    function openModal(index) {
        currentIndex = index;
        modalImage.src = images[currentIndex].src;
        modalAltText.textContent = images[currentIndex].alt;
        resetZoom();
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
        resetZoom();
    }

    function nextImage() {
        resetZoom();
        currentIndex = (currentIndex + 1) % images.length;
        modalImage.src = images[currentIndex].src;
        modalAltText.textContent = images[currentIndex].alt;
    }

    function prevImage() {
        resetZoom();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        modalImage.src = images[currentIndex].src;
        modalAltText.textContent = images[currentIndex].alt;
    }

    // Add event listeners for images
    if (!isMobile()) {
        images.forEach((image, index) => {
            image.addEventListener('click', () => openModal(index));
        });

        modalImage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            scale += delta;
            scale = Math.min(Math.max(1, scale), 5);
            setTransform();
        });

         modalImage.addEventListener('mousedown', (e) => {
            e.preventDefault();
            // REMOVED: if (scale > 1) { ... }
            isDragging = true;
            startX = e.clientX - pointX;
            startY = e.clientY - pointY;
            modalImage.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            pointX = e.clientX - startX;
            pointY = e.clientY - startY;
            setTransform();
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            modalImage.style.cursor = 'grab';
        });
    }

    // Navigation arrows (Check if they exist first)
    if (leftArrow) leftArrow.addEventListener('click', prevImage);
    if (rightArrow) rightArrow.addEventListener('click', nextImage);

    // Close modal on outside click
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

// --- LANGUAGE TOGGLE LOGIC ---
const englishBtn = document.getElementById('englishBtn');
const dutchBtn = document.getElementById('dutchBtn');

function changeLanguage(lang) {
    const elements = document.querySelectorAll('[data-english], [data-dutch]');
    elements.forEach(element => {
        if (lang === 'english') {
            element.textContent = element.getAttribute('data-english');
        } else if (lang === 'dutch') {
            element.textContent = element.getAttribute('data-dutch');
        }
    });

    localStorage.setItem('language', lang);
    if (englishBtn) englishBtn.classList.toggle('active', lang === 'english');
    if (dutchBtn) dutchBtn.classList.toggle('active', lang === 'dutch');
}

if (englishBtn && dutchBtn) {
    englishBtn.addEventListener('click', () => changeLanguage('english'));
    dutchBtn.addEventListener('click', () => changeLanguage('dutch'));
}

window.addEventListener('load', () => {
    const savedLanguage = localStorage.getItem('language') || 'english';
    changeLanguage(savedLanguage);
});

// --- NAV NAME ON SCROLL ---
// Fades the name in the nav bar in/out (see .nav-name in styles.css)
window.addEventListener('scroll', () => {
    document.body.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// --- RESTORE HASH SCROLL AFTER IMAGES LOAD ---
// The project images have no fixed dimensions, so at first paint the anchor
// target sits near the top. The browser jumps there before the images load and
// push everything down, leaving the page stranded at the top. Re-scroll once
// everything has settled so reloading a URL like /#contact lands correctly.
window.addEventListener('load', () => {
    if (location.hash) {
        const target = document.querySelector(location.hash);
        if (target) target.scrollIntoView();
    }
});

// --- CONTACT BUTTON FLASH ANIMATION ---
const contactNavLink = document.querySelector('nav a[href*="contact"]');
const contactSection = document.getElementById('contact');
const socialIcons = document.querySelectorAll('.contact-info a');

let isTargetingContact = false;

// 1. The Animation Trigger (Reusable)
function triggerContactWave() {
    socialIcons.forEach((icon, index) => {
        // Reset animation state
        icon.classList.remove('flash-active');
        void icon.offsetWidth; // Trigger Reflow to restart animation

        // Start animation
        icon.classList.add('flash-active');
    });
}

// 2. The Observer (Handles the "Scroll To" case)
if (contactSection && socialIcons.length > 0) {
    const observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        
        // Only trigger if we are scrolling to it via the button
        if (entry.isIntersecting && isTargetingContact) {
            triggerContactWave();
            isTargetingContact = false; // Reset flag so it doesn't loop
        }
    }, { threshold: 0.1 }); // Low threshold so it triggers as soon as it appears

    observer.observe(contactSection);
}

// 3. The Click Listener (Handles both "Scroll To" and "Already There")
if (contactNavLink) {
    contactNavLink.addEventListener('click', () => {
        isTargetingContact = true;

        // Check if the contact section is ALREADY visible
        const rect = contactSection.getBoundingClientRect();
        const isVisible = (
            rect.top < window.innerHeight && 
            rect.bottom >= 0
        );

        if (isVisible) {
            // We are already there, so play immediately!
            triggerContactWave();
            isTargetingContact = false; // Reset flag immediately
        }
        // If not visible, the Observer above will catch it when the scroll finishes.
    });
}




// --- VIDEO AUTOPLAY + PER-VIDEO SOUND TOGGLE ---
// Videos always autoplay muted (the only autoplay browsers allow everywhere).
// Each video gets a speaker button in its top-right corner; clicking it is a
// user gesture, so the browser permits sound and the volume fades up to
// TARGET_VOLUME. Unmuting one video mutes the others, so side-by-side videos
// never play sound over each other.
const soundVideos = document.querySelectorAll('video');

if (soundVideos.length > 0) {
    const TARGET_VOLUME = 0.3;
    const FADE_MS = 800;

    const ICON_SOUND_OFF = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>';
    const ICON_SOUND_ON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';

    // Fade a video's volume to a target; a new fade cancels the previous one.
    function fadeVolume(video, target, onDone) {
        const token = (video._fadeToken = (video._fadeToken || 0) + 1);
        const from = video.volume;
        const start = performance.now();
        function step(now) {
            if (video._fadeToken !== token) return; // superseded
            // rAF timestamps can precede the captured start time; clamp to 0
            // so the volume never leaves [0, 1] (which throws).
            const progress = Math.min(Math.max((now - start) / FADE_MS, 0), 1);
            video.volume = from + (target - from) * progress;
            if (progress < 1) requestAnimationFrame(step);
            else if (onDone) onDone();
        }
        requestAnimationFrame(step);
    }

    function setButtonState(video, button) {
        button.innerHTML = video.muted ? ICON_SOUND_OFF : ICON_SOUND_ON;
        button.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
    }

    function unmute(video) {
        // Silence the other videos first so sounds never overlap.
        soundVideos.forEach(other => {
            if (other !== video) other.muted = true;
        });
        video._fading = true;
        video.volume = 0;
        video.muted = false;
        fadeVolume(video, TARGET_VOLUME, () => { video._fading = false; });
    }

    function mute(video) {
        video._fadeToken = (video._fadeToken || 0) + 1; // cancel a running fade
        video._fading = false;
        video.muted = true;
    }

    soundVideos.forEach(video => {
        video.setAttribute('playsinline', ''); // iOS: play inline, not fullscreen
        video.muted = true;

        // Wrap the video so the button can sit in its top-right corner. The
        // wrapper takes over the video's slot in the layout: it inherits a
        // width attribute (e.g. the 50% used by older pages) if present,
        // otherwise it simply fills the container like .video does.
        const wrap = document.createElement('div');
        wrap.className = 'video-sound-wrap';
        const widthAttr = video.getAttribute('width');
        if (widthAttr) {
            wrap.style.width = widthAttr.includes('%') ? widthAttr : widthAttr + 'px';
            video.style.width = '100%';
        }
        video.parentNode.insertBefore(wrap, video);
        wrap.appendChild(video);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'video-sound-btn';
        setButtonState(video, button);
        button.addEventListener('click', () => {
            if (video.muted) unmute(video); else mute(video);
        });
        wrap.appendChild(button);

        // Clicking the video toggles sound instead of pausing it. A
        // transparent overlay catches the clicks so the browser's native
        // click-to-pause never fires; the strip over the control bar stays
        // uncovered so the controls keep working.
        const clickCatcher = document.createElement('div');
        clickCatcher.className = 'video-click-catcher';
        clickCatcher.addEventListener('click', () => {
            if (video.muted) unmute(video); else mute(video);
        });
        clickCatcher.addEventListener('dblclick', () => {
            // Keep double-click-to-fullscreen working (it unmutes below).
            if (video.requestFullscreen) video.requestFullscreen().catch(() => {});
            else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
        });
        wrap.appendChild(clickCatcher);

        // iPhones use their own fullscreen event for videos.
        video.addEventListener('webkitbeginfullscreen', () => {
            if (video.muted) unmute(video);
        });

        // If the play attempt raced ahead of the download, start the video
        // once its data arrives.
        video.addEventListener('loadeddata', () => ensurePlaying(video));

        // Keep the button in sync when sound is toggled via the native
        // controls too (muting others on unmute included).
        video.addEventListener('volumechange', () => {
            setButtonState(video, button);
            if (!video.muted && !video._fading) {
                soundVideos.forEach(other => {
                    if (other !== video) other.muted = true;
                });
                // Native unmute can restore a 0 volume — make it audible.
                if (video.volume === 0) video.volume = TARGET_VOLUME;
            }
        });
    });

    // Going fullscreen should always come with sound.
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(evt => {
        document.addEventListener(evt, () => {
            const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
            if (fsEl && fsEl.tagName === 'VIDEO' && fsEl.muted) unmute(fsEl);
        });
    });

    // Keep videos playing: start muted playback, and if even that is blocked
    // (rare), retry on the visitor's first interaction.
    function ensurePlaying(video) {
        if (!video.paused) return;
        const attempt = video.play();
        if (attempt) attempt.catch(() => {});
    }

    function playAll() {
        soundVideos.forEach(ensurePlaying);
    }

    const retryEvents = ['pointerdown', 'keydown', 'touchend'];
    const retryOnce = () => {
        retryEvents.forEach(evt => document.removeEventListener(evt, retryOnce));
        playAll();
    };
    retryEvents.forEach(evt => document.addEventListener(evt, retryOnce));

    playAll();

    // Returning via the back/forward cache can leave videos paused.
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) playAll();
    });
}


// Add Keyboard Navigation
window.addEventListener('keydown', (e) => {
    // Only trigger if the modal is currently visible
    if (modal.style.display === 'block') {
        if (e.key === 'ArrowRight') {
            nextImage();
        } else if (e.key === 'ArrowLeft') {
            prevImage();
        } else if (e.key === 'Escape') {
            closeModal();
        }
    }
});

// --- PROJECT HIGHLIGHT (index page) ---
// Large image above the cards that crossfades through the projects every
// ~2 seconds; clicking it opens the project currently shown.
const highlightEl = document.getElementById('projectHighlight');
if (highlightEl) {
    const highlightProjects = [
        { img: 'images/thee/t1.avif', title: 'ZULLEN WE EVEN THEE DRINKEN?', url: '/thee' },
        { img: 'images/placeholders/p2.avif', title: 'PYRAMID PARK',                 url: '/pyramidpark' },
        { img: 'images/fenix/f1.avif', title: 'ISE FENIX PROJECT',                    url: '/fenix' },
        { img: 'images/placeholders/p4.avif', title: 'HET NIETJE',                   url: '/nietje' },
        { img: 'images/arcadia/a1.avif', title: 'ARCADIA',                      url: '/arcadia' },
        { img: 'images/placeholders/p6.avif', title: 'LANDMARKS WESTERPARK',         url: '/westerpark' },
        { img: 'images/placeholders/p7.avif', title: 'GREEN STREAMS',                url: '/greenstreams' },
        { img: 'images/pachamama/p7.avif', title: 'PACHAMAMA',                    url: '/pachamama' }
    ];

    const imgA = document.getElementById('highlightImgA');
    const imgB = document.getElementById('highlightImgB');
    const highlightText = document.getElementById('highlightText');

    let currentProject = Math.floor(Math.random() * highlightProjects.length);
    let frontImg = imgA;   // The image currently visible
    let backImg = imgB;    // The hidden buffer that receives the next image

    frontImg.src = highlightProjects[currentProject].img;
    highlightText.textContent = highlightProjects[currentProject].title;

    highlightEl.addEventListener('click', () => {
        window.location.href = highlightProjects[currentProject].url;
    });

    setInterval(() => {
        // Pick a random project different from the one on screen
        let next;
        do {
            next = Math.floor(Math.random() * highlightProjects.length);
        } while (next === currentProject);

        // Load the next image into the hidden buffer, then crossfade
        backImg.src = highlightProjects[next].img;
        backImg.classList.add('active');
        frontImg.classList.remove('active');

        currentProject = next;
        highlightText.textContent = highlightProjects[next].title;

        // Swap roles for the next cycle
        [frontImg, backImg] = [backImg, frontImg];
    }, 3000);
}
