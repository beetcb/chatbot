import { Context, Schema, h } from "koishi";
// import { ChatMessage, ChatGPTError } from "chatgpt";
import { chatIns } from "./utils.js";

const { SELF_ID } = process.env;

const conversationToContext = new Map<
  string,
  { messageId?: string; conversationId?: string }
>();

export const name = "chatbot";

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.middleware(async (session, next) => {
    const { content, elements, userId, guildId, selfId } = session;
    // guild: reply to @ only
    if (guildId) {
      const isAt = elements.find(
        (e) => e.type === "at" && session.id === selfId
      );
      if (!isAt) {
        return next();
      }
    }

    const text = elements.filter((e) => e.type === "text").join(" ");
    if (text) {
      const reply = await chatGPT(content, userId);
      reply && session.sendQueued(reply);
    }

    return next();
  });
}

async function chatGPT(
  content: string,
  user: string
): Promise<string | undefined> {
  try {
    const { conversationId, messageId } = conversationToContext.get(user) ?? {};
    const res = await chatIns.sendMessage(content, {
      conversationId,
      parentMessageId: messageId,
    });
    maintainConversionContext(res, user);
    return res.text;
  } catch (e) {
    console.error(e);
    return `Error: code ${e.statusCode}, reason: ${e.message}`;
  }
}

function maintainConversionContext(res: any, user: string) {
  conversationToContext.set(user, {
    conversationId: res.conversationId,
    messageId: res.id,
  });
}
