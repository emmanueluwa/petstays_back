"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const place_1 = __importDefault(require("../models/place"));
const express_validator_1 = require("express-validator");
const stripe_1 = __importDefault(require("stripe"));
const auth_1 = __importDefault(require("../middleware/auth"));
const stripe = new stripe_1.default(process.env.STRIPE_API_KEY);
const router = express_1.default.Router();
router.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const pageNumber = parseInt(req.query.page ? req.query.page.toString() : "1");
        //pages to skip
        const skip = (pageNumber - 1) * pageSize;
        const places = yield place_1.default.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(pageSize);
        const total = yield place_1.default.countDocuments(query);
        const response = {
            data: places,
            pagination: {
                total,
                page: pageNumber,
                pages: Math.ceil(total / pageSize),
            },
        };
        res.json(response);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const places = yield place_1.default.find().sort("-lastUpdated");
        res.json(places);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
router.get("/:id", [(0, express_validator_1.param)("id").notEmpty().withMessage("Place ID is required")], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const id = req.params.id.toString();
    try {
        const place = yield place_1.default.findById(id);
        res.json(place);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching place" });
    }
}));
router.post("/:placeId/bookings/payment-intent", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { numberOfNights } = req.body;
    const placeId = req.params.placeId;
    const place = yield place_1.default.findById(placeId);
    if (!place) {
        return res.status(400).json({ message: "place not found" });
    }
    //data integrity and security
    //calculates on backend - most updated cost - prevents hacker entering own price per night before sending to backends
    const totalCost = place.pricePerNight * numberOfNights;
    const paymentIntent = yield stripe.paymentIntents.create({
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
}));
router.post("/:placeId/bookings", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentIntentId = req.body.paymentIntentId;
        const paymentIntent = yield stripe.paymentIntents.retrieve(paymentIntentId);
        if (!paymentIntent) {
            return res.status(400).json({ message: "payment intent not found" });
        }
        if (paymentIntent.metadata.placeId !== req.params.placeId ||
            paymentIntent.metadata.userId !== req.userId) {
            return res.status(400).json({ message: "payment intent mismatch" });
        }
        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({
                message: `payment intent not succeeded. Status: ${paymentIntent.status}`,
            });
        }
        const newBooking = Object.assign(Object.assign({}, req.body), { userId: req.userId });
        const place = yield place_1.default.findOneAndUpdate({ _id: req.params.placeId }, {
            $push: { bookings: newBooking },
        });
        if (!place) {
            return res.status(400).json({ message: "place not found" });
        }
        yield place.save();
        res.status(200).send();
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
const constructSearchQuery = (queryParams) => {
    let constructedQuery = {};
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
exports.default = router;
