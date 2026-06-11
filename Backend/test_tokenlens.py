import os
from dotenv import load_dotenv
from tokenlens import TokenLens

load_dotenv()

tl = TokenLens(
    api_key=os.getenv("TOKENLENS_KEY"),
    base_url=os.getenv("TOKENLENS_URL", "http://localhost:8000"),
)

# No OPENAI_API_KEY needed — the backend uses its own configured LLM keys.
client = tl.chat()

response = client.chat.completions.create(
    model="gpt4o-mini",
    messages=[{"role": "user", "content": "Hi!"}],
)

print(response.choices[0].message.content)
print(f"Tokens: {response.usage.total_tokens}  |  Cost: ${response.cost.usd:.8f}")
