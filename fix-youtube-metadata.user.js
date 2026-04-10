// ==UserScript==
// @name         YouTube Original Video Metadata (Layout Fixed)
// @namespace    http://tampermonkey.net/
// @version      2026-04-10.1
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
            .forEach(el => { el.style.display = 'none' });
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

    function handleRecommendationsMetadata(meta, spans) {
        // Case A: livestream (channel name + viewers)
        if (spans.length === 2) {
            const watchingEl = spans[1];
            if (!watchingEl) return;

            hideJunk(meta, true);

            updateCustomLine(meta, watchingEl.textContent);

            watchingEl.style.display = 'none';
            return;
        }

        // Case B: normal (channel name + views + time)
        if (spans.length >= 3) {
            const viewsEl = spans[1];
            const timeEl = spans[2];

            if (!viewsEl || !timeEl) return;

            hideJunk(meta);

            const formatted = formatViewsAndTime(viewsEl, timeEl);
            updateCustomLine(meta, formatted);

            viewsEl.style.display = 'none';
            timeEl.style.display = 'none';
        }
    }

    function handleLivestreamMetadata(meta, watchingEl) {
        if (!watchingEl) return;

        hideJunk(meta, true);

        updateCustomLine(meta, watchingEl.textContent);

        watchingEl.style.display = 'none';
    }


    function handleNormalMetadata(meta, texts) {
        const viewsEl = texts[0];
        const timeEl = texts[1];

        if (!viewsEl || !timeEl) return;

        hideJunk(meta);

        const formatted = formatViewsAndTime(viewsEl, timeEl);
        updateCustomLine(meta, formatted);

        viewsEl.style.display = 'none';
        timeEl.style.display = 'none';
    }


    function updateCustomLine(meta, text) {
        let customLine = meta.querySelector('.spoofed-metadata-line');

        if (!customLine) {
            customLine = createLine(text, {
                className: 'spoofed-metadata-line'
            });
            meta.appendChild(customLine);
        } else if (customLine.textContent !== text) {
            customLine.textContent = text;
        }
    }

    function handleRecommendations(meta) {
        const rowContainers = meta.querySelectorAll(".ytContentMetadataViewModelMetadataRow");
        if (!rowContainers) return;
        // In sidebar recommendations, the inner we want is the second row
        let inner
        // >= 2 because it might have NEW under it which is another row.
        // If this is the case then 0 = channel name, 1 = views and time, 2 = NEW
        let isSidenavVideos = (rowContainers.length >= 2); 
        if (isSidenavVideos) {
            inner = rowContainers[1]
        } else {
            inner = rowContainers[0]
        }
        const homepageSpans = [...inner.querySelectorAll('span.ytAttributedStringHost')]
        .filter(el => el.textContent.trim());

        if (isSidenavVideos) {
            // Fix the font sizing of the channel name, could probably move this to GM_addStyle later
            rowContainers[0].querySelectorAll('span.ytAttributedStringHost')[0].style.fontSize = "14px";
            return handleNormalMetadata(inner, homepageSpans);
        }

        if (homepageSpans.length >= 2 && !homepageSpans[1]?.textContent?.includes('waiting')) {
            return handleRecommendationsMetadata(meta, homepageSpans);
        } else {
            return handleLivestreamMetadata(meta, homepageSpans[1]);
        }
    }

    function handleChannel(meta) {
        const inner = meta.querySelector('#metadata-line');
        if (!inner) return;
        const channelSpans = [...inner.querySelectorAll('span.ytd-grid-video-renderer, span.inline-metadata-item')]
        .filter(el => el.textContent.trim());

        if (channelSpans.length === 2) {
            return handleNormalMetadata(inner, channelSpans);
        }
    }

    function handleSearch(meta) {
        const inner = meta.querySelector('#metadata-line');
        if (!inner) return;
        const searchSpans = [...inner.querySelectorAll('span.inline-metadata-item')]
        .filter(el => el.textContent.trim());
        if (searchSpans.length === 2) {
            return handleNormalMetadata(inner, searchSpans);
        }

        if (searchSpans.length === 1) {
            return handleLivestreamMetadata(inner, searchSpans[0]);
        }
    }

    function scan() {
        // The element selected here determines where the spoofed line gets added by updateCustomLine(). This is for the homepage only because jank
        // This selector applies to both the homepage and the recommendations on the right side of videos
        document.querySelectorAll('.ytLockupMetadataViewModelMetadata').forEach(handleRecommendations);
        // ytd-grid-video-renderer is for the channel homepage, ytd-video-meta-block is for the channel videos page, yeah idfk why it's different either
        document.querySelectorAll('ytd-grid-video-renderer, ytd-video-meta-block').forEach(handleChannel);
        document.querySelectorAll('ytd-video-meta-block.style-scope.ytd-video-renderer').forEach(handleSearch);
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

            .ytContentMetadataViewModelLeadingIcon {
                display: none;
            }
        `);

        // This needs to be conditionally only on the watch page, as this will break stuff like scheduled streams on the homepage
        // I couldn't find a better selector so this will have to do
        if (window.location.pathname.includes("/watch")) {
            GM_addStyle(`
                .ytContentMetadataViewModelDelimiter {
                    margin: 0 0;
                }
            `);
        }
    }

    // This is incredibly slow, but its the best I can manage with my current knowledge and without losing my mind. Please submit a PR if you know how to improve it!
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    injectStyles();
    scan();

})();