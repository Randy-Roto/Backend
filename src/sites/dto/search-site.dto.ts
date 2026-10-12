import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SearchSiteDto {
  @ApiProperty({ example: 'https://falso-banco.com/login' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(768)
  url: string | undefined;
}