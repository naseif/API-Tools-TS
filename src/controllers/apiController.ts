import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

/**
 * The HTTP Methods for the AddEndPoint() method
 */
export type HTTPMethods = 'get' | 'post' | 'put' | 'delete' | 'patch'

/**
 * The default callback function for an endpoint
 */

export type EndpointCallback = (req: Request, res: Response) => void

/**
 * The Middleware callback function for creating a middleware
 */
export type MiddleWareCallback = (req: Request, res: Response, next: NextFunction) => void

/**
 * The param callback function for AddParamChecker()
 */

export type ParameterCallback = (req: Request, res: Response, next: NextFunction, value: number | string) => void

/**
 * Whether to apply default middlewares or not type
 */

export type DefaultMiddlewares = "true" | "false"


export class APIController {
    /**
     * the main endpoint for this API
     */

    protected mainEndPoint: string;

    /**
     * The API Server PORT. Default: 51337
     */

    public port: number

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
     * A Map containing all used middlewares for this API
     */

    public MiddleWares: any;


    /**
     * A Map containing all parameters checker functions for this API
     */

    public parameters: any

    /**
     * Initialzes the APIController Class
     * @param {string} endpoint
     */

    constructor(endpoint: string) {
        if (!endpoint) throw new Error('APIController can not be initialized without a main endoint!');
        this.mainEndPoint = endpoint;
        this.endpoints = new Map();
        this.app = express();
        this.router = express.Router();
        this.MiddleWares = new Map();
        this.parameters = new Map();
        this.port = 51337
    }

    /**
     * Adds some middlewares for the API Security
     */

    private createMainEndPoint() {
        this.app.use(express.json());
        this.RegisterAllMiddleWares();
        this.app.use(this.mainEndPoint, this.router);
    }


    /**
     * Applies the default Middlewares
     */

    private applyDefaultMiddleWares() {
        this.MiddleWares.set('morgan', morgan('short'));
        this.MiddleWares.set('helmet', helmet());
        this.MiddleWares.set('cors', cors());
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
        method: HTTPMethods,
        callback: EndpointCallback
    ) {
        this.endpoints.set(endpoint, callback);
        this.router.route(endpoint)[method](callback);
    }

    /**
     * Adds multiple methods to a single endpoint.
     * @param {string} endpoint the API endpoint
     * @param {array} method e.g: ["get", "post"]
     * @param {Function[]} callback e.g [getUsers, postUser]
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
     *    res.status(200).json({method: "POST"})
     * }
     *
     *  // The "post" method here can have also multiple callback functions just like express allows
     * 
     * api.AddMultipleMethods("/random", ["get", "post"], [getUsers, [checkBody, postUser]]) // now the random endpoint will have the post and get methods and each has its own callback function
     *
     * api.startServer("true")
     *
     * ```
     */

    AddMultipleMethods(endpoint: string, method: string[], callback: Function[]) {
        this.endpoints.set(endpoint, callback);
        method.forEach((method, index) => {
            if (typeof method !== "string" && Array.isArray(method)) {
                this.AddMultipleMethods(endpoint, method, callback)
            }
            const f = callback[index];
            this.router.route(endpoint)[method](f);
        });
    }

    /**
     * Adds a Middleware to the API that will apply to each request made to this endpoint
     * @param {string} middlewareId Just a name for this middleware
     * @param {Function} callback A callback function
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

    AddMiddleWare(middlewareId: string, callback: MiddleWareCallback) {
        this.MiddleWares.set(middlewareId, callback);
    }


    /**
     * Map the given param placeholder name(s) to the given callback(s).
     * @param {string} param the parameter to write a condition for
     * @param {Function} callback the callback function for this paramter 
     * 
     * Example:
     * 
     * ```ts
     * 
     *  const api = new APIController('/api/v1');
     * 
     * api.AddEndPoint('/:id', 'get', (req, res) => {
     *   res.status(200).json({ data: 'none', status: 'ok' });
     * });
     * 
     * api.AddParamChecker('id', (req, res, next, value) => {
     *  if (value > 10) {
     *    res.status(404).json({ status: 'not allowed' });
     *  }
     *   next();
     * });
     * 
     * ```
     */

    AddParamChecker(param: string, callback: ParameterCallback) {
        this.parameters.set(param, callback);
    }

    /**
     * Registers all Middlewares in the Express app.
     */

    private RegisterAllMiddleWares() {
        for (const [middleware, callback] of this.MiddleWares.entries()) {
            this.app.use(callback);
        }
    }


    /**
     * Registers all parameter checkers for this router
     */

    private registerAllParamCheckers() {
        for (const [param, callback] of this.parameters.entries()) {
            this.router.param(param, callback);
        }
    }

    /**
     * Starts the express server
     * @param {string} applyDefaultMiddleWares "true" || "false"
     * This parameter is optional. use startServer("true") || startServer("false") to enable or disable the default middlewares
     */

    startServer(applyDefaultMiddleWares?: { useDefaultMiddlewares: DefaultMiddlewares }) {
        if (applyDefaultMiddleWares && applyDefaultMiddleWares.useDefaultMiddlewares === 'true') {
            this.applyDefaultMiddleWares();
            this.registerAllParamCheckers();
            this.createMainEndPoint();
        } else {
            this.RegisterAllMiddleWares();
            this.app.use(express.json());
            this.registerAllParamCheckers();
            this.app.use(this.mainEndPoint, this.router);
        }
        this.app.listen(this.port, () => {
            console.log(`API is running on http://localhost:${this.port}${this.mainEndPoint}`);
        });
    }
}
