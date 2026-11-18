import { Router, Request, Response } from "express";
import { authenticateJWT } from "../middlewares/auth.middleware.js";
import { sanitizeUserPrompt, setAuthUser } from "../ai/runner.js";
import { streamGraphAgent } from "../ai/graph/runner.js";
import { checkAiRateLimit } from "../ai/utils/rateLimiter.js";


const router = Router();

// ─────────────────────────────────────────────────────────────
// Day 20: POST /api/v1/ai/stream
// Real-time SSE AI Agent streaming endpoint.
//
// Flow:
//   1. Auth & rate limit check
//   2. Prompt injection sanitization
//   3. Set SSE headers (Content-Type: text/event-stream)
//   4. Stream LangGraph multi-agent execution events to client
//
// Client receives 4 event types:
//   - event: status    → agent routing / thinking updates
//   - event: tool_status → real-time tool execution progress
//   - event: token     → streamed AI text chunks
//   - event: done      → final response + completion signal
//   - event: error     → error payload
// ─────────────────────────────────────────────────────────────
router.post("/stream", authenticateJWT, async (req: Request, res: Response) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        res.status(400).json({ error: "prompt is required and must be a non-empty string." });
        return;
    }

    // 1. Rate limit check
    const user = (req as any).user;
    const rateLimiter = await checkAiRateLimit(user.id, 10, 60);
    if (!rateLimiter.allowed) {
        res.status(429).json({
            error: `Rate limit exceeded. Retry after ${rateLimiter.retryAfterSeconds}s`
        });
        return;
    }

    // 2. Prompt injection guard
    const promptCheck = sanitizeUserPrompt(prompt);
    if (!promptCheck.safe) {
        res.status(400).json({ error: promptCheck.reason });
        return;
    }

    // 3. Set authenticated user context for the agent
    const abortController = new AbortController()

    // 4. Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering for SSE
    res.flushHeaders();

    // Handle client disconnect (cleanup)
    req.on("close", () => {
        abortController.abort()
        res.end();
    });

    // 5. Stream agent execution
    await streamGraphAgent(prompt, user, res, abortController.signal);
});

export default router;
