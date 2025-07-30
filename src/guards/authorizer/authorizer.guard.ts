import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';

@Injectable()
export class AuthorizerGuard implements CanActivate {
  
  constructor(private readonly _config: ConfigService) {
  }
  
  canActivate( context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    
    if(this._config.get('authorization.enabled') === true){
      
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
