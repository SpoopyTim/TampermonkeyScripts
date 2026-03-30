// ==UserScript==
// @name         YouTube Original Video Metadata (Layout Fixed)
// @namespace    http://tampermonkey.net/
// @version      2026-03-30.1
// @license      MIT
// @description  Restore original YouTube metadata layout (proper spacing + size)
// @author       SpoopyTim
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-idle
// @homepageURL  https://github.com/spoopytim/TampermonkeyScripts
// @supportURL   https://github.com/spoopytim/TampermonkeyScripts/issues
// @downloadURL  https://raw.githubusercontent.com/spoopytim/TampermonkeyScripts/main/fix-youtube-metadata.user.js
// @updateURL    https://raw.githubusercontent.com/spoopytim/TampermonkeyScripts/main/fix-youtube-metadata.user.js
// ==/UserScript==

(function () {
    'use strict';

    function applyLayout(meta) {
        meta.style.display = "flex";
        meta.style.flexDirection = "column";
        meta.style.alignItems = "flex-start";
    }

    function hideJunk(meta, includeIcon = false) {
        let selector = '.yt-content-metadata-view-model__delimiter, .yt-content-metadata-view-model__leading-icon';
        if (includeIcon) selector += ', .yt-content-metadata-view-model__icon';
        meta.querySelectorAll(selector).forEach(el => el.style.display = 'none');
    }

    function createLine(text, options = {}) {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.fontSize = options.fontSize || "14px";
        el.style.color = options.color || "#aaa";
        el.style.marginTop = options.marginTop || "2px";
        if (options.className) el.className = options.className;
        return el;
    }

    function fixTime(timeContent) {
        const map = { sec: 'second', min: 'minute', hr: 'hour', wk: 'week', mo: 'month', yr: 'year' };
        return timeContent
            .replace(/\b(sec|min|hr|wk|mo|yr)\b/g, m => map[m] || m)
            .replace(/(\d+)\s(second|minute|hour|week|month|year)\b/g, (m, num, unit) => `${num} ${unit}${num === "1" ? "" : "s"}`);
    }

    function formatViewsAndTime(viewsEl, timeEl) {
        let viewsText = viewsEl.textContent;
        if (!viewsText.includes('view')) viewsText = `${viewsText} views`;
        return `${viewsText} • ${fixTime(timeEl.textContent)}`;
    }

    function fixGridItem(item) {
        const meta = item.querySelector('#metadata');
        const line = item.querySelector('#metadata-line');
        if (!meta || !line) return;

        const spans = line.querySelectorAll('span');
        if (spans.length < 2) return;
        const viewsEl = spans[0], timeEl = spans[1];
        if (!viewsEl || !timeEl) return;

        hideJunk(meta);

        const formatted = formatViewsAndTime(viewsEl, timeEl);

        // Find or create the custom line
        let customLine = meta.querySelector('.spoofed-metadata-line');
        if (!customLine) {
            customLine = createLine(formatted, { className: 'spoofed-metadata-line' });
            meta.appendChild(customLine);
        } else if (customLine.textContent !== formatted) {
            // update if changed
            customLine.textContent = formatted;
        }

        // Hide original
        viewsEl.style.display = 'none';
        timeEl.style.display = 'none';
    }

    function fixItem(item) {
        const meta = item.querySelector('yt-content-metadata-view-model');
        if (!meta) return;

        const texts = meta.querySelectorAll('.yt-content-metadata-view-model__metadata-text');
        if (texts.length < 2) return;

        applyLayout(meta);

        // Livestream / "watching" case
        if (texts.length === 2) {
            const channelEl = texts[0], watchingEl = texts[1];
            if (!channelEl || !watchingEl) return;

            hideJunk(meta, true);

            let customLine = meta.querySelector('.spoofed-metadata-line');
            if (!customLine) {
                customLine = createLine(watchingEl.textContent, { className: 'spoofed-metadata-line' });
                meta.appendChild(customLine);
            } else if (customLine.textContent !== watchingEl.textContent) {
                customLine.textContent = watchingEl.textContent;
            }

            watchingEl.style.display = 'none';
            return;
        }

        if (texts.length < 3) return;
        const channelEl = texts[0], viewsEl = texts[1], timeEl = texts[2];
        if (!channelEl || !viewsEl || !timeEl) return;

        hideJunk(meta);

        const formatted = formatViewsAndTime(viewsEl, timeEl);

        let customLine = meta.querySelector('.spoofed-metadata-line');
        if (!customLine) {
            customLine = createLine(formatted, { className: 'spoofed-metadata-line' });
            meta.appendChild(customLine);
        } else if (customLine.textContent !== formatted) {
            customLine.textContent = formatted;
        }

        viewsEl.style.display = 'none';
        timeEl.style.display = 'none';
    }

    function scan() {
        document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer').forEach(fixItem);
        document.querySelectorAll('ytd-grid-video-renderer, ytd-rich-grid-media').forEach(fixGridItem);
    }

    // Fix the large gap from the expected smaller font size
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            ytd-grid-video-renderer h3.ytd-grid-video-renderer {
                margin: 8px 0 2px !important;
            }
        `;
        document.head.appendChild(style);
    }

    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    injectStyles();
    scan();

})();