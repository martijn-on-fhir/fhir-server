import {FhirResourceDocument} from '../schema/fhir-resource-schema'
import {v4 as uuidv4} from 'uuid'
import {ValidationResult} from '../interfaces/validation-result'
import {Request} from 'express'
import {IncomingMessage} from 'node:http'

/**
 * Handles formatting and bundling of FHIR resources for API responses.
 * Provides utility methods to transform and package FHIR resources according to the FHIR specification.
 */
export class FhirResponse {

    /**
     * Formats a single FHIR resource by combining the resource data with its metadata.
     * @param resource - The FHIR resource document to format
     * @returns The formatted FHIR resource with combined metadata
     */
    static format(resource: FhirResourceDocument): Record<string, unknown> {

        return {
            ...resource
        }
    }

    static forbidden(description: string): object {
        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'forbidden',
                details: { text: description }
            }]
        }
    }

    /**
     * Creates an OperationOutcome resource for invalid FHIR resources.
     * @param result - The validation result containing errors
     * @returns An OperationOutcome resource describing validation errors
     */
    static notValid(result: ValidationResult): object {

        const response: {
            resourceType: string,
            issue: Array<{
                severity: string,
                code: string,
                details: {
                    text: string
                }
            }>
        } = {
            resourceType: 'OperationOutcome',
            issue: []
        }

        for (const error of result.errors) {

            const issue = {
                severity: 'error',
                code: 'invalid',
                details: {
                    text: error
                }
            } as never

            response.issue.push(issue)
        }

        return response
    }

    /**
     * Creates an OperationOutcome resource for resource not found errors.
     * @param description - Description of the resource that was not found
     * @returns An OperationOutcome resource with not-found error details
     */
    static notFound(description: string): object {

        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'not-found',
                details: {
                    text: `${description}`
                }
            }]
        }
    }

    /**
     * Creates an OperationOutcome resource for not acceptable errors.
     * @param description - Description of why the request was not acceptable
     * @returns An OperationOutcome resource with not-acceptable error details
     */
    static notAcceptable(description: string): object {

        return {
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'not-acceptable',
                details: {
                    text: `${description}`
                }
            }]
        }
    }

    /**
     * Creates a FHIR Bundle resource containing multiple FHIR resources with pagination support
     * @param resources - Array of FHIR resource documents to include in the bundle
     * @param total - Total number of available resources
     * @param offset - Starting index for pagination (default: 0)
     * @param count - Number of resources per page (default: 20)
     * @param request - Express request object for building pagination URLs
     * @returns A FHIR Bundle resource containing the requested resources and pagination links
     */
    static bundle(resources: FhirResourceDocument[], total: number, offset: number = 0, count: number = 20, request?: Request): any {

        let hostUrl = ''
        let url = request?.url.split('?')[0].substring(1)
        const query = request?.query ?? null

        if (query) {

            let c = 0

            for (const key in query) {

                if (key === '_offset' || key === '_count') {
                    delete query[key]
                } else {
                    url += `${c === 0 ? '?' : '&'}${key}=${query[key]}`
                    c++
                }
            }
        }

        if (request && request instanceof IncomingMessage) {
            hostUrl = request.get('secure') ? `https://${request.get('host')}` : `http://${request.get('host')}`
        }

        const response = {
            resourceType: 'Bundle',
            id: uuidv4(),
            type: 'searchset',
            total,
            link: [{
                relation: 'self',
                url: `${hostUrl}/${url}${url?.includes('?') ? '&' : '?'}_offset=${offset}&_count=${count}`
            },

                ...(offset + count < total && total !== 0 ? [{
                    relation: 'next',
                    url: `${hostUrl}/${url}${url?.includes('?') ? '&' : '?'}_offset=${offset + count}&_count=${count}`
                }] : []),

                ...(offset > 0 && total !== 0 ? [{
                    relation: 'previous',
                    url: `${hostUrl}/${url}${url?.includes('?') ? '&' : '?'}_offset=${Math.max(0, offset - count)}&_count=${count}`
                }] : [])
            ],
            entry: resources.map(resource => ({
                fullUrl: `${hostUrl}/fhir/${resource.resourceType}/${resource.id}`,
                resource: FhirResponse.format(resource),
                search: {
                    mode: 'match'
                }
            }))
        }

        return response
    }
}