/* ============================================================
   ui.js — Shared behaviour for all adventure pages.
   Add new interactive features here. Keep this file focused
   on UI behaviour — no content, no styles.
   ============================================================ */

(function () {
  'use strict';

  // ── SIDEBAR: active link tracking via IntersectionObserver ──
  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('#sidebar nav a');

  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('active'));
          const link = document.querySelector(
            `#sidebar nav a[href="#${entry.target.id}"]`
          );
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    sections.forEach(s => observer.observe(s));
  }

  // ── SIDEBAR: smooth scroll on nav click ──
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── PURCHASE / SOURCE LINKS ──
  // Reads window.AdventureLinks (set by each adventure's links.js).
  // Applies low-res swap + blur to ALL uses of a marked image across the page,
  // not just the named container. Also adds a source badge to named containers.
  if (window.AdventureLinks) {
    // Build a map of original filename → info for low-res lookup
    // e.g. "boss-room.jpg" → { lowres, lowresSrc, url, credit }
    const byFilename = new Map();
    Object.entries(window.AdventureLinks).forEach(([id, info]) => {
      if (info.lowres && info.lowresSrc) {
        const srcNoQuery = info.lowresSrc.split('?')[0];
        const ext        = srcNoQuery.match(/\.[^.]+$/)?.[0] || '.jpg';
        const original   = srcNoQuery.replace(`-lowres${ext}`, ext);
        const filename   = original.split('/').pop();
        byFilename.set(filename, info);
      }
    });

    // For low-res gallery items: flag for lightbox handler
    document.querySelectorAll('[data-src]').forEach(el => {
      const filename = el.dataset.src.split('/').pop();
      const info = byFilename.get(filename);
      if (!info) return;
      el.dataset.isLowres = 'true';
      if (info.url) el.dataset.lowresUrl = info.url;
    });

    // Apply low-res to every <img> whose src filename matches
    document.querySelectorAll('img').forEach(img => {
      const filename = img.src.split('/').pop();
      const info = byFilename.get(filename);
      if (!info) return;

      const newSrc = img.src.replace(/images\/[^?]+$/, info.lowresSrc);
      console.log('[lowres] swapping', img.src, '→', newSrc);
      img.src = newSrc;
      img.classList.add('img-lowres');

      // Make the image itself open the purchase URL on click
      if (info.url) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', e => {
          e.stopPropagation();
          window.open(info.url, '_blank', 'noopener,noreferrer');
        });
      }

      // Wrap closest container-like parent for badge + hover class
      const wrap = img.closest('.image-container, .gallery-item, .npc-card') || img.parentElement;
      if (wrap) {
        wrap.classList.add('container-lowres');
        if (info.url && !wrap.querySelector('.purchase-badge')) {
          const badge = document.createElement('a');
          badge.className = 'purchase-badge';
          badge.href = info.url;
          badge.target = '_blank';
          badge.rel = 'noopener noreferrer';
          badge.textContent = info.credit ? `Buy full art: ${info.credit} \u2197` : 'Buy full art \u2197';
          wrap.style.position = 'relative';
          wrap.appendChild(badge);
        }
      }
    });

    // Also handle named containers for source-only badges (lowres: false but has url)
    Object.entries(window.AdventureLinks).forEach(([id, info]) => {
      if (info.lowres || !info.url) return;
      const container = document.querySelector(`[data-link-id="${id}"]`);
      if (!container) return;
      const badge = document.createElement('a');
      badge.className = 'purchase-badge';
      badge.href = info.url;
      badge.target = '_blank';
      badge.rel = 'noopener noreferrer';
      badge.textContent = info.credit ? `Source: ${info.credit} \u2197` : 'Source \u2197';
      container.appendChild(badge);
    });
  }

  // ── IMAGE REVEAL: toggle show/hide for location art ──
  // Works on any element with class .image-reveal containing
  // a .image-toggle button and a .image-container.
  document.querySelectorAll('.image-reveal').forEach(reveal => {
    const btn = reveal.querySelector('.image-toggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = reveal.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });

  // ── IMAGE HOVER PREVIEW ──
  // Hovering any small/modified image shows a floating full-size version.
  let activeImgPreview = null;
  let imgPreviewTimer  = null;

  function scheduleImgPreviewHide() {
    imgPreviewTimer = setTimeout(() => {
      if (activeImgPreview) { activeImgPreview.remove(); activeImgPreview = null; }
    }, 120);
  }
  function cancelImgPreviewHide() { clearTimeout(imgPreviewTimer); }

  document.querySelectorAll('.npc-img, .img-float').forEach(img => {
    img.addEventListener('mouseenter', e => {
      cancelImgPreviewHide();
      if (activeImgPreview) { activeImgPreview.remove(); }
      const preview = document.createElement('div');
      preview.className = 'img-hover-preview';
      const full = document.createElement('img');
      full.src = img.src;
      full.alt = img.alt;
      preview.appendChild(full);
      document.body.appendChild(preview);
      activeImgPreview = preview;
      positionTooltip(preview, e);
    });

    img.addEventListener('mousemove', e => {
      if (activeImgPreview) positionTooltip(activeImgPreview, e);
    });

    img.addEventListener('mouseleave', () => {
      if (activeImgPreview) scheduleImgPreviewHide();
    });
  });

  document.addEventListener('mouseover', e => {
    if (e.target.closest('.img-hover-preview')) cancelImgPreviewHide();
  });
  document.addEventListener('mouseout', e => {
    if (!activeImgPreview) return;
    if (!e.target.closest('.img-hover-preview')) return;
    if (e.relatedTarget?.closest('.img-hover-preview, .npc-img, .img-float')) return;
    scheduleImgPreviewHide();
  });

  // ── WIKI LINK HOVER PREVIEW ──
  // Reads data-preview-title and data-preview-body from the target misc-entry.
  // Shows a floating tooltip on mouseenter, removes on mouseleave.
  let activeTooltip = null;
  let tooltipHideTimer = null;

  function scheduleTooltipHide() {
    tooltipHideTimer = setTimeout(() => {
      if (activeTooltip) { activeTooltip.remove(); activeTooltip = null; }
    }, 120);
  }

  function cancelTooltipHide() { clearTimeout(tooltipHideTimer); }

  document.querySelectorAll('a.wiki-link[href]').forEach(link => {
    link.addEventListener('mouseenter', e => {
      cancelTooltipHide();
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      const target = document.getElementById(href.slice(1));
      if (!target) return;

      const title = target.dataset.previewTitle || target.querySelector('.sb-name, .npc-name, h2')?.textContent || href.slice(1);
      const tag   = target.querySelector('.misc-tag')?.textContent?.trim() || '';
      const contentEl = target.querySelector('.misc-content');

      activeTooltip = document.createElement('div');
      activeTooltip.className = 'link-preview';
      activeTooltip.innerHTML =
        `<div class="lp-header"><span class="lp-title">${escapeHtml(title)}</span>${tag ? `<span class="lp-tag">${escapeHtml(tag)}</span>` : ''}</div>` +
        (contentEl ? `<div class="lp-content">${contentEl.innerHTML}</div>` : '');

      document.body.appendChild(activeTooltip);
      positionTooltip(activeTooltip, e);
    });

    link.addEventListener('mousemove', e => {
      if (activeTooltip) positionTooltip(activeTooltip, e);
    });

    link.addEventListener('mouseleave', e => {
      if (!activeTooltip) return;
      scheduleTooltipHide();
    });
  });

  // Cancel hide when mouse enters the tooltip; dismiss when it leaves
  document.addEventListener('mouseover', e => {
    if (e.target.closest('.link-preview')) cancelTooltipHide();
  });
  document.addEventListener('mouseout', e => {
    if (!activeTooltip) return;
    if (!e.target.closest('.link-preview')) return;
    if (e.relatedTarget?.closest('.link-preview, a.wiki-link')) return;
    scheduleTooltipHide();
  });

  function positionTooltip(el, e) {
    const margin = 14;
    // Temporarily make it visible off-screen to measure size
    el.style.left = '-9999px';
    el.style.top  = '0';
    const w  = el.offsetWidth;
    const h  = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = e.clientX + margin;
    let y = e.clientY + margin;

    if (x + w > vw - margin) x = e.clientX - w - margin;
    if (y + h > vh - margin) y = e.clientY - h - margin;
    if (y < margin)           y = margin;

    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
  }

  // ── GAME TERM TOOLTIPS ──
  if (window.DndTerms) {
    const { SPELLS, CONDITIONS, CREATURES } = window.DndTerms;

    // Build name → {type, key} map
    const nameMap = new Map();
    Object.entries(SPELLS).forEach(([key, d])      => nameMap.set(d[0].toLowerCase(), { type: 'spell',     key }));
    Object.entries(CONDITIONS).forEach(([key, d])  => nameMap.set(d[0].toLowerCase(), { type: 'condition', key }));
    Object.entries(CREATURES).forEach(([key, d])   => nameMap.set(d[0].toLowerCase(), { type: 'creature',  key }));

    // Sort longest-first so "Greater Invisibility" matches before "Invisibility"
    const sorted = [...nameMap.keys()].sort((a, b) => b.length - a.length);
    const esc    = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const TERM_RE = new RegExp('\\b(' + sorted.map(esc).join('|') + ')\\b', 'gi');

    // Scope: mechanical containers + table cells (for puzzle/encounter tables)
    const SCOPE = '.sb-action, .sb-props, .stat-block, .ba-text, .styled-table td';

    function wrapTerms(root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const p = node.parentElement;
          if (!p || p.closest('.game-term, a')) return NodeFilter.FILTER_REJECT;
          if (!node.textContent.trim())          return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);

      nodes.forEach(node => {
        TERM_RE.lastIndex = 0;
        if (!TERM_RE.test(node.textContent)) return;
        TERM_RE.lastIndex = 0;

        const frag = document.createDocumentFragment();
        let last = 0, m;
        while ((m = TERM_RE.exec(node.textContent)) !== null) {
          const term = nameMap.get(m[1].toLowerCase());
          if (!term) continue;
          if (m.index > last) frag.appendChild(document.createTextNode(node.textContent.slice(last, m.index)));
          const span = document.createElement('span');
          span.className = 'game-term game-term--' + term.type;
          span.dataset.termKey  = term.key;
          span.dataset.termType = term.type;
          span.textContent = m[1];
          frag.appendChild(span);
          last = m.index + m[1].length;
        }
        if (last < node.textContent.length) frag.appendChild(document.createTextNode(node.textContent.slice(last)));
        TERM_RE.lastIndex = 0;
        if (frag.childNodes.length > 1 || frag.firstChild?.nodeType !== Node.TEXT_NODE) {
          node.parentNode.replaceChild(frag, node);
        }
      });
    }

    document.querySelectorAll(SCOPE).forEach(wrapTerms);

    // Tooltip
    let activeTip = null;
    let tipHideTimer = null;

    function scheduleTipHide() {
      tipHideTimer = setTimeout(() => {
        if (activeTip) { activeTip.remove(); activeTip = null; }
      }, 120);
    }

    function cancelTipHide() { clearTimeout(tipHideTimer); }

    function showTermTip(span, e) {
      cancelTipHide();
      if (activeTip) { activeTip.remove(); activeTip = null; }
      const { termKey, termType } = span.dataset;
      const data = termType === 'spell' ? SPELLS[termKey] : termType === 'condition' ? CONDITIONS[termKey] : CREATURES[termKey];
      if (!data) return;

      activeTip = document.createElement('div');
      activeTip.className = 'term-tooltip';

      if (termType === 'creature') {
        activeTip.innerHTML =
          '<div class="tt-header"><span class="tt-name">' + escapeHtml(data[0]) + '</span>' +
          '<span class="tt-badge tt-badge--creature">Creature</span></div>' +
          '<div class="tt-meta">' + escapeHtml(data[1]) + '</div>' +
          '<div class="tt-body">' + escapeHtml(data[2]) + '</div>';
      } else if (termType === 'spell') {
        activeTip.innerHTML =
          '<div class="tt-header"><span class="tt-name">' + escapeHtml(data[0]) + '</span>' +
          '<span class="tt-badge tt-badge--spell">Spell</span></div>' +
          '<div class="tt-meta">' + escapeHtml(data[1]) + '</div>' +
          '<div class="tt-props">' +
            '<span>⏱ ' + escapeHtml(data[2]) + '</span>' +
            '<span>📍 ' + escapeHtml(data[3]) + '</span>' +
            '<span>🔮 ' + escapeHtml(data[4]) + '</span>' +
            '<span>⌛ ' + escapeHtml(data[5]) + '</span>' +
          '</div>' +
          '<div class="tt-body">' + escapeHtml(data[6]) + '</div>';
      } else {
        activeTip.innerHTML =
          '<div class="tt-header"><span class="tt-name">' + escapeHtml(data[0]) + '</span>' +
          '<span class="tt-badge tt-badge--condition">Condition</span></div>' +
          '<div class="tt-body tt-body--pre">' + escapeHtml(data[1]) + '</div>';
      }

      document.body.appendChild(activeTip);
      positionTooltip(activeTip, e);
    }

    // mouseover bubbles — reliable for delegation unlike mouseenter
    document.addEventListener('mouseover', e => {
      const span = e.target.closest('.game-term');
      if (span) {
        cancelTipHide();
        if (activeTip && activeTip._span === span) return;
        showTermTip(span, e);
        if (activeTip) activeTip._span = span;
      } else if (e.target.closest('.term-tooltip')) {
        cancelTipHide();
      }
    });

    document.addEventListener('mousemove', e => {
      if (activeTip && e.target.closest('.game-term')) positionTooltip(activeTip, e);
    });

    document.addEventListener('mouseout', e => {
      if (!activeTip) return;
      if (!e.target.closest('.game-term') && !e.target.closest('.term-tooltip')) return;
      if (e.relatedTarget?.closest('.game-term, .term-tooltip')) return;
      scheduleTipHide();
    });
  }

  // ── GALLERY LIGHTBOX ──
  document.querySelectorAll('.gallery-item[data-src]').forEach(item => {
    item.addEventListener('click', () => {
      // Low-res images: open purchase link if available, otherwise block lightbox
      if (item.dataset.isLowres) {
        if (item.dataset.lowresUrl) {
          window.open(item.dataset.lowresUrl, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      const src   = item.dataset.src;
      const label = item.dataset.label || '';

      const overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';

      const img = document.createElement('img');
      img.src = src;
      img.alt = label;
      overlay.appendChild(img);

      if (label) {
        const cap = document.createElement('div');
        cap.className = 'lightbox-caption';
        cap.textContent = label;
        overlay.appendChild(cap);
      }

      overlay.addEventListener('click', () => overlay.remove());
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
      });

      document.body.appendChild(overlay);
    });
  });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

})();
