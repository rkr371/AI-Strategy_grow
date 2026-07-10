import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "@workspace/db";
import { dailyMissions, clientLeads } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY must be set");
  return new GoogleGenAI({ apiKey });
}

const ALEX_PREFIX = `You are Alex, a senior Marketing Manager and business growth consultant. Be direct, practical, and conversational. No filler. Give real, actionable advice.`;

router.post("/coach/daily-brief", async (req, res) => {
  const { companyName, industry, goals } = req.body as {
    companyName?: string;
    industry?: string;
    goals?: string;
  };

  try {
    const ai = getGeminiClient();
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const prompt = `${ALEX_PREFIX}

Today is ${today}. Generate a focused daily marketing brief${companyName ? ` for ${companyName}` : ""}.
${industry ? `Industry: ${industry}` : ""}
${goals ? `Goals: ${goals}` : ""}

Provide:
## Morning Priorities
3 specific marketing actions to take today (with reasoning)

## Content Idea of the Day
One specific content piece to create (include the angle and target platform)

## Growth Action
One concrete growth action that can be completed today

## Market Insight
One timely insight about consumer behavior or market trends relevant to their business

## Daily Coaching Message
A personal, motivating message to start their day strong

Be specific to their industry and situation. Write conversationally, not in corporate-speak.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 1500 },
    });

    res.json({ brief: result.text ?? "" });
  } catch (err) {
    req.log.error({ err }, "Failed to generate daily brief");
    res.status(500).json({ error: "Failed to generate daily brief" });
  }
});

router.post("/coach/client-discovery", async (req, res) => {
  const { companyName, industry, product, targetAudience, budget } = req.body as {
    companyName?: string;
    industry?: string;
    product?: string;
    targetAudience?: string;
    budget?: string;
  };

  try {
    const ai = getGeminiClient();

    const prompt = `${ALEX_PREFIX}

Analyze the following business and identify the best client acquisition opportunities:

Business: ${companyName || "Unknown"}
Industry: ${industry || "Unknown"}
Product/Service: ${product || "Unknown"}
Target Audience: ${targetAudience || "Unknown"}
Budget: ${budget || "Unknown"}

Provide a comprehensive client discovery report:

## Ideal Customer Profile
Describe the top 3 specific customer personas with demographics, pain points, and buying behavior

## Where to Find Clients
Top 5 platforms and places where these clients are active (be specific — not just "social media")

## Outreach Strategy
3 proven outreach approaches for this business, with specific message angles

## Networking Opportunities
Industry events, communities, and partnerships that would generate high-quality leads

## Fastest Path to First Client
The single most effective action to get a paying client in the next 30 days

## Personalized Outreach Templates
Write 2 ready-to-use outreach messages (email or DM) for this specific business

Be extremely specific. Generic advice is useless.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 2000 },
    });

    res.json({ discovery: result.text ?? "" });
  } catch (err) {
    req.log.error({ err }, "Failed to generate client discovery");
    res.status(500).json({ error: "Failed to generate client discovery" });
  }
});

