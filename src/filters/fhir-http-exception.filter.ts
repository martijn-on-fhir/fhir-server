import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { FhirResponse } from '../lib/fhir-response'

/**
 * Exception filter that catches all HttpException instances and returns FHIR-compliant OperationOutcome resources
 * Provides consistent error handling across the FHIR server with appropriate HTTP status codes
 */
@Catch(HttpException)
export class FhirHttpExceptionFilter implements ExceptionFilter {

    /**
     * Catches HttpException and converts it to a FHIR OperationOutcome response
     * Maps HTTP status codes to appropriate FHIR OperationOutcome severity and codes
     * @param exception - The HttpException that was thrown
     * @param host - The execution context containing the response object
     */
    catch(exception: HttpException, host: ArgumentsHost): void {

        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const status = exception.getStatus()
        const message = exception.message || 'An error occurred'

        let fhirOutcome: object

        // Map HTTP status codes to appropriate FHIR responses
        switch (status) {
            case HttpStatus.BAD_REQUEST:
                fhirOutcome = FhirResponse.badRequest(message)
                break
            case HttpStatus.UNAUTHORIZED:
                fhirOutcome = this.createUnauthorizedOutcome(message)
                break
            case HttpStatus.FORBIDDEN:
                fhirOutcome = FhirResponse.forbidden(message)
                break
            case HttpStatus.NOT_FOUND:
                fhirOutcome = this.createNotFoundOutcome(message)
                break
            case HttpStatus.METHOD_NOT_ALLOWED:
                fhirOutcome = this.createMethodNotAllowedOutcome(message)
                break
            case HttpStatus.NOT_ACCEPTABLE:
                fhirOutcome = this.createNotAcceptableOutcome(message)
                break
            case HttpStatus.CONFLICT:
                fhirOutcome = this.createConflictOutcome(message)
                break
            case HttpStatus.GONE:
                fhirOutcome = this.createGoneOutcome(message)
                break
            case HttpStatus.PRECONDITION_FAILED:
                fhirOutcome = this.createPreconditionFailedOutcome(message)
                break
            case HttpStatus.UNPROCESSABLE_ENTITY:
                fhirOutcome = this.createUnprocessableEntityOutcome(message)
                break
            case HttpStatus.TOO_MANY_REQUESTS:
                fhirOutcome = this.createTooManyRequestsOutcome(message)
                break
            case HttpStatus.INTERNAL_SERVER_ERROR:
                fhirOutcome = this.createInternalServerErrorOutcome(message)
                break
            case HttpStatus.NOT_IMPLEMENTED:
                fhirOutcome = this.createNotImplementedOutcome(message)
                break
            case HttpStatus.SERVICE_UNAVAILABLE:
                fhirOutcome = this.createServiceUnavailableOutcome(message)
                break
            default:
                fhirOutcome = this.createGenericErrorOutcome(status, message)
                break
        }

        response
            .status(status)
            .json(fhirOutcome)
    }

    /**
     * Creates a FHIR OperationOutcome for 401 Unauthorized errors
     */
    private createUnauthorizedOutcome(message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'security',
                details: {
                    text: message
                }
            }]
        }
    }

    /**
     * Creates a FHIR OperationOutcome for 404 Not Found errors
     */
    private createNotFoundOutcome(message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'not-found',
                details: {
                    text: message
                }
            }]
        }
    }

    /**
     * Creates a FHIR OperationOutcome for 405 Method Not Allowed errors
     */
    private createMethodNotAllowedOutcome(message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'not-supported',
                details: {
                    text: message
                }
            }]
        }
    }

    /**
     * Creates a FHIR OperationOutcome for 406 Not Acceptable errors
     */
    private createNotAcceptableOutcome(message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'not-supported',
                details: {
                    text: message
                }
            }]
        }
    }

    /**
     * Creates a FHIR OperationOutcome for 409 Conflict errors
     */
    private createConflictOutcome(message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'conflict',
                details: {
                    text: message
                }
            }]
        }
    }

    /**
     * Creates a FHIR OperationOutcome for 410 Gone errors
     */
    private createGoneOutcome(message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'deleted',
                details: {
                    text: message
                }
            }]
        }
    }

    /**
     * Creates a FHIR OperationOutcome for 412 Precondition Failed errors
     */
    private createPreconditionFailedOutcome(message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'business-rule',
                details: {
                    text: message
                }
            }]
        }
    }

    /**
     * Creates a FHIR OperationOutcome for 422 Unprocessable Entity errors
     */
    private createUnprocessableEntityOutcome(message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'processing',
                details: {
                    text: message
                }
            }]
        }
    }

    /**
     * Creates a FHIR OperationOutcome for 429 Too Many Requests errors
     */
    private createTooManyRequestsOutcome(message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'throttled',
                details: {
                    text: message
                }
            }]
        }
    }

    /**
     * Creates a FHIR OperationOutcome for 500 Internal Server Error
     */
    private createInternalServerErrorOutcome(message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'exception',
                details: {
                    text: message
                }
            }]
        }
    }

    /**
     * Creates a FHIR OperationOutcome for 501 Not Implemented errors
     */
    private createNotImplementedOutcome(message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'not-supported',
                details: {
                    text: message
                }
            }]
        }
    }

    /**
     * Creates a FHIR OperationOutcome for 503 Service Unavailable errors
     */
    private createServiceUnavailableOutcome(message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'transient',
                details: {
                    text: message
                }
            }]
        }
    }

    /**
     * Creates a generic FHIR OperationOutcome for unmapped HTTP status codes
     */
    private createGenericErrorOutcome(status: number, message: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'exception',
                details: {
                    text: `HTTP ${status}: ${message}`
                }
            }]
        }
    }
}