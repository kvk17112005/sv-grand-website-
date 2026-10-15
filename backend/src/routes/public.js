import { Router } from "express";
import { validateQuery } from "../middleware/validate.js";
import { availabilityQuery } from "../lib/schemas.js";
import {
  getHotelContext,
  getPublicCatalog,
  listAddOns,
  listApprovedReviews,
  listOffers,
  listRoomTypes,
} from "../services/catalog.js";
import { getAvailability } from "../services/availability.js";

const router = Router();

router.get("/hotel", async (_req, res) => {
  res.json(await getPublicCatalog());
});

router.get("/room-types", async (_req, res) => {
  res.json({ roomTypes: await listRoomTypes() });
});

router.get("/offers", async (_req, res) => {
  res.json({ offers: await listOffers() });
});

router.get("/add-ons", async (_req, res) => {
  res.json({ addOns: await listAddOns() });
});

router.get("/reviews", async (_req, res) => {
  res.json({ reviews: await listApprovedReviews() });
});

router.get("/availability", validateQuery(availabilityQuery), async (req, res) => {
  const { checkIn, checkOut } = req.validatedQuery;
  const { hotel } = await getHotelContext();
  res.json({ availability: await getAvailability(hotel.id, checkIn, checkOut) });
});

export default router;