router.post("/coach/communicate", async (req, res) => {
  const { type, companyName, product, audience, context, tone } = req.body as {
    type?: string;
    companyName?: string;
    product?: string;
    audience?: string;
    context?: string;
    tone?: string;
  };

  try {
    const ai = getGeminiClient();

    const communicationType = type || "email";
    const prompt = `${ALEX_PREFIX}

Generate a professional ${communicationType} for the following:

Business: ${companyName || "Unknown"}
Product/Service: ${product || "Unknown"}
Target Recipient: ${audience || "Unknown"}
Tone: ${tone || "Professional but friendly"}
Additional Context: ${context || "None"}

Write the complete ${communicationType} — ready to send with minimal editing. Include:

## Subject Line (if email)
2-3 compelling subject line options

## The ${communicationType.charAt(0).toUpperCase() + communicationType.slice(1)}
Write the full message. Make it feel human and genuine, not templated.

## Alternative Version
A shorter, punchier alternative version

## Key Talking Points
3 customizable elements to personalize for each recipient

Focus on benefits over features. Make it feel personal.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 1500 },
    });

    res.json({ content: result.text ?? "" });
  } catch (err) {
    req.log.error({ err }, "Failed to generate communication");
    res.status(500).json({ error: "Failed to generate communication" });
  }
});

router.post("/coach/startup-ideas", async (req, res) => {
  const { industry, interests, skills, budget } = req.body as {
    industry?: string;
    interests?: string;
    skills?: string;
    budget?: string;
  };

  try {
    const ai = getGeminiClient();

    const prompt = `${ALEX_PREFIX}

Analyze global startup trends and generate 3 unique, viable startup ideas based on:

Industry Interest: ${industry || "Any"}
Personal Interests: ${interests || "Unknown"}
Skills Available: ${skills || "Unknown"}
Available Capital: ${budget || "Unknown"}

For each startup idea, provide:

## [Startup Name] — [One-line tagline]

**The Opportunity**: What problem does this solve and why now?

**Market Potential**: Size of the opportunity, growth trajectory

**Target Customer**: Who will pay for this and why

**Revenue Model**: How it makes money (be specific)

**30-Day Launch Plan**: Concrete steps to validate in 30 days

**Competition**: 2-3 existing players and your differentiation

**Startup Validation Score**: X/10 with reasoning

**Growth Roadmap**: 6-month milestones

---

Focus on ideas that are:
1. Solvable with available skills/budget
2. Have proven demand in adjacent markets
3. Can be tested before full investment`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 2500 },
    });

    res.json({ ideas: result.text ?? "" });
  } catch (err) {
    req.log.error({ err }, "Failed to generate startup ideas");
    res.status(500).json({ error: "Failed to generate startup ideas" });
  }
});

router.get("/coach/missions", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  try {
    const existing = await db
      .select()
      .from(dailyMissions)
      .where(eq(dailyMissions.missionDate, today));

    if (existing.length > 0) {
      res.json(existing);
      return;
    }

    const ai = getGeminiClient();
    const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

    const prompt = `Generate exactly 6 daily marketing missions for ${dayOfWeek}. Return ONLY a valid JSON array with no markdown:

[
  {
    "title": "mission title (max 8 words)",
    "description": "what to do and why it matters (2 sentences)",
    "category": "one of: Content|Outreach|Analytics|Social|SEO|Growth",
    "priority": "one of: high|medium|low",
    "xp": number between 30-150
  }
]

Mix different categories. Make them practical, achievable in under 2 hours each. Today focus: ${dayOfWeek === "Monday" ? "planning & content" : dayOfWeek === "Friday" ? "review & analytics" : "execution & outreach"}.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 800 },
    });

    let rawText = (result.text ?? "").trim();
    rawText = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const missionData = JSON.parse(rawText) as Array<{
      title: string;
      description: string;
      category: string;
      priority: string;
      xp: number;
    }>;

    const inserted = await db
      .insert(dailyMissions)
      .values(
        missionData.map((m) => ({
          title: m.title,
          description: m.description,
          category: m.category,
          priority: m.priority,
          xp: m.xp,
          missionDate: today,
          completed: false,
        }))
      )
      .returning();

    res.json(inserted);
  } catch (err) {
    req.log.error({ err }, "Failed to get missions");
    res.status(500).json({ error: "Failed to get missions" });
  }
});

router.patch("/coach/missions/:id/complete", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [updated] = await db
      .update(dailyMissions)
      .set({ completed: true })
      .where(eq(dailyMissions.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Mission not found" });
      return;
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to complete mission");
    res.status(500).json({ error: "Failed to complete mission" });
  }
});

router.patch("/coach/missions/:id/uncomplete", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [updated] = await db
      .update(dailyMissions)
      .set({ completed: false })
      .where(eq(dailyMissions.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Mission not found" });
      return;
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to uncomplete mission");
    res.status(500).json({ error: "Failed to uncomplete mission" });
  }
});

router.get("/coach/leads", async (req, res) => {
  try {
    const leads = await db.select().from(clientLeads);
    res.json(leads);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch leads");
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

router.post("/coach/leads", async (req, res) => {
  const { companyName, industry, contactType, platform, notes } = req.body as {
    companyName: string;
    industry: string;
    contactType: string;
    platform: string;
    notes?: string;
  };

  try {
    const [lead] = await db
      .insert(clientLeads)
      .values({ companyName, industry, contactType, platform, notes, status: "prospect" })
      .returning();
    res.status(201).json(lead);
  } catch (err) {
    req.log.error({ err }, "Failed to save lead");
    res.status(500).json({ error: "Failed to save lead" });
  }
});

router.patch("/coach/leads/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status: string };

  try {
    const [updated] = await db
      .update(clientLeads)
      .set({ status })
      .where(eq(clientLeads.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update lead status");
    res.status(500).json({ error: "Failed to update lead status" });
  }
});

export default router;
