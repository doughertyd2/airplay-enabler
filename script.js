// ==UserScript==
// @name         Brutal Popup Nuker (Safari iOS)
// @namespace    https://example.com
// @version      0.1
// @description  Block *all* pop-ups (and most tab-unders) in every frame.
// @match        http*://*/*
// @run-at       document-start
// @all-frames   true
// ==/UserScript==
(() => {
	"use strict";

	// Timestamp of the last *trusted* tap/click
	let lastUserGesture = 0;
	const GESTURE_WINDOW = 900; // ms Apple uses internally

	// Bump timestamp on any pointer down
	self.addEventListener("pointerdown", () => (lastUserGesture = performance.now()), true);

	// Hard-patch window.open
	const nativeOpen = window.open;
	window.open = new Proxy(nativeOpen, {
		apply(_, ctx, args) {
			const recent = performance.now() - lastUserGesture < GESTURE_WINDOW;
			return recent ? Reflect.apply(nativeOpen, ctx, args) : (console.warn("[PopupBlocked]", args[0]), null);
		},
	});

	// Stop target="_blank" links that fire outside a gesture
	self.addEventListener(
		"click",
		(e) => {
			const a = e.target.closest("a[target]");
			if (!a) return;
			if (performance.now() - lastUserGesture >= GESTURE_WINDOW) {
				e.preventDefault();
				console.warn("[PopupBlocked] anchor", a.href);
			}
		},
		true
	);
})();
