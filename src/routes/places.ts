import express, { Request, Response } from "express";
import Place from "../models/place";
import { BookingType, PlaceSearchResponse } from "../utils/types";
import { param, validationResult } from "express-validator";
import Stripe from "stripe";
import verifyToken from "../middleware/auth";

const stripe = new Stripe(process.env.STRIPE_API_KEY as string);

const router = express.Router();

router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = constructSearchQuery(req.query);

    let sortOptions = {};
    switch (req.query.sortOption) {
      case "pricePerMonthAsc":
        sortOptions = { pricePerMonth: 1 };
        break;
      case "pricePerMonthDesc":
        sortOptions = { pricePerMonth: -1 };
        break;
    }

    const pageSize = 5;
    const pageNumber = parseInt(
      req.query.page ? req.query.page.toString() : "1"
    );

    //pages to skip
    const skip = (pageNumber - 1) * pageSize;

    const places = await Place.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    const total = await Place.countDocuments(query);

    const response: PlaceSearchResponse = {
      data: places,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const places = await Place.find().sort("-lastUpdated");
    res.json(places);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Place ID is required")],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = req.params.id.toString();

    try {
      const place = await Place.findById(id);
      res.json(place);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error fetching place" });
    }
  }
);

router.post(
  "/:placeId/bookings/payment-intent",
  verifyToken,
  async (req: Request, res: Response) => {
    const { numberOfNights } = req.body;
    const placeId = req.params.placeId;

    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(400).json({ message: "place not found" });
    }

    //data integrity and security
    //calculates on backend - most updated cost - prevents hacker entering own price per night before sending to backends
    const totalCost = place.pricePerNight * numberOfNights;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCost * 100,
      currency: "gbp",
      metadata: {
        placeId,
        userId: req.userId,
      },
    });

    if (!paymentIntent.client_secret) {
      return res.status(500).json({ message: "something went wrong" });
    }

    const response = {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret.toString(),
      totalCost,
    };

    res.send(response);
  }
);

router.post(
  "/:placeId/bookings",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const paymentIntentId = req.body.paymentIntentId;

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId as string
      );

      if (!paymentIntent) {
        return res.status(400).json({ message: "payment intent not found" });
      }

      if (
        paymentIntent.metadata.placeId !== req.params.placeId ||
        paymentIntent.metadata.userId !== req.userId
      ) {
        return res.status(400).json({ message: "payment intent mismatch" });
      }

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: `payment intent not succeeded. Status: ${paymentIntent.status}`,
        });
      }

      const newBooking: BookingType = {
        ...req.body,
        userId: req.userId,
      };

      const place = await Place.findOneAndUpdate(
        { _id: req.params.placeId },
        {
          $push: { bookings: newBooking },
        }
      );

      if (!place) {
        return res.status(400).json({ message: "place not found" });
      }

      await place.save();
      res.status(200).send();
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "something went wrong" });
    }
  }
);

const constructSearchQuery = (queryParams: any) => {
  let constructedQuery: any = {};

  if (queryParams.location) {
    constructedQuery.$or = [
      { city: new RegExp(queryParams.location, "i") },
      { country: new RegExp(queryParams.location, "i") },
    ];
  }

  if (queryParams.bedrooms) {
    constructedQuery.bedrooms = {
      $gte: parseInt(queryParams.bedrooms),
    };
  }

  if (queryParams.bathrooms) {
    constructedQuery.bathrooms = {
      $gte: parseInt(queryParams.bathrooms),
    };
  }

  // if (queryParams.facilities) {
  //   constructedQuery.facilities = {
  //     $all: Array.isArray(queryParams.facilities)
  //       ? queryParams.facilities
  //       : [queryParams.facilities],
  //   };
  // }

  // if (queryParams.types) {
  //   constructedQuery.type = {
  //     $in: Array.isArray(queryParams.types)
  //       ? queryParams.types
  //       : [queryParams.types],
  //   };
  // }

  //   if (queryParams.stars) {
  //     const starRating = parseInt(queryParams.stars.toString());
  //     constructedQuery.starRating = { $eq: starRating };
  //   }

  // if (queryParams.stars) {
  //   const starRatings = Array.isArray(queryParams.stars)
  //     ? queryParams.stars.map((star: string) => parseInt(star))
  //     : parseInt(queryParams.stars);

  //   constructedQuery.starRating = { $in: starRatings };
  // }

  if (queryParams.maxPrice) {
    constructedQuery.pricePerMonth = {
      $lte: parseInt(queryParams.maxPrice).toString(),
    };
  }

  return constructedQuery;
};

export default router;
