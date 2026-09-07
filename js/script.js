const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const header = $('#siteHeader');
const progress = $('#progress');
const nav = $('#mainNav');
const menuToggle = $('#menuToggle');

window.addEventListener('scroll', () => {
  header?.classList.toggle('scrolled', window.scrollY > 35);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
}, {passive:true});

menuToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
$$('#mainNav a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded','false');
}));

// Active navigation based on the section currently in view.
const sections = $$('main section[id]');
const navLinks = $$('#mainNav a[href^="#"]');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, {rootMargin:'-35% 0px -55% 0px', threshold:0});
sections.forEach(section => sectionObserver.observe(section));

// Reveal-on-scroll — handles .reveal, .reveal-left, .reveal-right
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {threshold:.12});
$$('.reveal, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));

// Small tilt interaction on desktop.
$$('.tilt').forEach(card => {
  card.addEventListener('pointermove', e => {
    if (window.innerWidth < 900) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX-r.left)/r.width-.5;
    const y = (e.clientY-r.top)/r.height-.5;
    card.style.transform = `perspective(900px) rotateX(${-y*3}deg) rotateY(${x*3}deg) rotate(1deg)`;
  });
  card.addEventListener('pointerleave', () => card.style.transform = 'rotate(1deg)');
});

// Toast.
let toastTimer;
function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// Search panel — tabs, locality and location button all work.
let selectedSearchType = 'Buy';
$$('.search-tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.search-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  selectedSearchType = tab.dataset.type;
  $('#locality').placeholder = selectedSearchType === 'Projects' ? 'Search Project / Locality' : 'Search Locality';
}));

$('#searchForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const locality = $('#locality').value.trim() || 'Kanpur';
  const type = selectedSearchType;
  const property = $('#propertyType').value;
  const result = $('#searchResult');
  result.textContent = `${type} · ${property} · ${locality} — showing the featured Kalyan Infrabuilt project below.`;
  result.classList.add('show');
  document.querySelector('#project')?.scrollIntoView({behavior:'smooth'});
  toast(`Searching ${type.toLowerCase()} properties in ${locality}`);
});

$('#locateBtn')?.addEventListener('click', () => {
  if (!navigator.geolocation) {
    toast('Location access is not available in this browser.');
    return;
  }
  toast('Requesting your location…');
  navigator.geolocation.getCurrentPosition(
    pos => {
      $('#locality').value = `Near ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`;
      toast('Location added to the search field.');
    },
    () => toast('Location permission was not granted. You can enter a locality manually.')
  );
});

// Detail modal content.
const details = {
  pool: {
    eyebrow:'AMENITY · 01', title:'Swimming Pool',
    text:'A dedicated pool area is highlighted in the supplied project material, adding a leisure-focused element to the overall estate experience.',
    meta:['Leisure space','Project brochure highlight']
  },
  vastu: {
    eyebrow:'AMENITY · 02', title:'Vastu-Focused Planning',
    text:'The project brochure highlights 100% Vastu as a key feature of the plotted development.',
    meta:['100% Vastu highlighted','Project brochure']
  },
  security: {
    eyebrow:'AMENITY · 03', title:'Security',
    text:'24x7 CCTV and main gate service are highlighted in the supplied project material as part of the project security infrastructure.',
    meta:['24x7 CCTV','24x7 main gate service']
  },
  sports: {
    eyebrow:'AMENITY · 04', title:'Kids & Sports',
    text:'The supplied amenity list includes a kids park, sports area and box cricket for recreation and everyday activity.',
    meta:['Kids park','Sports area','Box cricket']
  },
  fitness: {
    eyebrow:'AMENITY · 05', title:'Club & Fitness',
    text:'Club area, gym and steam facilities are listed among the amenities in the supplied project material.',
    meta:['Club','Gym','Steam']
  },
  outdoor: {
    eyebrow:'AMENITY · 06', title:'Yoga & Jogging',
    text:'Open yoga space and a jogging track are included in the supplied amenity list, supporting outdoor routines within the setting.',
    meta:['Yoga space','Jogging track']
  },
  roads: {
    eyebrow:'PROJECT DETAIL', title:'Internal Roads',
    text:'The supplied project material highlights 30 ft RCC roads within the estate.',
    meta:['30 ft RCC road','Project brochure highlight']
  },
  lifestyle: {
    eyebrow:'PROJECT DETAIL', title:'Lifestyle Spaces',
    text:'The supplied material brings together club, gym, steam, yoga, jogging, sports and leisure spaces to give the plotted community a more complete lifestyle character.',
    meta:['Club','Fitness','Yoga','Sports']
  }
};

