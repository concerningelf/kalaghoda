// Top Tier: Haptic Feedback Helper
function triggerHaptic() {
    if (navigator.vibrate) {
        navigator.vibrate(15); // Light tap
    }
}

// Global Close Time Widget Function (Accessible via HTML onclick)
window.closeTimeWidget = function () {
    var timeWidget = document.getElementById('time-widget');
    if (timeWidget) timeWidget.classList.remove('active');

    var timeBtn = document.getElementById('time-travel-btn');
    if (timeBtn) timeBtn.classList.remove('active-control');

    // Hide backdrop on mobile
    var backdrop = document.getElementById('time-widget-backdrop');
    if (backdrop) backdrop.classList.remove('active');

    // Sync Nav: If we aren't in Layers mode, go back to Explore
    const consolePanel = document.getElementById('console');
    if (!consolePanel || !consolePanel.classList.contains('open')) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const explore = document.getElementById('nav-explore');
        if (explore) explore.classList.add('active');
    }
};

window.addEventListener('load', function () {
    initMap();
    initMobileGestures();
    initBottomNav();
    initTutorial();

    // Time widget backdrop - tap to close
    var backdrop = document.getElementById('time-widget-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', function () {
            window.closeTimeWidget();
            triggerHaptic();
        });
    }
});

// Tutorial/Onboarding Logic
function initTutorial() {
    var overlay = document.getElementById('tutorial-overlay');
    var dismissBtn = document.getElementById('tutorial-dismiss');

    if (!overlay) return;

    // Always hide tutorial initially - it will be shown after loading screen completes
    overlay.classList.remove('visible');
    overlay.style.display = 'none';

    // Dismiss button handler
    if (dismissBtn) {
        dismissBtn.addEventListener('click', function () {
            triggerHaptic();
            overlay.classList.remove('visible');
            // Remember that user has seen the tutorial
            localStorage.setItem('kgmap-tutorial-seen', 'true');
            // Fully hide after animation completes
            setTimeout(function () {
                overlay.style.display = 'none';
            }, 500);
        });
    }

    // Also dismiss on overlay background click
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            dismissBtn.click();
        }
    });
}

// Show tutorial after loading screen completes (only on mobile and only if not seen before)
function showTutorial() {
    var overlay = document.getElementById('tutorial-overlay');
    if (!overlay) return;

    // Only show on mobile
    if (window.innerWidth > 768) return;

    // Check if user has seen the tutorial before
    var hasSeenTutorial = localStorage.getItem('kgmap-tutorial-seen');
    if (hasSeenTutorial) return;

    // Show tutorial with a smooth fade-in
    setTimeout(function () {
        overlay.style.display = 'flex';
        // Allow display to apply before adding visible class for animation
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                overlay.classList.add('visible');
            });
        });
    }, 400);
}

// Bottom Nav Logic
function initBottomNav() {
    const navItems = document.querySelectorAll('.nav-item');
    const exploreBtn = document.getElementById('nav-explore');
    const layersBtn = document.getElementById('nav-layers');
    const timeBtn = document.getElementById('nav-time');
    const aboutBtn = document.getElementById('nav-about');

    function setActive(btn) {
        navItems.forEach(item => item.classList.remove('active'));
        if (btn) btn.classList.add('active');
        triggerHaptic();
    }

    exploreBtn.addEventListener('click', function () {
        setActive(this);
        closeTimeWidget();
        closePanel(false);
    });

    // Layers button now scrolls the chip bar into view and gives visual feedback
    layersBtn.addEventListener('click', function () {
        const chipBar = document.getElementById('chip-filter-bar');
        if (chipBar) {
            // Scroll chip bar into view smoothly
            chipBar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            // Flash effect to draw attention
            chipBar.style.transition = 'background 0.3s';
            chipBar.style.background = 'rgba(41, 128, 185, 0.1)';
            setTimeout(() => {
                chipBar.style.background = '';
            }, 500);
        }
        triggerHaptic();
        showToast('Tap chips to filter • Long-press for solo mode');
    });

    timeBtn.addEventListener('click', function () {
        const timeWidget = document.getElementById('time-widget');
        const isActive = timeWidget.classList.contains('active');

        if (isActive) {
            closeTimeWidget();
            setActive(exploreBtn);
        } else {
            setActive(this);
            timeWidget.classList.add('active');
            document.getElementById('time-travel-btn').classList.add('active-control');
            // Show backdrop
            var backdrop = document.getElementById('time-widget-backdrop');
            if (backdrop) backdrop.classList.add('active');
            if (window.closePanel) window.closePanel(false);
        }
    });

    aboutBtn.addEventListener('click', function () {
        window.location.href = 'about.html';
    });

    // Simplified close function (no more bottom sheet console on mobile)
    window.closeMobileConsole = function (resetNav = true) {
        var consolePanel = document.getElementById('console');
        if (consolePanel) consolePanel.classList.remove('open');

        if (resetNav) {
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.getElementById('nav-explore').classList.add('active');
        }
    };
}



// Show Toast
function showToast(message, duration = 3000, isHtml = false, className = '') {
    var toast = document.getElementById('toast');
    var msg = document.getElementById('toast-msg');
    toast.className = '';
    if (isHtml) msg.innerHTML = message;
    else msg.innerText = message;
    if (className) toast.classList.add(className);
    toast.classList.add('show');
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(function () { toast.classList.remove('show'); }, duration);
}

