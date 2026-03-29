// ==UserScript==
// @name         YouTube Original Video Metadata (Layout Fixed)
// @namespace    http://tampermonkey.net/
// @version      2026-03-28
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
        if (includeIcon) {
            selector += ', .yt-content-metadata-view-model__icon';
        }

        meta.querySelectorAll(selector)
            .forEach(el => el.style.display = 'none');
    }

    function createLine(text) {
        const el = document.createElement('div');
        el.textContent = text;

        // Fix size & spacing
        el.style.fontSize = "14px";
        el.style.color = "#aaa";
        el.style.marginTop = "2px";

        return el;
    }

    function fixItem(item) {
        const meta = item.querySelector('yt-content-metadata-view-model');
        if (!meta) return;
        if (meta.dataset.fixed) return;

        const texts = meta.querySelectorAll('.yt-content-metadata-view-model__metadata-text');
        if (texts.length < 2) return;

        meta.dataset.fixed = "true";
        applyLayout(meta);

        // Handle livestream / "watching" case (only 2 items)
        if (texts.length === 2) {
            const channelEl = texts[0];
            const watchingEl = texts[1];
            if (!channelEl || !watchingEl) return;

            hideJunk(meta, true);

            // Move "watching" to new line
            watchingEl.style.display = 'none';
            meta.appendChild(createLine(watchingEl.textContent));

            return;
        }

        if (texts.length < 3) return;

        const channelEl = texts[0];
        const viewsEl = texts[1];
        const timeEl = texts[2];
        if (!channelEl || !viewsEl || !timeEl) return;

        // Blow up old stuff
        viewsEl.style.display = 'none';
        timeEl.style.display = 'none';

        hideJunk(meta);

        meta.appendChild(
            createLine(`${viewsEl.textContent} views • ${timeEl.textContent}`)
        );
    }

    function scan() {
        document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer')
            .forEach(fixItem);
    }

    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    scan();
})();
