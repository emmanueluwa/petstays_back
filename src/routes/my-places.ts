import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import verifyToken from "../middleware/auth";
import { body } from "express-validator";
import { PlaceType } from "../utils/types";
import Place from "../models/place";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, //5MB
  },
});

// api/my-places
router.post(
  "/",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("type").notEmpty().withMessage("Place type is required"),
    body("pricePerNight")
      .notEmpty()
      .isNumeric()
      .withMessage("Price per night is required"),
    body("facilities")
      .notEmpty()
      .isArray()
      .withMessage("Facilities are required"),
  ],
  upload.array("imageFiles", 6),
  async (req: Request, res: Response) => {
    try {
      const imageFiles = req.files as Express.Multer.File[];
      const newPlace: PlaceType = req.body;

      const imageUrls = await uploadImages(imageFiles);
      newPlace.imageUrls = imageUrls;

      newPlace.lastUpdated = new Date();
      newPlace.userId = req.userId;

      const place = new Place(newPlace);
      await place.save();

      res.status(201).send(place);
    } catch (error: any) {
      console.log("Error creating place", error);
      // res
      //   .status(500)
      //   .json({ message: "Error creating place", error: error.message });
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const places = await Place.find({ userId: req.userId });
    res.json(places);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  const id = req.params.id.toString();

  try {
    const place = await Place.findOne({
      _id: id,
      userId: req.userId,
    });

    res.json(place);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.put(
  "/:placeId",
  verifyToken,
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      const updatedPlace: PlaceType = req.body;
      updatedPlace.lastUpdated = new Date();

      const place = await Place.findOneAndUpdate(
        {
          _id: req.params.placeId,
          userId: req.userId,
        },
        updatedPlace,
        { new: true }
      );

      if (!place) {
        return res.status(404).json({ message: "Place not found" });
      }

      const files = req.files as Express.Multer.File[];
      const updatedImageUrls = await uploadImages(files);

      //add existing to new
      place.imageUrls = [
        ...updatedImageUrls,
        ...(updatedPlace.imageUrls || []),
      ];

      await place.save();
      res.status(201).json(place);
    } catch (error) {}
  }
);

async function uploadImages(imageFiles: Express.Multer.File[]) {
  const uploadPromises = imageFiles.map(async (image) => {
    const b64 = Buffer.from(image.buffer).toString("base64");
    let dataURI = "data:" + image.mimetype + ";base64," + b64;
    const res = await cloudinary.v2.uploader.upload(dataURI);
    return res.url;
  });

  //wait for all images to be uploaded before getting back string array
  const imageUrls = await Promise.all(uploadPromises);
  return imageUrls;
}

export default router;
