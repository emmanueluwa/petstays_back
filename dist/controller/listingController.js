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
Object.defineProperty(exports, "__esModule", { value: true });
const area_1 = require("../models/area");
const express_validator_1 = require("express-validator");
const openListings_1 = require("../models/openListings");
const searchListings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = constructSearchQuery(req.query);
        let sortOptions = {};
        switch (req.query.sortOption) {
            case "pricePerMonthAsc":
                sortOptions = { price: 1 };
                break;
            case "pricePerMonthDesc":
                sortOptions = { price: -1 };
                break;
        }
        const pageSize = 5;
        const pageNumber = parseInt(req.query.page ? req.query.page.toString() : "1");
        const skip = (pageNumber - 1) * pageSize;
        const listings = yield openListings_1.openrentListing
            .find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(pageSize);
        const total = yield openListings_1.openrentListing.countDocuments(query);
        const response = {
            data: listings,
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
});
const getListings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = 11;
        const listings = yield openListings_1.openrentListing.find().limit(limit);
        res.json(listings);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
});
const getListingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // console.log({ errors });
    // console.log(req.params.id);
    try {
        const id = req.params.id.toString();
        const listing = yield openListings_1.openrentListing.findById(id);
        res.json(listing);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching place" });
    }
});
const getLocations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const areas = yield area_1.Area.find();
        res.json(areas);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
});
const constructSearchQuery = (queryParams) => {
    let constructedQuery = {};
    if (queryParams.location) {
        constructedQuery.$or = [
            { area: new RegExp(queryParams.location, "i") },
            { location: new RegExp(queryParams.location, "i") },
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
    if (queryParams.maxPrice) {
        constructedQuery.price = {
            $lte: parseInt(queryParams.maxPrice).toString(),
        };
    }
    return constructedQuery;
};
exports.default = { getListings, getLocations, searchListings, getListingById };
