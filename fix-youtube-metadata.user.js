// ==UserScript==
// @name         YouTube Original Video Metadata (Layout Fixed)
// @namespace    http://tampermonkey.net/
// @version      2026-03-31.1
// @license      MIT
// @description  Restore original YouTube metadata layout (proper spacing + size)
// @author       SpoopyTim
// @match        https://www.youtube.com/*
// @grant        GM_addStyle
// @run-at       document-idle
// @homepageURL  https://github.com/spoopytim/TampermonkeyScripts
// @supportURL   https://github.com/spoopytim/TampermonkeyScripts/issues
// @downloadURL  https://raw.githubusercontent.com/spoopytim/TampermonkeyScripts/main/fix-youtube-metadata.user.js
// @updateURL    https://raw.githubusercontent.com/spoopytim/TampermonkeyScripts/main/fix-youtube-metadata.user.js
// ==/UserScript==

(function () {
    'use strict';

    function hideJunk(meta, includeIcon = false) {
        let selector = '.yt-content-metadata-view-model__delimiter, .yt-content-metadata-view-model__leading-icon';
        if (includeIcon) selector += ', .yt-content-metadata-view-model__icon';

        meta.querySelectorAll(selector)
            .forEach(el => el.style.display = 'none');
    }

    function createLine(text, options = {}) {
        const el = document.createElement('div');
        el.textContent = text;

        el.className = options.className || 'spoofed-metadata-line';

        return el;
    }

    function fixTime(timeContent) {
        const map = {
            sec: 'second',
            min: 'minute',
            hr: 'hour',
            wk: 'week',
            mo: 'month',
            yr: 'year'
        };

        return timeContent
            .replace(/\b(sec|min|hr|wk|mo|yr)\b/g, m => map[m] || m)
            .replace(/(\d+)\s(second|minute|hour|week|month|year)\b/g,
                (m, num, unit) => `${num} ${unit}${num === "1" ? "" : "s"}`);
    }

    function formatViewsAndTime(viewsEl, timeEl) {
        let viewsText = viewsEl.textContent;

        if (!viewsText.includes('view')) {
            viewsText = `${viewsText} views`;
        }

        return `${viewsText} • ${fixTime(timeEl.textContent)}`;
    }

    function fixUniversal(item) {
        const meta =
            item.querySelector('#metadata') ||
            item.querySelector('yt-content-metadata-view-model');

        if (!meta) return;

        const line = meta.querySelector('#metadata-line');
        if (line) {
            const spans = [...line.querySelectorAll('.inline-metadata-item, span')]
                .filter(el => el.textContent.trim());

            if (spans.length >= 2) {
                const viewsEl = spans[0];
                const timeEl = spans[1];

                hideJunk(meta);

                const formatted = formatViewsAndTime(viewsEl, timeEl);

                let customLine = meta.querySelector('.spoofed-metadata-line');
                if (!customLine) {
                    customLine = createLine(formatted, {
                        className: 'spoofed-metadata-line'
                    });
                    meta.appendChild(customLine);
                } else if (customLine.textContent !== formatted) {
                    customLine.textContent = formatted;
                }

                viewsEl.style.display = 'none';
                timeEl.style.display = 'none';
            }

            return;
        }

        // yt-content-metadata-view-model (home feed etc.)
        const texts = meta.querySelectorAll('.yt-content-metadata-view-model__metadata-text');
        if (texts.length < 2) return;

        // Livestream case (channel + watching)
        if (texts.length === 2) {
            const watchingEl = texts[1];
            if (!watchingEl) return;

            hideJunk(meta, true);

            let customLine = meta.querySelector('.spoofed-metadata-line');
            if (!customLine) {
                customLine = createLine(watchingEl.textContent, {
                    className: 'spoofed-metadata-line'
                });
                meta.appendChild(customLine);
            } else if (customLine.textContent !== watchingEl.textContent) {
                customLine.textContent = watchingEl.textContent;
            }

            watchingEl.style.display = 'none';
            return;
        }

        // Normal case (channel, views, time)
        if (texts.length >= 3) {
            const viewsEl = texts[1];
            const timeEl = texts[2];

            if (!viewsEl || !timeEl) return;

            hideJunk(meta);

            const formatted = formatViewsAndTime(viewsEl, timeEl);

            let customLine = meta.querySelector('.spoofed-metadata-line');
            if (!customLine) {
                customLine = createLine(formatted, {
                    className: 'spoofed-metadata-line'
                });
                meta.appendChild(customLine);
            } else if (customLine.textContent !== formatted) {
                customLine.textContent = formatted;
            }

            viewsEl.style.display = 'none';
            timeEl.style.display = 'none';
        }
    }

    function scan() {
        document.querySelectorAll(
            'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-grid-media'
        ).forEach(fixUniversal);
    }

    function injectStyles() {
        GM_addStyle(`
            ytd-grid-video-renderer h3.ytd-grid-video-renderer {
                margin: 8px 0 2px !important;
            }

            .spoofed-metadata-line {
                font-size: 14px;
                color: #aaa;
                margin-top: 2px;
            }
        `);
    }

    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    injectStyles();
    scan();

})();