"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openrentListing = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const openrentSchema = new mongoose_1.default.Schema({
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
exports.openrentListing = mongoose_1.default.model("openrentListing", openrentSchema);
