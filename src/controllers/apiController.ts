import express, { Application, NextFunction, Request, Response, Router } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { Server } from 'http';
import { Socket } from 'net';
import { ControllerErrors, Errors } from '../utils/ControllerErrors';
import {
    EndpointCallback,
    ParameterCallback,
    MiddleWareCallback,
    APIControllerConfig,
    HTTPMethods,
    RouteDefinition
} from '../types';

export class APIController {
    /**
     * the main endpoint for this API
     */
    public readonly mainEndPoint: string;

    /**
     * The API Server PORT. Default: 3000
     */
    public port: number;

    /**
     * A map containing all endpoints of this API
     */
    public readonly endpoints: Map<string, EndpointCallback | ParameterCallback>;

    /**
     * Express Object
     */
    private readonly app: Application;

    /**
     * Express Router
     */
    private readonly router: Router;

    /**
     * A Map containing all used middlewares for this API
     */
    public readonly middlewares: Map<string, MiddleWareCallback>;

    /**
     * A Map containing all parameters checker functions for this API
     */
    public readonly parameters: Map<string, ParameterCallback>;

    /**
     * Bind the API to a different IP Address
     */
    public hostname: string;

    /**
     * Configuration for the API
     */
    private config: APIControllerConfig;

    /**
     * Whether the server has been started
     */
    private isServerStarted: boolean = false;

    /**
     * Reference to the HTTP server instance
     */
    private server: Server | null = null;

    /**
     * Set to track active connections for graceful shutdown
     */
    private connections: Set<Socket> = new Set();

    /**
     * Initializes the APIController Class
     * @param {string} endpoint - The main endpoint for the API
     * @param {APIControllerConfig} config - Configuration options
     */
    constructor(endpoint: string, config: APIControllerConfig = {}) {
        if (!endpoint || typeof endpoint !== 'string') {
            throw new ControllerErrors(
                'APIController requires a valid main endpoint (string)!',
                Errors.CLASS_INITIALIZATION_ERROR
            );
        }

        if (!endpoint.startsWith('/')) {
            throw new ControllerErrors('Main endpoint must start with "/"', Errors.CLASS_INITIALIZATION_ERROR);
        }

        this.mainEndPoint = endpoint;
        this.endpoints = new Map();
        this.app = express();
        this.router = Router();
        this.middlewares = new Map();
        this.parameters = new Map();

        // Apply configuration with defaults
        this.config = {
            port: 3000,
            hostname: 'localhost',
            useDefaultMiddlewares: true,
            jsonLimit: '10mb',
            urlEncodedLimit: '10mb',
            ...config
        };

        this.port = this.config.port!;
        this.hostname = this.config.hostname!;

        this.setupBaseMiddlewares();
    }

    /**
     * Sets up base express middlewares
     */
    private setupBaseMiddlewares(): void {
        this.app.use(express.json({ limit: this.config.jsonLimit }));
        this.app.use(express.urlencoded({ extended: true, limit: this.config.urlEncodedLimit }));
    }

    /**
     * Applies the default Middlewares
     */
    private applyDefaultMiddlewares(): void {
        if (this.config.useDefaultMiddlewares) {
            this.middlewares.set('morgan', morgan((this.config.morgan as string) || 'combined'));
            this.middlewares.set('helmet', helmet(this.config.helmet));
            this.middlewares.set('cors', cors(this.config.cors));
        }
    }

    /**
     * Validates HTTP method
     */
    private validateHTTPMethod(method: HTTPMethods): void {
        const validMethods: HTTPMethods[] = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
        if (!validMethods.includes(method)) {
            throw new ControllerErrors(
                `Invalid HTTP method: ${method}. Valid methods are: ${validMethods.join(', ')}`,
                Errors.METHOD_ERROR
            );
        }
    }

    /**
     * Validates endpoint path
     */
    private validateEndpoint(endpoint: string): void {
        if (!endpoint || typeof endpoint !== 'string') {
            throw new ControllerErrors('Endpoint must be a non-empty string!', Errors.ENDPOINT_ERROR);
        }
        if (!endpoint.startsWith('/')) {
            throw new ControllerErrors('Endpoint must start with "/"', Errors.ENDPOINT_ERROR);
        }
    }

    /**
     * Validates callback function
     */
    private validateCallback(callback: any, errorType: Errors): void {
        if (!callback || typeof callback !== 'function') {
            throw new ControllerErrors('Callback must be a valid function!', errorType);
        }
    }

    /**
     * Adds an endpoint to the API with improved error handling
     */
    public addEndpoint(
        endpoint: string,
        method: HTTPMethods,
        callback: EndpointCallback,
        middlewares?: MiddleWareCallback[]
    ): void {
        this.validateEndpoint(endpoint);
        this.validateHTTPMethod(method);
        this.validateCallback(callback, Errors.CALLBACK_ERROR);

        if (this.isServerStarted) {
            throw new ControllerErrors('Cannot add endpoints after server has started', Errors.CONTROLLER_ERROR);
        }

        const fullPath = `${method.toUpperCase()} ${endpoint}`;
        if (this.endpoints.has(fullPath)) {
            console.warn(`Warning: Overwriting existing endpoint ${fullPath}`);
        }

        this.endpoints.set(fullPath, callback);

        const handlers = middlewares ? [...middlewares, callback] : [callback];
        this.router.route(endpoint)[method](...handlers);
    }

