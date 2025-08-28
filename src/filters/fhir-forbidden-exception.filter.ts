import { ExceptionFilter, Catch, ArgumentsHost, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { FhirResponse } from '../lib/fhir-response';

/**
 * Exception filter that catches ForbiddenException and returns a FHIR-compliant OperationOutcome resource
 */
@Catch(ForbiddenException)
export class FhirForbiddenExceptionFilter implements ExceptionFilter {
    
    /**
     * Catches ForbiddenException and converts it to a FHIR OperationOutcome response
     * @param exception - The ForbiddenException that was thrown
     * @param host - The execution context containing the response object
     */
    catch(exception: ForbiddenException, host: ArgumentsHost): void {

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        
        const fhirOutcome = FhirResponse.forbidden(exception.message);
        
        response
            .status(403)
            .json(fhirOutcome);
    }
}