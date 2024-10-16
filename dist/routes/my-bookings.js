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
const auth_1 = __importDefault(require("../middleware/auth"));
const place_1 = __importDefault(require("../models/place"));
const router = express_1.default.Router();
// /api/my-bookings
router.get("/", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const places = yield place_1.default.find({
            bookings: {
                $elemMatch: { userId: req.userId },
            },
        });
        const results = places.map((place) => {
            const userBookings = place.bookings.filter((booking) => booking.userId === req.userId);
            const placeWithUserBookings = Object.assign(Object.assign({}, place.toObject()), { bookings: userBookings });
            return placeWithUserBookings;
        });
        res.status(200).send(results);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
exports.default = router;
