// ==UserScript==
// @name         AirPlay Always On (Ultimate Global)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Force full AirPlay (video+audio) on every page and iframe, by patching media element creation & attributes globally.
// @match        *://*/*
// @run-at       document-start
// @all-frames   true
// @grant        none
// ==/UserScript==
(function () {
	"use strict";

	// 1️⃣ Always report disableRemotePlayback as false
	Object.defineProperty(HTMLMediaElement.prototype, "disableRemotePlayback", {
		configurable: true,
		get: () => false,
		set: () => {
			/* ignore */
		},
	});

	// 2️⃣ Patch document.createElement so any new <video> or <audio> starts with our attrs
	const origCreate = Document.prototype.createElement;
	Document.prototype.createElement = function (tagName, options) {
		const el = origCreate.call(this, tagName, options);
		if (tagName.toUpperCase() === "VIDEO" || tagName.toUpperCase() === "AUDIO") {
			el.setAttribute("x-webkit-airplay", "allow");
			el.setAttribute("playsinline", "");
			el.setAttribute("webkit-playsinline", "");
			el.removeAttribute("disableRemotePlayback");
		}
		return el;
	};

	// 3️⃣ Intercept any setAttribute/removeAttribute calls on media elements
	const origSetAttr = Element.prototype.setAttribute;
	Element.prototype.setAttribute = function (name, value) {
		if (this.tagName === "VIDEO" || this.tagName === "AUDIO") {
			const n = name.toLowerCase();
			if (n === "disableremoteplayback") return; // block attempts to re-disable
			if (n === "x-webkit-airplay" && value !== "allow") {
				// force allow
				value = "allow";
			}
			if (n === "playsinline" || n === "webkit-playsinline") {
				// leave as-is
			}
		}
		return origSetAttr.call(this, name, value);
	};
	const origRemoveAttr = Element.prototype.removeAttribute;
	Element.prototype.removeAttribute = function (name) {
		if ((this.tagName === "VIDEO" || this.tagName === "AUDIO") && name.toLowerCase() === "x-webkit-airplay") {
			return; // don’t let pages remove our allow flag
		}
		return origRemoveAttr.call(this, name);
	};

	// 4️⃣ Patch any existing media tags as soon as possible
	const patchMedia = (el) => {
		try {
			el.setAttribute("x-webkit-airplay", "allow");
			el.setAttribute("playsinline", "");
			el.setAttribute("webkit-playsinline", "");
			el.removeAttribute("disableRemotePlayback");
		} catch (e) {}
	};
	const observer = new MutationObserver((muts) => {
		muts.forEach((m) => {
			m.addedNodes.forEach((node) => {
				if (node.nodeType !== 1) return;
				if (node.tagName === "VIDEO" || node.tagName === "AUDIO") {
					patchMedia(node);
				} else if (node.querySelectorAll) {
					node.querySelectorAll("video, audio").forEach(patchMedia);
				}
			});
		});
	});
	observer.observe(document.documentElement || document, {
		childList: true,
		subtree: true,
	});

	// 5️⃣ Also patch anything already in the DOM right now
	document.querySelectorAll("video, audio").forEach(patchMedia);
})();
