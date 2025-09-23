# SP Webapp

## Chatbot system prompt

You can set a default “system prompt” (also called system instruction) for the Gemini-powered chatbot. This prompt steers the assistant’s behavior across all chats.

1. Add the following to your `.env` (backend) file:

	 GEMINI_SYSTEM_PROMPT="You are a helpful tutor for this webapp. Be concise and friendly."

	 Optionally, you can also choose your model:

	 GEMINI_MODEL="gemini-1.5-flash"

2. Restart the server so the new env takes effect.

3. Per-request override (optional): When calling the backend endpoints you can include a custom system prompt:

	 - POST /api/gemini/chat
		 Body fields supported: `messages` (array), optional `model`, and one of `systemInstruction`, `system`, or `systemPrompt`.

	 - POST /api/gemini/generate
		 Body fields supported: `prompt` (string), optional `model`, and one of `systemInstruction`, `system`, or `systemPrompt`.

The backend passes this value through to Google’s Generative AI as the `systemInstruction`, so it is applied for both single-prompt generation and multi-turn chat.