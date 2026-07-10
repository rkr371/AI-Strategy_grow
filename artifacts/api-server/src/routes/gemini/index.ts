import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { db, conversations as conversationsTable, messages as messagesTable } from "@workspace/db";
import { eq, asc, desc } from "drizzle-orm";
import {
  CreateGeminiConversationBody,
  GetGeminiConversationParams,
  DeleteGeminiConversationParams,
  SendGeminiMessageParams,
  SendGeminiMessageBody,
  GenerateGeminiImageBody,
} from "@workspace/api-zod";

const router = Router();

const MARKETING_EXPERT_SYSTEM_PROMPT = `You are Alex, a senior Marketing Manager and business growth consultant with 20+ years of experience advising companies across technology, e-commerce, SaaS, retail, healthcare, and professional services.

Your role: You act as the user's dedicated Marketing Expert — someone they can have real business conversations with. You remember what they tell you, build on previous context, and guide them toward measurable growth.

Your personality:
- Warm, direct, and confident — like a trusted advisor, not a chatbot
- You give specific, actionable recommendations — never vague platitudes
- You ask smart follow-up questions when you need more context
- You push back politely when you see a better approach
- You celebrate wins and give genuine encouragement

Your expertise:
- Digital marketing strategy (SEO, social media, content marketing, PPC, email, influencer)
- Business development and B2B/B2C client acquisition
- Brand positioning and messaging that converts
- Revenue optimization and growth hacking techniques
- Market research and competitive intelligence
- Customer psychology and conversion rate optimization
- Go-to-market strategy for new products and services
- Daily marketing operations and execution

How you communicate:
- Conversational and natural — not bullet-point lists unless the user asks
- Lead with your key recommendation, then explain the reasoning
- Use concrete examples and real-world analogies
- When asked for templates or copy, write them out in full — ready to use
- Be honest about what will and won't work for their specific situation
- Keep responses focused and practical — skip the filler
- Reference previous conversation context when relevant

You are their Marketing Expert. Act like it.`;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY must be set");
  return new GoogleGenAI({ apiKey });
}

router.get("/gemini/conversations", async (req, res) => {
  try {
    const conversations = await db
      .select()
      .from(conversationsTable)
      .orderBy(desc(conversationsTable.createdAt));
    res.json(conversations);
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.post("/gemini/conversations", async (req, res) => {
  const parsed = CreateGeminiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const [conversation] = await db
      .insert(conversationsTable)
      .values({ title: parsed.data.title })
      .returning();
    res.status(201).json(conversation);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/gemini/conversations/:id", async (req, res) => {
  const parsed = GetGeminiConversationParams.safeParse({
    id: Number(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, parsed.data.id));

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, parsed.data.id))
      .orderBy(asc(messagesTable.createdAt));

    res.json({ ...conversation, messages });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

router.delete("/gemini/conversations/:id", async (req, res) => {
  const parsed = DeleteGeminiConversationParams.safeParse({
    id: Number(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(conversationsTable)
      .where(eq(conversationsTable.id, parsed.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.get("/gemini/conversations/:id/messages", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(asc(messagesTable.createdAt));
    res.json(messages);
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/gemini/conversations/:id/messages", async (req, res) => {
  const paramsParsed = SendGeminiMessageParams.safeParse({
    id: Number(req.params.id),
  });
  const bodyParsed = SendGeminiMessageBody.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const conversationId = paramsParsed.data.id;
  const userContent = bodyParsed.data.content;

  try {
    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId));

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(messagesTable).values({
      conversationId,
      role: "user",
      content: userContent,
    });

    const history = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationId))
      .orderBy(asc(messagesTable.createdAt));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const ai = getGeminiClient();
    let fullResponse = "";

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      systemInstruction: MARKETING_EXPERT_SYSTEM_PROMPT,
      contents: history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: { maxOutputTokens: 4096 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messagesTable).values({
      conversationId,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

router.post("/gemini/generate-image", async (req, res) => {
  const parsed = GenerateGeminiImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: parsed.data.prompt }] }],
    });

    const part = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData,
    );

    if (!part?.inlineData) {
      res.status(500).json({ error: "No image data returned" });
      return;
    }

    res.json({
      b64_json: part.inlineData.data,
      mimeType: part.inlineData.mimeType,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate image");
    res.status(500).json({ error: "Failed to generate image" });
  }
});

export default router;
