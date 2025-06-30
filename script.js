// ==UserScript==
// @name         Fetch & Open HLS for AirPlay
// @namespace    https://example.com/
// @version      1.0
// @description  Detect HLS manifests and give you a one-click way to open them (so you get full AirPlay video)
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
	"use strict";

	// --- 1) Inject the button
	const btn = document.createElement("button");
	btn.textContent = "🎬";
	Object.assign(btn.style, {
		position: "fixed",
		bottom: "12px",
		left: "12px",
		width: "36px",
		height: "36px",
		"font-size": "20px",
		"border-radius": "18px",
		border: "none",
		background: "#007AFF",
		color: "#fff",
		cursor: "pointer",
		display: "none",
		"z-index": 9999,
	});
	document.body.appendChild(btn);

	// --- 2) Track whether we've seen a <video> on screen
	let sawVideo = false;
	const obs = new MutationObserver((muts) => {
		for (let m of muts) {
			m.addedNodes.forEach((node) => {
				if (!sawVideo && node.tagName === "VIDEO") {
					sawVideo = true;
					tryShowButton();
				} else if (!sawVideo && node.querySelectorAll) {
					if (node.querySelector("video")) {
						sawVideo = true;
						tryShowButton();
					}
				}
			});
		}
	});
	obs.observe(document.documentElement, { childList: true, subtree: true });
	// also check for existing videos on load
	if (document.querySelector("video")) {
		sawVideo = true;
	}

	// --- 3) Hook fetch() and XHR to capture .m3u8 URLs
	let lastManifest = null;

	// fetch
	const _fetch = window.fetch;
	window.fetch = function (input, init) {
		const url = typeof input === "string" ? input : input.url;
		if (url && url.match(/\.m3u8(\?|$)/i)) {
			lastManifest = url;
			tryShowButton();
		}
		return _fetch.apply(this, arguments);
	};

	// XHR
	const _open = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function (method, url) {
		if (url && url.match(/\.m3u8(\?|$)/i)) {
			lastManifest = url;
			tryShowButton();
		}
		return _open.apply(this, arguments);
	};

	// --- 4) Show the button only when both conditions are met
	function tryShowButton() {
		if (sawVideo && lastManifest) {
			btn.style.display = "block";
		}
	}

	// --- 5) On click, open the manifest URL
	btn.addEventListener("click", () => {
		if (lastManifest) {
			window.open(lastManifest, "_blank");
		} else {
			alert("No HLS manifest detected yet. Play the video and try again.");
		}
	});
})();
