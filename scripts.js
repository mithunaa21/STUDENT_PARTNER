const API_KEY = "AIzaSyCsbpYzcXVy9iUCwSUr1nbNGXmKF_Cf7wo";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + API_KEY;
let timer;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isRunning = false;
const beepSound = new Audio("beep.wav"); // Load the beep sound

document.getElementById("startTimer").addEventListener("click", startTimer);
document.getElementById("pauseTimer").addEventListener("click", pauseTimer);
document.getElementById("resetTimer").addEventListener("click", resetTimer);

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timer);
                isRunning = false;
                updateTimerDisplay();
                beepSound.play(); 
                setTimeout(() => {
                    alert("Time's up! Take a break.");
                }, 1000); 

            }
        }, 1000);
    }
}
function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    timeLeft = 25 * 60; // Reset to 25 minutes
    updateTimerDisplay();
}

function updateTimerDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    document.getElementById("timerDisplay").innerText = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

document.getElementById("quizBtn").addEventListener("click", () => {
    let topic = prompt("Enter the topic you want a quiz on:");

    if (!topic || topic.trim() === "") {
        alert("You must enter a topic!");
        return;
    }

    document.getElementById("quizOutput").innerHTML = `Generating quiz on '${topic}'... Please wait.`;
    generateQuiz(topic.trim());
});
function generateQuiz(topic) {
    const prompt = `Generate a multiple-choice quiz on '${topic}'. 
    Provide 3 questions, each with 4 options labeled (A, B, C, D). 
    Show correct answers separately at the end under "Answers:".

    Example Format:
    1. Question?
       A) Option 1
       B) Option 2
       C) Option 3
       D) Option 4

    (Repeat for 3 questions)

    Answers:
    1. Correct answer
    2. Correct answer
    3. Correct answer`;

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })
    .then(response => response.json())
    .then(data => {
        console.log("API Response:", data);
        if (data && data.candidates && data.candidates.length > 0) {
            let quizText = data.candidates[0].content.parts[0].text;
            displayQuiz(quizText);
        } else {
            document.getElementById("quizOutput").innerText = "Error: Failed to generate quiz.";
        }
    })
    .catch(error => {
        console.error("Quiz generation error:", error);
        document.getElementById("quizOutput").innerText = "Error: API request failed.";
    });
}

function displayQuiz(quizText) {
    let [questionsPart, answersPart] = quizText.split("Answers:");
    if (!questionsPart || !answersPart) {
        document.getElementById("quizOutput").innerText = "Error: Could not parse quiz format.";
        return;
    }

    let questions = questionsPart.trim().split("\n\n");
    let answers = answersPart.trim().split("\n");

    let quizContainer = document.getElementById("quizOutput");
    quizContainer.innerHTML = ""; 

    let backButton = document.createElement("button");
    backButton.innerText = "Back";
    backButton.classList.add("back-button");
    backButton.addEventListener("click", function () {
        quizContainer.innerHTML = "";
        document.getElementById("quizBtn").style.display = "block";
    });

    quizContainer.appendChild(backButton);

    questions.forEach((questionBlock, index) => {
        let questionLines = questionBlock.split("\n");
        let questionText = questionLines[0];
        let options = questionLines.slice(1);

        let questionDiv = document.createElement("div");
        questionDiv.classList.add("question");

        let questionTitle = document.createElement("h3");
        questionTitle.innerText = questionText;
        questionDiv.appendChild(questionTitle);

        options.forEach(option => {
            let optionButton = document.createElement("button");
            optionButton.innerText = option;
            optionButton.classList.add("option");
            optionButton.addEventListener("click", function () {
                revealAnswer(index, optionButton, answers[index]);
            });
            questionDiv.appendChild(optionButton);
        });

        quizContainer.appendChild(questionDiv);
    });

    document.getElementById("quizBtn").style.display = "none"; 
}

function revealAnswer(questionIndex, selectedButton, correctAnswer) {
    let allOptions = selectedButton.parentElement.querySelectorAll(".option");
    allOptions.forEach(btn => btn.disabled = true);

    if (selectedButton.innerText.includes(correctAnswer.trim())) {
        selectedButton.style.backgroundColor = "lightgreen";
    } else {
        selectedButton.style.backgroundColor = "lightcoral";
    }

    let answerDisplay = document.createElement("p");
    answerDisplay.innerText = "✅ Correct Answer: " + correctAnswer;
    answerDisplay.style.fontWeight = "bold";
    selectedButton.parentElement.appendChild(answerDisplay);
}
document.getElementById("studybtn").addEventListener("click", () => {
    let chatContainer = document.getElementById("displayText");
    chatContainer.innerHTML = "<b>Assistant:</b> Hi! I'm your study companion. Ask me anything related to your studies!";
    startChat();
});

function startChat() {
    let chatContainer = document.getElementById("displayText");
    chatContainer.innerHTML += "<div><b>Assistant:</b> What topic do you need help with today?</div>";
    createChatInput();
}

