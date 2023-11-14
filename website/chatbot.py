from typing import Tuple
import openai
from openai import OpenAI
import os

MAX_CHAT_HISTORY = 20
MAX_PUBLIC_TOKEN_COUNT = 2000

# Define the prompt for the chatbot
with open("public_info.txt", "r") as f:
    public_info = f.read()

client = OpenAI(
    api_key=os.environ['OPENAI_API_KEY']
)

# Define a function to get a response from the chatbot
def get_response(messages, model="gpt-3.5-turbo", temperature=0.5, max_tokens=100):
    print(messages)
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        n=1,
        stop=None,
        timeout=15,
    )
    message = response.choices[0].message.content  # type: ignore
    return message


def filter(user_input) -> Tuple[bool, str]:
    # if too long
    if len(user_input) > 200:
        return False, "Message too long"

    return True, ""

def filter_history(msgs) -> Tuple[bool, str]:
    if len(msgs) > MAX_CHAT_HISTORY:
        return False, f"Too many rounds, max={MAX_CHAT_HISTORY}"

    total_token = sum(len(m["content"].split()) for m in msgs)
    if total_token > MAX_PUBLIC_TOKEN_COUNT:
        return False, f"Too many tokens, max={MAX_PUBLIC_TOKEN_COUNT}"

    return True, ""

def get_info_with_history(chat_history):
    passed, msg = filter_history(chat_history)
    if not passed:
        response = f"Sorry, {msg}. Please retry."
        return response

    user_input = chat_history[-1]["content"]
    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant to a survey research project"
                    " about computation usage. You have the following information"
                    f" about the survey {public_info}."
                ),
            },
        ]
        messages.extend(chat_history)
        response = get_response(messages)
    except Exception as e:
        response = (
            f"Sorry, something went wrong. Please ask the hosts for more"
            f" information."
        )
        print(e)

    return response


def get_info(user_input):
    passed, msg = filter(user_input)
    if not passed:
        response = f"Sorry, {msg}. Please retry."
    try:
        # whenever receive a question, convert the question to attach the key info, ask openai model to answer the question based on the key_info
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant to a survey research project about"
                    " computation usage. You have the following information about the"
                    f" survey {public_info}."
                ),
            },
            {"role": "user", "content": user_input},
        ]

        response = get_response(messages)
    except Exception as e:
        response = (
            f"Sorry, something went wrong. Please ask the hosts for more information."
        )
        print(e)

    return response


# Define the main function to run the chatbot
def main():
    # Print a welcome message
    print("Welcome to the survey chatbot! Ask me anything about the party.")

    # Loop to get user input and generate responses
    while True:
        # Get user input
        user_input = input("> ")

        # Check for exit command
        if user_input.lower() in ["exit", "quit"]:
            break

        print(get_info(user_input))


if __name__ == "__main__":
    main()