    /**
     * Legacy method for backward compatibility
     */
    public AddEndPoint(endpoint: string, method: HTTPMethods, callback: EndpointCallback): void {
        this.addEndpoint(endpoint, method, callback);
    }

    /**
     * Adds multiple methods to a single endpoint with improved type safety
     */
    public addMultipleMethods(endpoint: string, methods: HTTPMethods[], callbacks: EndpointCallback[]): void {
        this.validateEndpoint(endpoint);

        if (!Array.isArray(methods) || methods.length === 0) {
            throw new ControllerErrors('Methods must be a non-empty array of HTTP methods', Errors.METHOD_ERROR);
        }

        if (!Array.isArray(callbacks) || callbacks.length !== methods.length) {
            throw new ControllerErrors(
                'Callbacks array must have the same length as methods array',
                Errors.CALLBACK_ERROR
            );
        }

        methods.forEach((method, index) => {
            this.validateHTTPMethod(method);
            this.validateCallback(callbacks[index], Errors.CALLBACK_ERROR);
            this.addEndpoint(endpoint, method, callbacks[index]);
        });
    }

    /**
     * Legacy method for backward compatibility
     */
    public AddMultipleMethods(endpoint: string, method: string[], callback: any): void {
        // Convert old format to new format for backward compatibility
        if (!Array.isArray(callback)) {
            throw new ControllerErrors('Callback must be an array for multiple methods', Errors.CALLBACK_ERROR);
        }
        this.addMultipleMethods(endpoint, method as HTTPMethods[], callback);
    }

    /**
     * Adds bulk routes from configuration
     */
    public addRoutes(routes: RouteDefinition[]): void {
        routes.forEach((route) => {
            if (Array.isArray(route.method)) {
                const callbacks = Array.isArray(route.handler) ? route.handler : [route.handler];
                this.addMultipleMethods(route.path, route.method, callbacks);
            } else {
                const callback = Array.isArray(route.handler) ? route.handler[0] : route.handler;
                this.addEndpoint(route.path, route.method, callback, route.middlewares);
            }
        });
    }

    /**
     * Adds a Middleware to the API
     */
    public addMiddleware(middlewareId: string, callback: MiddleWareCallback): void {
        if (!middlewareId || typeof middlewareId !== 'string') {
            throw new ControllerErrors('Middleware ID must be a non-empty string', Errors.MIDDLEWARE_ERROR);
        }

        this.validateCallback(callback, Errors.MIDDLEWARE_ERROR);

        if (this.middlewares.has(middlewareId)) {
            console.warn(`Warning: Overwriting existing middleware ${middlewareId}`);
        }

        this.middlewares.set(middlewareId, callback);
    }

    /**
     * Legacy method for backward compatibility
     */
    public AddMiddleWare(middlewareId: string, callback: MiddleWareCallback): void {
        this.addMiddleware(middlewareId, callback);
    }

    /**
     * Adds a parameter checker with improved validation
     */
    public addParamChecker(param: string, callback: ParameterCallback): void {
        if (!param || typeof param !== 'string') {
            throw new ControllerErrors('Parameter name must be a non-empty string', Errors.PARAMETER_ERROR);
        }

        this.validateCallback(callback, Errors.PARAMETER_ERROR);

        this.parameters.set(param, callback);
    }

    /**
     * Legacy method for backward compatibility
     */
    public AddParamChecker(param: string, callback: ParameterCallback): void {
        this.addParamChecker(param, callback);
    }

    /**
     * Registers all Middlewares in the Express app
     */
    private registerAllMiddlewares(): void {
        for (const [middlewareId, callback] of this.middlewares.entries()) {
            try {
                this.app.use(callback);
            } catch (error) {
                throw new ControllerErrors(
                    `Failed to register middleware "${middlewareId}": ${error}`,
                    Errors.MIDDLEWARE_ERROR
                );
            }
        }
    }

    /**
     * Legacy method for backward compatibility
     */
    private RegisterAllMiddleWares(): void {
        this.registerAllMiddlewares();
    }

    /**
     * Registers all parameter checkers for this router
     */
    private registerAllParamCheckers(): void {
        for (const [param, callback] of this.parameters.entries()) {
            try {
                this.router.param(param, callback);
            } catch (error) {
                throw new ControllerErrors(
                    `Failed to register parameter checker "${param}": ${error}`,
                    Errors.PARAMETER_ERROR
                );
            }
        }
    }

    /**
     * Sets up the main endpoint and routing
     */
    private setupRouting(): void {
        this.registerAllParamCheckers();
        this.app.use(this.mainEndPoint, this.router);
    }

