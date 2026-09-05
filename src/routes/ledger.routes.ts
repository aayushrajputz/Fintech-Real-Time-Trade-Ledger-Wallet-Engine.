import { Router } from "express";
import { getLedgerHistory } from "../controllers/ledger.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.ts";

const router = Router();

router.get("/history", authenticateJWT, getLedgerHistory);

export default router;
