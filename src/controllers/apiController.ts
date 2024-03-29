import express, { Application, NextFunction, Request, Response, Router } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { ControllerErrors, Errors } from '../Utils/ControllerErrors';

/**
 * The HTTP Methods for the AddEndPoint() method
 */
export type HTTPMethods = 'get' | 'post' | 'put' | 'delete' | 'patch';

/**
 * The default callback function for an endpoint
 */

export type EndpointCallback = (req: Request, res: Response) => void;

/**
 * The Middleware callback function for creating a middleware
 */
export type MiddleWareCallback = (req: Request, res: Response, next: NextFunction) => void;

/**
 * The param callback function for AddParamChecker()
 */

export type ParameterCallback = (req: Request, res: Response, next: NextFunction, value: number | string) => void;

/**
 * Whether to apply default middlewares or not type
 */

export type DefaultMiddlewares = 'true' | 'false';

export class APIController {
    /**
     * the main endpoint for this API
     */

    public mainEndPoint: string;

    /**
     * The API Server PORT. Default: 51337
     */

    public port: number;

    /**
     * A map containing all endpoints of this API
     */

    public endpoints: Map<string, EndpointCallback | ParameterCallback>;

    /**
     * Express Object
     */

    private app: Application;

    /**
     * Express Router
     */

    private router: any;

    /**
     * A Map containing all used middlewares for this API
     */

    public MiddleWares: Map<string, MiddleWareCallback>;

    /**
     * A Map containing all parameters checker functions for this API
     */

    public parameters: Map<string, ParameterCallback>;

    /**
     * Bind the API to a different IP Address
     */
    public hostname: string

    /**
     * Initialzes the APIController Class
     * @param {string} endpoint
     */

    constructor(endpoint: string) {
        if (!endpoint)
            throw new ControllerErrors(
                'APIController can not be initialized without a main endpoint!',
                Errors.CLASS_INITIALIZATION_ERROR
            );
        this.mainEndPoint = endpoint;
        this.endpoints = new Map();
        this.app = express();
        this.router = Router();
        this.MiddleWares = new Map();
        this.parameters = new Map();
        this.port = 51337;
        this.hostname = "localhost"
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

    AddEndPoint(endpoint: string, method: HTTPMethods, callback: EndpointCallback) {
        if (!endpoint) throw new ControllerErrors('You did not provide a valid endpoint!', Errors.ENDPOITN_ERROR);
        if (!method)
            throw new ControllerErrors(
                'You did not provide a valid HTTP Method for this endpoint!',
                Errors.METHOD_ERROR
            );
        if (!callback || typeof callback !== 'function')
            throw new ControllerErrors(
                'The Callback function is either missing or is from type string.',
                Errors.CALLBACK_ERROR
            );
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

    AddMultipleMethods(endpoint: string, method: string[], callback: EndpointCallback) {
        if (!endpoint) throw new ControllerErrors('You did not provide a valid endpoint!', Errors.ENDPOITN_ERROR);
        if (!method || typeof method !== 'object')
            throw new ControllerErrors(
                'The HTTP methods is not of type string. You have to provide an Array containing all HTTP Methods you want to attach.',
                Errors.METHOD_ERROR
            );
        if (!callback || typeof callback !== 'object')
            throw new ControllerErrors('The callback function is not from type string!', Errors.CALLBACK_ERROR);
        this.endpoints.set(endpoint, callback);
        method.forEach((method, index) => {
            if (typeof method !== 'string' && Array.isArray(method)) {
                this.AddMultipleMethods(endpoint, method, callback);
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
        if (!middlewareId || typeof middlewareId !== 'string')
            throw new ControllerErrors(
                'You did not provide a valid Middleware name. The Middleware name is from type string',
                Errors.MIDDLEWARE_ERROR
            );
        if (!callback || typeof callback !== 'function')
            throw new ControllerErrors(
                'The Callback function for this Middleware is missing or is from type string.',
                Errors.CALLBACK_ERROR
            );
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
        if (!param || typeof param !== 'string')
            throw new ControllerErrors(
                'The param name is either missing or is not from type string!',
                Errors.PARAMETER_ERROR
            );
        if (!callback || typeof callback !== 'function')
            throw new ControllerErrors(
                'The Callback function for this ParamChecker is missing or is from type string.',
                Errors.CALLBACK_ERROR
            );
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
        this.app.listen(this.port, this.hostname, () => {
            console.log(`API is running on http://localhost:${this.port}${this.mainEndPoint}`);
        });
    }
}
