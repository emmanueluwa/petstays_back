import express, { Request, Response } from "express";
import Place from "../models/place";
import { PlaceSearchResponse } from "../utils/types";

const router = express.Router();

router.get("/search", async (req: Request, res: Response) => {
  try {
    const pageSize = 5;
    const pageNumber = parseInt(
      req.query.page ? req.query.page.toString() : "1"
    );

    //pages to skip
    const skip = (pageNumber - 1) * pageSize;

    const places = await Place.find().skip(skip).limit(pageSize);

    const total = await Place.countDocuments();

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

export default router;