function openDetail(key) {
  const d = details[key];
  if (!d) return;
  $('#modalEyebrow').textContent = d.eyebrow;
  $('#modalTitle').textContent = d.title;
  $('#modalText').textContent = d.text;
  $('#modalMeta').innerHTML = d.meta.map(x => `<span>${x}</span>`).join('');
  openModal();
}
$$('[data-detail]').forEach(el => el.addEventListener('click', () => openDetail(el.dataset.detail)));

function openModal() {
  const modal = $('#detailModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
}
function closeModal() {
  const modal = $('#detailModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}
$$('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
$$('[data-modal]').forEach(el => el.addEventListener('click', () => {
  $('#modalEyebrow').textContent = 'SHIV GANGA ESTATE';
  $('#modalTitle').textContent = 'Project details';
  $('#modalText').textContent = 'Shiv Ganga Estate at Maharajpur is presented as a plotted community with landscaped surroundings, leisure spaces and everyday infrastructure. The supplied project material highlights a swimming pool, car parking, 24x7 CCTV, 100% Vastu, kids park, sports area, 30 ft RCC roads, 24-hour main gate service, box cricket, club, gym, steam, yoga and jogging spaces.';
  $('#modalMeta').innerHTML = ['Maharajpur · Kanpur','Plotted community','Landscape & leisure','Site walkthroughs'].map(x => `<span>${x}</span>`).join('');
  openModal();
}));

// =============================================================
// VIDEO SLIDER — auto-advancing with arrows, dots, thumbs, swipe
// =============================================================
const videos = [
  {
    src:'assets/videos/WhatsApp_Video_2026-09-02_at_11.28.18_AM.mp4',
    poster:'assets/posters/WhatsApp_Video_2026-09-02_at_11.28.18_AM.jpg',
    tag:'Arrival', title:'Estate entrance',
    desc:'A first look at the arrival and approach into the estate.'
  },
  {
    src:'assets/videos/WhatsApp_Video_2026-09-02_at_11.50.06_AM.mp4',
    poster:'assets/posters/WhatsApp_Video_2026-09-02_at_11.50.06_AM.jpg',
    tag:'Landscape', title:'Landscaped gardens',
    desc:'Green edges, planted spaces and the visual rhythm of the landscape.'
  },
  {
    src:'assets/videos/WhatsApp_Video_2026-09-02_at_11.56.56_AM.mp4',
    poster:'assets/posters/WhatsApp_Video_2026-09-02_at_11.56.56_AM.jpg',
    tag:'Movement', title:'Internal roads',
    desc:'A walkthrough of the internal movement and road network.'
  },
  {
    src:'assets/videos/WhatsApp_Video_2026-09-02_at_12.04.08_PM.mp4',
    poster:'assets/posters/WhatsApp_Video_2026-09-02_at_12.04.08_PM.jpg',
    tag:'Open spaces', title:'Room to breathe',
    desc:'Open areas and everyday spaces around the estate.'
  },
  {
    src:'assets/videos/WhatsApp_Video_2026-09-02_at_12.08.02_PM.mp4',
    poster:'assets/posters/WhatsApp_Video_2026-09-02_at_12.08.02_PM.jpg',
    tag:'Walkthrough', title:'Palm-lined walk',
    desc:'A closer look at the planted edges and pedestrian experience.'
  },
  {
    src:'assets/videos/WhatsApp_Video_2026-09-02_at_12.10.51_PM.mp4',
    poster:'assets/posters/WhatsApp_Video_2026-09-02_at_12.10.51_PM.jpg',
    tag:'Detail', title:'Landscape detail',
    desc:'A final visual pass across the estate landscaped character.'
  }
];

let videoIndex = 0;
let videoAutoTimer = null;
const VIDEO_AUTO_MS = 6000; // advance after 6 s when video is idle

const mainVideo = $('#mainVideo');
const mainVideoSource = $('#mainVideoSource');

/* ---- render thumbnail strip — click opens fullscreen ---- */
function renderVideoThumbs() {
  const wrap = $('#videoThumbs');
  if (!wrap) return;
  wrap.innerHTML = videos.map((v, i) => `
    <button class="video-thumb${i === videoIndex ? ' active' : ''}" data-index="${i}" aria-label="Watch: ${v.title}">
      <img src="${v.poster}" alt="${v.title}" loading="lazy">
      <span class="tiny-play">&#9654;</span>
      <div class="video-thumb-copy">
        <span>0${i+1} &middot; ${v.tag}</span>
        <strong>${v.title}</strong>
      </div>
    </button>`).join('');
  $$('.video-thumb', wrap).forEach(t =>
    t.addEventListener('click', () => {
      stopAutoPlay();
      // Select the video index first, then open fullscreen
      selectVideo(Number(t.dataset.index), false);
      openVideoModal();
      startAutoPlay();
    })
  );
}

/* ---- render dot indicators ---- */
function renderDots() {
  const wrap = $('#vsliderDots');
  if (!wrap) return;
  wrap.innerHTML = videos.map((_, i) =>
    `<button class="vslider-dot${i === videoIndex ? ' active' : ''}" data-index="${i}" aria-label="Video ${i+1}"></button>`
  ).join('');
  $$('.vslider-dot', wrap).forEach(d =>
    d.addEventListener('click', () => {
      stopAutoPlay();
      selectVideo(Number(d.dataset.index), true);
      startAutoPlay();
    })
  );
}

/* ---- sync active states without full re-render ---- */
function syncUI() {
  $$('.vslider-dot').forEach((d, i) => d.classList.toggle('active', i === videoIndex));
  $$('.video-thumb').forEach((t, i) => t.classList.toggle('active', i === videoIndex));
  // scroll active thumb into view
  const activeThumb = $$('.video-thumb')[videoIndex];
  if (activeThumb) activeThumb.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
}

/* ---- select and optionally play a video ---- */
function selectVideo(index, autoplay) {
  videoIndex = ((index % videos.length) + videos.length) % videos.length;
  const v = videos[videoIndex];
  if (mainVideo) {
    mainVideo.pause();
    mainVideoSource.src = v.src;
    mainVideo.poster = v.poster;
    mainVideo.load();
  }
  const countEl = $('#videoCount');
  if (countEl) countEl.textContent = `${String(videoIndex+1).padStart(2,'0')} / 0${videos.length}`;
  const tagEl = $('#videoTag');       if (tagEl)   tagEl.textContent   = v.tag;
  const titleEl = $('#videoTitle');   if (titleEl) titleEl.textContent = v.title;
  const descEl = $('#videoDescription'); if (descEl) descEl.textContent = v.desc;
  const prog = $('#videoProgress');
  if (prog) prog.style.width = `${((videoIndex + 1) / videos.length) * 100}%`;
  syncUI();
  if (autoplay && mainVideo) mainVideo.play().catch(() => {});
}

/* ---- auto-play: tick every VIDEO_AUTO_MS, advance if video is idle ---- */
function startAutoPlay() {
  stopAutoPlay();
  videoAutoTimer = setInterval(() => {
    if (mainVideo && !mainVideo.paused) return; // let natural playback finish
    selectVideo(videoIndex + 1, false);
  }, VIDEO_AUTO_MS);
}
function stopAutoPlay() {
  clearInterval(videoAutoTimer);
  videoAutoTimer = null;
}

/* advance on natural video end */
mainVideo?.addEventListener('ended', () => {
  selectVideo(videoIndex + 1, true);
});

/* progress bar synced to playback */
mainVideo?.addEventListener('timeupdate', () => {
  if (!mainVideo.duration) return;
  const prog = $('#videoProgress');
  if (prog) prog.style.width = `${(mainVideo.currentTime / mainVideo.duration) * 100}%`;
});

/* play / pause button — stops click from bubbling to the card */
mainVideo?.addEventListener('play',  () => { const b = $('#mainPlay'); if (b) b.innerHTML = '&#9646;&#9646;'; });
mainVideo?.addEventListener('pause', () => { const b = $('#mainPlay'); if (b) b.innerHTML = '&#9654;'; });

$('#mainPlay')?.addEventListener('click', e => {
  e.stopPropagation(); // prevent card-click from firing
  if (!mainVideo) return;
  if (mainVideo.paused) {
    mainVideo.play().catch(() => {});
    stopAutoPlay();
  } else {
    mainVideo.pause();
    startAutoPlay();
  }
});

/* video fullscreen button — stop propagation (card click also opens modal, avoid double) */
$('#videoFullscreen')?.addEventListener('click', e => {
  e.stopPropagation();
  openVideoModal();
});

/* clicking anywhere on the main video card opens fullscreen modal */
$('#videoMainCard')?.addEventListener('click', () => {
  openVideoModal();
});
/* keyboard enter/space on card also opens */
$('#videoMainCard')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVideoModal(); }
});

/* left / right arrow buttons */
$('#prevVideo')?.addEventListener('click', () => {
  stopAutoPlay();
  selectVideo(videoIndex - 1, true);
  startAutoPlay();
});
$('#nextVideo')?.addEventListener('click', () => {
  stopAutoPlay();
  selectVideo(videoIndex + 1, true);
  startAutoPlay();
});

/* touch swipe on main video card */
(function() {
  const card = $('.video-main-card');
  if (!card) return;
  let startX = 0;
  card.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive:true});
  card.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 40) return;
    stopAutoPlay();
    selectVideo(diff > 0 ? videoIndex + 1 : videoIndex - 1, true);
    startAutoPlay();
  }, {passive:true});
})();

