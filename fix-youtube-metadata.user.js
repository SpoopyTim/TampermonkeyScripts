// ==UserScript==
// @name         YouTube Original Video Metadata (Layout Fixed)
// @namespace    http://tampermonkey.net/
// @version      2026-03-28
// @description  Restore original YouTube metadata layout (proper spacing + size)
// @author       SpoopyTim
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// @homepageURL  https://github.com/spoopytim/TampermonkeyScripts
// @supportURL   https://github.com/spoopytim/TampermonkeyScripts/issues
// @downloadURL  https://raw.githubusercontent.com/spoopytim/TampermonkeyScripts/main/fix-youtube-metadata.user.js
// @updateURL    https://raw.githubusercontent.com/spoopytim/TampermonkeyScripts/main/fix-youtube-metadata.user.js
// ==/UserScript==

(function () {
    'use strict';

    function fixItem(item) {
        const meta = item.querySelector('yt-content-metadata-view-model');
        if (!meta) return;

        const texts = meta.querySelectorAll('.yt-content-metadata-view-model__metadata-text');
        if (texts.length < 3) return;

        const channelEl = texts[0];
        const viewsEl = texts[1];
        const timeEl = texts[2];

        if (!channelEl || !viewsEl || !timeEl) return;
        if (meta.dataset.fixed) return;
        meta.dataset.fixed = "true";

        // Change it to horizontal layout from vertical layout
        meta.style.display = "flex";
        meta.style.flexDirection = "column";
        meta.style.alignItems = "flex-start";

        // Blow up old stuff
        viewsEl.style.display = 'none';
        timeEl.style.display = 'none';

        meta.querySelectorAll('.yt-content-metadata-view-model__delimiter, .yt-content-metadata-view-model__leading-icon')
            .forEach(el => el.style.display = 'none');

        const newLine = document.createElement('div');
        newLine.textContent = `${viewsEl.textContent} views • ${timeEl.textContent}`;

        // Fix size & spacing
        newLine.style.fontSize = "13px";
        newLine.style.color = "#aaa";
        newLine.style.marginTop = "2px";

        meta.appendChild(newLine);
    }

    function scan() {
        document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer')
            .forEach(fixItem);
    }

    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    scan();
})();