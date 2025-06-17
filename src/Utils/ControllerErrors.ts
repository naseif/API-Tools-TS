/**
 * The Error Codes for the ControllerErrors Class
 */

export enum Errors {
    CLASS_INITIALIZATION_ERROR = 'InitializationError',
    CONTROLLER_ERROR = 'ControllerError',
    ENDPOINT_ERROR = 'EndpointError', // Fixed typo
    METHOD_ERROR = 'MethodError',
    CALLBACK_ERROR = 'CallbackFunctionError',
    MIDDLEWARE_ERROR = 'MiddleWareError',
    PARAMETER_ERROR = 'ParameterError',
    SERVER_ERROR = 'ServerError',
    VALIDATION_ERROR = 'ValidationError'
}

export class ControllerErrors extends Error {
    /**
     * The error message
     */
    public readonly message: string;

    /**
     * the error code for this error message
     */
    public readonly errorCode: Errors;

    /**
     * Additional context about the error
     */
    public readonly context?: Record<string, any>;

    constructor(message: string, code: Errors = Errors.CONTROLLER_ERROR, context?: Record<string, any>) {
        super();
        this.message = `${code} - ${message}`;
        this.errorCode = code;
        this.context = context;
        this.name = 'ControllerErrors';
        Error.captureStackTrace(this, ControllerErrors);
    }
}
