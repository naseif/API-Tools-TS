import { readFileSync } from "fs";
import express from "express";
import { tourController } from "../controllers/tourController";
const tours = JSON.parse(
  readFileSync(`${__dirname}/../data/tours.json`, "utf8")
);

const tourRouterT = new tourController(tours);
console.log(tourRouterT.tours[0]);
const tourRouter = express.Router();

tourRouter.param("id", tourRouterT.checkID);

tourRouter
  .route("/")
  .get(tourRouterT.getAllTours)
  .post(tourRouterT.checkBody, tourRouterT.createTour);
tourRouter
  .route("/:id")
  .get(tourRouterT.getTourByID)
  .patch(tourRouterT.updateTour)
  .delete(tourRouterT.deleteTour);

module.exports = tourRouter;
