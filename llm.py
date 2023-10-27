import openai
import os

# Set up OpenAI API key
openai.api_key = os.environ["OPENAI_API_KEY"]

# Define prompt
prompt = "Insert your prompt here"

# Define parameters
model_engine = "text-davinci-002"
temperature = 0.5
max_tokens = 50

# Generate text
response = openai.Completion.create(
    engine=model_engine,
    prompt=prompt,
    temperature=temperature,
    max_tokens=max_tokens
)

# Print generated text
print(response.choices[0].text)
