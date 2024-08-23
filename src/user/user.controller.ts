import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
    Param,
    ParseIntPipe,
    Patch,
    Query,
} from "@nestjs/common";
import { Public } from "../common/decorator/public.decorator";
import { UserService } from "./user.service";
import { GetCurrentUserId } from "../common/decorator/get-current-user-id.decorator";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ChangeNicknameDto } from "./dto/change-nickname.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import {
    ContributionResponseDto,
    UserResponseDto,
    UsersResponseDto,
} from "./dto/response.dto";
import { BaseResponseDto } from "../common/dto/base-response.dto";
import { SetResponseDto } from "../common/decorator/set-response-dto.decorator";
import { BooksResponseDto } from "../book/dto/response.dto";
import { GetBooksQueryDto } from "../book/dto/get-books-query.dto";
import { GetContributionQueryDto } from "./dto/get-contribution-query.dto";
import { ChangePositionDto } from "./dto/change-position.dto";
import { ChangeAffiliationDto } from "./dto/change-affiliation.dto";

@ApiTags("User")
@ApiInternalServerErrorResponse({
    description: "예기치 못한 서버 에러 발생",
    type: BaseResponseDto,
})
@Controller("v1/users")
export class UserController {
    private logger = new Logger("UserController");
    constructor(private readonly userService: UserService) {}

    // [U-01] Controller logic
    @ApiOperation({ summary: "모든 사용자 정보 조회" })
    @ApiOkResponse({
        description: "사용자 정보 조회 성공",
        type: UsersResponseDto,
    })
    @SetResponseDto(UsersResponseDto)
    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    async getAllUsers(): Promise<UsersResponseDto> {
        const users = await this.userService.findAllUsers();

        return {
            message: "All users have been found.",
            users,
        };
    }

