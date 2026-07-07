async function loadGallery() {
  const gallery = document.getElementById("gallery");

  let images;
  try {
    const res = await fetch("data/gallery.json");
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    images = await res.json();
  } catch (err) {
    gallery.innerHTML = '<p style="color:#999; font-size:16px;">Could not load gallery. Please try again later.</p>';
    console.error("Failed to load gallery.json:", err);
    return;
  }

  const webItems   = images.filter(i => i.type === "web-project");
  const albumItems = images.filter(i => i.type === "album");
  buildWebSection(webItems);
  buildAlbumSection(albumItems);

  images.filter(i => i.type !== "web-project").forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.category = item.category || "all";

    if (item.aspect === "portrait")  div.classList.add("item-portrait");
    if (item.aspect === "landscape") div.classList.add("item-landscape");

    if (item.type === "video") {
      div.classList.add("item-video");

      const poster = document.createElement("img");
      poster.src = item.thumb;
      poster.loading = "lazy";
      poster.alt = item.title || "";
      poster.className = "video-poster";

      const video = document.createElement("video");
      video.src = item.full;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "none";
      video.className = "video-preview";

      const playIcon = document.createElement("div");
      playIcon.className = "play-icon";
      playIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="white" width="48" height="48"><circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.45)"/><polygon points="10,8 18,12 10,16" fill="white"/></svg>`;

      div.appendChild(poster);
      div.appendChild(video);
      div.appendChild(playIcon);

      div.addEventListener("mouseenter", () => {
        video.play().catch(() => {});
        poster.style.opacity = "0";
        playIcon.style.opacity = "0";
      });

      div.addEventListener("mouseleave", () => {
        video.pause();
        video.currentTime = 0;
        poster.style.opacity = "1";
        playIcon.style.opacity = "1";
      });

      div.dataset.full = item.full;
      div.dataset.type = "video";

    } else {
      const image = document.createElement("img");
      image.src = item.thumb;
      image.loading = "lazy";
      image.alt = item.title || "";
      image.dataset.full = item.full;

      div.appendChild(image);
      div.dataset.full = item.full;
      div.dataset.type = "image";
    }

    gallery.appendChild(div);
  });

  setupAnimations();
  setupLightbox();
  setupWebModal();
  setupAlbumModal();
  setupFilters("dgp");
}

function buildAlbumSection(albumItems) {
  const section = document.getElementById("album-section");
  section.innerHTML = "";

  albumItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "album-card";
    card.dataset.category = item.category || "";
    card.innerHTML = `
      <div class="album-card-img">
        <img src="${item.thumb}" alt="${item.title || ""}" loading="lazy">
      </div>
      <p class="album-card-title">${item.title || ""}</p>
    `;
    card.addEventListener("click", () => openAlbumModal(item));
    section.appendChild(card);
  });
}

function setupAlbumModal() {
  const modal   = document.getElementById("album-modal");
  const overlay = modal.querySelector(".album-modal-overlay");
  const closeBtn = document.getElementById("album-modal-close");

  closeBtn.addEventListener("click", closeAlbumModal);
  overlay.addEventListener("click", closeAlbumModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeAlbumModal();
  });
}

function openAlbumModal(item) {
  const modal     = document.getElementById("album-modal");
  const heroImg   = document.getElementById("album-modal-hero-img");
  const titleEl   = document.getElementById("album-modal-title");
  const descEl    = document.getElementById("album-modal-desc");
  const linksEl   = document.getElementById("album-modal-links");
  const thumbsEl  = document.getElementById("album-modal-thumbs");

  const photos = item.photos && item.photos.length > 0 ? item.photos : [item.thumb];

  titleEl.textContent = item.title || "";

  // Description
  descEl.textContent = item.description || "";
  descEl.style.display = item.description ? "block" : "none";

  // Links
  linksEl.innerHTML = "";
  (item.links || []).forEach((link, i) => {
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "album-link";
    a.textContent = link.label;
    linksEl.appendChild(a);
  });
  linksEl.style.display = (item.links && item.links.length > 0) ? "flex" : "none";

  heroImg.src = photos[0];
  heroImg.alt = item.title || "";

  thumbsEl.innerHTML = "";
  if (photos.length > 1) {
    photos.forEach((src, i) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      if (i === 0) img.classList.add("active");
      img.addEventListener("click", () => {
        heroImg.style.opacity = "0";
        setTimeout(() => {
          heroImg.src = src;
          heroImg.style.opacity = "1";
        }, 150);
        thumbsEl.querySelectorAll("img").forEach(t => t.classList.remove("active"));
        img.classList.add("active");
      });
      thumbsEl.appendChild(img);
    });
  }

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeAlbumModal() {
  document.getElementById("album-modal").classList.remove("open");
  document.body.style.overflow = "";
}

