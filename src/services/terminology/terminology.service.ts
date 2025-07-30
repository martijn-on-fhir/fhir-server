import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig, HttpStatusCode } from 'axios';
import { ConfigService } from '@nestjs/config';
import { get } from 'lodash-es';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ValueSetDocument, ValueSetSchema } from '../../schema/value-set-schema';

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
   * Oauth toke for authorization.
   */
  token: string;
  
  /**
   * Creates an instance of TerminologyService
   * @param _config - Configuration service to retrieve terminology settings
   * @param _model
   */
  constructor(private readonly _config: ConfigService, @InjectModel(ValueSetSchema.name) private _model: Model<ValueSetDocument>) {
    
    this.baseUrl = this._config.get('terminology.baseUrl') as string;
    this.enabled = this._config.get('terminology.enabled') as boolean;
  }
  
  /**
   * Looks up and expands a value set from the terminology server
   * @param valueSet - The URL of the value set to expand
   * @returns Promise resolving to the expanded value set
   */
  async lookup(valueSet: string): Promise<any> {
    
    if (valueSet.indexOf('|') !== -1) {
      valueSet = valueSet.split('|')[0];
    }
    
    const document = await this._find(valueSet)
    
    if (document) {
      return document.toObject().expansion
    }
    
    if (this.enabled) {
      
      if (!this.token) {
        this.token = await this._getToken();
      }
      
      const config: AxiosRequestConfig = {
        baseURL: this.baseUrl,
        url: `fhir/ValueSet/$expand?url=${valueSet}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${this.token}`,
        },
      };
      
      return await axios.request(config).then((response: any) => {
        
        if (!document) {
          
          this._model.create({
            url: response.data.url,
            version: '1.0.0',
            resourceType: response.data.resourceType,
            expansion: response.data.expansion.contains,
            value: response.data,
          });
        }
        
        return get(response.data.expansion, 'contains', null);
        
      }).catch(() => {
        return null;
      });
    }
  }
  
  /**
   * Searches for a value set document in the database by URL
   * @param valueSet - The URL of the value set to find
   * @returns Promise resolving to the found value set document or null if not found
   */
  private async _find(valueSet: string): Promise<ValueSetDocument | null> {
    return await this._model.findOne({ url: valueSet })
  }
  
  /**
   * Retrieves an authentication token from the terminology server
   * @returns Promise resolving to the access token string
   * @throws Error if authentication fails or server is unreachable
   */
  private async _getToken(): Promise<string> {
    
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
    };
    
    return await axios.request(config).then((response: any) => {
      return response.data.access_token;
    }).catch((error) => {
      
      if (error.response.status === HttpStatusCode.Unauthorized) {
        throw new Error('Unauthorized');
      }
      
      throw new Error(error);
    });
  }
}
