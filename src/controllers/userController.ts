import { readFileSync } from "fs";
import { tourController } from "./tourController";

export class userController {
  users: any[] = [] || undefined;

  constructor(toursArray: any[]) {
    this.users = toursArray;
  }

  getAllUsers(req: any, res: any) {
    res
      .status(200)
      .json({ status: "success", result: users.length, data: { users } });
  }

  createUser(req: any, res: any) {
    res.status(500).json({
      status: "error",
      message: "This endpoint is not implemented yet",
    });
  }

  getUser(req: any, res: any) {
    res.status(500).json({
      status: "error",
      message: "This endpoint is not implemented yet",
    });
  }

  updateUser(req: any, res: any) {
    res.status(500).json({
      status: "error",
      message: "This endpoint is not implemented yet",
    });
  }

  deleteUser(req: any, res: any) {
    res.status(500).json({
      status: "error",
      message: "This endpoint is not implemented yet",
    });
  }
}

const users = readFileSync(`${__dirname}/../dev-data/data/users.json`);
