"""Use Large Language Model to process survey transcripts."""
from typing import List, Tuple
import tqdm
import argparse
import os
import openai
import re
import json
from collections import Counter


# FIXME(jeremiah): research questions can be broken out to separate files
QUESTION_RESEARCH_IMPACT_AND_SPECIAL_HARDWARE = """
The interviewer 'B' asks the interviewee 'A' the following questions:'7.1 How
would your research change with 2x, 10x, 100x speedup of the main computation
tasks? (Break it down for 2x/10x/100x, is there a difference?)'This question
touches on the idea of the researcher benefiting from a speedup in computational
power.For this transcript, can you report whether or not the researcher feels
that they would benefit from a 2x speedup, a 10x speed up or a 100x speedup.The
researcher also asks: 'Does this project require specific hardware (GPU, TPU,
FPGA, etc?)?'You should report whether or not the researcher mentions using GPU
or cluster computing in their research, at all throughout the interview.Your
answer should sound like this: In this interview, the researcher feels that they
(would/would not) benefit from a 2x speedup,that they (would/would not) benefit
from a 10x speedup, and that they (would/would not) benefit from a 100x
speedup.The researcher (does/does not) use GPUs. The researcher (does/does not)
use computer clusters'
""".strip().replace("\n", " ")

QUESTION_GPU_OR_CLUSTER = """
The interviewer, 'B' asks the interviewee 'A' the following questions: '7.1 How
would your research change with 2x, 10x, 100x speedup of the main computation
tasks? (Break it down for 2x/10x/100x, is there a difference?)' This question
touches on the idea of the researcher benefiting from a speedup in computational
power. For this transcript, can you report whether or not the researcher feels
that they would benefit from a 2x speedup, a 10x speed up or a 100x speedup.
Then, you should report whether or not the researcher mentions using GPU or
cluster computing in their research, at all throughout the interview. Your
answer should sound like this: In this interview, the researcher feels that they
(would/would not) benefit from a 2x speedup, that they (would/would not) benefit
from a 10x speedup, and that they (would/would not) benefit from a 100x speedup.
The researcher (does/does not) use GPUs. The researcher (does/does not) use
computer clusters'
""".strip().replace("\n", " ")


QUESTION_SATISFACTORY = """
The interviewer, 'B' asks the interviewee 'A' the following questions: '4.2 Do
you think the computation performance behavior of the project is
unsatisfactory?'. Then, the researcher asks: '4.3 Are your bigger research plans
unattainable due to lack of computation power?'. Then, the researcher asks: '4.4
Is additional computation blocked by computation speed or lack of memory or
something else?' These questions touch on the idea of the researcher being
'blocked' by computation. Can you give a qualitative assessment, based on the
transcript, of whether or not the researcher is blocked by computation. If the
researcher is blocked, give details that they reports as to why they feel they
are blocked by computaiton. If they are not blocked, give the reasoning that
they report as to why they feel that they are not blocked by computation. Please
write a paragraph summary describing the researcher's situation. Do not give me
the researcher's direct answers. Instead, you should summarize the researcher's
main positions regarding this issue that they report during their interview.
Your answer should begin 'Based on the transcript, the researcher feels that
...' and then give a description of their position. 
""".strip().replace("\n", " ")


def get_transcript_from_google_drive(filename):
    # Only works in Google colab
    # TODO(jeremiah): should remove this if not used in the future
    from google.colab import drive

    drive.mount("/content/drive")
    with open(filename, "r") as fd:
        transcript = fd.read()

    return transcript


def get_transcript_filenames(base_dir) -> List[str]:
    # Initialize an empty list to hold the transcript file paths
    transcripts = []

    # Walk through the directory structure
    for dirpath, dirnames, filenames in os.walk(base_dir):
        for filename in filenames:
            if filename.endswith(".transcript.vtt"):
                # Construct the full path to the file and append to list
                full_path = os.path.join(dirpath, filename)
                transcripts.append(full_path)

    return transcripts


