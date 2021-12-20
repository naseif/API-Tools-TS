import express, { Request, Response } from 'express';
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

    constructor(endpoint: string) {
        if (!endpoint) throw new Error('APIController can not be initialized without a main endoint!');
        this.mainEndPoint = endpoint;
        this.endpoints = new Map();
        this.app = express();
        this.router = express.Router();
    }

    /**
     * Adds some middlewares for the API Security
     */

    private CreateMainEndPoint() {
        this.app.use(morgan('short'));
        this.app.use(helmet());
        this.app.use(cors());
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
     * Starts the express server
     * @param {string} applyDefaultMiddleWares "true" || "false"
     * This parameter is optional. use startServer("true") || startServer("false") to enable or disable the default middlewares
     */

    startServer(applyDefaultMiddleWares?: 'true' | 'false') {
        if (applyDefaultMiddleWares && applyDefaultMiddleWares === 'true') {
            this.CreateMainEndPoint();
        } else {
            this.app.use(express.json());
            this.app.use(this.mainEndPoint, this.router);
        }
        const port = process.env.PORT || 3000;
        this.app.listen(port, () => {
            console.log(`API is running on https://localhost:${port}${this.mainEndPoint}`);
        });
    }
}