/* thumbnail strip — vertical wheel scrolls horizontally */
(function() {
  const wrap = $('#videoThumbs');
  if (!wrap) return;
  wrap.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      wrap.scrollLeft += e.deltaY;
    }
  }, {passive:false});
})();

/* initialise */
renderVideoThumbs();
renderDots();

// Only auto-advance when the #videos section is actually visible in viewport
(function() {
  const videoSection = $('#videos');
  if (!videoSection) { startAutoPlay(); return; }

  const visibilityObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        startAutoPlay();
      } else {
        stopAutoPlay();
      }
    });
  }, { threshold: 0.25 });

  visibilityObserver.observe(videoSection);
})();

// =============================================================
// VIDEO FULLSCREEN MODAL
// =============================================================
function openVideoModal() {
  const v = videos[videoIndex];
  const modal = $('#videoModal');
  const player = $('#modalVideo');
  player.src = v.src;
  player.poster = v.poster;
  $('#modalVideoTitle').textContent = v.title;
  $('#modalVideoDescription').textContent = v.desc;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  player.play().catch(() => {});
}

function closeVideoModal() {
  const modal = $('#videoModal');
  const player = $('#modalVideo');
  player.pause();
  player.removeAttribute('src');
  player.load();
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

/* In-modal prev/next: change video without closing modal */
function modalSelectVideo(newIndex) {
  videoIndex = ((newIndex % videos.length) + videos.length) % videos.length;
  const v = videos[videoIndex];
  const player = $('#modalVideo');
  if (player) {
    player.pause();
    player.src = v.src;
    player.poster = v.poster;
    player.load();
    player.play().catch(() => {});
  }
  // Also sync the main card info
  const countEl = $('#videoCount'); if (countEl) countEl.textContent = `${String(videoIndex+1).padStart(2,'0')} / 0${videos.length}`;
  const tagEl = $('#videoTag');     if (tagEl)   tagEl.textContent   = v.tag;
  const titleEl = $('#videoTitle'); if (titleEl) titleEl.textContent = v.title;
  const descEl  = $('#videoDescription'); if (descEl) descEl.textContent = v.desc;
  const prog = $('#videoProgress'); if (prog) prog.style.width = `${((videoIndex+1)/videos.length)*100}%`;
  $('#modalVideoTitle').textContent = v.title;
  $('#modalVideoDescription').textContent = v.desc;
  syncUI();
}

$('#modalPrev')?.addEventListener('click', () => modalSelectVideo(videoIndex - 1));
$('#modalNext')?.addEventListener('click', () => modalSelectVideo(videoIndex + 1));

$$('[data-close-video]').forEach(el => el.addEventListener('click', closeVideoModal));

// =============================================================
// GALLERY LIGHTBOX
// =============================================================
function openLightbox(src, caption) {
  $('#lightboxImage').src = src;
  $('#lightboxImage').alt = caption;
  $('#lightboxCaption').textContent = caption;
  $('#lightbox').classList.add('open');
  $('#lightbox').setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
}
function closeLightbox() {
  $('#lightbox').classList.remove('open');
  $('#lightbox').setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}
$$('.gallery-item').forEach(item =>
  item.addEventListener('click', () => openLightbox(item.dataset.image, item.dataset.caption))
);
$$('[data-close-lightbox]').forEach(el => el.addEventListener('click', closeLightbox));

// Location context button.
$('#mapAction')?.addEventListener('click', () => {
  $('#modalEyebrow').textContent = 'LOCATION CONTEXT';
  $('#modalTitle').textContent = 'Maharajpur · Kanpur';
  $('#modalText').textContent = 'The supplied project material places Shiv Ganga Estate at Maharajpur, Kanpur and includes a Greater Kanpur reference map plus regional infrastructure clippings. These references are intended to provide context around the project rather than promise travel times or investment outcomes.';
  $('#modalMeta').innerHTML = ['Maharajpur','Kanpur','Greater Kanpur','Regional context'].map(x => `<span>${x}</span>`).join('');
  openModal();
});

// Enquiry form.
$('#enquiryForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#name').value.trim();
  const interest = $('#interest').value;
  const success = $('#formSuccess');
  success.hidden = false;
  success.textContent = `Thank you${name ? ', ' + name : ''}. Your enquiry for ${interest.toLowerCase()} has been captured on this page. The form can now be connected to the client verified email, CRM or backend.`;
  e.target.reset();
  toast('Enquiry captured successfully.');
});

// Escape closes all overlays. Arrow keys navigate video modal.
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeLightbox();
    closeVideoModal();
  }
  // Arrow navigation inside open video modal
  const videoModalOpen = $('#videoModal')?.classList.contains('open');
  if (videoModalOpen) {
    if (e.key === 'ArrowLeft')  modalSelectVideo(videoIndex - 1);
    if (e.key === 'ArrowRight') modalSelectVideo(videoIndex + 1);
  }
});

$('#year').textContent = new Date().getFullYear();

// Cinematic hero slideshow.
const heroSlides = $$('.hero-slide');
const heroDots = $$('#heroSlidesDots span');
let heroIndex = 0;
if (heroSlides.length) {
  setInterval(() => {
    heroSlides[heroIndex]?.classList.remove('active');
    heroDots[heroIndex]?.classList.remove('active');
    heroIndex = (heroIndex + 1) % heroSlides.length;
    heroSlides[heroIndex]?.classList.add('active');
    heroDots[heroIndex]?.classList.add('active');
  }, 5200);
}
