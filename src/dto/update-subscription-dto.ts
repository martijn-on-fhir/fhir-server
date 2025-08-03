import { ApiPropertyOptional } from '@nestjs/swagger'
import { SubscriptionStatus } from '../schema/subscription-schema'
import { IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { SubscriptionChannelDto } from './subscription-channel-dto'

export class UpdateSubscriptionDto {
  
  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  criteria?: string;
  
  @ApiPropertyOptional({ type: SubscriptionChannelDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SubscriptionChannelDto)
  channel?: SubscriptionChannelDto;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end?: string;
}
