import mongoose from "mongoose";
import { scrapeConnection, scrapeConnectionReady } from "..";

const areaSchema = new mongoose.Schema({
  name: String,
});

export const initModels = async () => {
  await scrapeConnectionReady;
  const Area = scrapeConnection.model("Area", areaSchema);
  return { Area };
};
