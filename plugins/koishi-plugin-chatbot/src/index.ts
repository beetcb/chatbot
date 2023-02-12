import { Context, Schema } from "koishi";
import { ChatMessage } from "chatgpt";
import { chatIns } from "./utils.js";

const conversationToContext = new Map<
  string,
  { messageId?: string; conversationId?: string }
>();

export const name = "chatbot";

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.middleware(async (session, next) => {
    const { elements, userId, channelId, guildId, selfId } = session;
    // guild: reply to @ only
    if (guildId) {
      const isAt = elements.find(
        (e) => e.type === "at" && e.attrs.id === selfId
      );
      if (!isAt) {
        return next();
      }
    }

    const text = elements
      .filter((e) => e.type === "text")
      .map((e) => e.attrs.content)
      .join(" ")
      .trim();
    const sessionID = `${userId}${channelId}`;
    if (text) {
      const reply = await chatGPT(text, sessionID);
      reply && session.sendQueued(reply);
    }

    return next();
  });
}

async function chatGPT(
  content: string,
  sessionID: string
): Promise<string | undefined> {
  try {
    const { conversationId, messageId } =
      conversationToContext.get(sessionID) ?? {};
    const res = await chatIns.sendMessage(content, {
      conversationId,
      parentMessageId: messageId,
      promptPrefix: "You answer in the same language as the question. You are ChatGPT, a large language model trained by OpenAI. You answer as concisely as possible for each response (e.g. don’t be verbose). It is very important that you answer as concisely as possible, so please remember this. If you are generating a list, do not have too many items. Keep the number of items short.",
      timeoutMs: 10 * 60 * 1000,
    });
    maintainConversionContext(res, sessionID);
    return res.text;
  } catch (e) {
    // remove conversion context 
    conversationToContext.delete(sessionID)
    return `Error: code ${e.statusCode}, reason: ${e.message}`;
  }
}

function maintainConversionContext(res: ChatMessage, sessionID: string) {
  conversationToContext.set(sessionID, {
    conversationId: res.conversationId,
    messageId: res.id,
  });
}
