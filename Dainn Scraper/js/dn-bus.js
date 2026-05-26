/*!
 * dn-bus — minimal pub/sub the popup uses to broadcast scrape lifecycle.
 *
 * Replaces the brittle MutationObserver chain in index-page.js that watched
 * .hidden class flips on the Stop button to infer "scrape started/finished".
 * Renaming or restyling buttons used to silently break webhook delivery; with
 * the bus, popup.js is the single source of truth that announces lifecycle.
 *
 * Events currently broadcast (see popup.js):
 *   scrape:started   { hostName, startingUrl }
 *   scrape:page      { pageNumber, rowsThisPage, totalRows }
 *   scrape:completed { reason: 'manual' | 'no-more-pages' | 'error', totalRows, pages, workingTimeMs }
 *   scrape:error     { message, errorId? }
 *
 * Listeners stay decoupled from popup.js' minified hot path — they just
 * dnBus.on('scrape:page', handler). Errors thrown by listeners are caught
 * so one buggy subscriber can't take down the others.
 */
(function () {
    if (window.dnBus) return; // idempotent — script could be re-injected
    const listeners = Object.create(null);

    window.dnBus = {
        on(event, fn) {
            if (typeof fn !== 'function') return () => {};
            (listeners[event] || (listeners[event] = [])).push(fn);
            return () => this.off(event, fn);
        },
        off(event, fn) {
            const arr = listeners[event];
            if (!arr) return;
            const i = arr.indexOf(fn);
            if (i >= 0) arr.splice(i, 1);
        },
        emit(event, payload) {
            const arr = listeners[event];
            if (!arr || !arr.length) return;
            // Iterate a copy so handlers that unsubscribe themselves don't
            // mutate the array mid-loop.
            arr.slice().forEach(fn => {
                try { fn(payload); }
                catch (e) { console.warn('[dnBus] listener for', event, 'threw:', e); }
            });
        }
    };
})();
