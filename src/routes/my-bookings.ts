import express, { Request, Response } from "express";
import verifyToken from "../middleware/auth";
import Place from "../models/place";
import { PlaceType } from "../utils/types";

const router = express.Router();

// /api/my-bookings
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const places = await Place.find({
      bookings: {
        $elemMatch: { userId: req.userId },
      },
    });

    const results = places.map((place) => {
      const userBookings = place.bookings.filter(
        (booking) => booking.userId === req.userId
      );

      const placeWithUserBookings: PlaceType = {
        ...place.toObject(),
        bookings: userBookings,
      };

      return placeWithUserBookings;
    });

    res.status(200).send(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

export default router;
