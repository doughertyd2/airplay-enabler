// ==UserScript==
// @name         Force-Native HLS → AirPlay video
// @namespace    https://example.com/
// @version      0.2
// @description  Disable MSE-based players (hls.js, video.js, etc.) so Safari uses its native HLS path.
// @match        *://target-site.example/*          //  ❱❱ change to the real domain
// @run-at       document-start                     //  IMPORTANT: must execute before players load
// @grant        none
// ==/UserScript==

(() => {
	/* 1 ─── Kill MediaSource so libraries think MSE is unavailable */
	try {
		Object.defineProperty(window, "MediaSource", { value: undefined, configurable: true });
		Object.defineProperty(window, "ManagedMediaSource", { value: undefined, configurable: true });
	} catch (e) {
		/* ignored */
	}

	/* 2 ─── If hls.js shows up, sabotage its feature-test */
	const hookHls = (Hls) => {
		if (Hls && typeof Hls.isSupported === "function") {
			Hls.isSupported = () => false; // force “unsupported → don’t attach”
		}
	};
	Object.defineProperty(window, "Hls", {
		configurable: true,
		set(v) {
			hookHls(v);
			this.__hls = v;
		},
		get() {
			return this.__hls;
		},
	});

	/* 3 ─── Nudge video.js / VHS not to override native HLS */
	const patchVideoJs = () => {
		if (window.videojs?.options?.html5?.hls) {
			window.videojs.options.html5.hls.overrideNative = false; // VHS flag :contentReference[oaicite:2]{index=2}
		}
	};
	const timer = setInterval(() => {
		patchVideoJs();
		if (window.videojs) clearInterval(timer);
	}, 300);
})();
