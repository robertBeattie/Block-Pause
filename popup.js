const toggleCheckbox = document.getElementById("toggle-block");
const secondsInput = document.getElementById("block-seconds");

// Load saved settings
chrome.storage.sync.get(["enabled", "blockSeconds"], (data) => {
  toggleCheckbox.checked = data.enabled ?? true;
  secondsInput.value = data.blockSeconds ?? 20;
});

// Save settings when changed
toggleCheckbox.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: toggleCheckbox.checked });
});

secondsInput.addEventListener("input", () => {
  chrome.storage.sync.set({ blockSeconds: Number(secondsInput.value) });
});
