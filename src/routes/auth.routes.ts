import { Router } from "express";
import { signUp, login, logout, refresh } from "../controllers/auth.controller.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { signupSchema } from "../validators/auth.validator.js";
import { loginSchema } from "../validators/auth.validator.js";
import { rateLimiter } from "../middlewares/rate-limiter.middleware.js";


const router = Router();

router.post("/signUp", rateLimiter(5, 60), validateRequest(signupSchema), signUp);
router.post("/login", validateRequest(loginSchema), login);

router.post("/logout", logout);
router.post("/refresh", refresh)



export default router;