    /**
     * Adds global error handling middleware
     */
    private addErrorHandling(): void {
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error('Unhandled error:', err);

            if (err instanceof ControllerErrors) {
                res.status(400).json({
                    error: true,
                    message: err.message,
                    code: err.errorCode,
                    context: err.context
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Internal server error'
                });
            }
        });

        // Handle 404 for unmatched routes
        this.app.use('*', (req: Request, res: Response) => {
            res.status(404).json({
                error: true,
                message: `Route ${req.originalUrl} not found`,
                availableEndpoints: Array.from(this.endpoints.keys())
            });
        });
    }

    /**
     * Gets server information
     */
    public getServerInfo(): { port: number; hostname: string; mainEndPoint: string; isRunning: boolean } {
        return {
            port: this.port,
            hostname: this.hostname,
            mainEndPoint: this.mainEndPoint,
            isRunning: this.isServerStarted
        };
    }

    /**
     * Gets all registered endpoints
     */
    public getEndpoints(): string[] {
        return Array.from(this.endpoints.keys());
    }

    /**
     * Tracks active connections for graceful shutdown
     */
    private setupConnectionTracking(): void {
        if (!this.server) return;

        this.server.on('connection', (socket: Socket) => {
            this.connections.add(socket);

            socket.on('close', () => {
                this.connections.delete(socket);
            });

            socket.on('error', () => {
                this.connections.delete(socket);
            });
        });
    }

    /**
     * Closes all active connections
     */
    private closeAllConnections(): void {
        for (const socket of this.connections) {
            socket.destroy();
        }
        this.connections.clear();
    }

    /**
     * Starts the express server with improved configuration
     */
    public async startServer(legacyConfig?: { useDefaultMiddlewares: string }): Promise<void> {
        if (this.isServerStarted) {
            throw new ControllerErrors('Server is already running', Errors.SERVER_ERROR);
        }

        try {
            // Handle legacy configuration format
            if (legacyConfig?.useDefaultMiddlewares) {
                this.config.useDefaultMiddlewares = legacyConfig.useDefaultMiddlewares === 'true';
            }

            this.applyDefaultMiddlewares();
            this.registerAllMiddlewares();
            this.setupRouting();
            this.addErrorHandling();

            return new Promise((resolve, reject) => {
                this.server = this.app.listen(this.port, this.hostname, () => {
                    this.isServerStarted = true;

                    // Set up connection tracking after server starts
                    this.setupConnectionTracking();

                    console.log(`🚀 API is running on http://${this.hostname}:${this.port}${this.mainEndPoint}`);
                    console.log(`📊 Registered ${this.endpoints.size} endpoints`);
                    console.log(`🔧 Active middlewares: ${Array.from(this.middlewares.keys()).join(', ')}`);
                    resolve();
                });

                this.server!.on('error', (error) => {
                    reject(
                        new ControllerErrors(`Failed to start server: ${error.message}`, Errors.SERVER_ERROR, {
                            originalError: error
                        })
                    );
                });
            });
        } catch (error) {
            throw new ControllerErrors(`Server startup failed: ${error}`, Errors.SERVER_ERROR);
        }
    }

    /**
     * Gracefully stops the server
     */
    public async stopServer(): Promise<void> {
        if (!this.isServerStarted || !this.server) {
            throw new ControllerErrors('Server is not running', Errors.SERVER_ERROR);
        }

        return new Promise((resolve, reject) => {
            // Set a timeout for forced shutdown
            const forceShutdownTimeout = setTimeout(() => {
                console.warn('⚠️ Force closing server due to timeout');
                this.closeAllConnections();
                this.server!.close(() => {
                    this.cleanup();
                    resolve();
                });
            }, 10000); // 10 seconds timeout

            // Graceful shutdown
            this.server!.close((error) => {
                clearTimeout(forceShutdownTimeout);

                if (error) {
                    reject(
                        new ControllerErrors(`Error stopping server: ${error.message}`, Errors.SERVER_ERROR, {
                            originalError: error
                        })
                    );
                    return;
                }

                this.cleanup();
                console.log('✅ Server stopped gracefully');
                resolve();
            });

            // Stop accepting new connections and close existing ones
            setTimeout(() => {
                this.closeAllConnections();
            }, 1000); // Give existing requests 1 second to complete
        });
    }

    /**
     * Cleanup server state
     */
    private cleanup(): void {
        this.isServerStarted = false;
        this.server = null;
        this.connections.clear();
    }

    /**
     * Force stops the server immediately (not recommended for production)
     */
    public forceStopServer(): void {
        if (!this.server) {
            throw new ControllerErrors('Server is not running', Errors.SERVER_ERROR);
        }

        this.closeAllConnections();
        this.server.close();
        this.cleanup();
        console.log('⚠️ Server force stopped');
    }

    /**
     * Gets current connection count
     */
    public getActiveConnections(): number {
        return this.connections.size;
    }

    /**
     * Gets the Express app instance for advanced usage
     */
    public getApp(): Application {
        return this.app;
    }

    /**
     * Gets the Express router instance
     */
    public getRouter(): Router {
        return this.router;
    }
}
