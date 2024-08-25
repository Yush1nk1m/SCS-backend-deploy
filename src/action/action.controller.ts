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
    Post,
    Query,
} from "@nestjs/common";
import { ActionService } from "./action.service";
import { Public } from "../common/decorator/public.decorator";
import { GetCurrentUserId } from "../common/decorator/get-current-user-id.decorator";
import { CreateActionDto } from "./dto/create-action.dto";
import { UpdateActionDto } from "./dto/update-action.dto";
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ActionResponseDto, ContentResponseDto } from "./dto/response.dto";
import { LikeResponseDto } from "../common/dto/like-response.dto";
import { BaseResponseDto } from "../common/dto/base-response.dto";
import { GetCommentsQueryDto } from "../comment/dto/get-comments-query.dto";
import { CommentsResponseDto } from "../comment/dto/response.dto";
import { SetResponseDto } from "../common/decorator/set-response-dto.decorator";

@ApiTags("Action")
@ApiInternalServerErrorResponse({
    description: "예기치 못한 서버 에러 발생",
    type: BaseResponseDto,
})
@Controller("v1/actions")
export class ActionController {
    private logger = new Logger("ActionController");

    constructor(private readonly actionService: ActionService) {}

    // [AC-01] Controller logic
    @ApiOperation({ summary: "특정 답변 조회" })
    @ApiOkResponse({
        description: "답변 조회 성공",
        type: ActionResponseDto,
    })
    @ApiNotFoundResponse({
        description: "답변이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(ActionResponseDto)
    @Public()
    @Get(":id")
    @HttpCode(HttpStatus.OK)
    async getSpecificAction(
        @Param("id", ParseIntPipe) actionId: number,
    ): Promise<ActionResponseDto> {
        const action = await this.actionService.getSpecificAction(actionId);

        return {
            message: `Action with id ${actionId} has been found.`,
            action,
        };
    }

    // [AC-02] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "새 답변 생성" })
    @ApiCreatedResponse({
        description: "답변 생성 성공",
        type: ActionResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 정보가 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "질문이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(ActionResponseDto)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createAction(
        @GetCurrentUserId() userId: number,
        @Body() createActionDto: CreateActionDto,
    ): Promise<ActionResponseDto> {
        const { questionId, title, content } = createActionDto;
        const action = await this.actionService.createAction(
            userId,
            questionId,
            title,
            content,
        );

        return {
            message: "New action has been created.",
            action,
        };
    }

    // [AC-03] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "답변 수정" })
    @ApiOkResponse({
        description: "답변 수정 성공",
        type: ActionResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 정보가 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiForbiddenResponse({
        description: "사용자 권한이 없음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "답변이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(ActionResponseDto)
    @Patch(":id")
    @HttpCode(HttpStatus.OK)
    async updateAction(
        @GetCurrentUserId() userId: number,
        @Param("id", ParseIntPipe) actionId: number,
        @Body() updateActionDto: UpdateActionDto,
    ): Promise<ActionResponseDto> {
        const { title, content } = updateActionDto;
        const action = await this.actionService.updateAction(
            userId,
            actionId,
            title,
            content,
        );

        return {
            message: "Action has been updated.",
            action,
        };
    }

    // [AC-04] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "답변 삭제" })
    @ApiOkResponse({
        description: "답변 삭제 성공",
        type: BaseResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 정보가 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiForbiddenResponse({
        description: "사용자 권한이 없음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "답변이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(BaseResponseDto)
    @Delete(":id")
    @HttpCode(HttpStatus.OK)
    async deleteAction(
        @GetCurrentUserId() userId: number,
        @Param("id", ParseIntPipe) actionId: number,
    ): Promise<BaseResponseDto> {
        await this.actionService.deleteAction(userId, actionId);

        return {
            message: "Action has been deleted.",
        };
    }

    // [AC-05] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "특정 답변의 Raw 마크다운 컨텐츠 조회" })
    @ApiOkResponse({
        description: "마크다운 컨텐츠 조회 성공",
        type: ContentResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 정보가 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiForbiddenResponse({
        description: "사용자 권한이 없음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "답변이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(ContentResponseDto)
    @Get(":id/raw-content")
    @HttpCode(HttpStatus.OK)
    async getRawContent(
        @GetCurrentUserId() userId: number,
        @Param("id", ParseIntPipe) actionId: number,
    ): Promise<ContentResponseDto> {
        const content = await this.actionService.getRawContent(
            userId,
            actionId,
        );

        return {
            message: "Raw markdown content has been found.",
            content,
        };
    }

    // [AC-06] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "좋아요 등록/취소" })
    @ApiOkResponse({
        description: "좋아요 등록/취소 성공",
        type: LikeResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 정보가 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "답변이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(LikeResponseDto)
    @Post(":id/like")
    @HttpCode(HttpStatus.OK)
    async toggleActionLike(
        @GetCurrentUserId() userId: number,
        @Param("id", ParseIntPipe) actionId: number,
    ): Promise<LikeResponseDto> {
        const [liked, likeCount] = await this.actionService.toggleLike(
            userId,
            actionId,
        );

        return {
            message: "Like to the action has been processed.",
            liked,
            likeCount,
        };
    }

    // [AC-07] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "좋아요 여부 조회" })
    @ApiOkResponse({
        description: "좋아요 여부 조회 성공",
        type: LikeResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 정보가 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "답변이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(LikeResponseDto)
    @Get(":id/like")
    @HttpCode(HttpStatus.OK)
    async getActionLike(
        @GetCurrentUserId() userId: number,
        @Param("id", ParseIntPipe) actionId: number,
    ): Promise<LikeResponseDto> {
        const [liked, likeCount] = await this.actionService.getLike(
            userId,
            actionId,
        );

        return {
            message: "Like information for the action has been found.",
            liked,
            likeCount,
        };
    }

    // [AC-08] Controller logic
    @ApiOperation({ summary: "댓글 목록 조회" })
    @ApiOkResponse({
        description: "댓글 목록 조회 성공",
        type: CommentsResponseDto,
    })
    @ApiNotFoundResponse({
        description: "답변이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(CommentsResponseDto)
    @Public()
    @Get(":id/comments")
    @HttpCode(HttpStatus.OK)
    async getComments(
        @Param("id", ParseIntPipe) actionId: number,
        @Query() query: GetCommentsQueryDto,
    ): Promise<CommentsResponseDto> {
        const { page, limit, sort, order } = query;
        const [comments, total] = await this.actionService.getComments(
            actionId,
            page,
            limit,
            sort,
            order,
        );

        return {
            message: "Comments have been found.",
            comments,
            total,
        };
    }
}
