chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "downloadSummary") {
        const blob = new Blob([request.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
            url: url,
            filename: "summarizer/summary.txt"
        });
    }
});

let timer;
let timeLeft = 5 * 60;
let isRunning = false;
let popupWindowId = null;

chrome.action.onClicked.addListener(() => {
    // If popup is already open, focus it
    if (popupWindowId) {
        chrome.windows.update(popupWindowId, { focused: true });
        return;
    }

    // Open index.html as a new window
    chrome.windows.create({
        url: "index.html",
        type: "popup",
        width: 400,
        height: 550,
        left: 100,  // Adjust position
        top: 100    // Adjust position
    }, (window) => {
        popupWindowId = window.id;
    });

    // Reset popupWindowId when the window is closed
    chrome.windows.onRemoved.addListener((windowId) => {
        if (windowId === popupWindowId) {
            popupWindowId = null;
        }
    });
});

// Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchContent") {
        console.log("Fetching content from active tab...");

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs.length) {
                console.error("❌ No active tab.");
                sendResponse({ text: "" });
                return;
            }

            chrome.tabs.sendMessage(tabs[0].id, { action: "getContent", topic: request.topic }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message:", chrome.runtime.lastError.message);
                    sendResponse({ text: "" });
                    return;
                }

                if (!response || !response.text) {
                    console.error("No response from content script.");
                    sendResponse({ text: "" });
                } else {
                    console.log("Received content:", response.text.slice(0, 300));
                    sendResponse(response);
                }
            });
        });

        return true;
    }

    // Pomodoro Timer Logic
    if (request.action === "startTimer") {
        if (!isRunning) {
            isRunning = true;
            timer = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                    chrome.storage.local.set({ timeLeft, isRunning });
                } else {
                    clearInterval(timer);
                    isRunning = false;
                    chrome.storage.local.set({ isRunning: false });

                    chrome.notifications.create({
                        type: "basic",
                        iconUrl: "icon.png",
                        title: "Pomodoro Complete!",
                        message: "Time's up! Take a break.",
                    });
                }
            }, 1000);
        }
    } else if (request.action === "pauseTimer") {
        clearInterval(timer);
        isRunning = false;
        chrome.storage.local.set({ isRunning: false });
    } else if (request.action === "resetTimer") {
        clearInterval(timer);
        timeLeft = 5 * 60;
        isRunning = false;
        chrome.storage.local.set({ timeLeft, isRunning: false });
    }
});
