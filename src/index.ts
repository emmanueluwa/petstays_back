import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import userRoutes from "./routes/users";
import authRoutes from "./routes/auth";
import myPlaceRoutes from "./routes/my-places";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import placeRoutes from "./routes/places";
import bookingRoutes from "./routes/my-bookings";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING as string)
  .then(() => console.log("connected to db :)"));

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.get("/health", async (req: Request, res: Response) => {
  res.send({ message: "health ok :)" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/my-places", myPlaceRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/my-bookings", bookingRoutes);

app.listen(7000, () => {
  console.log("server running on localhost:7000 :)");
});
