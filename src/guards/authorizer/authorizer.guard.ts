import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';

/**
 * Guard that handles JWT authorization for protected routes.
 * Verifies the presence and validity of JWT tokens in request headers.
 * Can be disabled via configuration settings.
 */
@Injectable()
export class AuthorizerGuard implements CanActivate {
  
  /**
   * Creates an instance of AuthorizerGuard.
   * @param {ConfigService} _config - The configuration service for accessing auth settings
   */
  constructor(private readonly _config: ConfigService) {
  }
  
  /**
   * Determines if the current request should be allowed to proceed.
   * Checks for valid JWT token if authorization is enabled in config.
   *
   * @param {ExecutionContext} context - The execution context of the current request
   * @returns {boolean | Promise<boolean> | Observable<boolean>} True if access is allowed, false otherwise
   */
  canActivate( context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    
    if(this._config.get('authorization.oauth.enabled') === true){
      
      const request = context.switchToHttp().getRequest()
      const authHeader = request.headers['authorization']
      
      if (authHeader) {
        
        const decodeJwt: any = jose.decodeJwt(authHeader)
        
        return decodeJwt ? decodeJwt.exp > Date.now() / 1000 : false
        
      } else {
        return false
      }
    }
    
    return true;
  }
}