// Copy to Clipboard Helper (Fallback for Share)
function copyToClipboard(record, shareUrl) {
    var shareText = `${record.title}\n${record.description}\n${shareUrl || window.location.href}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('Link copied to clipboard');
        }).catch(() => {
            showToast('Unable to copy link');
        });
    } else {
        // Older fallback
        var textArea = document.createElement('textarea');
        textArea.value = shareText;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Link copied to clipboard');
        } catch (err) {
            showToast('Unable to copy link');
        }
        document.body.removeChild(textArea);
    }
}


// Mobile Gestures
function initMobileGestures() {
    // 1. Setup Side Panel
    const sidePanel = document.getElementById('side-panel');
    const sidePanelScroll = document.getElementById('panel-scroll-area');
    const sidePanelHandle = document.getElementById('panel-handle');
    attachDragGesture(sidePanel, sidePanelScroll, sidePanelHandle, function () {
        closePanel(false);
    });

    // 2. Setup Console Panel
    const consolePanel = document.getElementById('console');
    const consoleScroll = document.getElementById('console'); // Console itself is the scroll area
    const consoleHandle = document.getElementById('console-handle');
    attachDragGesture(consolePanel, consoleScroll, consoleHandle, function () {
        if (window.closeMobileConsole) window.closeMobileConsole();
    });
}

function attachDragGesture(panel, scrollArea, handle, closeCallback) {
    if (!panel) return;

    let startY = 0;
    let isDragging = false;

    panel.addEventListener('touchstart', function (e) {
        const touchTarget = e.target;
        // Don't drag if touching a close button
        if (touchTarget.closest('.mobile-close-btn')) return;

        // STRICT HANDLE ONLY: Prevents conflict with scrolling content
        const isHandle = (handle && (handle.contains(touchTarget) || touchTarget === handle));

        if (isHandle) {
            startY = e.touches[0].clientY;
            isDragging = true;
            // Prevent scrolling when dragging the handle
            if (e.cancelable) e.preventDefault();
        } else {
            isDragging = false;
        }
    }, { passive: false });

    panel.addEventListener('touchmove', function (e) {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault(); // Always prevent default while strictly dragging handle

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        // Only allow dragging DOWN
        if (diff > 0) {
            panel.style.transform = `translateY(${diff}px)`;
            panel.style.transition = 'none';
        }
    }, { passive: false });

    panel.addEventListener('touchend', function (e) {
        if (!isDragging) return;
        isDragging = false;
        const endY = e.changedTouches[0].clientY;
        const diff = endY - startY;

        panel.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.25, 1)';
        panel.style.transform = '';

        // Threshold to close
        if (diff > 100) {
            closeCallback();
        } else {
            // Reset position if not dragged far enough
            if (panel.classList.contains('open')) {
                panel.style.transform = '';
            }
        }
    }, { passive: true });
}

function initMap() {
    var initialZoom = 16.5;
    var startCenter = [72.8322, 18.9270];

    var config = {
        style: 'https://api.maptiler.com/maps/019b6fe6-78c4-7dcb-b6eb-fed1b18171df/style.json?key=f0f0aibL2C05fTzSrqHq',
        colors: {
            'Art Deco': '#2a9d8f', 'Victorian': '#e76f51', 'Modern': '#00cec9',
            'Indo-Saracenic': '#b33939', 'Neoclassical': '#8e44ad', 'Public Space': '#27ae60',
            'Lettering': '#e84393', 'Ghost Site': '#95a5a6', 'Street Furniture': '#57606f',
            'Living Heritage': '#f39c12', 'Street Sign': '#3742fa', 'Vernacular': '#d35400', 'Urban Texture': '#8d6e63'
        },
        icons: {
            'Art Deco': 'fa-building', 'Victorian': 'fa-landmark', 'Modern': 'fa-square',
            'Indo-Saracenic': 'fa-gopuram', 'Neoclassical': 'fa-columns', 'Public Space': 'fa-tree',
            'Lettering': 'fa-font', 'Ghost Site': 'fa-ghost', 'Street Furniture': 'fa-road',
            'Living Heritage': 'fa-users', 'Street Sign': 'fa-sign-hanging', 'Vernacular': 'fa-home', 'Urban Texture': 'fa-cubes'
        },
        chapters: [
            // --- SP MUKHERJEE CHOWK (REGAL CIRCLE) ---
            // 1. Wellington Fountain
            { id: 'wellington', category: 'Neoclassical', title: 'Wellington Fountain', image: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Wellington_fountain_with_the_MH_Police_HQ_in_background%2C_Mumbai.jpg', description: 'Built to commemorate the Duke of Wellington’s visits to Bombay. It is the only fountain in the city built in the Neoclassical style.', year: '1865', architect: 'Gen. Barr / Sir George Gilbert Scott', builder: 'Public Subscription', location: { center: [18.925439, 72.832344] } },
            // INS Vikrant Memorial (User Submission)
            { id: 'ins-vikrant', category: 'Street Furniture', title: 'INS Vikrant Memorial', image: './images/ins-vikrant.jpg', description: 'A detailed scale model of India\'s first aircraft carrier, INS Vikrant (R11), installed at Regal Circle as a tribute to the Indian Navy.', year: '2022', architect: 'Indian Navy', builder: 'Public Installation', location: { center: [18.925800, 72.832673] } },
            // V.B. Gandhi Marg Sign (User Submission)
            { id: 'vbgandhi-sign', category: 'Street Sign', title: 'V.B. Gandhi Marg Sign', image: './images/vb-gandhi-marg.jpg', description: 'A classic blue enamel hanging street sign marking the entrance to V.B. Gandhi Marg (formerly Forbes Street).', year: '1990', architect: 'BMC', builder: 'Municipal Corp', location: { center: [18.92825, 72.831972] } },
            // Forbes Street Sign (User Submission)
            { id: 'forbes-sign', category: 'Street Sign', title: 'Forbes Street Sign', image: './images/forbes-street.jpg', description: 'A rare bilingual street sign bearing the colonial name "Forbes Street" (now V.B. Gandhi Marg).', year: 'Unknown', architect: 'BMC', builder: 'Municipal Corp', location: { center: [18.92825, 72.832056] } },
            // 21. Regal Cinema (FIXED: Moved South to Circle)
            { id: 'regal', category: 'Art Deco', title: 'Regal Cinema', image: './images/regal.jpg', description: 'One of the earliest Art Deco cinemas in India.', year: '1933', architect: 'Charles Stevens', builder: 'Framji Sidhwa', location: { center: [18.92455, 72.83245] } }, // Moved down
            // 20. Police Headquarters (FIXED: Across the street)
            { id: 'police-hq', category: 'Victorian', title: 'Police Headquarters', image: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Maharashtra_Police_Headquarters.jpg', description: 'Formerly the Royal Alfred Sailors’ Home. A masterpiece of Gothic architecture.', year: '1876', architect: 'F.W. Stevens', builder: 'Govt. of Bombay', location: { center: [18.92524244911638, 72.83334037487425] } },
            // 22. Majestic (FIXED: North of Regal)
            { id: 'majestic', category: 'Indo-Saracenic', title: 'Majestic Aamdar Niwas', image: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Majestic_MLA_Hostel_Mumbai_by_Dr._Raju_Kasambe_DSCN0428_(28).jpg', description: 'Formerly the Majestic Hotel. An Indo-Saracenic gem now used as a hostel for legislators.', year: '1909', architect: 'W.A. Chambers', builder: 'Private', location: { center: [18.9246768777787, 72.8318474719337] } },
            // 23. Indian Mercantile (Waterloo) (FIXED: Distinct from Majestic)
            { id: 'mercantile', category: 'Indo-Saracenic', title: 'Indian Mercantile Mansion', image: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Indian_Mercantile_Mansion%2C_Colaba%2C_Mumbai_as_seen_from_Madame_Cama_Road.jpg', description: 'Also known as Waterloo Mansions. A grand residential building with Gothic arches.', year: '1900', architect: 'Unknown', builder: 'Private', location: { center: [18.924916574206417, 72.83188959451451] } }, // Moved slightly west

            // --- MUSEUM PRECINCT ---
            // 3. Institute of Science
            { id: 'science', category: 'Indo-Saracenic', title: 'Institute of Science', image: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Entrance_of_the_Institute_of_Science%2C_Fort%2C_Mumbai.jpg', description: 'A majestic Indo-Saracenic building built using yellow Kharodi basalt.', year: '1920', architect: 'George Wittet', builder: 'Govt. of Bombay', location: { center: [18.926175121968605, 72.83025908124948] } },
            // 2. NGMA (Offset slightly East from Institute)
            { id: 'ngma', category: 'Indo-Saracenic', title: 'NGMA (Cowasji Jehangir Hall)', image: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Sir_Cowasji_Jehangir_Hall_Front.jpg', description: 'Originally the Cowasji Jehangir Public Hall, now the National Gallery of Modern Art.', year: '1911', architect: 'George Wittet', builder: 'Sir Cowasji Jehangir', location: { center: [18.925786832066194, 72.83156173339212] } },
            // 4. CSMVS Museum (Centered in grounds to avoid overlap)
            { id: 'museum', category: 'Indo-Saracenic', title: 'CSMVS Museum', image: './images/csmvs.jpg', description: 'Indo Saracenic landmark constructed using grey Kurla basalt. Formerly the Prince of Wales Museum.', year: '1914', architect: 'George Wittet', builder: 'Govt. of Bombay', location: { center: [18.92666, 72.83222] } },
            // Buddha Sculpture (User Submission)
            { id: 'buddha-sculpture', category: 'Street Furniture', title: 'The Buddhas Within', image: './images/buddha-head.jpg', description: 'A monumental copper sculpture by Satish Gupta. The serene head reveals a hollow cave-like interior housing a sleeping Buddha and 1,500 miniature figures.', year: '2016', architect: 'Satish Gupta', builder: 'CSMVS/Private', location: { center: [18.926611, 72.831722] } },
            // 16. K.R. Cama Oriental Institute (User Submission)
            { id: 'cama', categories: ['Indo-Saracenic', 'Lettering'], title: 'K.R. Cama Oriental Institute', images: ['https://upload.wikimedia.org/wikipedia/commons/b/b8/The_K.R._Cama_Oriental_Institute_in_Fort%2C_Mumbai.jpg', './images/camal.jpg'], description: 'A premier institute for Indology and Persian studies, inaugurated in 1916. The building features elegant Indo-Saracenic arches and a distinctive stone-carved nameplate above the entrance.', year: '1916', architect: 'Unknown', builder: 'Sukhadwala Family', location: { center: [18.927298, 72.833709] } },
            // 19. Lion's Gate
            { id: 'lions-gate', category: 'Victorian', title: 'Lion’s Gate', image: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Naval_Dockyard_Mumbai.jpg', description: 'The main entrance to the Naval Dockyard, guarded by two stone lions.', year: '1890', architect: 'Royal Navy', builder: 'Bombay Dockyard', location: { center: [18.926268371527307, 72.83421608761844] } },
            // Naval Dockyard Weather Vane (User Submission)
            { id: 'dockyard-vane', category: 'Urban Texture', title: 'Naval Weather Vane', image: './images/dockyard-weather-vane.png', description: 'A classic rooster weather vane perched atop a red-domed cupola within the Naval Dockyard complex, a functional and decorative maritime detail.', year: 'Unknown', architect: 'Royal Navy', builder: 'Bombay Dockyard', location: { center: [18.927833, 72.833861] } },
            // INS Vikrant Sculpture (User Submission)
            { id: 'vikrant-sculpture', category: 'Street Furniture', title: 'INS Vikrant Sculpture', image: './images/naval-artifact.jpg', description: 'A modern sculpture created from the metal scraps of the dismantled INS Vikrant (1961), serving as a memorial to India’s first aircraft carrier.', year: '2016', architect: 'Arzan Khambatta', builder: 'Indian Navy', location: { center: [18.92666, 72.83355] } },
            // 28. BNHS (Nudged South of Lion Gate)
            { id: 'bnhs', category: 'Lettering', title: 'BNHS (Hornbill House)', image: 'https://upload.wikimedia.org/wikipedia/commons/7/73/BNHS_Office_by_Raju_KasambeDSCN7078_(7)_05.jpg', description: 'Headquarters of the Bombay Natural History Society.', year: '1965', architect: 'Unknown', builder: 'BNHS', location: { center: [18.92623514458551, 72.8332718521053] } },
            // 18. St Andrews (Distinct location)
            { id: 'standrews', category: 'Neoclassical', title: 'St. Andrew’s Cathedral', image: 'https://upload.wikimedia.org/wikipedia/commons/8/81/A_heritage_structure_of_early_19th_century.jpg', description: 'A Scottish Presbyterian church with a classic steeple.', year: '1819', architect: 'Thomas Dadford', builder: 'Scottish Community', location: { center: [18.92693820553702, 72.83370123061556] } },

            // --- KALA GHODA CRESCENT (The dense area) ---
            // 6. Elphinstone College
            { id: 'elphinstone', category: 'Victorian', title: 'Elphinstone College', image: './images/elphinstone.jpg', description: 'Victorian Gothic Revival building with pointed arches.', year: '1871', architect: 'James Trubshawe', builder: 'Sir Cowasji Jehangir', location: { center: [18.92497448499293, 72.83083411935105] } },
            // 10. Rhythm House (Nudged West/Left side of street)
            { id: 'rhythm', categories: ['Ghost Site', 'Lettering'], title: 'Rhythm House', images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Rhythm_House_(14427838921).jpg/1024px-Rhythm_House_(14427838921).jpg', './images/rhythm-house-lettering.jpg'], description: 'Formerly the city\'s premier music store. The iconic Art Deco typography was synonymous with Mumbai\'s music culture for decades.', year: '1940s', architect: 'Unknown', builder: 'Mehmood Curmally', location: { center: [18.928066, 72.832123] } },
            // 12. Jehangir Art Gallery (Nudged East/Right side of street)
            { id: 'jehangir', category: 'Modern', title: 'Jehangir Art Gallery', image: './images/jehangir.jpg', description: 'Modernist concrete structure with a distinctive cantilevered entrance.', year: '1952', architect: 'G. M. Bhuta', builder: 'Sir Cowasji Jehangir', location: { center: [18.92745, 72.83185] } },
            // 17. Ador House (Nudged North of Rhythm House)
            { id: 'ador', categories: ['Art Deco', 'Lettering'], title: 'Ador House', images: ['./images/ador-house-building.jpg', './images/ador-house-lettering.jpg'], description: 'A mid-20th century structure blending commercial utility with Art Deco, featuring a stone facade and bracketed wooden eaves. The "ADOR HOUSE" lettering is rendered in clean, sans-serif metal relief above the entrance arcade.', year: '1940', architect: 'Unknown', builder: 'JB Advani Group', location: { center: [18.927000, 72.833167] } },
            // 29. Max Mueller (Nudged East of Ador)
            { id: 'mmb', category: 'Modern', title: 'Max Mueller Bhavan', image: './images/placeholder.jpg', description: 'The Goethe-Institut hub for Indo-German cultural exchange.', year: '1970', architect: 'N/A', builder: 'Goethe Institut', location: { center: [18.92725, 72.83250] } },
            // 32. Pavement Gallery (Specific spot on pavement)
            { id: 'pavement', category: 'Living Heritage', title: 'The Pavement Gallery', image: './images/pavement-gallery.jpg', description: 'An informal exhibition space where aspiring artists display their work.', year: '2025', architect: 'The People', builder: 'Informal Usage', location: { center: [18.927028, 72.831500] } },

            // --- KUBER DUBASH MARG / RAMPART ROW ---
            // 7. David Sassoon (West End)
            { id: 'sassoon', category: 'Victorian', title: 'David Sassoon Library', image: './images/sassoon.jpg', description: 'Victorian Gothic architecture defined by pointed arches and a tranquil garden.', year: '1870', architect: 'Campbell & Gosling', builder: 'Scott McClelland', location: { center: [18.92772, 72.83116] } },
            // 13. Bhogilal (Corner building)
            { id: 'bhogilal', category: 'Victorian', title: 'Bhogilal Hargovindas', image: './images/bhogilal-lettering.jpg', description: 'A heritage commercial building on K. Dubash Marg featuring colonial stonework, clear signage, and an ornate wrought iron entrance grille with the monogram "FSP".', year: '1890', architect: 'Unknown', builder: 'Merchant Family', location: { center: [18.92760, 72.83190] } },
            // 31. KG Statue (Center of Parking Lot)
            { id: 'statue', category: 'Street Furniture', title: 'Kala Ghoda Statue', image: './images/placeholder.jpg', description: 'Bronze statue installed to mark the historic site.', year: '2017', architect: 'Commissioned artwork', builder: 'Kala Ghoda Association', location: { center: [18.92780, 72.83180] } },
            // Rope Walk Lane Paving (User Submission)
            // Rope Walk Lane Paving (User Submission)
            { id: 'ropewalk-paving', category: 'Urban Texture', title: 'Rope Walk Lane Paving', image: './images/ropewalk-paving.jpg', description: 'New basalt stone paving installed in 2025, transforming Rope Walk Lane into a dedicated pedestrian path on weekends.', year: '2025', architect: 'Unknown', builder: 'BMC', location: { center: [18.928583, 72.832306] } },
            // Heritage Stone Paving (User Submission)
            { id: 'heritage-paving', category: 'Urban Texture', title: 'Historic Basalt Paving', image: './images/stone-paving.jpg', description: 'Remnants of the original heavy rectangular basalt stone paving that once lined many of the Fort precinct\'s streets, providing a durable surface for carriages and trams.', year: 'Unknown', architect: 'City Engineers', builder: 'Public Works', location: { center: [18.928806, 72.832333] } },
            // 11. Synagogue (Further East)
            { id: 'synagogue', categories: ['Victorian', 'Lettering'], title: 'Keneseth Eliyahoo', images: ['./images/synagogue.jpg', './images/synagogue-lettering.jpg'], description: 'Victorian era synagogue with a distinctive blue facade. The Hebrew inscription above the entrance reads: "This is the gate of the Lord; the righteous shall enter through it" (Psalm 118:20).', year: '1884', architect: 'Gostling & Morris', builder: 'Jacob Elias Sassoon', location: { center: [18.92811, 72.83257] } },
            // Numbered Signage (User Submission)
            { id: 'numbered-sign', category: 'Lettering', title: '52-54-56 Signage', image: './images/numbered-sign.jpg', description: 'A distinctive metal building number sign "52-54-56" mounted against a backdrop of contemporary street art featuring a stylized bird.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.928222, 72.832556] } },
            // Homji Street Sign (User Submission)
            { id: 'homji-street', category: 'Street Sign', title: 'Homji Street Sign', image: './images/homji-street-sign.jpg', description: 'Weathered bilingual street sign in English and Hindi, mounted on stone steps. A classic example of Mumbai\'s historic street signage.', year: 'Unknown', architect: 'BMC', builder: 'BMC', location: { center: [18.932722, 72.835056] } },
            // R.K. Laxman Sculpture (User Submission)
            { id: 'rk-laxman', category: 'Street Furniture', title: 'R.K. Laxman\'s Common Man Sculpture', image: './images/rk-laxman-sculpture.jpg', description: 'Bronze sculpture depicting cartoonist R.K. Laxman\'s iconic "Common Man" character facing a bull, installed as a tribute to the legendary artist and his satirical commentary on Indian society.', year: '2014', architect: 'Ram V. Sutar', builder: 'Kala Ghoda Association', location: { center: [18.931778, 72.834194] } },
            // 14. Oricon (North side of street)
            { id: 'oricon', category: 'Modern', title: 'Oricon House', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Mumbai_Skyline_at_Night.jpg/800px-Mumbai_Skyline_at_Night.jpg', description: 'A mid-century modern commercial high-rise.', year: '1960', architect: 'Unknown', builder: 'Oricon Enterprises', location: { center: [18.92790, 72.83220] } },

            // --- UNIVERSITY & OVAL ---
            // 5. City Civil Court (South end of Oval strip)
            { id: 'civil-court', category: 'Victorian', title: 'Old Secretariat (City Court)', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Mumbai_City_Civil_and_Sessions_Court_as_seen_from_Oval_Maidan.jpg/1280px-Mumbai_City_Civil_and_Sessions_Court_as_seen_from_Oval_Maidan.jpg', description: 'One of the earliest Venetian Gothic buildings in the city.', year: '1874', architect: 'Col. H. St. Clair Wilkins', builder: 'Public Works Dept', location: { center: [18.92750, 72.83020] } },
            // 25. University (Nudged North to Library/Convocation Hall)
            { id: 'university', category: 'Victorian', title: 'University of Mumbai', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/University_of_Mumbai_Fort_Campus.jpg/800px-University_of_Mumbai_Fort_Campus.jpg', description: 'The Fort campus features Venetian Gothic architecture including the Convocation Hall.', year: '1874', architect: 'Sir Gilbert Scott', builder: 'Cowasji Jehangir', location: { center: [18.92840, 72.83050] } },
            // University Library Facade (User Submission)
            { id: 'university-facade', category: 'Victorian', title: 'University Library Turret', image: './images/university-turret.jpg', description: 'A close-up view of the Venetian Gothic stonework on the University Library. Designed by Sir George Gilbert Scott, the structure uses local Kurla basalt and Malad stone.', year: '1878', architect: 'Sir Gilbert Scott', builder: 'Premchand Roychand', location: { center: [18.928833, 72.831194] } },
            // Jehangir Building (User Submission)
            { id: 'jehangir-building', categories: ['Victorian', 'Lettering'], title: 'Jehangir Building', images: ['./images/jehangir-building.jpg', './images/jehangir-lettering.jpg'], description: 'A handsome stone facade building on Mahatma Gandhi Road featuring arched windows and decorative iron balconies. The name "JEHANGIR BUILDING" is rendered in bold relief lettering across the facade.', year: '1890', architect: 'Unknown', builder: 'Private', location: { center: [18.928833, 72.831250] } },
            // 26. Rajabai Tower (Nudged South to the actual Tower base)
            { id: 'rajabai', category: 'Victorian', title: 'Rajabai Clock Tower', image: './images/rajabai.jpg', description: 'Modeled on Big Ben, this 85m tower dominates the skyline.', year: '1878', architect: 'Sir Gilbert Scott', builder: 'Premchand Roychand', location: { center: [18.92880, 72.83020] } },
            // New India Assurance Building (User Submission)
            { id: 'new-india', category: 'Art Deco', title: 'New India Assurance Building', image: './images/new-india-assurance.jpg', description: 'A monumental Art Deco structure designed by Master, Sathe & Bhuta. The facade features colossal relief sculptures by N.G. Pansare representing "Protection" and "Prosperity".', year: '1937', architect: 'Master, Sathe & Bhuta', builder: 'Sir Dorabji Tata', location: { center: [18.930111, 72.831167] } },
            // 24. Oval Maidan (Far West)
            { id: 'oval', category: 'Public Space', title: 'Oval Maidan', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Oval_Maidan%2C_Mumbai.jpg/1024px-Oval_Maidan%2C_Mumbai.jpg', description: 'A Grade I heritage open precinct.', year: '1860', architect: 'N/A', builder: 'City Planner', location: { center: [18.92800, 72.82950] } },

            // --- MG ROAD NORTH / FLORA FOUNTAIN ---
            // 8. Army and Navy (West side)
            { id: 'army', categories: ['Victorian', 'Lettering'], title: 'Army and Navy Building', images: ['./images/army-navy.jpg', './images/army-lettering.jpg'], description: 'Late nineteenth century Neo-Classical/Victorian commercial building. The iconic "ARMY & NAVY BUILDING" serif lettering is rendered in silver against the dark stone facade.', year: '1890', architect: 'Frederick William Stevens', builder: 'British Military', location: { center: [18.92820, 72.83130] } },
            // 9. Esplanade (Opposite Army Navy)
            { id: 'esplanade', category: 'Victorian', title: 'Esplanade Mansion', image: './images/esplanade.jpg', description: 'Formerly Watson\'s Hotel. Cast iron framed building.', year: '1865', architect: 'Rowland Mason Ordish', builder: 'British Engineers', location: { center: [18.92830, 72.83160] } },
            // Lumiere Screening (Ghost Site - Next to Esplanade)
            { id: 'lumiere', category: 'Ghost Site', title: 'Lumière Film Screening', image: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Watson%27s_Hotel_1880s.jpg', description: 'On July 7, 1896, the Lumière Brothers showcased the first-ever motion pictures in India here at the former Watson’s Hotel.', year: '1896', architect: 'N/A', builder: 'Marius Sestier', location: { center: [18.92835, 72.83165] } },
            // Sassoon Building (User Submission)
            { id: 'sassoon-bldg', category: 'Lettering', title: 'Sassoon Building No. 3', image: './images/sassoon-bldg.jpg', description: 'Classic hand-painted building signage located at 27 Burjorji Bharucha Marg. Currently houses the Government of Maharashtra Gazetteers Department.', year: 'Unknown', architect: 'Unknown', builder: 'David Sassoon & Co.', location: { center: [18.928638, 72.831778] } },
            // Gazetteer Dept Sign (User Submission)
            { id: 'gazetteer-sign', category: 'Lettering', title: 'Gazetteer Dept Sign', image: './images/gazetteer-sign.jpg', description: 'A weathered black and white wooden signboard for the "Gazetteers Department of Govt. of Maharashtra", located at the entrance of the historic Sassoon Building.', year: 'Unknown', architect: 'Govt of Maharashtra', builder: 'PWD', location: { center: [18.928655, 72.831795] } },
            // BEST Sign (User Submission)
            { id: 'best-sign', category: 'Street Sign', title: 'BEST Sub-Station Sign', image: './images/best-sign.jpg', description: 'A standard red enamel sign marking the local electrical sub-station for B. Bharucha Marg (formerly Dean Lane).', year: 'Unknown', architect: 'BEST Undertaking', builder: 'Municipal Corp', location: { center: [18.928611, 72.831833] } },
            // Heritage Corner Building (User Submission)
            { id: 'heritage-corner', category: 'Vernacular', title: 'Heritage Corner Facade', image: './images/bombay-shirt-co.jpg', description: 'A striking corner building with a weathered grey facade, recurrent arched windows, and wooden shutters. A classic example of the precinct\'s unpolished heritage texture.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.928583, 72.832306] } },
            // Vardhan Chowk Sign (User Submission)
            { id: 'vardhan-chowk', category: 'Street Sign', title: 'Shri. Kishorchandra M. Vardhan Chowk', image: './images/vardhan-chowk.jpg', description: 'A municipal street sign designating the junction as "Shri. Kishorchandra M. Vardhan Chowk", honoring a local figure.', year: 'Unknown', architect: 'BMC', builder: 'Municipal Corp', location: { center: [18.928361, 72.832972] } },
            // Alkesh Dinesh Mody Marg Sign (User Submission)
            { id: 'alkesh-mody', category: 'Street Sign', title: 'Alkesh Dinesh Mody Marg', image: './images/alkesh-mody.jpg', description: 'A prominent street sign named after the dynamic stockbroker Alkesh Dinesh Mody. The street was historically a key business lane in the Fort area.', year: '1994', architect: 'BMC', builder: 'Municipal Corp', location: { center: [18.929611, 72.834139] } },
            // Techno Heritage (User Submission)
            { id: 'techno-heritage', category: 'Vernacular', title: 'Techno Heritage', image: './images/techno-heritage.jpg', description: 'A distinctively geometric building with Art Deco influences, featuring symmetrical bays, louvred shutters, and patterned balcony railings. Originally a residential structure adapted for commercial use.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.929778, 72.832167] } },
            // Cercle Littéraire (Ghost Site)
            { id: 'cercle-litteraire', category: 'Ghost Site', title: 'Cercle Littéraire (Jatia Chambers)', image: './images/jatia-chambers.jpg', description: 'Housed the French library "Cercle Littéraire" on the third floor, opened in 1886 by Sir Dinshaw Petit. A cultural landmark for over a century, it closed around 2022/23.', year: '1886', architect: 'Unknown', builder: 'Sir Dinshaw Petit', location: { center: [18.928278, 72.832194] } },
            // Botawala Building Sign (User Submission)
            { id: 'botawala-sign', category: 'Lettering', title: 'Botawala Building Sign', image: './images/botawala-bldg.jpg', description: 'Old hand-painted wooden signage for 71/73 Botawala Building.', year: 'Unknown', architect: 'Unknown', builder: 'HIMS Botawala Charities Trust', location: { center: [18.929556, 72.834194] } },

            // Stone Relief Pillar (User Submission)
            { id: 'rural-relief', category: 'Urban Texture', title: 'Stone Relief of Rural Life', image: './images/rural-relief-pillar.jpg', description: 'A detailed stone relief carving on a building pillar depicting stylized figures engaged in rural agricultural tasks.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.930917, 72.831417] } },

            // Wayside Inn (Next to Esplanade)
            { id: 'wayside', category: 'Ghost Site', title: 'Wayside Inn', image: './images/wayside.jpg', description: 'Now the Khyber restaurant. Famous quaint tea room.', year: '1920', architect: 'N/A', builder: 'Historic Site', location: { center: [18.92860, 72.83170] } },
            { id: 'kgc', category: 'Living Heritage', title: 'Kala Ghoda Café', image: './images/kgcafe.png', description: 'A modern institution in a heritage shell, known for its sustainable architecture.', year: '2009', architect: 'N/A', builder: 'Private', location: { center: [18.92716499313838, 72.83273188562479] } },
            // Street Art Mural (User Submission)
            { id: 'horse-mural', category: 'Living Heritage', title: 'Street Art Mural', image: './images/horse-mural.jpg', description: 'A contemporary street art mural featuring a galloping horse and the word "HEAL", painted on a compound wall.', year: 'Unknown', architect: 'Unknown', builder: 'Street Artist', location: { center: [18.927639, 72.833083] } },
            // Commerce House Gate (User Submission)
            { id: 'commerce-house', category: 'Lettering', title: 'Commerce House Gate', image: './images/commerce-house.jpg', description: 'Art Deco style lettering integrated directly into the wrought iron gate design.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.928472, 72.832833] } },
            // British Engineering Co. (User Submission)
            { id: 'british-engg', category: 'Lettering', title: 'British Engineering Co.', image: './images/british-engg.jpg', description: 'Faded signage for "British Engineering Co.", distributors for Bharat Bijlee, NGEF, and other industrial giants. A reminder of the area\'s engineering trading roots.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.928472, 72.833917] } },
            // Si Bambai Mural (User Submission)
            { id: 'sibambai-mural', category: 'Living Heritage', title: 'Si Bambai Mural', image: './images/sibambai-mural.jpg', description: 'A large mural on the facade of Si Bambai, a visual and performance art space supporting independent and emerging artists.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.928500, 72.833944] } },
            // 15. Great Western (Further North, East Side)
            { id: 'great-western', category: 'Neoclassical', title: 'Great Western Building', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Great_Western_Building%2C_Mumbai.jpg/640px-Great_Western_Building%2C_Mumbai.jpg', description: 'Originally the Admiralty House (1770s).', year: '1770', architect: 'Unknown', builder: 'British Admiralty', location: { center: [18.92850, 72.83290] } },
            // New Era Engineering (User Submission)
            { id: 'new-era', category: 'Lettering', title: 'New Era Engineering Co.', image: './images/new-era.jpg', description: 'A specialized engineering supply store established in 1981, known for its distinctive red block lettering signage featuring heritage industrial logos.', year: '1981', architect: 'N/A', builder: 'New Era Engineering Co.', location: { center: [18.928900, 72.832620] } },
            // Sheraton & Co. (User Submission)
            { id: 'sheraton-co', category: 'Lettering', title: 'Sheraton & Co.', image: './images/sheraton-co.jpg', description: 'Faded vintage signage for "Sheraton & Co. - The Accepted Name for Quality Furniture Fittings". A relic of the old made-to-order furniture trade.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.928833, 72.832667] } },
            // Modern Machines (India) (User Submission)
            { id: 'modern-machines', category: 'Lettering', title: 'Modern Machines (India)', image: './images/modern-machines.jpg', description: 'Hand-painted commercial signage at 129 Nagindas Master Road, featuring detailed technical illustrations of industrial lathe machines, drills, and presses.', year: 'Unknown', architect: 'N/A', builder: 'Private', location: { center: [18.928760, 72.832710] } },
            // Jaydeep Engg. Co. (User Submission)
            { id: 'jaydeep-engg', category: 'Lettering', title: 'Jaydeep Engg. Co.', image: './images/jaydeep-engg.jpg', description: 'Hand-painted industrial signage featuring detailed technical illustrations of pumps, motors, and generators, reflecting the engineering trade history of the street.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.929056, 72.832528] } },
            // The Other Horse (User Submission)
            { id: 'other-horse', category: 'Street Furniture', title: 'The "Other" Black Horse', image: './images/black-horse-small.jpg', description: 'A lesser-known, smaller black horse statue located in a garden patch near the British Engineering Company buildings. Distinct from the famous "Spirit of Kala Ghoda" in the main precinct.', year: 'Unknown', architect: 'Unknown', builder: 'Private Installation', location: { center: [18.928361, 72.833944] } },
            // Bandukwala Building (User Submission)
            { id: 'bandukwala', category: 'Vernacular', title: 'Bandukwala Building', image: './images/bandukwala.jpg', description: 'A handsome heritage building featuring arched windows with decorative keystones and intricate pilasters, now housing legal chambers. Home to the "CS Legal" offices.', year: 'Unknown', architect: 'Unknown', builder: 'Bandukwala Family', location: { center: [18.928917, 72.833583] } },
            // Sewing Machine Mural (User Submission)
            { id: 'sewing-mural', category: 'Living Heritage', title: 'Sewing Machine Mural', image: './images/sewing-mural.jpg', description: 'A whimsical large-scale mural by artist Shashi, depicting a vintage sewing machine intertwining with nature (#stitchinglivestogether). Located above a fashion boutique.', year: 'Unknown', architect: 'Shashi', builder: 'Private', location: { center: [18.928972, 72.833861] } },
            // Ice Cream Mural (User Submission)
            { id: 'ice-cream-mural', category: 'Living Heritage', title: 'Ice Cream Mural', image: './images/ice-cream-mural.jpg', description: 'A vibrant, retro-styled street art mural featuring a pin-up figure and colorful ice cream motifs, located near Valliyan. A popular backdrop that adds to the artistic pulse of the Kala Ghoda precinct.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.928250, 72.832389] } },
            // Artisans' Gallery Mural (User Submission)
            { id: 'artisans-mural', category: 'Living Heritage', title: 'Artisans’ Gallery Facade', image: './images/artisans-mural.jpg', description: 'A striking monochromatic mural with yellow accents covering the facade of Artisans’ Gallery. The artwork celebrates craftsmanship, depicting hands engaged in pottery, painting, and other traditional arts.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.928280, 72.832420] } },
            // Jatin Malik Mural (User Submission)
            { id: 'jatin-malik-mural', category: 'Living Heritage', title: 'Spirit of Kala Ghoda Mural', image: './images/jatin-malik-mural.jpg', description: 'A vibrant mural on the yellow facade of the Jatin Malik store, featuring a stylized, colorful horse in motion—a direct artistic homage to the "Kala Ghoda" (Black Horse) identity of the precinct.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.928278, 72.832139] } },
            // Berenike to Sopara Mural (User Submission)
            { id: 'sopara-mural', category: 'Living Heritage', title: 'Ancient Trade Route Mural', image: './images/sopara-mural.jpg', description: 'A detailed vertical tile mural titled "Berenike - Anchored in Ancient Trade - Sopara", illustrating the historic maritime connection between Egypt (Berenike) and the ancient port of Sopara near Mumbai.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.927283, 72.833800] } },
            // Mehta House (Restored)
            { id: 'mehta-house', category: 'Lettering', title: 'Mehta House Signage', image: './images/mehta-house.jpg', description: 'Features striking 3D shadow-effect lettering typical of the mid-20th century commercial art style.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.929194, 72.833833] } },
            // East & West Building (User Submission)
            // East & West Building (User Submission)
            { id: 'east-west', category: 'Lettering', title: 'East & West Building', image: './images/east-west.jpg', description: 'Heritage stone inscription on the facade of the East & West Insurance Building.', year: 'Unknown', architect: 'Unknown', builder: 'East & West Insurance Co.', location: { center: [18.929972, 72.833583] } },
            // Ring Co (User Submission)
            { id: 'ring-co', categories: ['Lettering', 'Ghost Site'], title: 'Ghost Signage (Ring Co.)', image: './images/ring-co.jpg', description: 'A fragmented sign reading "...RING CO." visible above the Bhaveshwar Copy Center, hinting at a former industrial or engineering tenant.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.93030, 72.83390] } },
            // Vernacular Wooden Facade (User Submission)
            { id: 'vernacular-facade', category: 'Vernacular', title: 'Late 19th Century Vernacular Facade', image: './images/wooden-facade.jpg', description: 'A rare partially-preserved example of the vernacular architectural style once common in Fort. Features intricate wooden jali balconies and corbelled brackets.', year: 'Unknown', architect: 'Unknown', builder: 'Local Craftsmen', location: { center: [18.929194, 72.8325] } },
            // Wooden Terraces (User Submission)
            { id: 'wooden-terraces', category: 'Vernacular', title: 'Vernacular Wooden Terraces', image: './images/wooden-terraces.jpg', description: 'A striking multi-story wooden facade featuring deep cantilevered balconies, decorative railings, and support brackets, housing the Kalamkari Design Studio.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.931278, 72.834000] } },
            // Ornate Window (User Submission)
            { id: 'ornate-window', category: 'Urban Texture', title: 'Ornate Window Grille', image: './images/ornate-window.jpg', description: 'A beautifully preserved window featuring complex geometric metal or wood work, representing the residential architectural fabric of the precinct.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.928417, 72.833111] } },
            // Marine Diesel Signage (User Submission)
            { id: 'marine-diesel', category: 'Lettering', title: 'Marine Diesel Signage', image: './images/marine-diesel.jpg', description: 'Comprehensive hand-painted trade signage for "Marine Diesel Engines & Spares" at Kirti Building, listing heritage mechanical brands like Lister, Ruston, and Kirloskar.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.928417, 72.833194] } },
            // Gujerat Mill Store (User Submission)
            { id: 'gujerat-mill', category: 'Lettering', title: 'The Gujerat Mill Store', image: './images/gujerat-mill.jpg', description: 'Distinctive mid-century corporate signage featuring a stylized "G" logo and metal lettering on a textured plaster facade.', year: 'Unknown', architect: 'N/A', builder: 'Private', location: { center: [18.928389, 72.833139] } },
            // Rampart Beat Chowky (User Submission)
            { id: 'rampart-chowky', category: 'Victorian', title: 'Rampart Beat Chowky', image: './images/rampart-chowky.jpg', description: 'A small stone police outpost with heritage architectural details, including a cornice and stone brackets, guarding the entrance to Rampart Row.', year: 'Unknown', architect: 'Public Works Dept', builder: 'Govt. of Bombay', location: { center: [18.927500, 72.832361] } },
            // Allahabad Bank Building (User Submission)
            { id: 'allahabad-bank', category: 'Neoclassical', title: 'Allahabad Bank Building', image: './images/allahabad-bank.jpg', description: 'A grand Neo-Classical banking hall (now Indian Bank) featuring a prominent corner entrance, Corinthian pilasters, and heavy stone detailing.', year: 'Unknown', architect: 'Unknown', builder: 'Allahabad Bank', location: { center: [18.931250, 72.834000] } },
            // SBI Fort Branch (User Submission)
            { id: 'sbi-fort', category: 'Neoclassical', title: 'SBI Main Branch (Fort)', image: './images/sbi-fort-branch.jpg', description: 'A massive colonial-era banking structure with colossal Ionic columns and a pedimented entrance, originally the Imperial Bank of India.', year: '1924', architect: 'Unknown', builder: 'Imperial Bank', location: { center: [18.931306, 72.834000] } },
            // SBI Roman Numeral (User Submission)
            { id: 'sbi-roman', category: 'Lettering', title: 'MCMXXIV Date Plaque', image: './images/sbi-mcmxxiv.jpg', description: 'The Roman numeral MCMXXIV (1924) carved in bold relief gold-painted serif lettering on the stone entablature, marking the building’s completion year.', year: '1924', architect: 'Unknown', builder: 'Imperial Bank', location: { center: [18.931333, 72.834028] } },
            // A. Doshi & Co. (User Submission)
            { id: 'a-doshi', categories: ['Lettering'], title: 'A. Doshi & Co.', images: ['./images/a-doshi-sign.jpg'], description: 'Classic commercial signage with bold relief lettering, accompanied by a diamond-shaped plaque reading "ESTD 1940".', year: '1940', architect: 'Unknown', builder: 'Private', location: { center: [18.931333, 72.833750] } },
            // Ewart House Lettering (User Submission)
            { id: 'ewart-house', categories: ['Lettering', 'Ghost Site'], title: 'Ewart House Lettering', image: './images/ewart-house.jpg', description: 'Carved "EWART HOUSE" lettering on the stone facade above the Central Bank of India. A subtle reminder of the building\'s identity.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.931361, 72.833083] } },
            // Bruce Street Sign (User Submission)
            { id: 'bruce-street', categories: ['Street Sign', 'Ghost Site'], title: 'Old Bruce Street Sign', images: ['./images/bruce-street-sign.jpg'], description: 'A rare painted sign for "10, BRUCE STREET" (now Homi Modi Street) preserved on a building facade, a tangible reminder of the area’s colonial nomenclature.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.931417, 72.833556] } },
            // 27. BSE (Far East)
            { id: 'bse', category: 'Modern', title: 'Bombay Stock Exchange', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/BSE_-_Bombay_Stock_Exchange_Building.jpg/960px-BSE_-_Bombay_Stock_Exchange_Building.jpg', description: 'The Phiroze Jeejeebhoy Towers.', year: '1980', architect: 'Chandrakant Patel', builder: 'BSE', location: { center: [18.92970, 72.83360] } },
            // Dalal Street Sign Black (User Submission)
            { id: 'dalal-sign-black', category: 'Street Sign', title: 'Dalal Street Sign (Black)', image: './images/dalal-street-black.jpg', description: 'A classic black cast-iron street sign marking Dalal Street, the financial heart of Mumbai.', year: 'Unknown', architect: 'BMC', builder: 'Municipal Corp', location: { center: [18.929722, 72.833722] } },
            // Jawaharlal Darda Statue (User Submission)
            { id: 'darda-statue', category: 'Street Furniture', title: 'Jawaharlal Darda Statue', image: './images/jawaharlal-darda.jpg', description: 'A bronze bust honoring the freedom fighter and journalist Jawaharlal Darda, affectionately known as "Babuji".', year: 'Unknown', architect: 'Unknown', builder: 'Public', location: { center: [18.929889, 72.833778] } },
            // Carved Stone Facade (User Submission)
            { id: 'carved-balconies', category: 'Vernacular', title: 'Ornate Stone Facade', image: './images/carved-balconies.jpg', description: 'A fine example of vernacular architecture featuring intricate stone jaali (lattice) work, heavy masonry brackets, and projecting balconies, characteristic of the mixed-use buildings in old Fort.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.929972, 72.833778] } },
            // Stone Arched Facade (User Submission)
            { id: 'stone-arches', category: 'Vernacular', title: 'Stone Arched Facade', image: './images/islamic-stone-arches.jpg', description: 'Distinctive vernacular building featuring scalloped (cusped) stone arches and geometric perforated stone railings.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.930250, 72.833833] } },
            // Dalal Street Sign Blue (User Submission)
            { id: 'dalal-sign-blue', category: 'Street Sign', title: 'Dalal Street Sign (Blue)', image: './images/dalal-street-blue.jpg', description: 'A vintage blue enamel street sign for Dalal Street, likely an earlier municipal design.', year: 'Unknown', architect: 'BMC', builder: 'Municipal Corp', location: { center: [18.929750, 72.833750] } },

            // --- FLORA FOUNTAIN CLUSTER (De-cluttered) ---
            // 30. Flora Fountain (Dead Center of Chowk)
            { id: 'flora', category: 'Street Furniture', title: 'Flora Fountain', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Mumbai_03-2016_72_Flora_Fountain.jpg/960px-Mumbai_03-2016_72_Flora_Fountain.jpg', description: 'An ornamental fountain at Hutatma Chowk.', year: '1864', architect: 'R. Norman Shaw', builder: 'Agri-Horticultural Soc', location: { center: [18.93230, 72.83170] } },
            // Hutatma Chowk (Martyrs' Memorial)
            { id: 'hutatma', category: 'Public Space', title: 'Hutatma Smarak (Martyrs’ Memorial)', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Hutatma_Chowk%2C_Mumbai_-_panoramio_(2).jpg/1280px-Hutatma_Chowk%2C_Mumbai_-_panoramio_(2).jpg', description: 'A memorial with a bronze statue of a laborer and a farmer, honoring the 106 martyrs of the Samyukta Maharashtra Samiti who died for the creation of the state.', year: '1961', architect: 'Harish Talim', builder: 'Govt. of Maharashtra', location: { center: [18.93245, 72.83160] } },
            // Tram Tracks (User Submission)
            { id: 'tram-tracks', category: 'Ghost Site', title: 'Tram Tracks', image: './images/tram-tracks.jpg', description: 'The tram tracks, hidden for more than six decades, were discovered during excavation in 2018. Mumbai\'s tram service began in 1874 and stopped in 1964. While horses were used to pull the trams earlier, they were replaced by electric engines in 1907. The network functioned from Colaba to Pydhonie via Crawford Market. The original tracks have been preserved at their original position.', year: '1874', architect: 'BEC', builder: 'Bombay Tramway Co.', location: { center: [18.932583, 72.831667] } },
            // Central Bank of India (User Submission)
            { id: 'central-bank', categories: ['Neoclassical', 'Lettering'], title: 'Central Bank of India', images: ['./images/central-bank.jpg', './images/central-bank-lettering.jpg'], description: 'A grand heritage building established in 1911 as one of the first truly Indian owned banks. The facade features prominent "CENTRAL BANK BUILDING" carved lettering curving around the corner.', year: '1911', architect: 'Unknown', builder: 'Sir Sorabji Pochkhanawala', location: { center: [18.931722, 72.831750] } },
            // Bombay House (User Submission)
            { id: 'bombay-house', categories: ['Neoclassical', 'Lettering'], title: 'Bombay House', images: ['./images/bombay-house.jpg', './images/bombay-house-lettering.jpg'], description: 'The global headquarters of the Tata Group since 1924. This colonial-era stone building is renowned for its understated elegance and the "BOMBAY HOUSE" gold lettering above the entrance arcade.', year: '1924', architect: 'George Wittet', builder: 'Tata Group', location: { center: [18.931847, 72.832680] } },
            // British Fire Hydrant (User Submission)
            { id: 'fire-hydrant', category: 'Street Furniture', title: 'British Fire Hydrant', image: './images/british-fire-hydrant.jpg', description: 'A rare cast-iron fire hydrant from the British colonial era, painted bright red. These sturdy relics of civic infrastructure are disappearing but occasionally found on Fort’s sidewalks.', year: 'Unknown', architect: 'Unknown', builder: 'Municipal Corp', location: { center: [18.931500, 72.832944] } },
            // Siddharth College (User Submission)
            { id: 'siddharth-college', category: 'Victorian', title: 'Siddharth College (Anand Bhavan)', image: './images/siddharth-college.jpg', description: 'A Grade II heritage structure (formerly Albert Building), acquired by Dr. B.R. Ambedkar in 1951 to house the first college of the People\'s Education Society.', year: '1900', architect: 'Unknown', builder: 'People\'s Education Society', location: { center: [18.933889, 72.832389] } },
            // Davar Building (User Submission)
            { id: 'davar-building', category: 'Lettering', title: 'Davar Building Lettering', image: './images/davar-building.jpg', description: 'Carved stone lettering above an arched entrance passage, exemplifying the bold typography of early 20th century commercial buildings in the Fort area.', year: '1900', architect: 'Unknown', builder: 'Private', location: { center: [18.932222, 72.831694] } },
            // Sunder Woodwork (User Submission)
            { id: 'sunder-woodwork', category: 'Lettering', title: 'Sunder Woodwork Signage', image: './images/sunder-woodwork.jpg', description: 'Art Deco style signage reading "WOOD SUNDER WORK" with dimensional lettering and a distinctive red outline, located above an arched stone entrance.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.932250, 72.831667] } },
            // CIP Building / ICP Fort Heritage (User Submission)
            { id: 'cip-building', category: 'Neoclassical', title: 'ICP Fort Heritage (CIP Building)', image: './images/cip-building.jpg', description: 'A grand heritage building on Nagindas Master Road, originally constructed in 1913. The facade features a prominent pediment with the year "1913" carved in relief, along with decorative cornices and Corinthian-style pilasters. It currently houses the flagship store of fashion designer Sabyasachi.', year: '1913', architect: 'Unknown', builder: 'Private', location: { center: [18.932456, 72.833428] } },
            // Standard Building (User Submission)
            { id: 'standard-building', category: 'Neoclassical', title: 'Standard Building', image: './images/standard-building.jpg', description: 'Designed by F.W. Stevens and completed by his son Charles Stevens. A prime example of the Neo-Classical style on D.N. Road, featuring buff-coloured basalt and intricate carvings.', year: '1902', architect: 'F.W. Stevens / Charles Stevens', builder: 'Standard Life Assurance', location: { center: [18.933900, 72.832100] } },
            // U.N. Pursram (User Submission)
            { id: 'un-pursram', category: 'Living Heritage', title: 'U.N. Pursram', image: './images/un-pursram.jpg', description: 'A historic department store housed within the Standard Building arcade, serving Mumbai since the mid-20th century.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.934111, 72.832556] } },
            // U.N. Pursram Lettering (User Submission)
            { id: 'un-pursram-lettering', category: 'Lettering', title: 'U.N. Pursram Signage', image: './images/un-pursram.jpg', description: 'The distinctive oval signage of U.N. Pursram, a classic example of commercial typography on D.N. Road.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.934140, 72.832580] } },
            // Thomas Cook Building (User Submission)
            { id: 'thomas-cook', category: 'Neoclassical', title: 'Thomas Cook Building', image: './images/thomas-cook-building.jpg', description: 'A distinguished Grade II-A heritage structure featuring Classical elements like Corinthian columns and arched windows. Originally the Indian headquarters for Eastman Kodak.', year: '1900', architect: 'Unknown', builder: 'Eastman Kodak', location: { center: [18.934167, 72.832611] } },
            // J.N. Petit Institute (User Submission)
            { id: 'jn-petit', category: 'Victorian', title: 'J.N. Petit Institute', image: './images/jn-petit.jpg', description: 'A magnificent Neo-Gothic library and reading room built in 1898. Its facade features polychromatic stone, stained glass, and pointed arches. Recipient of a UNESCO Heritage Award.', year: '1898', architect: 'Merwanjee Bana', builder: 'Petit Family', location: { center: [18.934194, 72.832639] } },
            // Fort Gate Remnant (User Submission)
            { id: 'fort-gate', category: 'Victorian', title: 'Fort Gate Remnant', image: './images/fort-gate-remnant.jpg', description: 'A surviving basalt stone archway, likely a remnant from the original Fort walls demolished in the 1860s. Now integrated into the urban fabric near DN Road.', year: '1860', architect: 'British Military Engineers', builder: 'Public Works', location: { center: [18.933667, 72.832361] } },
            // Booksellers (Nudged North West along the curve)
            { id: 'booksellers', category: 'Living Heritage', title: 'Secondhand Book Sellers', image: './images/books.jpg', description: 'The lineage of street book vendors near Flora Fountain.', year: '1950', architect: 'N/A', builder: 'Vendor Collective', location: { center: [18.93250, 72.83150] } },
            // RBI Rupee Installation (User Submission)
            { id: 'rbi-rupee', category: 'Street Furniture', title: 'RBI Rupee Installation', image: './images/rbi-rupee.jpg', description: 'A large golden installation of the Indian Rupee symbol (₹) accompanied by coin motifs, located outside the Reserve Bank of India.', year: '2010', architect: 'RBI', builder: 'RBI', location: { center: [18.932943, 72.837090] } },
            // RBI Building (User Submission)
            { id: 'rbi-building', categories: ['Modern', 'Street Furniture'], title: 'Reserve Bank of India (Main Building)', images: ['./images/rbi-building.jpg', './images/rbi-tiger.jpg'], description: 'The headquarters of India\'s central bank. Completed in 1939, the building is a transition between Art Deco and Modernism. A prominent golden statue of the RBI tiger under a palm tree (based on the East India Company\'s Mohur) stands at the entrance.', year: '1939', architect: 'J.A. Ritchie', builder: 'Shapoorji Pallonji', location: { center: [18.932850, 72.836850] } },
            // India Government Mint (User Submission)
            { id: 'mumbai-mint', category: 'Neoclassical', title: 'India Government Mint', image: './images/mumbai-mint.jpg', description: 'Established in 1829, the Mumbai Mint is one of the oldest in India. The building is a fine example of Neoclassical architecture, featuring a grand basalt stone facade.', year: '1829', architect: 'Major John Hawkins', builder: 'British Government', location: { center: [18.933361, 72.836556] } },
            // Shahid Bhagat Singh Road Sign (User Submission)
            { id: 'bhagatsingh-road-sign', category: 'Street Sign', title: 'Shahid Bhagat Singh Road Sign', image: './images/bhagatsingh-road-sign.jpg', description: 'A classic blue municipal street sign marking Shahid Bhagat Singh Road (formerly Colaba Causeway). The decorative ironwork scroll on the post is a characteristic feature of Mumbai\'s heritage street signage.', year: 'Unknown', architect: 'BMC', builder: 'Municipal Corp', location: { center: [18.932889, 72.836139] } },
            // British Fire Hydrant - SBS Road (User Submission)
            { id: 'fire-hydrant-sbs', category: 'Street Furniture', title: 'British Fire Hydrant', image: './images/hydrant-sbs.jpg', description: 'A weathered cast-iron fire hydrant from the British colonial era, located along Shahid Bhagat Singh Road. These hexagonal pillars remain as silent sentinels of the city\'s 19th-century water infrastructure.', year: '1890', architect: 'Unknown', builder: 'Municipal Corp', location: { center: [18.932583, 72.835806] } },
            // British Fire Hydrant - D.N. Road (User Submission)
            { id: 'fire-hydrant-dn', category: 'Street Furniture', title: 'British Fire Hydrant', image: './images/hydrant-dn-road.jpg', description: 'A tall, cylindrical cast-iron fire hydrant with a rounded cap, located within the heritage arcade on Dadabhai Naoroji Road. This red-oxide painted relic is part of Mumbai\'s historic fire-fighting infrastructure.', year: '1890', architect: 'Unknown', builder: 'Municipal Corp', location: { center: [18.93225, 72.834306] } },
            // Heritage Monograms (User Submission)
            { id: 'standard-monograms', category: 'Lettering', title: 'Heritage Monograms', images: ['./images/monogram-hb.jpg', './images/monogram-mb.jpg'], description: 'Intricate monograms carved into the stone balconies of the Standard Building on D.N. Road. These stylized "HB" and "MB" initials are a testament to the craftsmanship and personal branding of the early 20th-century architects and builders.', year: '1902', architect: 'F.W. Stevens', builder: 'Standard Life Assurance', location: { center: [18.932056, 72.834417] } },
            // Gungadass Vizbhoocundass Piyav (User Submission)
            { id: 'gungadass-piyav', categories: ['Street Furniture', 'Lettering'], title: 'Gungadass Vizbhoocundass Piyav', images: ['./images/gungadass-piyav.jpg', './images/gungadass-plaque-1841.jpg', './images/gungadass-plaque-1873.jpg'], description: 'A historic water fountain (piyav) decorated with red jaali work. The inscriptions in multiple scripts (English, Gujarati, Marathi, Urdu) commemorate its erection in 1841 by Gungadass Vizbhoocundass and a subsequent addition in 1873 by his widow, Bai Manchooverbai.', year: '1841', architect: 'Unknown', builder: 'Gungadass Vizbhoocundass', location: { center: [18.932028, 72.834389] } },
            // Ryrie's Building (User Submission)
            { id: 'ryrie-building', categories: ['Neoclassical', 'Lettering'], title: 'Ryrie\'s Building (Galeries Lafayette)', images: ['./images/ryrie-building.jpg', './images/ryrie-monogram.jpg'], description: 'A grand heritage building on D.N. Road, recently restored to house Galeries Lafayette. The stone facade features intricate Neoclassical details, including the original "RY" monogram carved into the masonry, signifying its history as the Ryrie\'s building.', year: '1900', architect: 'Unknown', builder: 'Ryrie & Co.', location: { center: [18.930883, 72.834693] } },
            // State Bank Building Directory (User Submission)
            { id: 'sbi-directory', category: 'Lettering', title: 'State Bank Building Directory', image: './images/crawford-bayley-board.jpg', description: 'A classic black directory board located at the entrance of the State Bank Building (formerly State Bank of India Commercial Branch). It features the names of historic tenants like Crawford Bayley & Co. and The Oriental Fire & General Insurance, rendered in crisp white lettering.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.931083, 72.834972] } },
            // Keystone Sculptures (User Submission)
            { id: 'keystone-heads', category: 'Urban Texture', title: 'Keystone Sculptures', image: './images/keystone-heads.jpg', description: 'Intricate sculpted heads (mascarons) adorning the keystones of the arches on this heritage façade. These bearded faces, possibly depicting European or mythological figures, watch over the street from above the shopfronts (currently Bademiya).', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.931444, 72.835194] } },
            // Oriental Building (User Submission)
            { id: 'oriental-building', category: 'Victorian', title: 'Oriental Building', image: './images/oriental-building.jpg', description: 'A magnificent Venetian Gothic structure completed in 1885. Its facade is a masterpiece of stone carving, featuring prominent arches, decorative balconies, and the signature "mascaron" heads on its keystones. Originally built for the Oriental Life Assurance Company, it is now an iconic part of the Fort district\'s architectural fabric.', year: '1885', architect: 'Frederick William Stevens', builder: 'Oriental Life Assurance', location: { center: [18.931444, 72.835194] } },
            // BMC Plaque - Horniman Circle (User Submission)
            { id: 'bmc-plaque-horniman', category: 'Street Sign', title: 'BMC Garden Plaque', image: './images/bmc-plaque-horniman.jpg', description: 'The official colorful seal of the Brihanmumbai Municipal Corporation (BMC) mounted on the historic iron railings of Horniman Circle Garden. The seal features iconic Mumbai landmarks like the Gateway of India and a factory, representing the city’s heritage and industry.', year: 'Unknown', architect: 'BMC', builder: 'Municipal Corp', location: { center: [18.932167, 72.835556] } },
            // Asiatic Society of Mumbai (User Submission)
            { id: 'asiatic-society', category: 'Neoclassical', title: 'Asiatic Society of Mumbai (Town Hall)', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/The_Asiatic_Society_of_Mumbai_in_May_2025.jpg/1024px-The_Asiatic_Society_of_Mumbai_in_May_2025.jpg', description: 'Completed in 1833, the Town Hall is one of the most magnificent Neoclassical buildings in Mumbai. Inspired by Greek and Roman architecture, it features a grand portico with eight Doric columns and a famous flight of steps that serves as a popular public space.', year: '1833', architect: 'Colonel Thomas Cowper', builder: 'Government of Bombay', location: { center: [18.931813, 72.836155] } },
            // Horniman Circle Garden (User Submission)
            { id: 'horniman-garden', category: 'Public Space', title: 'Horniman Circle Garden', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Mumbai%2C_giardini_di_horniman_circle%2C_03.jpg/1024px-Mumbai%2C_giardini_di_horniman_circle%2C_03.jpg', description: 'A historic park at the center of Horniman Circle, originally known as Elphinstone Circle. Laid out in 1872, the garden is a rare example of circular urban planning in Mumbai, surrounded by palm trees and grand Victorian buildings. It remains a tranquil green lung in the heart of the business district.', year: '1872', architect: 'Unknown', builder: 'Govt. of Bombay', location: { center: [18.931907, 72.835007] } },
            { id: 'bharat-insurance', categories: ['Neoclassical', 'Lettering'], title: 'Bharat Insurance Building', images: ['./images/bharat-insurance.jpg', './images/bharat-insurance-lettering.jpg'], description: 'A stately Neoclassical building on Horniman Circle. The facade features a graceful curve, recurring arched windows with decorative "mascaron" keystone heads, and prominent raised lettering for the "BHARAT INSURANCE BUILDING". It currently houses the flagship Hermes store, blending historic grandeur with modern luxury.', year: 'Unknown', architect: 'Unknown', builder: 'Bharat Insurance Co.', location: { center: [18.933329, 72.835815] } },
            // Sir H.C. Dinshaw Building (User Submission)
            { id: 'hc-dinshaw-building', categories: ['Neoclassical', 'Lettering'], title: 'Sir H.C. Dinshaw Building', images: ['./images/hc-dinshaw-building.jpg', './images/hc-dinshaw-lettering.jpg'], description: 'A grand heritage building on Horniman Circle, part of the precinct\'s iconic curved architecture. The facade is adorned with intricate stone carvings, including "mascaron" heads on the window keystones. Notable gold-engraved lettering above the entrance and within the archways bears the name "SIR H. C. DINSHAW BUILDING".', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.932915, 72.835373] } },
            // Mumbai Samachar (User Submission)
            { id: 'mumbai-samachar', categories: ['Victorian', 'Lettering', 'Living Heritage'], title: 'Mumbai Samachar Building', images: ['./images/mumbai-samachar.jpg', './images/mumbai-samachar-lettering.jpg'], description: 'The home of Asia\'s oldest continuously published newspaper (est. 1822). This striking red-brick building is a landmark of Mumbai\'s journalism history. The facade is a fine example of Victorian commercial architecture, featuring multilingual signage and elegant arched windows.', year: '1822', architect: 'Unknown', builder: 'Cama Family', location: { center: [18.932820, 72.834456] } },
            // Elphinstone Building (User Submission)
            { id: 'elphinstone-building', categories: ['Victorian', 'Lettering'], title: 'Elphinstone Building', images: ['./images/elphinstone-building.jpg', './images/elphinstone-lettering.jpg'], description: 'A stately Victorian Gothic building with prominent arched windows and intricate stone ornamentation. The facade features the "ELPHINSTONE BUILDING" nameplate carved into the masonry. Today, it stands as a prime example of the 19th-century commercial grandness of the Fort district, housing modern retail like Starbucks.', year: '1870', architect: 'James Trubshawe', builder: 'Unknown', location: { center: [18.933358, 72.834229] } },
            // Brady House (User Submission)
            { id: 'brady-house', categories: ['Neoclassical', 'Lettering'], title: 'Brady House', images: ['./images/brady-house.jpg', './images/brady-house-lettering.jpg'], description: 'An elegant heritage building featuring a distinctive shield-shaped pediment with the "BRADY HOUSE" nameplate. The structure displays refined architectural detailing with arched windows and a symmetrical facade, characteristic of early 20th-century commercial buildings in Mumbai\'s business district.', year: 'Unknown', architect: 'Unknown', builder: 'W.H. Brady & Co.', location: { center: [18.932474, 72.833778] } },
            // Pardiwala Paper Mart (User Submission)
            { id: 'pardiwala-sign', categories: ['Lettering', 'Ghost Site'], title: 'Pardiwala Paper Mart Sign', image: './images/pardiwala-paper.jpg', description: 'A weathered wooden sign with bold relief lettering for "PARDIWALA PAPER MART", hanging under a stone Gothic arch. A classic example of Mumbai\'s historic commercial signage and a "ghost site" of a former paper trading business.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.932354, 72.834335] } },
            // Heritage Lettering (User Submission)
            { id: '1923-lettering', category: 'Lettering', title: '1923 Lettering', image: './images/lettering-north-fort.jpg', description: 'Carved stone lettering displaying the year "1923" adorned with decorative floral motifs.', year: '1923', architect: 'Unknown', builder: 'Private', location: { center: [18.935944, 72.833889] } },
            // Readymoney Mansion (User Submission)
            { id: 'readymoney-mansion', categories: ['Vernacular', 'Lettering'], title: 'Readymoney Mansion', images: ['./images/readymoney-mansion-building.jpg', './images/readymoney-mansion-lettering.jpg'], description: 'A striking heritage building featuring a stone facade and intricate wooden balconies. The name "READYMONEY MANSION" is carved in bold relief above the entrance.', year: 'Unknown', architect: 'Unknown', builder: 'Readymoney Family', location: { center: [18.931944, 72.830534] } },
            // Churchgate House (User Submission)
            { id: 'churchgate-house', categories: ['Lettering', 'Victorian'], title: 'Churchgate House Lettering', image: './images/churchgate-house-lettering.jpg', description: 'Classic serif lettering for "CHURCHGATE HOUSE" mounted on the stone facade of a heritage building, now housing a modern bank branch.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.932546, 72.832911] } },
            // Elite Shopping Centre (User Submission)
            { id: 'elite-shopping-centre', category: 'Lettering', title: 'Elite Shopping Centre Signage', image: './images/elite-shopping-centre-lettering.jpg', description: 'A vibrant arched blue sign for the "ELITE SHOPPING CENTRE" marking a busy commercial passage on Nariman Road.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.932250, 72.832917] } },
            // Rustom Building (User Submission)
            { id: 'rustom-building', categories: ['Lettering', 'Victorian'], title: 'Rustom Building Lettering', image: './images/rustom-building-lettering.jpg', description: 'Bold relief lettering for "RUSTOM BUILDING" set against a stone facade. The building features decorative iron balconies and classic stone detailing, characteristic of the district\'s commercial heritage.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.932614, 72.833245] } },
            // St. Thomas Cathedral (User Submission)
            { id: 'st-thomas-cathedral', categories: ['Victorian', 'Lettering'], title: 'St. Thomas Cathedral', images: ['./images/st-thomas-building.jpg', './images/st-thomas-lettering.jpg'], description: 'The first Anglican church in Mumbai, consecrated in 1718. A landmark of colonial architecture, it gave its name to the nearby Churchgate station. The cathedral features a blend of Gothic and Neoclassical styles with a distinctive white tower.', year: '1718', architect: 'Unknown', builder: 'East India Company', location: { center: [18.932995, 72.833599] } },
            // Fish & Star Reliefs (User Submission)
            { id: 'fish-relief-wall', category: 'Urban Texture', title: 'Fish & Star Reliefs', image: './images/fish-relief-wall.jpg', description: 'A unique vernacular detail featuring red-painted relief sculptures of stars and two fish meeting head-to-head on the gable wall of a building in the Fort precinct.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.932972, 72.833500] } },
            // Heritage Balconies (User Submission)
            { id: 'heritage-balconies-fort', category: 'Vernacular', title: 'Heritage Balconies', image: './images/heritage-balconies-fort.jpg', description: 'A striking example of early 20th-century residential architecture in Fort, featuring ornate wrought-iron balconies, a Greek-key pattern frieze, and classic stone facing.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.932889, 72.833389] } },
            // MCGB Fire Hydrant (User Submission)
            { id: 'fire-hydrant-mcgb', category: 'Street Furniture', title: 'MCGB Fire Hydrant', image: './images/fire-hydrant-mcgb.jpg', description: 'A classic cylindrical cast-iron fire hydrant with the inscription "MCGB" (Municipal Corporation of Greater Bombay) and "IS 908", reflecting the city\'s municipal infrastructure history.', year: 'Unknown', architect: 'Unknown', builder: 'Municipal Corp', location: { center: [18.932694, 72.833333] } },
            // Yazdani Bakery (User Submission)
            { id: 'yazdani-bakery', categories: ['Living Heritage', 'Lettering', 'Vernacular'], title: 'Yazdani Restaurant & Bakery', images: ['./images/yazdani-bakery-facade.jpg', './images/yazdani-bakery-sign.jpg', './images/yazdani-la-boulangerie.jpg'], description: 'An iconic Iranian bakery and restaurant established in 1953, housed in a charming colonial-era structure with a distinctive red-trim gabled roof. Famous for its ginger biscuits, brun maska, and wood-fired ovens.', year: '1953', architect: 'Unknown', builder: 'Zend Meherwan Abadan', location: { center: [18.933451, 72.833699] } },
            // French Bank Building (User Submission)
            { id: 'french-bank-building', categories: ['Lettering', 'Ghost Site'], title: 'French Bank Building Signage', image: './images/french-bank-building.jpg', description: 'Prominent sans-serif lettering for the "FRENCH BANK BUILDING" above the entrance. To the right, a faint "BNP" ghost sign is visible on the facade, a relic of the building\'s former life as the Mumbai headquarters for the French bank BNP Paribas.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.933314, 72.835043] } },
            // Gool Mansion (User Submission)
            { id: 'gool-mansion', category: 'Lettering', title: 'Gool Mansion Lettering', image: './images/gool-mansion-lettering.jpg', description: 'Art Deco style gold lettering on a red granite plaque marking "GOOL MANSION", integrated into the facade of this heritage residential building on Nariman Road.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.934023, 72.835087] } },
            // Fluted Heritage Facade (User Submission)
            { id: 'fluted-facade-plant', categories: ['Neoclassical', 'Urban Texture'], title: 'Fluted Heritage Facade', image: './images/baroda-facade-plant.jpg', description: 'A grand heritage facade featuring monumental fluted pilasters. A young Ficus tree has taken root in the decorative iron balcony, a common sight where nature reclaims the masonry joints of the Fort precinct.', year: 'Unknown', architect: 'Unknown', builder: 'Private', location: { center: [18.933417, 72.835250] } },













            // Small extras
            { id: 'hydrant', category: 'Street Furniture', title: 'British Fire Hydrant', image: './images/hydrant.jpg', description: 'A hexagonal cast-iron fire hydrant, a sturdy relic of the colonial municipal water infrastructure.', year: '1895', architect: 'BMC', builder: 'Foundry Cast', location: { center: [18.928139, 72.831917] } },
            { id: 'kerbstones', category: 'Urban Texture', title: 'Kurla Basalt Kerbstones', image: './images/kurla-basalt.jpg', description: 'Original massive blocks of grey Kurla basalt lining the pavement.', year: '1880', architect: 'City Engineers', builder: 'Public Works', location: { center: [18.92750, 72.83200] } }
        ]
    };

    // --- PRELOADER SYSTEM ---
    (function preloadAllImages() {
        var allImages = [];
        config.chapters.forEach(function (ch) {
            if (ch.image) allImages.push(ch.image);
            if (ch.images) allImages.push(...ch.images);
        });
        // Deduplicate
        allImages = allImages.filter(function (item, pos) {
            return allImages.indexOf(item) == pos;
        });

        var total = allImages.length;
        var loaded = 0;
        var bar = document.getElementById('loading-bar');
        var screen = document.getElementById('loading-screen');
        var text = document.getElementById('loading-text');

        if (total === 0) {
            if (screen) screen.style.display = 'none';
            return;
        }

        // Failsafe: If loading takes too long, force close
        setTimeout(function () {
            if (screen && screen.style.display !== 'none') {
                console.warn('Preloader timed out, forcing close.');
                if (bar) bar.style.width = '100%';
                if (screen) {
                    screen.style.opacity = '0';
                    setTimeout(function () {
                        screen.style.display = 'none';
                        // Show tutorial after loading screen is hidden
                        showTutorial();
                    }, 300);
                }
            }
        }, 8000); // Reduced from 15s to 8s

        function checkDone() {
            loaded++;
            var percent = Math.min(100, Math.round((loaded / total) * 100));
            if (bar) bar.style.width = percent + '%';
            if (text) text.innerText = 'Loading Map... ' + percent + '%';

            if (loaded >= total) {
                // Reduced delay before fade out
                setTimeout(function () {
                    if (screen) {
                        screen.style.opacity = '0';
                        setTimeout(function () {
                            screen.style.display = 'none';
                            // Show tutorial after loading screen is hidden
                            showTutorial();
                        }, 300); // Reduced from 500ms
                    }
                }, 200); // Reduced from 800ms
            }
        }

        allImages.forEach(function (url) {
            var img = new Image();
            img.onload = checkDone;
            img.onerror = checkDone;
            img.src = url;
        });
    })();

    function parseYear(yearStr) {
        if (!yearStr) return 2025;
        yearStr = yearStr.toString().toLowerCase();
        var match = yearStr.match(/(\d{4})/);
        if (match) return parseInt(match[0]);
        if (yearStr.includes('late 19th')) return 1890;
        if (yearStr.includes('mid 19th')) return 1850;
        if (yearStr.includes('early 19th')) return 1810;
        if (yearStr.includes('19th century')) return 1850;
        if (yearStr.includes('early 20th')) return 1910;
        if (yearStr.includes('mid 20th')) return 1950;
        if (yearStr.includes('late 20th')) return 1990;
        if (yearStr.includes('20th century')) return 1950;
        return 2025;
    }

    var disabledCategories = [];
    var currentSliderYear = 2025;
    var markerObjects = [];
    var selectedMarker = null;

    var layersContent = document.getElementById('layers-content');

    // Helper to get categories array from a chapter (supports both 'category' and 'categories' fields)
    function getCategories(item) {
        if (item.categories && Array.isArray(item.categories)) {
            return item.categories;
        }
        return item.category ? [item.category] : [];
    }

    // Extract all unique categories from chapters
    var categories = [...new Set(config.chapters.flatMap(function (item) { return getCategories(item); }))];

    var allBtn = document.createElement('div');
    allBtn.className = 'filter-btn all-layers-btn active';
    allBtn.innerHTML = 'Reset Visibility';
    allBtn.onclick = function () { resetFilters(); };
    layersContent.appendChild(allBtn);

    categories.forEach(function (cat) {
        var btn = document.createElement('div');
        btn.className = 'filter-btn';
        btn.setAttribute('data-cat', cat);
        var color = config.colors[cat] || '#333';
        var iconClass = config.icons[cat] || 'fa-map-marker-alt';
        btn.innerHTML = `<div class="layer-label-group"><span class="dot-indicator" style="color:${color}"></span><i class="fa-solid ${iconClass}" style="color:#666; font-size:12px;"></i><span>${cat}</span></div><div class="layer-actions"><span class="layer-solo-btn" title="Show Only This Layer">ONLY</span><div class="layer-eye-btn" title="Toggle Visibility">HIDE</div></div>`;
        btn.querySelector('.layer-eye-btn').addEventListener('click', function (e) { e.stopPropagation(); toggleCategory(cat, btn); });
        btn.querySelector('.layer-solo-btn').addEventListener('click', function (e) { e.stopPropagation(); soloCategory(cat, btn.querySelector('.layer-solo-btn')); });
        layersContent.appendChild(btn);
    });

    // --- MOBILE CHIP FILTER BAR ---
    var chipBar = document.getElementById('chip-filter-bar');
    if (chipBar && window.innerWidth <= 768) {
        // Create Reset Chip first
        var resetChip = document.createElement('div');
        resetChip.className = 'filter-chip chip-reset';
        resetChip.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Reset';
        resetChip.addEventListener('click', function () {
            triggerHaptic();
            resetFilters();
            updateChipStates();
            // Fly back to original location with 3D view
            map.flyTo({
                center: [72.8322, 18.9270],
                zoom: 16,  // Zoom 16 to show individual markers instead of clusters
                pitch: 45,
                bearing: -15,
                duration: 1000
            });
            showToast('View reset');
        });
        chipBar.appendChild(resetChip);

        // Create a chip for each category
        categories.forEach(function (cat) {
            var color = config.colors[cat] || '#333';
            var iconClass = config.icons[cat] || 'fa-map-marker-alt';
            var chip = document.createElement('div');
            chip.className = 'filter-chip';
            chip.setAttribute('data-cat', cat);
            chip.innerHTML = `<span class="chip-dot" style="background:${color}"></span><i class="fa-solid ${iconClass}"></i>${cat}`;

            // Long press detection variables
            var longPressTimer = null;
            var isLongPress = false;

            // Tap = Toggle visibility
            chip.addEventListener('click', function (e) {
                if (isLongPress) {
                    isLongPress = false;
                    return; // Ignore click after long press
                }
                triggerHaptic();
                // Find corresponding desktop button and toggle
                var desktopBtn = document.querySelector(`.filter-btn[data-cat="${cat}"]`);
                if (desktopBtn) {
                    toggleCategory(cat, desktopBtn);
                }
                updateChipStates();
            });

            // Long press = Solo mode
            chip.addEventListener('touchstart', function (e) {
                isLongPress = false;
                longPressTimer = setTimeout(function () {
                    isLongPress = true;
                    triggerHaptic();
                    // Check if already solo
                    var isSolo = chip.classList.contains('chip-solo');
                    if (isSolo) {
                        resetFilters();
                        showToast('All layers visible');
                    } else {
                        // Find corresponding desktop solo button
                        var desktopBtn = document.querySelector(`.filter-btn[data-cat="${cat}"]`);
                        if (desktopBtn) {
                            soloCategory(cat, desktopBtn.querySelector('.layer-solo-btn'));
                        }
                        showToast(`Solo: ${cat} only`);
                    }
                    updateChipStates();
                }, 500); // 500ms for long press
            });

            chip.addEventListener('touchend', function () {
                clearTimeout(longPressTimer);
            });

            chip.addEventListener('touchmove', function () {
                clearTimeout(longPressTimer);
                isLongPress = false;
            });

            chipBar.appendChild(chip);
        });

        // Add Wall Toggle Chip
        var wallChip = document.createElement('div');
        wallChip.className = 'filter-chip chip-wall';
        wallChip.innerHTML = '<i class="fa-solid fa-archway"></i> 1860 Wall';
        wallChip.addEventListener('click', function () {
            triggerHaptic();
            var wallBtn = document.getElementById('wall-btn');
            if (wallBtn && window.toggleLayer) {
                window.toggleLayer('fort-wall-layer', wallBtn);
            }
            // Toggle chip visual state
            wallChip.classList.toggle('chip-solo');
        });
        chipBar.appendChild(wallChip);

        // Scroll hint: hide gradient when scrolled to end
        var wrapper = chipBar.parentElement;
        chipBar.addEventListener('scroll', function () {
            var isAtEnd = chipBar.scrollLeft + chipBar.offsetWidth >= chipBar.scrollWidth - 10;
            wrapper.classList.toggle('scrolled-end', isAtEnd);
        });
    }

    // Function to sync chip visual states with the actual filter state
    function updateChipStates() {
        var chips = document.querySelectorAll('.filter-chip[data-cat]');
        var soloActive = document.querySelector('.layer-solo-btn.active-solo');
        var soloCategory = soloActive ? soloActive.closest('.filter-btn').getAttribute('data-cat') : null;

        chips.forEach(function (chip) {
            var cat = chip.getAttribute('data-cat');
            var isHidden = disabledCategories.includes(cat);
            var isSolo = (soloCategory === cat);

            chip.classList.remove('chip-hidden', 'chip-solo');
            if (isSolo) {
                chip.classList.add('chip-solo');
            } else if (isHidden) {
                chip.classList.add('chip-hidden');
            }
        });
    }

    // Expose updateChipStates globally for syncing
    window.updateChipStates = updateChipStates;

    /* 
    // OLD FLOATING FILTER TOGGLE - Replaced by Bottom Nav
    var mobileFilterBtn = document.getElementById('mobile-filter-toggle');
    if (!mobileFilterBtn) {
        mobileFilterBtn = document.createElement('div');
        mobileFilterBtn.id = 'mobile-filter-toggle';
        mobileFilterBtn.innerHTML = '<i class="fa-solid fa-layer-group"></i>';
        mobileFilterBtn.style.display = 'none';
        document.getElementById('search-container').appendChild(mobileFilterBtn);
        mobileFilterBtn.onclick = function() {
            var consolePanel = document.getElementById('console');
            if (consolePanel.classList.contains('open')) { closeMobileConsole(); } 
            else {
                consolePanel.classList.add('open');
                this.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                this.style.background = '#333'; this.style.color = '#fff';
                if(window.innerWidth <= 768) window.closeTimeWidget();
            }
        };
    }
    */

    // window.closeMobileConsole removed from here to avoid duplication with initBottomNav

    var consoleCloseBtn = document.getElementById('console-close-btn');
    if (consoleCloseBtn) { consoleCloseBtn.addEventListener('click', function () { if (window.closeMobileConsole) window.closeMobileConsole(); }); }

    function toggleCategory(cat, btn) {
        if (document.body.classList.contains('mode-1883')) return;
        var textBtn = btn.querySelector('.layer-eye-btn');
        if (disabledCategories.includes(cat)) {
            disabledCategories = disabledCategories.filter(c => c !== cat);
            btn.classList.remove('layer-hidden'); textBtn.innerText = 'HIDE';
        } else {
            disabledCategories.push(cat);
            btn.classList.add('layer-hidden'); textBtn.innerText = 'SHOW';
        }
        document.querySelectorAll('.layer-solo-btn').forEach(b => b.classList.remove('active-solo'));
        updateMapState();
        updateClusterSource();
        if (window.updateChipStates) window.updateChipStates();
    }

    function soloCategory(targetCat, soloBtnElement) {
        if (document.body.classList.contains('mode-1883')) return;
        if (soloBtnElement.classList.contains('active-solo')) { resetFilters(); return; }
        disabledCategories = categories.filter(c => c !== targetCat);
        var allBtns = document.querySelectorAll('.filter-btn[data-cat]');
        allBtns.forEach(b => {
            var cat = b.getAttribute('data-cat');
            var textBtn = b.querySelector('.layer-eye-btn');
            var currentSoloBtn = b.querySelector('.layer-solo-btn');
            if (cat === targetCat) { b.classList.remove('layer-hidden'); textBtn.innerText = 'HIDE'; currentSoloBtn.classList.add('active-solo'); }
            else { b.classList.add('layer-hidden'); textBtn.innerText = 'SHOW'; currentSoloBtn.classList.remove('active-solo'); }
        });
        updateMapState();
        updateClusterSource();
        if (window.updateChipStates) window.updateChipStates();
    }

    function resetFilters() {
        if (document.body.classList.contains('mode-1883')) return;
        disabledCategories = [];
        var btns = document.querySelectorAll('.filter-btn[data-cat]');
        btns.forEach(b => {
            b.classList.remove('layer-hidden');
            b.querySelector('.layer-eye-btn').innerText = 'HIDE';
            b.querySelector('.layer-solo-btn').classList.remove('active-solo');
        });
        updateMapState();
        updateClusterSource();
        if (window.updateChipStates) window.updateChipStates();
    }

    // Zoom threshold for showing individual markers vs clusters
    var CLUSTER_ZOOM_THRESHOLD = 16;

    // Track last filter state to avoid unnecessary cluster updates
    var lastFilterState = { categories: [], year: 2025 };

    // Update marker visibility based on zoom and filters
    function updateMapState() {
        // Check if map exists and get current zoom (may be called before map is ready)
        var currentZoom = (typeof map !== 'undefined' && map.getZoom) ? map.getZoom() : 17;
        var showMarkersBasedOnZoom = currentZoom >= CLUSTER_ZOOM_THRESHOLD;

        markerObjects.forEach(function (m) {
            // For multi-category support: visible if ANY category is not disabled
            var markerCategories = m.categories || [m.category];
            var categoryVisible = markerCategories.some(function (cat) {
                return !disabledCategories.includes(cat);
            });
            var timeVisible = m.year <= currentSliderYear;

            // Show marker only if: zoom is high enough AND category/time filters allow
            // OR if it is the currently selected marker (ensure it stays visible during flyTo/zoom transitions)
            var isSelected = m.element.classList.contains('selected');

            if ((showMarkersBasedOnZoom || isSelected) && categoryVisible && timeVisible) {
                m.element.style.display = 'flex';
                m.element.style.opacity = '1';
                // Ensure z-index is prioritized if selected (handled by CSS .selected)
            }
            else { m.element.style.display = 'none'; }
        });
        if (selectedMarker && selectedMarker.style.display === 'none') { closePanel(false); }
    }

    // Update cluster source - call this only when filters change, not on zoom
    function updateClusterSource() {
        // Check if map and source exist
        if (typeof map === 'undefined' || !map.getSource || !map.getSource('heritage-clusters')) {
            return;
        }

        // Check if filters actually changed
        var currentFilterState = JSON.stringify({ categories: disabledCategories, year: currentSliderYear });
        var lastFilterStateStr = JSON.stringify(lastFilterState);

        if (currentFilterState === lastFilterStateStr) {
            return; // No change, skip update
        }

        // Update last state
        lastFilterState = { categories: disabledCategories.slice(), year: currentSliderYear };

        // Build filtered GeoJSON for clusters
        var filteredFeatures = config.chapters.filter(function (record) {
            // Check category visibility
            var recordCategories = getCategories(record);
            var categoryVisible = recordCategories.some(function (cat) {
                return !disabledCategories.includes(cat);
            });

            // Check time visibility
            var parsedYear = parseYear(record.year);
            var timeVisible = parsedYear <= currentSliderYear;

            return categoryVisible && timeVisible;
        }).map(function (record) {
            // Fix coordinates if needed
            var coords = record.location.center.slice();
            if (coords[0] < coords[1]) {
                coords = [coords[1], coords[0]];
            }

            var recordCategories = getCategories(record);
            var primaryCategory = recordCategories[0] || 'Unknown';

            return {
                "type": "Feature",
                "properties": {
                    "id": record.id,
                    "title": record.title,
                    "category": primaryCategory,
                    "color": config.colors[primaryCategory] || '#333'
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": coords
                }
            };
        });

        var filteredGeoJSON = {
            "type": "FeatureCollection",
            "features": filteredFeatures
        };

        // Update the cluster source data
        map.getSource('heritage-clusters').setData(filteredGeoJSON);
    }

    var separator = document.createElement('div');
    separator.className = 'console-separator';
    layersContent.appendChild(separator);

    var wallBtn = document.createElement('div');
    wallBtn.id = 'wall-btn'; wallBtn.className = 'filter-btn';
    wallBtn.innerHTML = '<div class="layer-label-group"><i class="fa-solid fa-archway"></i> Toggle 1860 Fort Wall</div>';
    wallBtn.onclick = function () { toggleLayer('fort-wall-layer', this); };
    layersContent.appendChild(wallBtn);

    var wallInfo = document.createElement('div');
    wallInfo.id = 'wall-info';
    wallInfo.innerHTML = '<strong>The Invisible Ramparts</strong>This dashed line traces the demolished fortifications of the Bombay Fort (removed 1862).';
    layersContent.appendChild(wallInfo);

    var layersHeader = document.getElementById('layers-header');
    var layersArrow = document.getElementById('layers-arrow');
    layersHeader.addEventListener('click', function () {
        if (layersContent.classList.contains('collapsed')) { layersContent.classList.remove('collapsed'); layersArrow.classList.add('rotated'); }
        else { layersContent.classList.add('collapsed'); layersArrow.classList.remove('rotated'); }
    });

    var defaultBottomPadding = window.innerWidth < 768 ? 0 : 300;
    var mapPadding = { top: 0, bottom: defaultBottomPadding, left: 0, right: 0 };

    var map = new maplibregl.Map({
        container: 'map',
        style: config.style,
        center: startCenter, zoom: initialZoom, minZoom: 14.5,
        maxBounds: [[72.8100, 18.9100], [72.8500, 18.9450]],
        pitch: 45, bearing: -15, antialias: true, attributionControl: false, padding: mapPadding
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    var parsedYears = config.chapters.map(c => parseYear(c.year)).filter(y => !isNaN(y) && y !== 2025);
    var minYear = parsedYears.length > 0 ? Math.min(...parsedYears) : 1850;
    var maxYear = 2025;

    document.getElementById('label-min').innerText = minYear;

    var timeWidget = document.getElementById('time-widget');
    var sliderInput = document.createElement('input');
    sliderInput.type = 'range'; sliderInput.min = minYear; sliderInput.max = maxYear; sliderInput.value = maxYear; sliderInput.id = 'year-slider';
    timeWidget.insertBefore(sliderInput, timeWidget.querySelector('.range-labels'));

    sliderInput.addEventListener('input', function (e) {
        var year = parseInt(e.target.value);
        document.getElementById('year-display').innerText = (year === parseInt(e.target.max)) ? "Present Day" : "Year: " + year;
        currentSliderYear = year;
        updateMapState();
        updateClusterSource();
    });

    // window.closeTimeWidget is now global.

    var timeTravelBtn = document.getElementById('time-travel-btn');
    var timeWidgetEl = document.getElementById('time-widget');

    if (window.innerWidth >= 768) { timeWidgetEl.classList.add('active'); timeTravelBtn.classList.add('active-control'); }

    timeTravelBtn.addEventListener('click', function () {
        var btn = this;
        if (document.body.classList.contains('mode-1883')) { if (window.innerWidth <= 768) showToast("Time Travel unavailable in 1883 Mode"); return; }

        if (timeWidgetEl.classList.contains('active')) {
            // Closing
            window.closeTimeWidget();
        } else {
            // Opening
            timeWidgetEl.classList.add('active');
            btn.classList.add('active-control');
            if (window.innerWidth <= 768) {
                closeMobileConsole();
                // Show backdrop on mobile
                var backdrop = document.getElementById('time-widget-backdrop');
                if (backdrop) backdrop.classList.add('active');
                // Sync Nav
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                const timeNav = document.getElementById('nav-time');
                if (timeNav) timeNav.classList.add('active');
            }
        }
    });

    function setupControl(id, action) {
        var btn = document.getElementById(id);
        btn.addEventListener('click', function () {
            if (document.body.classList.contains('mode-1883') && id !== 'map-1883-btn' && id !== 'zoom-in-btn' && id !== 'zoom-out-btn' && id !== 'compass-btn') { return; }
            action();
            if (window.innerWidth <= 768) { var msg = btn.getAttribute('data-msg'); if (msg) showToast(msg); }
        });
    }

    setupControl('zoom-in-btn', () => map.zoomIn());
    setupControl('zoom-out-btn', () => map.zoomOut());

    var view3dBtn = document.getElementById('view-3d-btn');
    map.on('pitch', function () { if (map.getPitch() > 5) view3dBtn.classList.add('active-control'); else view3dBtn.classList.remove('active-control'); });
    map.on('load', function () { if (map.getPitch() > 5) view3dBtn.classList.add('active-control'); });

    map.on('rotate', function () {
        var compassIcon = document.querySelector('#compass-btn i');
        compassIcon.style.transform = `rotate(${-map.getBearing()}deg)`;
    });

    setupControl('compass-btn', () => {
        map.flyTo({ bearing: 0, pitch: 0 });
        // Visual Feedback
        var btn = document.getElementById('compass-btn');
        btn.classList.add('active-control');
        setTimeout(() => btn.classList.remove('active-control'), 300);
    });
    setupControl('view-3d-btn', () => { var currentPitch = map.getPitch(); if (currentPitch > 5) { map.easeTo({ pitch: 0, bearing: 0 }); } else { map.easeTo({ pitch: 45, bearing: -15 }); } });

    setupControl('reset-view-btn', () => {
        // Reset to original view - same zoom for both desktop and mobile
        map.flyTo({ center: startCenter, zoom: initialZoom, pitch: 45, bearing: -15, duration: 2000 });
        closePanel(true);
    });

    setupControl('map-1883-btn', function () { toggle1883Map(document.getElementById('map-1883-btn')); });

    var geolocate = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        fitBoundsOptions: { maxZoom: 18 }
    });
    map.addControl(geolocate);
    setupControl('locate-btn', () => {
        geolocate.trigger();
        // Visual Feedback
        var btn = document.getElementById('locate-btn');
        btn.classList.add('active-control');
        setTimeout(() => btn.classList.remove('active-control'), 300);
    });

    var tooltip = document.getElementById('tooltip');
    const searchInputMobile = document.getElementById('search-input');
    const searchInputDesktop = document.getElementById('search-input-desktop');
    const searchResults = document.getElementById('search-results');

    // Search handler function
    function handleSearch(e) {
        const val = e.target.value.toLowerCase();
        // Sync the other input
        if (e.target === searchInputMobile && searchInputDesktop) {
            searchInputDesktop.value = e.target.value;
        } else if (e.target === searchInputDesktop && searchInputMobile) {
            searchInputMobile.value = e.target.value;
        }

        if (val.length < 1) { searchResults.style.display = 'none'; return; }

        // Search across title and all categories (supports both 'category' and 'categories')
        const matches = config.chapters.filter(item => {
            var itemCategories = getCategories(item);
            var categoryMatch = itemCategories.some(cat => cat.toLowerCase().includes(val));
            return item.title.toLowerCase().includes(val) || categoryMatch;
        });

        searchResults.innerHTML = ''; searchResults.style.display = 'block';
        if (matches.length > 0) {
            matches.forEach(item => {
                var itemCategories = getCategories(item);
                var categoryDisplay = itemCategories.join(' · ');

                const div = document.createElement('div'); div.className = 'search-item';
                div.innerHTML = `<span class="search-item-title">${item.title}</span><span class="search-item-cat">${categoryDisplay}</span>`;
                div.addEventListener('click', () => {
                    const targetObj = markerObjects.find(obj => obj.id === item.id);
                    if (targetObj) {
                        targetObj.element.click();
                        if (searchInputMobile) searchInputMobile.value = '';
                        if (searchInputDesktop) searchInputDesktop.value = '';
                        searchResults.style.display = 'none';
                        if (window.innerWidth <= 768 && searchInputMobile) { searchInputMobile.blur(); }
                    }
                });
                searchResults.appendChild(div);
            });
        } else { searchResults.innerHTML = '<div class="search-empty">No results found</div>'; }
    }

    // Add listeners to both inputs
    if (searchInputMobile) searchInputMobile.addEventListener('input', handleSearch);
    if (searchInputDesktop) searchInputDesktop.addEventListener('input', handleSearch);

    // Mobile search expansion - hide brand pill when focused
    if (searchInputMobile) {
        var headerPills = document.querySelector('.mobile-header-pills');
        searchInputMobile.addEventListener('focus', function () {
            if (headerPills) headerPills.classList.add('search-expanded');
        });
        searchInputMobile.addEventListener('blur', function () {
            // Delay removal to allow result clicks
            setTimeout(function () {
                if (headerPills && !searchInputMobile.value) {
                    headerPills.classList.remove('search-expanded');
                }
            }, 200);
        });
    }

    document.addEventListener('click', function (e) {
        if (!document.getElementById('search-container').contains(e.target)) {
            searchResults.style.display = 'none';
            // Also collapse search if clicking outside
            var headerPills = document.querySelector('.mobile-header-pills');
            if (headerPills && searchInputMobile && !searchInputMobile.value) {
                headerPills.classList.remove('search-expanded');
            }
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === "Escape") {
            if (document.body.classList.contains('mode-1883')) { toggle1883Map(document.getElementById('map-1883-btn')); }
            else { closePanel(false); }
        }
    });

    map.on("load", function () {
        map.setSky({ 'sky-color': '#87CEEB', 'sky-horizon-blend': 0.5, 'horizon-color': '#ffffff', 'fog-color': '#888888', 'fog-ground-blend': 0.5 });
        var layers = map.getStyle().layers;


        map.addSource('source-1883', { 'type': 'image', 'url': './images/fort-1883.jpg', 'coordinates': [[72.8228, 18.9435], [72.8492, 18.9435], [72.8492, 18.9235], [72.8228, 18.9235]] });
        map.addLayer({ 'id': 'layer-1883', 'type': 'raster', 'source': 'source-1883', 'paint': { 'raster-fade-duration': 0 }, 'layout': { 'visibility': 'none' } });
        map.addLayer({ 'id': '3d-buildings', 'source': 'openmaptiles', 'source-layer': 'building', 'type': 'fill-extrusion', 'minzoom': 15, 'paint': { 'fill-extrusion-color': '#f0f0f0', 'fill-extrusion-height': ['get', 'render_height'], 'fill-extrusion-base': ['get', 'render_min_height'], 'fill-extrusion-opacity': 0.9 } });

        var fortWallGeoJSON = { "type": "Feature", "geometry": { "type": "LineString", "coordinates": [[72.8312, 18.9278], [72.8318, 18.9276], [72.8325, 18.9273], [72.8335, 18.9268], [72.8342, 18.9265]] } };
        map.addSource('fort-wall', { 'type': 'geojson', 'data': fortWallGeoJSON });
        map.addLayer({ 'id': 'fort-wall-layer', 'type': 'line', 'source': 'fort-wall', 'layout': { 'line-join': 'round', 'line-cap': 'round', 'visibility': 'none' }, 'paint': { 'line-color': '#c0392b', 'line-width': 4, 'line-dasharray': [2, 4] } });

        // --- CLUSTERING SETUP ---
        // Create GeoJSON from chapters for clustering
        var clusterGeoJSON = {
            "type": "FeatureCollection",
            "features": config.chapters.map(function (record, index) {
                // AUTO-FIX: Handle Google Maps Format (Lat, Lng) -> (Lng, Lat)
                if (record.location.center[0] < record.location.center[1]) {
                    record.location.center = [record.location.center[1], record.location.center[0]];
                }
                var recordCategories = getCategories(record);
                var primaryCategory = recordCategories[0] || 'Unknown';
                return {
                    "type": "Feature",
                    "properties": {
                        "id": record.id,
                        "index": index,
                        "title": record.title,
                        "category": primaryCategory,
                        "color": config.colors[primaryCategory] || '#333'
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": record.location.center
                    }
                };
            })
        };

        // Add clustering source
        map.addSource('heritage-clusters', {
            type: 'geojson',
            data: clusterGeoJSON,
            cluster: true,
            clusterMaxZoom: 17, // Continue clustering up to zoom 17 (layer hides at 16)
            clusterRadius: 50  // Radius of each cluster when clustering points
        });

        // Cluster circles layer - hidden at zoom 16+
        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'heritage-clusters',
            filter: ['has', 'point_count'],
            maxzoom: 16, // Hide clusters at zoom 16 and above
            paint: {
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#2980b9',  // Small clusters (blue)
                    10,
                    '#8e44ad',  // Medium clusters (purple)
                    25,
                    '#c0392b'   // Large clusters (red)
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    18,   // Small clusters
                    10,
                    24,   // Medium clusters
                    25,
                    30    // Large clusters
                ],
                'circle-stroke-width': 3,
                'circle-stroke-color': '#fff'
            }
        });

        // Cluster count labels - hidden at zoom 16+
        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'heritage-clusters',
            filter: ['has', 'point_count'],
            maxzoom: 16, // Hide cluster labels at zoom 16 and above
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 12
            },
            paint: {
                'text-color': '#ffffff'
            }
        });

        // Click on cluster to zoom in
        // NOTE: Using layer click event for cluster interaction
        map.on('click', 'clusters', function (e) {
            var features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });

            if (!features || features.length === 0) return;

            var clusterId = features[0].properties.cluster_id;
            var coordinates = features[0].geometry.coordinates.slice();
            var clusterSource = map.getSource('heritage-clusters');

            if (!clusterSource) return;

            // Haptic feedback on mobile
            triggerHaptic();

            // MapLibre 4.x uses Promises instead of callbacks
            var expansionZoomResult = clusterSource.getClusterExpansionZoom(clusterId);

            // Check if it's a Promise (modern API) or uses callbacks (legacy)
            if (expansionZoomResult && typeof expansionZoomResult.then === 'function') {
                // Promise-based API (MapLibre 4.x+)
                expansionZoomResult.then(function (zoom) {
                    var targetZoom = Math.min(zoom + 0.5, 18);
                    map.flyTo({
                        center: coordinates,
                        zoom: targetZoom,
                        duration: 500
                    });
                }).catch(function (err) {
                    console.error('Cluster expansion error:', err);
                    // Fallback: zoom in by 2 levels
                    map.flyTo({
                        center: coordinates,
                        zoom: Math.min(map.getZoom() + 2, 18),
                        duration: 500
                    });
                });
            } else {
                // Fallback: just zoom in by 2 levels
                map.flyTo({
                    center: coordinates,
                    zoom: Math.min(map.getZoom() + 2, 18),
                    duration: 500
                });
            }
        });

        // Change cursor on cluster hover
        map.on('mouseenter', 'clusters', function () {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', function () {
            map.getCanvas().style.cursor = '';
        });

        // Listen for zoom changes to show/hide markers based on cluster threshold
        map.on('zoom', function () {
            updateMapState();
        });

        config.chapters.forEach(function (record) {
            // Optimization: Use Wikimedia Thumbnails
            if (window.optimizeWikiImage) {
                record.image = window.optimizeWikiImage(record.image);
            }

            // AUTO-FIX: Handle Google Maps Format (Lat, Lng) -> (Lng, Lat)
            // In Mumbai, Lng (72.8) is always > Lat (18.9). 
            // If [0] < [1], it's inverted.
            if (record.location.center[0] < record.location.center[1]) {
                record.location.center = [record.location.center[1], record.location.center[0]];
                console.log('Auto-corrected coordinates for: ' + record.title);
            }

            // Get categories array (supports both 'category' and 'categories' fields)
            var recordCategories = getCategories(record);
            var primaryCategory = recordCategories[0] || 'Unknown';
            var isMultiCategory = recordCategories.length > 1;

            var color = config.colors[primaryCategory] || '#333';
            var iconClass = config.icons[primaryCategory] || 'fa-map-marker-alt';

            var el = document.createElement('div');
            el.className = 'marker' + (isMultiCategory ? ' marker-multi' : '');
            el.style.backgroundColor = color;
            el.innerHTML = '<i class="fa-solid ' + iconClass + '"></i>';

            // Apply dynamic secondary color ring if multi-category
            if (isMultiCategory) {
                var secondaryCategory = recordCategories[1];
                var secondaryColor = config.colors[secondaryCategory] || '#333';
                el.style.setProperty('--ring-color', secondaryColor);
            }

            record.parsedYear = parseYear(record.year);
            el.onclick = function (e) { e.stopPropagation(); openPanel(record, color, el); };
            if (window.matchMedia('(hover: hover)').matches) {
                el.addEventListener('mouseenter', function (e) { tooltip.innerText = record.title; var rect = el.getBoundingClientRect(); tooltip.style.left = rect.left + (rect.width / 2) + 'px'; tooltip.style.top = rect.top + 'px'; tooltip.style.opacity = '1'; });
                el.addEventListener('mouseleave', function () { tooltip.style.opacity = '0'; });
            }
            var marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(record.location.center).addTo(map);
            markerObjects.push({ element: el, category: primaryCategory, categories: recordCategories, marker: marker, id: record.id, title: record.title, year: record.parsedYear });
        });

        // Set initial marker visibility based on zoom level and filters
        updateMapState();

        // Check for deep link URL parameter (?site=xyz)
        var urlParams = new URLSearchParams(window.location.search);
        var siteId = urlParams.get('site');
        if (siteId) {
            // Find the marker with this ID and click it
            var targetMarker = markerObjects.find(m => m.id === siteId);
            if (targetMarker) {
                // Small delay to ensure map is fully loaded
                setTimeout(function () {
                    targetMarker.element.click();
                    // Clear the URL parameter without reload
                    window.history.replaceState({}, document.title, window.location.pathname);
                }, 500);
            }
        }
    });

    // General map click handler - close panels when clicking empty areas
    map.on('click', function (e) {
        // Check if click was on a cluster
        try {
            if (map.getLayer('clusters')) {
                var clusterFeatures = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
                if (clusterFeatures && clusterFeatures.length > 0) {
                    // Click was on cluster - don't close panels, let cluster handler deal with it
                    return;
                }
            }
        } catch (err) {
            // Layer might not exist yet
        }

        closePanel(false);
        closeMobileConsole();
    });

    window.closePanel = function (preventCameraMove) {
        document.getElementById('side-panel').classList.remove('open');
        if (selectedMarker) { selectedMarker.classList.remove('selected'); selectedMarker = null; }
        if (!preventCameraMove && window.innerWidth >= 768) { map.flyTo({ zoom: initialZoom, speed: 0.6 }); }
    }

    function openPanel(record, color, markerEl) {
        triggerHaptic(); // Feedback

        if (window.innerWidth <= 768) { window.closeTimeWidget(); }
        if (selectedMarker) selectedMarker.classList.remove('selected');
        markerEl.classList.add('selected'); selectedMarker = markerEl;
        var infoHTML = `<div class="panel-info">
            <div class="panel-info-row"><i class="fa-solid fa-calendar"></i><span class="panel-info-label">Year</span><span class="panel-info-val">${record.year}</span></div>
            <div class="panel-info-row"><i class="fa-solid fa-pencil-ruler"></i><span class="panel-info-label">Architect</span><span class="panel-info-val">${record.architect}</span></div>
            <div class="panel-info-row"><i class="fa-solid fa-hammer"></i><span class="panel-info-label">Builder</span><span class="panel-info-val">${record.builder}</span></div>
        </div>`;
        var destLat = record.location.center[1]; var destLng = record.location.center[0];
        var navUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=walking`;
        var quickActions = `<div class="panel-quick-actions">
            <a href="${navUrl}" target="_blank" class="panel-action-btn primary"><i class="fa-solid fa-diamond-turn-right"></i><span>Navigate</span></a>
            <button id="share-btn" class="panel-action-btn secondary"><i class="fa-solid fa-share-nodes"></i><span>Share</span></button>
        </div>`;


        // Get images array (supports both 'image' and 'images' fields)
        var images = record.images && Array.isArray(record.images) ? record.images : [record.image];
        var currentImageIndex = 0;

        // IMAGE GALLERY CONTAINER
        var imageContainer = document.createElement('div');
        imageContainer.className = 'panel-img-container skeleton';

        var img = document.createElement('img');
        img.className = 'panel-img loading';
        img.src = images[0];

        img.onload = function () {
            imageContainer.classList.remove('skeleton');
            img.classList.remove('loading');
        };
        imageContainer.appendChild(img);

        // Add gallery navigation if multiple images
        if (images.length > 1) {
            // Dot indicators
            var dotsContainer = document.createElement('div');
            dotsContainer.className = 'gallery-dots';
            images.forEach(function (_, idx) {
                var dot = document.createElement('span');
                dot.className = 'gallery-dot' + (idx === 0 ? ' active' : '');
                dot.addEventListener('click', function (e) {
                    e.stopPropagation();
                    goToImage(idx);
                });
                dotsContainer.appendChild(dot);
            });
            imageContainer.appendChild(dotsContainer);

            // Arrow buttons
            var prevBtn = document.createElement('button');
            prevBtn.className = 'gallery-arrow gallery-prev';
            prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
            prevBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                goToImage((currentImageIndex - 1 + images.length) % images.length);
            });
            imageContainer.appendChild(prevBtn);

            var nextBtn = document.createElement('button');
            nextBtn.className = 'gallery-arrow gallery-next';
            nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
            nextBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                goToImage((currentImageIndex + 1) % images.length);
            });
            imageContainer.appendChild(nextBtn);

            // Image counter
            var counter = document.createElement('div');
            counter.className = 'gallery-counter';
            counter.textContent = '1 / ' + images.length;
            imageContainer.appendChild(counter);

            // Navigation function
            function goToImage(idx) {
                currentImageIndex = idx;
                img.classList.add('loading');
                imageContainer.classList.add('skeleton');
                img.src = images[idx];
                img.onload = function () {
                    imageContainer.classList.remove('skeleton');
                    img.classList.remove('loading');
                };
                // Update dots
                dotsContainer.querySelectorAll('.gallery-dot').forEach(function (d, i) {
                    d.classList.toggle('active', i === idx);
                });
                // Update counter
                counter.textContent = (idx + 1) + ' / ' + images.length;
            }

            // Swipe support for mobile
            var touchStartX = 0;
            var touchEndX = 0;
            imageContainer.addEventListener('touchstart', function (e) {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            imageContainer.addEventListener('touchend', function (e) {
                touchEndX = e.changedTouches[0].screenX;
                if (touchStartX - touchEndX > 50) {
                    goToImage((currentImageIndex + 1) % images.length); // Swipe left = next
                } else if (touchEndX - touchStartX > 50) {
                    goToImage((currentImageIndex - 1 + images.length) % images.length); // Swipe right = prev
                }
            }, { passive: true });
        }

        // Combine content
        var panelInner = document.getElementById('panel-inner');
        panelInner.innerHTML = '';
        panelInner.appendChild(imageContainer);

        // Build category pills (supports multi-category)
        var recordCategories = getCategories(record);
        var categoryPillsHTML = recordCategories.map(function (cat) {
            var catColor = config.colors[cat] || '#333';
            return `<span class="panel-cat" style="background:${catColor}">${cat}</span>`;
        }).join('');

        var textContent = document.createElement('div');
        textContent.className = 'panel-content';
        textContent.innerHTML = `<div class="panel-header">${categoryPillsHTML}</div><h2 class="panel-title">${record.title}</h2><p class="panel-desc">${record.description}</p>${infoHTML}${quickActions}`;
        panelInner.appendChild(textContent);

        // Add share button functionality
        setTimeout(() => {
            var shareBtn = document.getElementById('share-btn');
            if (shareBtn) {
                shareBtn.addEventListener('click', async function () {
                    triggerHaptic();

                    // Create a deep link URL with the site ID
                    var baseUrl = window.location.origin + window.location.pathname;
                    var shareUrl = baseUrl + '?site=' + encodeURIComponent(record.id);

                    var shareData = {
                        title: record.title + ' - Kala Ghoda Heritage Map',
                        text: record.description,
                        url: shareUrl
                    };

                    // Check if Web Share API is supported
                    if (navigator.share) {
                        try {
                            await navigator.share(shareData);
                            showToast('Shared successfully');
                        } catch (err) {
                            if (err.name !== 'AbortError') {
                                console.log('Share failed:', err);
                                copyToClipboard(record, shareUrl);
                            }
                        }
                    } else {
                        // Fallback: copy to clipboard
                        copyToClipboard(record, shareUrl);
                    }
                });
            }
        }, 100);

        document.getElementById('side-panel').classList.add('open');
        closeMobileConsole();

        // Show scroll hint on mobile with clickable button
        if (window.innerWidth <= 768) {
            var scrollArea = document.getElementById('panel-scroll-area');
            var sidePanel = document.getElementById('side-panel');

            // Remove any existing scroll hint button
            var existingHint = document.getElementById('scroll-hint-btn');
            if (existingHint) existingHint.remove();

            // Create clickable scroll hint button
            var scrollHintBtn = document.createElement('button');
            scrollHintBtn.id = 'scroll-hint-btn';
            scrollHintBtn.className = 'scroll-hint-btn';
            scrollHintBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
            scrollHintBtn.setAttribute('aria-label', 'Scroll down for more');
            sidePanel.appendChild(scrollHintBtn);

            // Click to scroll down
            scrollHintBtn.addEventListener('click', function () {
                triggerHaptic();
                scrollArea.scrollTo({
                    top: scrollArea.scrollTop + 300,
                    behavior: 'smooth'
                });
            });

            // Hide after user scrolls
            var hideHintOnScroll = function () {
                if (scrollArea.scrollTop > 50) {
                    scrollHintBtn.classList.add('hidden');
                    scrollArea.removeEventListener('scroll', hideHintOnScroll);
                }
            };
            scrollArea.addEventListener('scroll', hideHintOnScroll);

            // Reset scroll position
            scrollArea.scrollTop = 0;
        }

        var flyOptions = {
            center: record.location.center,
            zoom: 17.5,
            pitch: map.getPitch(),
            bearing: map.getBearing(),
            speed: 0.8,
            curve: 1
        };

        if (window.innerWidth < 768) {
            // On mobile, offset the center so the marker appears above the bottom sheet
            flyOptions.padding = { top: 20, bottom: window.innerHeight * 0.5, left: 0, right: 0 };
            flyOptions.zoom = 17; // Slightly less zoom on mobile to show context
        }

        map.flyTo(flyOptions);
    }

    document.getElementById('panel-close-btn').addEventListener('click', function () { closePanel(false); });

    window.toggleLayer = function (layerId, btn) {
        if (document.body.classList.contains('mode-1883')) return;
        triggerHaptic();
        var visibility = map.getLayoutProperty(layerId, 'visibility');
        var infoBox = document.getElementById('wall-info');
        if (visibility === 'visible') {
            map.setLayoutProperty(layerId, 'visibility', 'none');
            btn.classList.remove('active-control'); infoBox.style.display = 'none';
        } else {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
            btn.classList.add('active-control'); infoBox.style.display = 'block';
            if (window.innerWidth <= 768) {
                closeMobileConsole();
                var wallContent = infoBox.innerHTML;
                showToast(wallContent, 6000, true, 'wall-mode');
            } else { setTimeout(function () { infoBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50); }
        }
    };

    window.toggle1883Map = function (btn) {
        triggerHaptic();
        var layerId = 'layer-1883';
        var visibility = map.getLayoutProperty(layerId, 'visibility');
        var body = document.body;
        if (visibility === 'visible') {
            map.setLayoutProperty(layerId, 'visibility', 'none');
            btn.classList.remove('active-control'); body.classList.remove('mode-1883');
            updateMapState();
        } else {
            closeTimeWidget();
            document.getElementById('search-input').value = '';
            document.getElementById('search-results').style.display = 'none';
            map.fitBounds([[72.8228, 18.9235], [72.8492, 18.9435]], { padding: { top: 100, bottom: 100, left: 50, right: 50 }, pitch: 0, bearing: 0 });
            map.moveLayer(layerId); // Ensure it renders on top
            map.setLayoutProperty(layerId, 'visibility', 'visible');
            btn.classList.add('active-control'); body.classList.add('mode-1883');
            markerObjects.forEach(function (m) { m.element.style.display = 'none'; });
            closePanel(true);
            if (window.innerWidth <= 768) showToast("1883 Mode Active: Other tools disabled");
        }
    };
}

// Global Helper: Optimize Wikimedia Images
// Converts full-res URLs to 800px thumbnails
window.optimizeWikiImage = function (url) {
    if (!url) return url;
    if (url.indexOf('upload.wikimedia.org') === -1) return url;
    if (url.indexOf('/thumb/') !== -1) return url;

    try {
        var parts = url.split('/');
        var commonsIndex = parts.indexOf('commons');
        if (commonsIndex !== -1) {
            var filename = parts[parts.length - 1];
            // Insert 'thumb' after 'commons'
            parts.splice(commonsIndex + 1, 0, 'thumb');
            // Append the thumbnail specification
            parts.push('800px-' + filename);
            return parts.join('/');
        }
    } catch (e) {
        console.warn('Failed to optimize wiki image:', url);
    }
    return url;
};
