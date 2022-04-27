/**
 * The Error Codes for the ControllerErros Class
 */

export enum Errors {
    CLASS_INITIALIZATION_ERROR = 'InitializationError',
    CONTROLLER_ERROR = 'ControllerError',
    ENDPOITN_ERROR = 'EndpointError',
    METHOD_ERROR = 'MethodError',
    CALLBACK_ERROR = 'CallbackFunctionError',
    MIDDLEWARE_ERROR = 'MiddleWareError',
    PARAMETER_ERROR = 'ParameterError'
}

export class ControllerErrors extends Error {
    /**
     * The error message
     */

    message: string;

    /**
     * the error code for this error message
     */

    errorCode: Errors;

    constructor(message: string, code: Errors = Errors.CONTROLLER_ERROR) {
        super();
        this.message = `${code} - ${message}`;
        this.errorCode = code;
        Error.captureStackTrace(this);
    }
}
