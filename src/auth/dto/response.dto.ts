import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "../../common/dto/base-response.dto";
import { Expose, Type } from "class-transformer";
import { UserDto } from "../../user/dto/user.dto";

export class TokensResponseDto extends BaseResponseDto {
    @ApiProperty({
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        description: "액세스 토큰",
    })
    @Expose()
    accessToken: string;

    @ApiProperty({
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        description: "리프레시 토큰",
    })
    @Expose()
    refreshToken: string;
}

export class SignupResponseDto extends BaseResponseDto {
    @ApiProperty({ type: UserDto, description: "사용자 정보" })
    @Type(() => UserDto)
    @Expose()
    user: UserDto;
}
