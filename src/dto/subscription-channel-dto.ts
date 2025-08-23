import { SubscriptionChannelType } from '../schema/subscription-schema'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsObject, IsOptional, IsString, IsUrl } from 'class-validator'

export class SubscriptionChannelDto {
  
  @ApiProperty({
    description: 'Channel type',
    enum: SubscriptionChannelType,
    example: SubscriptionChannelType.REST_HOOK
  })
  @IsEnum(SubscriptionChannelType)
  type: string;
  
  @ApiPropertyOptional({
    description: 'Endpoint URL for rest-hook or websocket',
    example: 'https://example.com/fhir/webhook'
  })
  @IsOptional()
  @IsUrl()
  endpoint?: string;
  
  @ApiPropertyOptional({
    description: 'MIME type to send (xml | json)',
    example: 'application/fhir+json'
  })
  @IsOptional()
  @IsString()
  payload?: string;
  
  @ApiPropertyOptional({
    description: 'Additional headers for rest-hook',
    example: { 'Authorization': 'Bearer token' }
  })
  @IsOptional()
  @IsObject()
  header?: Record<string, string>;
}
