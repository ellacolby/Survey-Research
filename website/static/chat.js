const chatButton = document.querySelector('.chat-input button');
const chatInput = document.querySelector(".chat-input input[type='text']");
const chatOutput = document.querySelector(".chat-output");

// Function to add a message to the chat output area
function addMessage(sender, message) {
    // replace line breaks with <br> to preserve formatting
    message = message.replace(/\n/g, "<br>");
    var messageElement = document.createElement("div");
    messageElement.innerHTML = "<strong>" + sender + ":</strong> " + message;
    // Function to add a message to the chat output area
    if (sender === "You") {
        messageElement.classList.add("user-message");
    } else {
        messageElement.classList.add("chatbot-message");
    }
    chatOutput.insertBefore(messageElement, chatOutput.firstChild);
}

    const welcomeMessage = `Ask me anything about the survey! `;
    const chatbotRoute = "/chatbot-history";
    addMessage("Survey Bot", welcomeMessage);

function formatChatHistory(maxHistory=40) {
    var chatHistory = [];
    var chatElements = chatOutput.children;

    var numMsg = Math.min(maxHistory, chatElements.length - 1);

    for (var i = numMsg - 1; i >= 0; i--) {
        var element = chatElements[i];

        var content = element.innerHTML.replace(/<strong>.*?:<\/strong>\s*/, "");
        content = content.replace(/<br>/g, "\n");

        if (element.classList.contains("user-message")) {
            chatHistory.push({"role": "user", "content": content});
        }
        else if (element.classList.contains("chatbot-message")) {
            chatHistory.push({"role": "assistant", "content": content});
        }
    }
    return chatHistory;
}

// Function to send a message to the server
function getResponse(chatHistory) {
    const msgJson = JSON.stringify(chatHistory);
    return fetch(chatbotRoute, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: msgJson 
    })
        .then(response => response.text())
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Function to send a message to the server
function processInput() {
    addMessage("You", chatInput.value);
    const chatHistory = formatChatHistory(5);
    // const response = getResponse(chatInput.value);
    const response = getResponse(chatHistory)
    chatInput.value = '';
    response.then((data) => {
        addMessage("Survey Bot", data);
        const hr = document.createElement("hr");
        hr.style.margin = "2px";
        chatOutput.insertBefore(hr, chatOutput.firstChild);
    });
}

chatButton.addEventListener('click', () => {
    if (chatInput.value !== '') {
        processInput();
    }
});

// enter key
chatInput.addEventListener('keyup', (event) => {
    if (event.keyCode === 13 && chatInput.value !== '') {
        processInput();
    }
});