import { writeFile, readFileSync } from "fs";

export class tourController {
  tours: any[] = [];

  constructor(toursArray: any[]) {
    this.tours = toursArray;
  }

  getAllTours(req: any, res: any) {
    res.status(200).json({
      status: "OK",
      requestedAt: req.requestTime,
      results: this.tours.length,
      data: { tours: this.tours },
    });
  }

  checkID(req: any, res: any, next: any, val: any) {
    if (req.params.id * 1 > this.tours.length)
      return res.status(404).json({ status: "fail", message: "Invalid ID" });
    next();
  }

  getTourByID(req: any, res: any) {
    const id = Number(req.params.id);
    const tour = this.tours.find((el: any) => el.id === id);
    res.status(200).json({ status: "OK", data: { tour } });
  }

  checkBody(req: any, res: any, next: any) {
    if (!req.body.name || !req.body.price) {
      return res.status(404).json({
        status: "fail",
        message: "Request body must contain name and price properties",
      });
    }
    next();
  }

  createTour(req: any, res: any) {
    const newID = this.tours[this.tours.length - 1].id + 1;
    const newTour = Object.assign({ id: newID }, req.body);
    this.tours.push(newTour);

    writeFile(
      `${__dirname}/../dev-data/data/tours-simple.json`,
      JSON.stringify(this.tours),
      (err) => {
        if (err) return res.status(404).json({ status: err });
        res.status(201).json({ status: "success", data: { tour: newTour } });
      }
    );
  }

  updateTour(req: any, res: any) {
    res
      .status(200)
      .json({ status: "success", data: { tour: "<Updated tour here..>" } });
  }

  deleteTour(req: any, res: any) {
    res.status(204).json({ status: "success", data: null });
  }
}
