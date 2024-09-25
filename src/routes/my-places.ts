import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Place, { PlaceType } from "../models/place";
import verifyToken from "../middleware/auth";
import { body } from "express-validator";

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

      const uploadPromises = imageFiles.map(async (image) => {
        const b64 = Buffer.from(image.buffer).toString("base64");
        let dataURI = "data:" + image.mimetype + ";base64," + b64;
        const res = await cloudinary.v2.uploader.upload(dataURI);
        return res.url;
      });

      //wait for all images to be uploaded before getting back string array
      const imageUrls = await Promise.all(uploadPromises);
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

export default router;
