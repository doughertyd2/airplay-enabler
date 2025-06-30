(() => {
	try {
		// Kill MSE so native HLS is used
		Object.defineProperty(window, "MediaSource", { value: undefined, configurable: true });
		Object.defineProperty(window, "ManagedMediaSource", { value: undefined, configurable: true });
	} catch (e) {
		console.warn("Couldn’t disable MediaSource", e);
	}

	// If hls.js is present, pretend it’s unsupported
	if (window.Hls && typeof Hls.isSupported === "function") {
		Hls.isSupported = () => false;
		console.log("Patched Hls.isSupported → false");
	}

	// If video.js/VHS is present, disable its native-override flag
	if (window.videojs?.options?.html5?.hls) {
		window.videojs.options.html5.hls.overrideNative = false;
		console.log("video.js overrideNative disabled");
	}

	// Fix all existing <video> elements
	document.querySelectorAll("video").forEach((video) => {
		video.removeAttribute("disableRemotePlayback");
		video.setAttribute("x-webkit-airplay", "allow");
		video.setAttribute("playsinline", "");
		video.setAttribute("webkit-playsinline", "");
	});
	console.log("Applied AirPlay patch to video elements. Reload to see .m3u8 src.");
})();
