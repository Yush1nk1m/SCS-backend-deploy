import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Logger,
    UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { EmailDto } from "./dto/email.dto";
import { VerificationDto } from "./dto/verification.dto";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { Public } from "../common/decorator/public.decorator";
import { RefreshTokenGuard } from "../common/guard/refresh-token.guard";
import { GetCurrentUserId } from "../common/decorator/get-current-user-id.decorator";
import { GetCurrentUser } from "../common/decorator/get-current-user.decorator";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { SignupResponseDto, TokensResponseDto } from "./dto/response.dto";
import { BaseResponseDto } from "../common/dto/base-response.dto";
import { SetResponseDto } from "../common/decorator/set-response-dto.decorator";

@ApiTags("Auth")
@ApiInternalServerErrorResponse({
    description: "예기치 못한 서버 에러 발생",
    type: BaseResponseDto,
})
@Controller("v1/auth")
export class AuthController {
    private logger = new Logger("AuthController");
    constructor(private readonly authService: AuthService) {}

    // [A-01] Controller logic
    @ApiOperation({ summary: "인증 코드 전송" })
    @ApiOkResponse({
        description: "인증 코드 전송 완료",
        type: BaseResponseDto,
    })
    @ApiConflictResponse({
        description: "동일한 이메일의 사용자 존재",
        type: BaseResponseDto,
    })
    @SetResponseDto(BaseResponseDto)
    @Public()
    @Post("email/verification-code")
    @HttpCode(HttpStatus.CREATED)
    async sendVerificationMail(
        @Body() emailDto: EmailDto,
    ): Promise<BaseResponseDto> {
        await this.authService.sendVerificationMail(emailDto);

        return {
            message: "A verification mail has been sent.",
        };
    }

    // [A-02] Controller logic
    @ApiOperation({ summary: "인증 코드 검증" })
    @ApiOkResponse({
        description: "인증 코드 검증 완료",
        type: BaseResponseDto,
    })
    @ApiBadRequestResponse({
        description: "인증 코드 불일치",
        type: BaseResponseDto,
    })
    @SetResponseDto(BaseResponseDto)
    @Public()
    @Post("email/verify-code")
    @HttpCode(HttpStatus.OK)
    async verifySignupCode(
        @Body() verificationDto: VerificationDto,
    ): Promise<BaseResponseDto> {
        const isVerified =
            await this.authService.verifySignupCode(verificationDto);

        if (isVerified) {
            return {
                message: "Verified.",
            };
        }
    }

    // [A-03] Controller logic
    @ApiOperation({ summary: "회원 가입" })
    @ApiCreatedResponse({
        description: "회원 가입 완료",
        type: SignupResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 이메일이 인증되지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(SignupResponseDto)
    @Public()
    @Post("signup")
    @HttpCode(HttpStatus.CREATED)
    async signup(@Body() signupDto: SignupDto): Promise<SignupResponseDto> {
        const user = await this.authService.signup(signupDto);

        return {
            message: "A new user has been signed up.",
            user,
        };
    }

    // [A-04] Controller logic
    @ApiOperation({ summary: "로그인" })
    @ApiOkResponse({
        description: "로그인 성공",
        type: TokensResponseDto,
    })
    @ApiForbiddenResponse({
        description: "사용자 정보가 일치하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(TokensResponseDto)
    @Public()
    @Post("jwt/login")
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<TokensResponseDto> {
        const tokens = await this.authService.login(loginDto);

        return {
            message: "You have been logged in.",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    // [A-05] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "리프레시" })
    @ApiOkResponse({
        description: "JWT 토큰 리프레시 성공",
        type: TokensResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "리프레시 토큰이 유효하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(TokensResponseDto)
    @Public()
    @UseGuards(RefreshTokenGuard)
    @Post("jwt/refresh")
    @HttpCode(HttpStatus.OK)
    async refresh(
        @GetCurrentUserId() userId: number,
        @GetCurrentUser("refreshToken") refreshToken: string,
    ): Promise<TokensResponseDto> {
        this.logger.verbose(`userId: ${userId}, refreshToken: ${refreshToken}`);
        const tokens = await this.authService.refreshJwtTokens(
            userId,
            refreshToken,
        );

        this.logger.verbose("tokens are refreshed");
        return {
            message: "JWT tokens have been refreshed.",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    // [A-06] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "로그아웃" })
    @ApiOkResponse({
        description: "로그아웃 성공",
        type: BaseResponseDto,
    })
    @SetResponseDto(BaseResponseDto)
    @Post("jwt/logout")
    @HttpCode(HttpStatus.OK)
    async logout(@GetCurrentUserId() userId: number): Promise<BaseResponseDto> {
        await this.authService.logout(userId);

        return {
            message: "You have been logged out.",
        };
    }
}
