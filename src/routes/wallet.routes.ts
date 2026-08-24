import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth.middleware.js";
import * as WalletController from "../controllers/wallet.controller.js"
import { idempotencyMiddleware } from "../middlewares/idempotency.middleware.js";

const router = Router()

router.post("/create", authenticateJWT, WalletController.createWallet)

router.post("/deposit", authenticateJWT, WalletController.deposit)

router.post("/withdraw", authenticateJWT, WalletController.withdraw)

router.post("/transfer", authenticateJWT, idempotencyMiddleware, WalletController.transfer)

router.get("/history", authenticateJWT, WalletController.getHistory)



export default router  