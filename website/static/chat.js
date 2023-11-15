var chatButton;
var chatInput;
var chatOutput;
var columnContext = "No comlumn selected yet.";
const chatbotRoute = "/chatbot-history";

$(document).ready(function () {
    chatButton = document.querySelector('.chat-input button');
    chatInput = document.querySelector(".chat-input input[type='text']");
    chatOutput = document.querySelector(".chat-output");

    const welcomeMessage = `Ask me anything about the survey! `;
    addMessage("Survey Bot", welcomeMessage);

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

    $('#myTable').on('init.dt', function() {
        // Attach a click listener to each column header in the DataTable
        $("body").on("click", "td", function() {
            var index = $(this).index();
            // Call the function to update the graph based on the clicked column index
            getTableContext(index);
        });
    });
});


function getTableContext(columnIndex) {
    // Fetch the data from DataTable
    const table = $('#myTable').DataTable();
    const columnData = table.column(columnIndex).data().toArray();

    // get the column header
    const columnHeader = table.column(columnIndex).header().innerHTML;

    // combine the header and data into a single string
    columnContext = columnHeader + ": " + columnData.join(", ");

    // also reset the chat history
    chatOutput.innerHTML = "";
    // add the context to the chat history
    addMessage("Survey Bot", "I have your survey data:" + columnContext);
}

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


function formatChatHistory(maxHistory=40) {
    var chatHistory = [];
    var chatElements = chatOutput.children;

    var numMsg = Math.min(maxHistory, chatElements.length);

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
