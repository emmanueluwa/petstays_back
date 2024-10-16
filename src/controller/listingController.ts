import express, { Request, Response } from "express";
import { initModels } from "../models/area";
import { validationResult } from "express-validator";
import { listingModels } from "../models/openListings";

const searchListings = async (req: Request, res: Response) => {
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
    const pageNumber = parseInt(
      req.query.page ? req.query.page.toString() : "1"
    );

    const skip = (pageNumber - 1) * pageSize;

    const { openrentListing } = await listingModels();

    const listings = await openrentListing
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    const total = await openrentListing.countDocuments(query);

    const response = {
      data: listings,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
};

const getLocations = async (req: Request, res: Response) => {
  const { Area } = await initModels();

  try {
    const areas = await Area.find();
    res.json(areas);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
};

const getListings = async (req: Request, res: Response) => {
  const { openrentListing } = await listingModels();

  try {
    const limit = 11;
    const listings = await openrentListing.find().limit(limit);
    res.json(listings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
};

const getListingById = async (req: Request, res: Response) => {
  const { openrentListing } = await listingModels();
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // console.log({ errors });
  // console.log(req.params.id);

  try {
    const id = req.params.id.toString();
    const listing = await openrentListing.findById({ _id: id });
    res.json(listing);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching place" });
  }
};

const constructSearchQuery = (queryParams: any) => {
  let constructedQuery: any = {};

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

export default { getListings, getLocations, searchListings, getListingById };