function createChatInput() {
    let chatContainer = document.getElementById("displayText");

    // Create the chat input area
    let chatInputSection = document.createElement("div");
    chatInputSection.classList.add("chat-input");

    let inputField = document.createElement("input");
    inputField.setAttribute("type", "text");
    inputField.setAttribute("placeholder", "Type your question...");
    inputField.classList.add("userInput");

    let sendButton = document.createElement("button");
    sendButton.innerText = "Send";
    sendButton.classList.add("sendButton");
    sendButton.addEventListener("click", () => {
        let userQuery = inputField.value.trim();
        if (userQuery) {
            chatContainer.innerHTML += `<div class="message user-message"><b>You:</b> ${userQuery}</div>`;
            chatContainer.innerHTML += `<div class="message assistant-message"><b>Assistant:</b> Thinking...</div>`;
            fetchStudyResponse(userQuery);
            inputField.value = "";
        }
    });

    chatInputSection.appendChild(inputField);
    chatInputSection.appendChild(sendButton);
    chatContainer.appendChild(chatInputSection);

    // Prevent duplicate Clear Chat & Back buttons
    if (!document.getElementById("clearChatBtn")) {
        let controlButtons = document.createElement("div");
        controlButtons.classList.add("control-buttons");

        let clearButton = document.createElement("button");
        clearButton.innerText = "Clear Chat";
        clearButton.addEventListener("click", () => {
            chatContainer.innerHTML = "";
            startChat();
        });
    
        let backButton = document.createElement("button");
        backButton.innerText = "Back";
        backButton.addEventListener("click", () => {
            window.location.href = "index.html";
        });
        controlButtons.appendChild(clearButton);
        controlButtons.appendChild(backButton);
        chatContainer.appendChild(controlButtons);
    }
}


function sendMessage(inputField, chatContainer) {
    let userQuery = inputField.value.trim();
    if (userQuery) {
        let userMessage = document.createElement("div");
        userMessage.classList.add("message", "user-message");
        userMessage.innerHTML = `<b>You:</b> ${userQuery}`;
        chatContainer.appendChild(userMessage);

        let assistantMessage = document.createElement("div");
        assistantMessage.classList.add("message", "assistant-message");
        assistantMessage.innerHTML = `<b>Assistant:</b> Thinking...`;
        chatContainer.appendChild(assistantMessage);

        fetchStudyResponse(userQuery, assistantMessage);
        inputField.value = "";
    }
}

function fetchStudyResponse(query) {
    const prompt = `Act like an interactive study mentor. Respond to '${query}' in an engaging and structured way, asking follow-up questions to encourage deeper learning.`;

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })
    .then(response => response.json())
    .then(data => {
        let chatContainer = document.getElementById("displayText");
        if (data && data.candidates && data.candidates.length > 0) {
            let responseText = data.candidates[0].content.parts[0].text;
            chatContainer.innerHTML += `<div><b>Assistant:</b> ${responseText.replace(/\n/g, "<br>")}</div>`;
            chatContainer.innerHTML += `<div><b>Assistant:</b> Do you have any more questions on this topic?</div>`;
            createChatInput(); 
        } else {
            chatContainer.innerHTML += "<div><b>Assistant:</b> Sorry, I couldn't fetch a response.</div>";
        }
    })
    .catch(error => {
        let chatContainer = document.getElementById("displayText");
        chatContainer.innerHTML += "<div><b>Assistant:</b> Error fetching response.</div>";
    });
}
// Your existing code remains unchanged...

document.getElementById("summarize").addEventListener("click", () => {
    let summaryElement = document.getElementById("summary");
    summaryElement.innerHTML = "<p style='color: gray;'>Summarizing...</p>";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
            summaryElement.innerHTML = "<p style='color: red;'>No active tab found.</p>";
            return;
        }

        chrome.scripting.executeScript(
            {
                target: { tabId: tabs[0].id },
                function: extractMainContent
            },
            (result) => {
                if (chrome.runtime.lastError) {
                    summaryElement.innerHTML = `<p style='color: red;'>Error: ${chrome.runtime.lastError.message}</p>`;
                    return;
                }

                if (result && result.length > 0 && result[0].result) {
                    let extractedText = result[0].result.trim();
                    if (extractedText) {
                        summaryElement.innerHTML = formatSummary(summarizeText(extractedText));
                        addBackButton();
                    } else {
                        summaryElement.innerHTML = "<p style='color: red;'>No meaningful content found.</p>";
                    }
                } else {
                    summaryElement.innerHTML = "<p style='color: red;'>Content not found. Try another page.</p>";
                }
            }
        );
    });
});

// Function to add the Back button
function addBackButton() {
    let summaryElement = document.getElementById("summary");
    let backButton = document.createElement("button");
    backButton.innerText = "Back";
    backButton.style.display = "block";
    backButton.style.marginTop = "10px";
    backButton.style.padding = "8px 12px";
    backButton.style.backgroundColor = "red";
    backButton.style.color = "white";
    backButton.style.border = "none";
    backButton.style.cursor = "pointer";

    backButton.addEventListener("click", () => {
        summaryElement.innerHTML = ""; // Clears the summary
    });

    summaryElement.appendChild(backButton);
}

// Function to extract content from the active tab
function extractMainContent() {
    let mainContent = document.querySelector("main, article, .main-content, #content, .post-content");
    return mainContent ? mainContent.innerText : document.body.innerText;
}

// Function to summarize extracted content
function summarizeText(text) {
    let sentences = text.split('. ');
    let importantPoints = sentences.slice(0, 5).map(s => `• ${s.trim()}.`);
    return importantPoints.join('<br><br>');
}

// Function to format the summary output
function formatSummary(summary) {
    return `<p style="color: darkblue; font-size: 16px; line-height: 1.8;">${summary}</p>`;
}
