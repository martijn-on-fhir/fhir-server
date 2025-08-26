import {AccessDecision} from "../../interfaces/access-decision";
import {IncomingMessage} from "node:http";
import {last} from 'lodash-es'
import * as jose from 'jose';

/**
 * Handles FHIR resource access authorization based on OAuth2 scopes.
 *
 * This class validates whether a request has the necessary permissions
 * to perform operations on FHIR resources by checking the scopes
 * present in the authorization token against the requested operation
 * and resource type.
 */
export class FhirScopeAuthorization {

    /** HTTP method of the incoming request */
    private _method: 'GET' | 'POST' | 'PUT' | 'DELETE';

    /** Identifier of the user making the request */
    private _userId: string

    /** OAuth2 scopes extracted from the authorization token */
    private _scope: any

    /** The incoming HTTP request being authorized */
    private _request: IncomingMessage

    /** The FHIR resource type being accessed */
    private _resource: string

    /** The FHIR operation being performed */
    private _operation: 'read' | 'create' | 'update' | 'delete';

    /** The authorization decision and associated metadata */
    private _decision: AccessDecision

    /**
     * Authorizes an incoming HTTP request based on its scopes.
     *
     * This method:
     * - Extracts the authorization token and scopes
     * - Determines the requested operation and resource
     * - Validates the access permissions
     *
     * @param request - The incoming HTTP request to authorize
     * @returns An AccessDecision object indicating if the request is allowed
     */
    authorize(request: IncomingMessage): AccessDecision {

        this._decision = {
            allowed: true,
            reasons: [],
            warnings: [],
            filteredIncludes: []
        }

        this._request = request;
        this._method = request.method?.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE'

        this.setScope()
        this.setOperation()
        this.setResource()
        this.validate()

        return this._decision
    }

    /**
     * Validates the request against the extracted scopes.
     *
     * Performs the primary resource access check and updates
     * the authorization decision accordingly.
     *
     * @private
     */
    private validate(): void{
        this._decision = this.checkPrimaryResourceAccess()
    }

    /**
     * Checks if the request has permission to access the primary resource.
     *
     * Maps operations to required permissions and checks if any of the
     * provided scopes grant the necessary permission for the requested
     * resource and operation.
     *
     * @private
     * @returns Object containing the access decision and reasoning
     */
    private checkPrimaryResourceAccess(): { allowed: boolean; reasons: string[] } {

        const permissionMap = {
            'create': 'c',
            'read': 'r',
            'update': 'u',
            'delete': 'd',
            'search': 's'
        };

        const requiredPermission = permissionMap[this._operation]

        for (const scope of this._scope) {

            const decision: boolean = this.scopeGrantsPermission(scope, this._resource, requiredPermission)

            if (decision) {
                return { allowed: true, reasons: [`Granted by scope: ${scope}`] };
            }
        }

        return {
            allowed: false,
            reasons: [`No scope grants ${this._operation} permission for ${this._resource}`]
        }
    }

    /**
     * Determines if a specific scope grants a permission for a resource type.
     *
     * Parses the scope string in format "context/resource.permission" and
     * checks if it matches the requested resource type and permission.
     * Supports wildcard (*) matching for both resource and permission.
     *
     * @private
     * @param scope - The scope to check in format "context/resource.permission"
     * @param resourceType - The type of resource being accessed
     * @param permission - The required permission (r,w,c,d)
     * @returns True if the scope grants the requested permission
     */
    private scopeGrantsPermission( scope: string, resourceType: string, permission: string ): boolean {

        const scopeParts = scope.split('/');

        if (scopeParts.length !== 2) return false;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [context, resourcePermission] = scopeParts;
        const entities = resourcePermission.split('.');

        if (entities.length !== 2) return false;

        const [scopeResource, scopePermissions] = entities;
        const resourceMatches = scopeResource === resourceType || scopeResource === '*';
        const permissionMatches = scopePermissions === '*' || scopePermissions.includes(permission);

        return resourceMatches && permissionMatches;
    }

    /**
     * Extracts and sets the resource type from the request URL path.
     *
     * This method:
     * - Removes query parameters from the path if present
     * - Splits the path into parts using '/' as delimiter
     * - Takes the last part as the resource type
     * - Stores the resource type in the _resource property
     *
     * If the path is undefined or not a string, the method returns
     * without setting the resource.
     *
     * @private
     * @returns {void}
     */
    private setResource(): void {

        const path = this._request['path'].includes('?') ? this._request['path'].split('?')[0] : this._request['path']

        if(!path || typeof path !== 'string') return;

        const entities = path.split('/').filter(r => r !== '')
        this._resource = entities.length > 2 ? entities[1] : last(entities)
    }

    /**
     * Maps HTTP methods to corresponding FHIR operations.
     *
     * This method:
     * - Takes the HTTP method from the request
     * - Defaults to 'read' for unrecognized methods
     *
     * The mapped operation is stored in the _operation property
     * for use in authorization decisions.
     *
     * @private
     * @returns {void}
     */
    private setOperation(): void {

        switch (this._method) {

            case 'GET': {
                this._operation = 'read'
                break
            }

            case 'POST': {
                this._operation = 'create'
                break
            }

            case 'PUT': {
                this._operation = 'update'
                break
            }

            case 'DELETE': {
                this._operation = 'delete'
                break
            }

            default: {
                this._operation = 'read'
                break
            }
        }
    }

    /**
     * Extracts and sets the scope from the authorization header of the request.
     *
     * This method:
     * - Checks for presence of authorization header
     * - Extracts the token from Bearer authentication
     * - Decodes the JWT token to extract scope
     * - Sets the scope as an array by splitting on spaces
     *
     * If authorization header is undefined or token is empty,
     * the method returns without setting the scope.
     *
     * @private
     * @returns {void}
     */
    private setScope(): void {

        if (this._request.headers.authorization === undefined) return;

        const token = this._request.headers.authorization.startsWith('Bearer') ? this._request.headers.authorization.substring(7) :
            this._request.headers.authorization;

        if (!token) return;

        const decoded = jose.decodeJwt(token);
        
        // Validate token expiration
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            return; // Token is expired, don't set scope
        }
        
        this._scope = (decoded.scope as string || '').split(' ')
    }
}