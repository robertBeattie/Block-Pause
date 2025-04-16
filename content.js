let pauseBlockedUntil = 0;
let blockDuration = 20000;
let pauseBlockEnabled = true;

// Get initial settings
chrome.storage.sync.get(["blockSeconds", "enabled"], (data) => {
  blockDuration = (data.blockSeconds ?? 20) * 1000;
  pauseBlockEnabled = data.enabled ?? true;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockSeconds) {
    blockDuration = changes.blockSeconds.newValue * 1000;
  }
  if (changes.enabled) {
    pauseBlockEnabled = changes.enabled.newValue;
  }
});

function blockPauseFor() {
  pauseBlockedUntil = Date.now() + blockDuration;
  console.log(`[Pause Block] Blocking pause for ${blockDuration / 1000} seconds`);
}

function isPauseBlocked() {
  return pauseBlockEnabled && Date.now() < pauseBlockedUntil;
}

function overrideVideoControls(video) {
  if (!video || video._pauseOverridden) return;

  video.addEventListener("play", () => {
    if (!isPauseBlocked()){
        blockPauseFor(20000);
    }
  });

  // Instantly resume if paused during block
  video.addEventListener("pause", () => {
    if (isPauseBlocked()) {
      console.log("[Pause Block] Pause detected — resuming playback immediately.");
      setTimeout(() => {
        if (video.paused) {
          video.play().catch(err => console.warn("Play failed:", err));
        }
      }, 10); // 10ms delay to ensure it’s registered
    }
  });

  // Block clicks directly on video during block
  video.addEventListener("click", (e) => {
    if (isPauseBlocked() && !video.paused) {
      console.log("[Pause Block] Blocked click on video");
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);

  video._pauseOverridden = true;
  console.log("[Pause Block] Video controls overridden.");
}

function hookPauseBlocking() {
  const video = document.querySelector("video");
  if (video) {
    overrideVideoControls(video);
  }
}

// Catch spacebar and play/pause button early
window.addEventListener("keydown", (e) => {
  const isPauseKey = e.code === "Space" || e.key.toLowerCase() === "k";
  if (isPauseKey && isPauseBlocked()) {
    console.log("[Pause Block] Blocked key:", e.code);
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);

document.addEventListener("click", (e) => {
  const playButton = e.target.closest(".ytp-play-button");
  if (playButton && isPauseBlocked()) {
    console.log("[Pause Block] Blocked pause via play/pause button");
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);

// MutationObserver for DOM changes + fullscreen
const observer = new MutationObserver(() => {
  hookPauseBlocking();
});
observer.observe(document.body, { childList: true, subtree: true });

// Backup interval to reapply
setInterval(() => {
  hookPauseBlocking();
}, 1000);

// Initial run
hookPauseBlocking();
