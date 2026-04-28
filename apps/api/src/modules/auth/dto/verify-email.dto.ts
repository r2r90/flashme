import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    example: '02c3eab78e705bf10c18819d44e3ba1db9d7c5ca...',
    description: 'Token received in verification email',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
