import {ExceptionFilter, Catch, ArgumentsHost, BadRequestException} from '@nestjs/common';
import { Response } from 'express';
import { FhirResponse } from '../lib/fhir-response';

/**
 * Exception filter that catches BadRequestException and returns a FHIR-compliant OperationOutcome resource
 */
@Catch(BadRequestException)
export class FhirBadRequestExceptionFilter implements ExceptionFilter {

    /**
     * Catches BadRequestException and converts it to a FHIR OperationOutcome response
     * @param exception - The BadRequestException that was thrown
     * @param host - The execution context containing the response object
     */
    catch(exception: BadRequestException, host: ArgumentsHost): void {

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const fhirOutcome = FhirResponse.badRequest(exception.message);

        response
            .status(400)
            .json(fhirOutcome);
    }
}