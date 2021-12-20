import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

export class APIController {
  /**
   * the main endpoint for this API
   */

  protected mainEndPoint: string;

  /**
   * A map containing all endpoints of this API
   */

  endpoints: any;
  /**
   * Express Object
   */

  private app: express.Application;

  /**
   * Express Router
   */

  private router: any;

  /**
   * Initialzes the APIController Class
   * @param {string} endpoint
   */

  /**
   * A Map containing all used middlewares for this API
   */

  public MiddleWares: any

  constructor(endpoint: string) {
    if (!endpoint) throw new Error('APIController can not be initialized without a main endoint!');
    this.mainEndPoint = endpoint;
    this.endpoints = new Map();
    this.app = express();
    this.router = express.Router();
    this.MiddleWares = new Map();
  }

  /**
   * Adds some middlewares for the API Security
   */

  private CreateMainEndPoint() {
    this.MiddleWares.set("morgan", morgan("short"));
    this.MiddleWares.set("helmet", helmet());
    this.MiddleWares.set("cors", cors());
    this.app.use(express.json());
    this.app.use(this.mainEndPoint, this.router);
  }

  /**
   * Adds an enhdpoint to the API
   * @param {string} endpoint
   * @param {string} method
   * @param {function} callback
   *
   * Example:
   * ```ts
   * import { APIController } from "./dist"
   *
   * const api = new APIController("/api/v1");
   *
   * api.AddEndPoint("/", "get", (req, res) => {
   * res.status(200).json({ home: "home is now accessible" })
   * })
   *
   * api.StartServer("true") // to apply default middlewares ["cors", "morgan", "helmet"]
   * ```
   *
   */

  AddEndPoint(
    endpoint: string,
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    callback: (req: Request, res: Response) => void
  ) {
    this.endpoints.set(endpoint, callback);
    this.router.route(endpoint)[method](callback);
  }


  /**
   * Adds multiple methods to a single endpoint.
   * @param {string} endpoint the API endpoint
   * @param {array} method e.g: ["get", "post"]
   * @param {array} callback e.g [getUsers, postUser]
   * 
   * The callback functions for the methods should be put in the array in order to grant each method its right callback function
   * 
   * Example: 
   * ```ts
   * 
   * import { APIController } from "api-tools-ts"
   * const api = new APIController("/api/v1")
   * 
   * const getUsers = (req, res) => {
   *   res.status(200).json({ method: "GET" })
   *  } 
   * 
   * const postUser = (req, res) => {
   *    res.status.(200).json(method: "POST")
   * }
   * 
   * api.AddMultipleMethods("/random", ["get", "post"], [getUsers, postUser]) // now the random endpoint will have the post and get methods and each has its own callback function
   * 
   * api.startServer("true")
   * 
   * ```
   */

  AddMultipleMethods(endpoint: string, method: string[], callback: any[]) {
    this.endpoints.set(endpoint, callback);
    method.forEach((method, index) => {
      const f = callback[index];
      this.router.route(endpoint)[method](f);
    });
  }


  /**
   * Adds a Middleware to the API that will apply to each request made to this endpoint
   * @param {string} middlewareId Just a name for this middleware
   * @param {callback} callback A callback function 
   * 
   * Example: 
   *  ```ts
   * import { APIController } from "api-tools-ts"
   * const api = new APIController("/api/v1")
   * 
   * api.AddEndPoint("/test", (req, res) => {
   *  res.status(200).json({status: "success", message: "I am running"})
   * })
   * 
   * // This middleware will be applied each time the endpoint /test and every other endpoint you add later are requested!
   * api.AddMiddleWare("whatever", (req, res, next) => {
   *  console.log("Hey I am your new middleware")
   *  next();
   * })
   * 
   * api.startServer("true")
   * ```
   * 
   */

  AddMiddleWare(middlewareId: string, callback: (req: Request, res: Response, next: NextFunction) => void) {
    this.MiddleWares.set(middlewareId, callback);
  }

  /**
   * Registers all Middlewares in the Express app.
   */

  private RegisterAllMiddleWares() {
    for (const [middleware, callback] of this.MiddleWares.entries()) {
      this.app.use(callback)
    }
  }

  /**
   * Starts the express server
   * @param {string} applyDefaultMiddleWares "true" || "false"
   * This parameter is optional. use startServer("true") || startServer("false") to enable or disable the default middlewares
   */

  startServer(applyDefaultMiddleWares?: 'true' | 'false') {
    if (applyDefaultMiddleWares && applyDefaultMiddleWares === 'true') {
      this.CreateMainEndPoint();
      this.RegisterAllMiddleWares();
    } else {
      this.RegisterAllMiddleWares();
      this.app.use(express.json());
      this.app.use(this.mainEndPoint, this.router);
    }
    const port = process.env.PORT || 3000;
    this.app.listen(port, () => {
      console.log(`API is running on https://localhost:${port}${this.mainEndPoint}`);
    });
  }
}