def clean_transcript(text):
    """Replace names from transcript."""
    # Extract names that come before a colon in the text
    name_occurrences = re.findall(r"\n([\w\s\-]+):", text)

    # Count the occurrences of each name and pick the two most frequent
    counter = Counter(name_occurrences)
    most_common_names = counter.most_common(3)

    if len(most_common_names) < 2:
        if len(most_common_names) == 0:
            print("Couldn't identify both names, using defaults 'A' and 'B'")
            name_a, name_b = "A", "B"
        if len(most_common_names) == 1:
            name_a = most_common_names[0][0]
            name_b = "B"
            print("Only found one name")
    else:
        name_a, name_b = most_common_names[0][0], most_common_names[1][0]

    text = text.replace(name_a, "A")
    text = text.replace(name_b, "B")
    text = re.sub(r"\n\n\d+\n", "", text)
    pattern = r"\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}"
    return re.sub(pattern, "", text)


def load_transcripts(base_dir) -> Tuple[List[str], List[str]]:
    transcript_filenames = get_transcript_filenames(base_dir)

    # Initialize an empty list to store cleaned transcripts
    cleaned_transcripts = []
    raw_transcripts = []

    # Loop through each transcript file and clean its content
    for transcript_file in transcript_filenames:
        with open(transcript_file, "r") as fd:
            raw_transcript = fd.read()
            raw_transcripts.append(raw_transcript)
            cleaned_text = clean_transcript(raw_transcript)
            cleaned_transcripts.append(cleaned_text)

    return raw_transcripts, cleaned_transcripts


def load_cleaned_transcripts(base_dir) -> List[str]:
    _, clean_transcripts = load_transcripts(base_dir)
    return clean_transcripts


def get_llm_response(transcript, research_question, model="gpt-3.5-turbo-16k"):
    # TODO(jeremiah): expose more options to the arguments
    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful research assistant. You will parse through an"
                    " interview transcript and attempt to analyze the respondent's"
                    " answers to certain questions."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Here is a transcript of a research: {transcript}."
                    f" {research_question}"
                ),
            },
        ],
    )

    # FIXME(jeremiah): need to check the response is valid before returning
    return response["choices"][0]["message"]["content"]


def main(base_dir, response_file):
    cleaned_transcripts = load_cleaned_transcripts(base_dir)
    print(len(cleaned_transcripts))

    # Initialize an empty list to store LLM responses
    all_llm_responses = []
    research_questions = [
        QUESTION_RESEARCH_IMPACT_AND_SPECIAL_HARDWARE,
        QUESTION_GPU_OR_CLUSTER,
        QUESTION_SATISFACTORY,
    ]

    # Define the questions you want to ask
    for q_idx, question in enumerate(research_questions):
        print(
            f"Processing question: {q_idx + 1}/{len(research_questions)} on"
            f" {len(cleaned_transcripts)} transcripts"
        )
        print("-----------------------------------")

        responses = []

        for t_idx, transcript in tqdm.tqdm(enumerate(cleaned_transcripts)):
            # Prompt the LLM with the user message

            try:
                response = get_llm_response(transcript, question)
                responses.append(response)
            except Exception as e:
                tqdm.tqdm.write(f"Error processing transcript {t_idx}, {e}")
                responses.append("ERROR")

        all_llm_responses.append({"question": question, "responses": responses})

    # Save the responses to a file
    with open(response_file, "w") as fd:
        json.dump(
            {"transcripts": cleaned_transcripts, "responses": all_llm_responses}, fd
        )
        print(f"Saved responses to {response_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-d", "--base-dir", help="path to directory containing transcripts"
    )
    parser.add_argument("-k", "--openai-api-key", help="OpenAI API key", required=True)
    parser.add_argument(
        "-o",
        "--output-file",
        help="path to output file",
        default="transcript_and_responses.json",
    )

    args = parser.parse_args()
    if not os.path.isdir(args.base_dir):
        raise ValueError("base_dir must be a directory")
    openai.api_key = args.openai_api_key
    main(args.base_dir, args.output_file)
