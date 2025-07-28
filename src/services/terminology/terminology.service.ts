import { Injectable } from '@nestjs/common';
import axios, {AxiosRequestConfig, HttpStatusCode} from 'axios'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TerminologyService {
  
  tokenUrl = '';
  enabled: boolean = false
  baseUrl: string = ''
  username: string = ''
  password: string = ''
  
  constructor(private readonly _config: ConfigService) {
    
    this.username = this._config.get('terminology.username') as string
    this.password = this._config.get('terminology.password') as string
    this.baseUrl = this._config.get('terminology.baseUrl') as string
    this.tokenUrl = this._config.get('terminology.tokenUrl') as string
    this.enabled = this._config.get('terminology.enabled') as boolean
  }
  
  async lookup(valueSet: string): Promise<any> {
    
    const token = await this.getToken()
    
    const config: AxiosRequestConfig = {
      baseURL: '',
      url: `/fhir/ValueSet/$expand?url=${valueSet}`,
      method: 'GET',
      headers: {
        authorization: token
      }
    }
    
    return axios.request(config).then((response: any) => {
      return response.data
    }).catch((error) => {
      throw new Error(error)
    })
  }
  
  async getToken(): Promise<string> {
  
    const config: AxiosRequestConfig = {
      url: this.tokenUrl,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: {
        username: this.username,
        password: this.password,
        client_id: 'cli_client',
        client_secret: '',
        grant_type: 'password'
      }
    }
    
    return await axios.request(config).then((response: any) => {
      return response.data.access_token
    }).catch((error) => {
      
      if (error.response.status === HttpStatusCode.Unauthorized) {
        throw new Error('Unauthorized')
      }
      
      throw new Error(error)
    })
  }
}
