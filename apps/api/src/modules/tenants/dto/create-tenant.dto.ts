import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Ink Paris' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    example: 'ink-paris',
    description: 'Lowercase letters, numbers and hyphens only',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must be lowercase letters, numbers and hyphens only',
  })
  slug!: string;
}
