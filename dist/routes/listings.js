"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const listingController_1 = __importDefault(require("../controller/listingController"));
const router = express_1.default.Router();
router.get("/search", listingController_1.default.searchListings);
router.get("/", listingController_1.default.getListings);
router.get("/:id", [(0, express_validator_1.param)("id").notEmpty().withMessage("Place ID is required")], listingController_1.default.getListingById);
router.get("/locations", listingController_1.default.getLocations);
exports.default = router;
