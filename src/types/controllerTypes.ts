/**
 * The HTTP Methods for the AddEndPoint() method
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

export type HTTPMethods = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

/**
 * The default callback function for an endpoint
 */

export type EndpointCallback = (req: Request, res: Response, next?: NextFunction) => void | Promise<void>;

/**
 * The Middleware callback function for creating a middleware
 */

export type MiddleWareCallback = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

/**
 * The param callback function for AddParamChecker()
 */
export type ParameterCallback = (
    req: Request,
    res: Response,
    next: NextFunction,
    value: string
) => void | Promise<void>;

/**
 * Configuration options for the API Controller
 */
export interface APIControllerConfig {
    port?: number;
    hostname?: string;
    useDefaultMiddlewares?: boolean;
    cors?: cors.CorsOptions;
    helmet?: Parameters<typeof helmet>[0];
    morgan?: string | morgan.FormatFn;
    jsonLimit?: string;
    urlEncodedLimit?: string;
}

/**
 * Route definition for bulk endpoint registration
 */
export interface RouteDefinition {
    path: string;
    method: HTTPMethods | HTTPMethods[];
    handler: EndpointCallback | EndpointCallback[];
    middlewares?: MiddleWareCallback[];
}
