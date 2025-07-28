import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig, HttpStatusCode } from 'axios';
import { ConfigService } from '@nestjs/config';

/**
 * Service for interacting with the terminology server
 * to perform value set expansions and terminology lookups
 */
@Injectable()
export class TerminologyService {
  
  /**
   * Indicates whether the terminology service is enabled
   * When false, the service will not perform any external lookups
   */
  enabled: boolean = false;
  
  /**
   * Base URL of the terminology server endpoint
   * Used as the prefix for all terminology service requests
   */
  baseUrl: string = '';
  
  /**
   * Creates an instance of TerminologyService
   * @param _config - Configuration service to retrieve terminology settings
   */
  constructor(private readonly _config: ConfigService) {
    
    this.baseUrl = this._config.get('terminology.baseUrl') as string;
    this.enabled = this._config.get('terminology.enabled') as boolean;
  }
  
  /**
   * Looks up and expands a value set from the terminology server
   * @param valueSet - The URL of the value set to expand
   * @returns Promise resolving to the expanded value set
   */
  async lookup(valueSet: string): Promise<any> {
    
    if (this.enabled) {
      
      const token = await this.getToken();
      
      const config: AxiosRequestConfig = {
        baseURL: '',
        url: `/fhir/ValueSet/$expand?url=${valueSet}`,
        method: 'GET',
        headers: {
          authorization: token,
        },
      }
      
      return axios.request(config).then((response: any) => {
        return response.data;
      }).catch((error) => {
        throw new Error(error);
      })
    }
  }
  
  /**
   * Retrieves an authentication token from the terminology server
   * @returns Promise resolving to the access token string
   * @throws Error if authentication fails or server is unreachable
   */
  async getToken(): Promise<string> {
    
    const config: AxiosRequestConfig = {
      url: this._config.get('terminology.tokenUrl') as string,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: {
        username: this._config.get('terminology.username') as string,
        password: this._config.get('terminology.password') as string,
        client_id: 'cli_client',
        client_secret: '',
        grant_type: 'password',
      },
    }
    
    return await axios.request(config).then((response: any) => {
      return response.data.access_token;
    }).catch((error) => {
      
      if (error.response.status === HttpStatusCode.Unauthorized) {
        throw new Error('Unauthorized');
      }
      
      throw new Error(error);
    })
  }
}