function buildWebSection(webItems) {
  const section = document.getElementById("web-section");
  section.innerHTML = "";

  const major = webItems.filter(i => i.size === "major");
  const minor = webItems.filter(i => i.size === "minor");
  const soon  = webItems.filter(i => i.size === "soon");

  major.forEach(item => {
    const card = document.createElement("div");
    card.className = "wp-major";
    card.innerHTML = `
      <div class="wp-major-screen">
        <img src="${item.thumb}" alt="${item.title}" loading="lazy">
      </div>
      <div class="wp-major-info">
        <div class="wp-tags">
          ${(item.tags || []).map(t => `<span class="wp-tag">${t}</span>`).join('<span class="wp-tag-sep">·</span>')}
        </div>
        <h3 class="wp-title">${item.title}</h3>
        <p class="wp-desc">${item.shortDescription || item.description || ""}</p>
        <span class="wp-cta">View project →</span>
      </div>
    `;
    card.addEventListener("click", () => openWebModal(item));
    section.appendChild(card);
  });

  if (minor.length > 0) {
    const row = document.createElement("div");
    row.className = "wp-minor-row";
    minor.forEach(item => {
      const card = document.createElement("div");
      card.className = "wp-minor";
      card.dataset.project = JSON.stringify(item);
      card.innerHTML = `
        <div class="wp-minor-screen">
          <img src="${item.thumb}" alt="${item.title}" loading="lazy">
        </div>
        <div class="wp-minor-info">
          <div class="wp-tags">
            ${(item.tags || []).map(t => `<span class="wp-tag">${t}</span>`).join('<span class="wp-tag-sep">·</span>')}
          </div>
          <h3 class="wp-title">${item.title}</h3>
          <p class="wp-desc wp-desc-short">${item.shortDescription || item.description || ""}</p>
          <span class="wp-cta">View project →</span>
        </div>
      `;
      card.addEventListener("click", () => openWebModal(item));
      row.appendChild(card);
    });
    section.appendChild(row);
  }

  soon.forEach(item => {
    const card = document.createElement("div");
    card.className = "wp-soon";
    card.innerHTML = `
      <div class="wp-soon-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div class="wp-soon-text">
        <h3 class="wp-title">${item.title}</h3>
        <p class="wp-desc-short">${item.description || "Currently in progress"}</p>
      </div>
      <span class="wp-badge wp-badge-soon">Coming soon</span>
    `;
    section.appendChild(card);
  });
}

function setupWebModal() {
  const modal   = document.getElementById("web-modal");
  const overlay = modal.querySelector(".web-modal-overlay");
  const closeBtn = document.getElementById("web-modal-close");

  closeBtn.addEventListener("click", closeWebModal);
  overlay.addEventListener("click", closeWebModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeWebModal();
  });
}

