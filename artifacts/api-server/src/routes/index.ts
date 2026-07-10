import { Router, type IRouter } from "express";
import healthRouter from "./health";
import strategiesRouter from "./strategies";
import geminiRouter from "./gemini";
import voiceRouter from "./voice";
import coachRouter from "./coach";

const router: IRouter = Router();

router.use(healthRouter);
router.use(strategiesRouter);
router.use(geminiRouter);
router.use(voiceRouter);
router.use(coachRouter);

export default router;
