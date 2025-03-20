chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractText") {
        let text = document.body.innerText;
        sendResponse({ content: text });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getContent") {
        console.log("📌 Extracting text from page...");
        
        let pageContent = document.body.innerText.trim();

        if (!pageContent) {
            console.error("❌ No text extracted.");
            sendResponse({ text: "" });
            return;
        }

        let topic = request.topic.toLowerCase();
        let filteredText = pageContent
            .split("\n")
            .filter(line => line.toLowerCase().includes(topic))
            .join("\n");

        if (!filteredText) {
            console.warn("No relevant content found for the topic:", topic);
            sendResponse({ text: "No relevant content found on this page." });
        } else {
            console.log("✅ Extracted relevant content:", filteredText.slice(0, 300));
            sendResponse({ text: filteredText });
        }
    }
});