    // [U-03] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "로그인한 사용자 정보 조회" })
    @ApiOkResponse({
        description: "사용자 정보 조회 성공",
        type: UserResponseDto,
    })
    @ApiNotFoundResponse({
        description: "사용자 정보가 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(UserResponseDto)
    @Get("me")
    @HttpCode(HttpStatus.OK)
    async getCurrentUser(
        @GetCurrentUserId(ParseIntPipe) id: number,
    ): Promise<UserResponseDto> {
        this.logger.verbose(
            `An user with id: ${id} has requested to get information`,
        );
        const user = await this.userService.findUser(id);

        return {
            message: `An user with id: ${id} has been found.`,
            user,
        };
    }

    // [U-09] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "로그인한 사용자의 커뮤니티 기여도 조회" })
    @ApiOkResponse({
        description: "기여도 조회 성공",
        type: ContributionResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "접근 권한이 없음",
        type: BaseResponseDto,
    })
    @SetResponseDto(ContributionResponseDto)
    @Get("contribution")
    @HttpCode(HttpStatus.OK)
    async getMyContribution(
        @GetCurrentUserId() userId: number,
        @Query() query: GetContributionQueryDto,
    ): Promise<ContributionResponseDto> {
        const { type } = query;
        const [total, percentile] = await this.userService.getUserContribution(
            userId,
            type,
        );

        return {
            message: "User contribution information has been found.",
            total,
            percentile,
        };
    }

    // [U-07] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "로그인한 사용자가 생성한 문제집 조회" })
    @ApiOkResponse({
        description: "문제집 조회 성공",
        type: BooksResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "접근 권한이 없음",
        type: BaseResponseDto,
    })
    @SetResponseDto(BooksResponseDto)
    @Get("books")
    @HttpCode(HttpStatus.OK)
    async getMyBooks(
        @GetCurrentUserId() userId: number,
        @Query() query: GetBooksQueryDto,
    ): Promise<BooksResponseDto> {
        const { page, limit, sort, order, search } = query;
        const [books, total] = await this.userService.getMyBooks(
            userId,
            page,
            limit,
            sort,
            order,
            search,
        );

        return {
            message: "User's books have been found.",
            books,
            total,
        };
    }

    // [U-08] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "로그인한 사용자가 좋아요한 문제집 조회" })
    @ApiOkResponse({
        description: "문제집 조회 성공",
        type: BooksResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "접근 권한이 없음",
        type: BaseResponseDto,
    })
    @SetResponseDto(BooksResponseDto)
    @Get("books/liked")
    @HttpCode(HttpStatus.OK)
    async getLikedBooks(
        @GetCurrentUserId() userId: number,
        @Query() query: GetBooksQueryDto,
    ): Promise<BooksResponseDto> {
        const { page, limit, sort, order, search } = query;
        const [books, total] = await this.userService.getLikedBooks(
            userId,
            page,
            limit,
            sort,
            order,
            search,
        );

        return {
            message: "User's books have been found.",
            books,
            total,
        };
    }

    // [U-02] Controller logic
    @ApiOperation({ summary: "특정 사용자 정보 조회" })
    @ApiOkResponse({
        description: "사용자 정보 조회 성공",
        type: UserResponseDto,
    })
    @ApiNotFoundResponse({
        description: "사용자 정보가 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(UserResponseDto)
    @Public()
    @Get(":id")
    @HttpCode(HttpStatus.OK)
    async getSpecificUser(
        @Param("id", ParseIntPipe) id: number,
    ): Promise<UserResponseDto> {
        const user = await this.userService.findUser(id);

        return {
            message: `An user with id: ${id} has been found.`,
            user,
        };
    }

    // [U-04] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "로그인한 사용자 비밀번호 변경" })
    @ApiOkResponse({
        description: "비밀번호 변경 성공",
        type: BaseResponseDto,
    })
    @ApiBadRequestResponse({
        description: "적절하지 않은 요청",
        type: BaseResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "접근 권한이 없음",
        type: BaseResponseDto,
    })
    @SetResponseDto(BaseResponseDto)
    @Patch("password")
    @HttpCode(HttpStatus.OK)
    async changeUserPassword(
        @GetCurrentUserId() id: number,
        @Body() changePasswordDto: ChangePasswordDto,
    ): Promise<BaseResponseDto> {
        const { password, newPassword, confirmPassword } = changePasswordDto;
        await this.userService.changeUserPassword(
            id,
            password,
            newPassword,
            confirmPassword,
        );

        return {
            message: "User password has been changed.",
        };
    }

    // [U-05] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "로그인한 사용자 닉네임 변경" })
    @ApiOkResponse({
        description: "닉네임 변경 성공",
        type: UserResponseDto,
    })
    @SetResponseDto(BaseResponseDto)
    @Patch("nickname")
    @HttpCode(HttpStatus.OK)
    async changeUserNickname(
        @GetCurrentUserId() id: number,
        @Body() changeNicknameDto: ChangeNicknameDto,
    ): Promise<UserResponseDto> {
        const { nickname } = changeNicknameDto;
        const user = await this.userService.changeUserNickname(id, nickname);

        return {
            message: "User nickname has been changed.",
            user,
        };
    }

    // [U-10] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "로그인한 사용자 소속 변경" })
    @ApiOkResponse({
        description: "소속 변경 성공",
        type: UserResponseDto,
    })
    @SetResponseDto(UserResponseDto)
    @Patch("affiliation")
    @HttpCode(HttpStatus.OK)
    async changeUserAffiliation(
        @GetCurrentUserId() userId: number,
        @Body() changeAffiliationDto: ChangeAffiliationDto,
    ): Promise<UserResponseDto> {
        const { affiliation } = changeAffiliationDto;
        const user = await this.userService.changeUserAffiliation(
            userId,
            affiliation,
        );

        return {
            message: "User affiliation has been changed.",
            user,
        };
    }

    // [U-11] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "로그인한 사용자 포지션 변경" })
    @ApiOkResponse({
        description: "포지션 변경 성공",
        type: UserResponseDto,
    })
    @SetResponseDto(UserResponseDto)
    @Patch("position")
    @HttpCode(HttpStatus.OK)
    async changeUserPosition(
        @GetCurrentUserId() userId: number,
        @Body() changePositionDto: ChangePositionDto,
    ): Promise<UserResponseDto> {
        const { position } = changePositionDto;
        const user = await this.userService.changeUserPosition(
            userId,
            position,
        );

        return {
            message: "User position has been changed.",
            user,
        };
    }

    // [U-06] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "로그인한 사용자 회원 탈퇴" })
    @ApiOkResponse({
        description: "회원 탈퇴 성공",
        type: BaseResponseDto,
    })
    @ApiBadRequestResponse({
        description: "적절하지 않은 요청",
        type: BaseResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "접근 권한이 없음",
        type: BaseResponseDto,
    })
    @SetResponseDto(BaseResponseDto)
    @Delete()
    @HttpCode(HttpStatus.OK)
    async deleteCurrentUser(
        @GetCurrentUserId() id: number,
        @Body() deleteUserDto: DeleteUserDto,
    ): Promise<BaseResponseDto> {
        const { password, confirmMessage } = deleteUserDto;
        await this.userService.deleteUser(id, password, confirmMessage);

        return {
            message: `An user with id: ${id} has been deleted.`,
        };
    }
}
