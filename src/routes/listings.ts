import express from "express";
import { param } from "express-validator";
import listingController from "../controller/listingController";

const router = express.Router();

router.get("/search", listingController.searchListings);
router.get("/locations", listingController.getLocations);
router.get("/", listingController.getListings);
router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Place ID is required")],
  listingController.getListingById
);

export default router;
