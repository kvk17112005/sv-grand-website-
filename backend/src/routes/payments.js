import { Router } from "express";
import { lookupLimiter, writeLimiter } from "../middleware/rateLimit.js";
import { getPaymentIntentStatus, processPaymentWebhook } from "../services/payments.js";

const router = Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get("/:paymentId", lookupLimiter, async (req, res) => {
  if (!UUID_RE.test(req.params.paymentId)) {
    return res.status(404).json({ message: "Payment intent not found." });
  }
  res.json(await getPaymentIntentStatus(req.params.paymentId));
});

router.post("/webhook", writeLimiter, async (req, res) => {
  const result = await processPaymentWebhook({
    payload: req.body,
    rawBody: req.rawBody,
    signature: req.get("x-payment-signature"),
  });
  res.json({ received: true, duplicate: result.duplicate });
});

export default router;
