# Survey Research Analysis


## Setup

- Setup Python with virtual environment
- Install Python packages: `pip install -r requirements.txt`
- Prepare a directory with the `.vtt` files
- Get the OpenAI key

## Usage

- Run `python llm.py -d {directory with .vtt files} -k {OpenAI key}`
- The output will be stored in `transcript_and_responses.json` by default
- See `python llm.py --help` for other options
