const { OPENAI_API_KEY } = process.env;

let chatIns;

async function createIns() {
  const { ChatGPTAPI } = await import("chatgpt");
  chatIns = new ChatGPTAPI({ apiKey: OPENAI_API_KEY, debug: true });
}

createIns();

export { chatIns };
