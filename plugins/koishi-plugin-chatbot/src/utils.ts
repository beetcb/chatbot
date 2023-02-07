const { OPENAI_API_KEY } = process.env;

/**
 * @see -> https://github.com/microsoft/TypeScript/issues/43329#issuecomment-811606238
 * Provides a mechanism to use dynamic import / import() with tsconfig -> module: commonJS as otherwise import() gets
 * transpiled to require().
 */
const _importDynamic = new Function("modulePath", "return import(modulePath)"); // eslint-disable-line no-new-func

let chatIns;

async function createIns() {
  const { ChatGPTAPI } = await _importDynamic("chatgpt");
  chatIns = new ChatGPTAPI({ apiKey: OPENAI_API_KEY, debug: true });
}

createIns();

export { chatIns };