function openWebModal(item) {
  const modal   = document.getElementById("web-modal");
  const heroImg = document.getElementById("web-modal-hero-img");
  const tagsEl  = document.getElementById("web-modal-tags");
  const titleEl = document.getElementById("web-modal-title");
  const descEl  = document.getElementById("web-modal-desc");
  const screensEl = document.getElementById("web-modal-screens");
  const linksEl = document.getElementById("web-modal-links");

  heroImg.src = item.thumb;
  heroImg.alt = item.title;
  titleEl.textContent = item.title;
  // Render full description with newlines and bullet points
  const lines = (item.description || "").split("\n");
  descEl.innerHTML = lines.map(line => {
    if (line.startsWith("•") || line.startsWith("*")) {
      return `<span class="wp-bullet">${line.replace(/^[•*]\s*/, "")}</span>`;
    }
    return line ? `<span class="wp-para">${line}</span>` : `<span class="wp-spacer"></span>`;
  }).join("");

  tagsEl.innerHTML = (item.tags || []).map(t => `<span class="wp-tag">${t}</span>`).join('<span class="wp-tag-sep">·</span>');

  screensEl.innerHTML = "";
  const screenLabel = document.querySelector(".web-modal-screens-label");
  if (item.screens && item.screens.length > 0) {
    screenLabel.style.display = "block";
    screensEl.style.display = "grid";
    item.screens.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      img.addEventListener("click", () => {
        const lb = document.getElementById("lightbox");
        const lbImg = document.getElementById("lightbox-img");
        const lbVideo = document.getElementById("lightbox-video");
        lbVideo.style.display = "none";
        lbImg.style.display = "block";
        lbImg.src = src;
        lb.style.display = "flex";
      });
      screensEl.appendChild(img);
    });
  } else {
    screenLabel.style.display = "none";
    screensEl.style.display = "none";
  }

  linksEl.innerHTML = "";
  (item.links || []).forEach((link) => {
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "wp-link";
    a.textContent = link.label;
    linksEl.appendChild(a);
  });

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeWebModal() {
  document.getElementById("web-modal").classList.remove("open");
  document.body.style.overflow = "";
}

function setupAnimations() {
  const items = document.querySelectorAll(".item");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  });
  items.forEach(i => observer.observe(i));
}

function setupLightbox() {
  const lightbox      = document.getElementById("lightbox");
  const lightboxImg   = document.getElementById("lightbox-img");
  const lightboxVideo = document.getElementById("lightbox-video");
  const close         = document.getElementById("lightbox-close");

  function openLightbox(type, src, alt) {
    lightbox.style.display = "flex";
    if (type === "video") {
      lightboxImg.style.display   = "none";
      lightboxVideo.style.display = "block";
      lightboxVideo.src = src;
      lightboxVideo.play().catch(() => {});
    } else {
      lightboxVideo.style.display = "none";
      lightboxVideo.pause();
      lightboxVideo.src = "";
      lightboxImg.style.display = "block";
      lightboxImg.src = src;
      lightboxImg.alt = alt || "";
    }
  }

  function closeLightbox() {
    lightbox.style.display = "none";
    lightboxVideo.pause();
    lightboxVideo.src = "";
    lightboxImg.src = "";
  }

  document.getElementById("gallery").addEventListener("click", (e) => {
    const item = e.target.closest(".item");
    if (!item) return;
    openLightbox(item.dataset.type, item.dataset.full, item.querySelector("img")?.alt);
  });

  close.addEventListener("click", (e) => {
    e.stopPropagation();
    closeLightbox();
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  lightboxVideo.addEventListener("click", (e) => e.stopPropagation());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
}

function setupFilters(defaultFilter = "all") {
  const buttons     = document.querySelectorAll(".button[data-filter]");
  const gallery     = document.getElementById("gallery");
  const webSection  = document.getElementById("web-section");
  const albumSection = document.getElementById("album-section");

  function applyFilter(filter) {
    const items = document.querySelectorAll(".item");
    const albumCards = document.querySelectorAll(".album-card");
    const isWeb   = filter === "web";
    const isAlbum = filter === "events" || filter === "advertising";

    buttons.forEach(b => b.classList.remove("active"));
    const activeBtn = [...buttons].find(b => b.dataset.filter === filter);
    if (activeBtn) activeBtn.classList.add("active");

    gallery.classList.toggle("hidden-section", isWeb || isAlbum);
    webSection.classList.toggle("hidden", !isWeb);
    albumSection.classList.toggle("hidden", !isAlbum);

    if (isAlbum) {
      albumCards.forEach(card => {
        card.style.display = card.dataset.category === filter ? "" : "none";
      });
    }

    gallery.classList.toggle("masonry", filter === "illustrations");
    gallery.classList.toggle("six-col", filter === "animations");

    items.forEach(item => {
      const match = filter === "all" || item.dataset.category === filter;
      item.classList.toggle("hidden", !match);
    });

    if (filter === "illustrations") {
      const illustrationItems = [...items].filter(i => i.dataset.category === "illustrations");
      illustrationItems
        .sort(() => Math.random() - 0.5)
        .forEach(item => gallery.appendChild(item));
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
  });

  applyFilter(defaultFilter);
}

loadGallery();