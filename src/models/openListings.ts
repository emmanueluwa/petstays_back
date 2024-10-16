import mongoose from "mongoose";
import { scrapeConnection, scrapeConnectionReady } from "..";

const openrentSchema = new mongoose.Schema({
  _id: String,
  area: String,
  title: String,
  price: Number,
  bedrooms: Number,
  bathrooms: Number,
  max_tenants: String,
  location: String,
  description: String,
  images: { type: [String] },
  url: String,
});

export const listingModels = async () => {
  await scrapeConnectionReady;
  const openrentListing = scrapeConnection.model(
    "openrentListing",
    openrentSchema
  );
  return { openrentListing };
};

// export const openrentListing = mongoose.model(
//   "openrentListing",
//   openrentSchema
// );
