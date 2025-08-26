import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common'
import {Observable} from 'rxjs'
import {FhirScopeAuthorization} from "../../lib/authorization/fhir-scope-authorization";
import {ConfigService} from "@nestjs/config";
import {IncomingMessage} from "node:http";
import {AccessDecision} from "../../interfaces/access-decision";

@Injectable()
export class FhirAuthorizerGuard implements CanActivate {

    authorizer: FhirScopeAuthorization = new FhirScopeAuthorization();

    /**
     * Creates an instance of AuthorizerGuard.
     * @param {ConfigService} _config - The configuration service for accessing auth settings
     */
    constructor(private readonly _config: ConfigService) {
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {

        if (this._config.get('authorization.smartOnFhir.enabled') === true) {

            const request: IncomingMessage = context.switchToHttp().getRequest()
            const decision: AccessDecision = this.authorizer.authorize(request);

            return decision.allowed;

        } else {
            return true;
        }
    }

}
