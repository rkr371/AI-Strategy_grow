import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { db, strategiesTable } from "@workspace/db";
import { eq, desc, sql, gte } from "drizzle-orm";
import {
  GenerateStrategyBody,
  GetStrategyParams,
  DeleteStrategyParams,
} from "@workspace/api-zod";

const router = Router();

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY must be set");
  return new GoogleGenAI({ apiKey });
}

async function generateMarketingStrategy(input: {
  companyName: string;
  industry: string;
  targetAudience: string;
  goals: string;
  budget?: string | null;
  additionalContext?: string | null;
}): Promise<string> {
  const ai = getGeminiClient();

  const prompt = `You are a world-class marketing strategist at a top-tier agency. Generate a comprehensive, deeply researched, and highly actionable marketing strategy for the following company. Be specific — avoid generic advice. Tailor every section to this exact business.

**Company:** ${input.companyName}
**Industry:** ${input.industry}
**Target Audience:** ${input.targetAudience}
**Goals:** ${input.goals}
${input.budget ? `**Budget:** ${input.budget}` : ""}
${input.additionalContext ? `**Additional Context:** ${input.additionalContext}` : ""}

Respond ONLY with the following 10 sections in Markdown. Use the exact section headings below so the output can be parsed precisely. For each section, be specific, data-driven, and actionable. Use bullet points, sub-headings, tables, and numbered lists where appropriate.

## Executive Summary
Write 3-5 sentences: the company's core opportunity, the recommended overall marketing approach, and the single most important thing to prioritize.

## Target Audience Analysis
Define 2-3 detailed buyer personas. For each include: name/archetype, age range, income, platforms they use, pain points, motivations, and how this company solves their problem.

## Social Media Strategy
Recommend the top 3-4 platforms. For each: posting frequency, content formats (Reels, Stories, carousels, etc.), best times to post, tone/voice, and one specific content series idea.

## Content Ideas
Provide 10 specific, ready-to-execute content ideas (posts, videos, blogs, etc.) tailored to this business. Include the format, platform, and goal for each idea.

## Ad Campaign Ideas
Describe 3 distinct ad campaign concepts. For each include: campaign name, objective (awareness/conversion/retargeting), platform, ad format, target segment, headline, and key message.

## 30-Day Growth Plan
A week-by-week action plan for the first 30 days. Be specific about tasks, who owns them, and what tools to use.

## Competitor Analysis
Identify 3 likely competitors (real or archetypal for this industry). For each: their apparent strengths, weaknesses, and one gap ${input.companyName} can exploit.

## SEO Suggestions
List 10 specific keywords or phrases to target (mix of short-tail and long-tail). Include search intent, difficulty level (low/medium/high), and one content idea for each keyword.

## Estimated Marketing Budget
Break down a recommended monthly marketing budget across all channels. Show as a table with: Channel, Monthly Spend, % of Budget, Expected Output. Include a total.

## KPI Goals
List 8-10 specific, measurable KPIs with: metric name, current baseline assumption, 30-day target, 90-day target, and how to measure it.

Be thorough, specific, and professional. This strategy should be ready to hand to a marketing team to execute immediately.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 8192 },
  });

  return response.text ?? "";
}

router.get("/strategies/stats", async (req, res) => {
  try {
    const total = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(strategiesTable);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(strategiesTable)
      .where(gte(strategiesTable.createdAt, weekAgo));

    const topIndustriesRaw = await db
      .select({
        industry: strategiesTable.industry,
        count: sql<number>`count(*)::int`,
      })
      .from(strategiesTable)
      .groupBy(strategiesTable.industry)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const recentStrategies = await db
      .select()
      .from(strategiesTable)
      .orderBy(desc(strategiesTable.createdAt))
      .limit(5);

    res.json({
      total: total[0]?.count ?? 0,
      thisWeek: thisWeek[0]?.count ?? 0,
      topIndustries: topIndustriesRaw.map((r) => ({
        industry: r.industry,
        count: r.count,
      })),
      recentStrategies,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/strategies", async (req, res) => {
  try {
    const strategies = await db
      .select()
      .from(strategiesTable)
      .orderBy(desc(strategiesTable.createdAt));
    res.json(strategies);
  } catch (err) {
    req.log.error({ err }, "Failed to list strategies");
    res.status(500).json({ error: "Failed to fetch strategies" });
  }
});

router.post("/strategies", async (req, res) => {
  const parsed = GenerateStrategyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const input = parsed.data;

  try {
    const content = await generateMarketingStrategy(input);

    const [strategy] = await db
      .insert(strategiesTable)
      .values({
        companyName: input.companyName,
        industry: input.industry,
        targetAudience: input.targetAudience,
        goals: input.goals,
        budget: input.budget ?? null,
        additionalContext: input.additionalContext ?? null,
        content,
      })
      .returning();

    res.status(201).json(strategy);
  } catch (err) {
    req.log.error({ err }, "Failed to generate strategy");
    res.status(500).json({ error: "Failed to generate strategy" });
  }
});

router.get("/strategies/:id", async (req, res) => {
  const parsed = GetStrategyParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [strategy] = await db
      .select()
      .from(strategiesTable)
      .where(eq(strategiesTable.id, parsed.data.id));

    if (!strategy) {
      res.status(404).json({ error: "Strategy not found" });
      return;
    }

    res.json(strategy);
  } catch (err) {
    req.log.error({ err }, "Failed to get strategy");
    res.status(500).json({ error: "Failed to fetch strategy" });
  }
});

router.delete("/strategies/:id", async (req, res) => {
  const parsed = DeleteStrategyParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(strategiesTable)
      .where(eq(strategiesTable.id, parsed.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Strategy not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete strategy");
    res.status(500).json({ error: "Failed to delete strategy" });
  }
});

export default router;
