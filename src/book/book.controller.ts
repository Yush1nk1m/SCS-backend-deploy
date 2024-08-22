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
import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { BaseResponseDto } from "../common/dto/base-response.dto";
import { BookService } from "./book.service";
import { BookResponseDto, BooksResponseDto } from "./dto/response.dto";
import { SetResponseDto } from "../common/decorator/set-response-dto.decorator";
import { Public } from "../common/decorator/public.decorator";
import { GetBooksQueryDto } from "./dto/get-books-query.dto";
import { GetCurrentUserId } from "../common/decorator/get-current-user-id.decorator";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto, UpdateBookVisibilityDto } from "./dto/update-book.dto";
import { LikeResponseDto } from "../common/dto/like-response.dto";
import { QuestionsResponseDto } from "../question/dto/response.dto";
import { GetQuestionsQueryDto } from "../section/dto/get-questions-query.dto";

@ApiTags("Book")
@ApiInternalServerErrorResponse({
    description: "예기치 못한 서버 에러 발생",
    type: BaseResponseDto,
})
@Controller("v1/books")
export class BookController {
    private logger = new Logger("BookController");

    constructor(private readonly bookService: BookService) {}

    // [B-01] Controller logic
    @ApiOperation({ summary: "모든 문제집 조회" })
    @ApiOkResponse({
        description: "문제집 조회 성공",
        type: BooksResponseDto,
    })
    @SetResponseDto(BooksResponseDto)
    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    async getBooks(
        @Query() query: GetBooksQueryDto,
    ): Promise<BooksResponseDto> {
        const { page, limit, sort, order, search } = query;
        const [books, total] = await this.bookService.getBooks(
            page,
            limit,
            sort,
            order,
            search,
        );

        return {
            message: "Books have been found.",
            books,
            total,
        };
    }

    // [B-10] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "사용자의 문제집 좋아요 여부 조회" })
    @ApiOkResponse({
        description: "문제집 좋아요 여부 조회 성공",
        type: LikeResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 인증이 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "문제집이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(LikeResponseDto)
    @Get(":id/like")
    @HttpCode(HttpStatus.OK)
    async getLike(
        @GetCurrentUserId() userId: number,
        @Param("id", ParseIntPipe) bookId: number,
    ): Promise<LikeResponseDto> {
        const [likeCount, liked] = await this.bookService.getLike(
            userId,
            bookId,
        );

        return {
            message: "Book's like status has been found.",
            likeCount,
            liked,
        };
    }

    // [B-12] Controller logic
    @ApiOperation({ summary: "문제집에 저장된 질문 조회" })
    @ApiOkResponse({
        description: "질문 조회 성공",
        type: QuestionsResponseDto,
    })
    @ApiForbiddenResponse({
        description: "문제집에 접근할 수 없음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "문제집이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(QuestionsResponseDto)
    @Public()
    @Get(":id/questions")
    @HttpCode(HttpStatus.OK)
    async getQuestionsOfBook(
        @Param("id", ParseIntPipe) bookId: number,
        @Query() query: GetQuestionsQueryDto,
    ): Promise<QuestionsResponseDto> {
        const [questions, total] = await this.bookService.getQuestionsOfBook(
            bookId,
            query,
        );

        return {
            message: "Questions have been found.",
            questions,
            total,
        };
    }

    // [B-02] Controller logic
    @ApiOperation({ summary: "특정 문제집 조회" })
    @ApiOkResponse({
        description: "문제집 조회 성공",
        type: BookResponseDto,
    })
    @ApiNotFoundResponse({
        description: "문제집이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(BookResponseDto)
    @Public()
    @Get(":id")
    @HttpCode(HttpStatus.OK)
    async getBook(
        @Param("id", ParseIntPipe) bookId: number,
    ): Promise<BookResponseDto> {
        const book = await this.bookService.getBook(bookId);

        return {
            message: "Book has been found.",
            book,
        };
    }

    // [B-03] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "새 문제집 생성" })
    @ApiCreatedResponse({
        description: "문제집 생성 성공",
        type: BookResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 인증이 유효하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(BookResponseDto)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createBook(
        @GetCurrentUserId() userId: number,
        @Body() createBookDto: CreateBookDto,
    ): Promise<BookResponseDto> {
        const { visibility, title, description } = createBookDto;
        const book = await this.bookService.createBook(
            userId,
            visibility,
            title,
            description,
        );

        return {
            message: "New book has been created.",
            book,
        };
    }

    // [B-04] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "문제집 수정" })
    @ApiOkResponse({
        description: "문제집 수정 성공",
        type: BookResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 인증이 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiForbiddenResponse({
        description: "사용자 접근 권한이 존재하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "문제집이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(BookResponseDto)
    @Patch(":id/title")
    @HttpCode(HttpStatus.OK)
    async updateBook(
        @GetCurrentUserId() userId: number,
        @Param("id", ParseIntPipe) bookId: number,
        @Body() updateBookDto: UpdateBookDto,
    ): Promise<BookResponseDto> {
        const { title, description } = updateBookDto;
        const book = await this.bookService.updateBook(
            userId,
            bookId,
            title,
            description,
        );

        return {
            message: "Book has been updated.",
            book,
        };
    }

    // [B-06] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "문제집 삭제" })
    @ApiOkResponse({
        description: "문제집 삭제 성공",
        type: BaseResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 인증이 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiForbiddenResponse({
        description: "사용자 접근 권한이 존재하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "문제집이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(BaseResponseDto)
    @Delete(":id")
    @HttpCode(HttpStatus.OK)
    async deleteBook(
        @GetCurrentUserId() userId: number,
        @Param("id", ParseIntPipe) bookId: number,
    ): Promise<BaseResponseDto> {
        await this.bookService.deleteBook(userId, bookId);

        return {
            message: "Book has been deleted.",
        };
    }

    // [B-07] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "문제집에 질문 추가 (스크랩)" })
    @ApiOkResponse({
        description: "스크랩 성공",
        type: BaseResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 인증이 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiForbiddenResponse({
        description: "사용자 접근 권한이 존재하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "문제집이나 질문이 존재하지 않음",
        type: BaseResponseDto,
    })
    @ApiConflictResponse({
        description: "질문이 이미 문제집에 저장됨",
        type: BaseResponseDto,
    })
    @SetResponseDto(BaseResponseDto)
    @Post(":bookId/questions/:questionId")
    @HttpCode(HttpStatus.OK)
    async saveQuestionToBook(
        @GetCurrentUserId() userId: number,
        @Param("bookId", ParseIntPipe) bookId: number,
        @Param("questionId", ParseIntPipe) questionId: number,
    ): Promise<BaseResponseDto> {
        await this.bookService.saveQuestion(userId, bookId, questionId);

        return {
            message: "Question has been saved to the book.",
        };
    }

    // [B-08] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "문제집에서 질문 삭제" })
    @ApiOkResponse({
        description: "질문 삭제 성공",
        type: BaseResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 인증이 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiForbiddenResponse({
        description: "사용자 접근 권한이 존재하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "문제집이나 질문이 존재하지 않음",
        type: BaseResponseDto,
    })
    @ApiConflictResponse({
        description: "질문이 문제집에 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(BaseResponseDto)
    @Delete(":bookId/questions/:questionId")
    @HttpCode(HttpStatus.OK)
    async deleteQuestionFromBook(
        @GetCurrentUserId() userId: number,
        @Param("bookId", ParseIntPipe) bookId: number,
        @Param("questionId", ParseIntPipe) questionId: number,
    ): Promise<BaseResponseDto> {
        await this.bookService.deleteQuestion(userId, bookId, questionId);

        return {
            message: "Question has been deleted from the book.",
        };
    }

    // [B-09] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "문제집 좋아요 등록/취소" })
    @ApiOkResponse({
        description: "문제집 좋아요 등록/취소 성공",
        type: LikeResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 인증이 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "문제집이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(LikeResponseDto)
    @Post(":id/like")
    @HttpCode(HttpStatus.OK)
    async toggleLike(
        @GetCurrentUserId() userId: number,
        @Param("id", ParseIntPipe) bookId: number,
    ): Promise<LikeResponseDto> {
        const [likeCount, liked] = await this.bookService.toggleLike(
            userId,
            bookId,
        );

        return {
            message: "Like request has been processed",
            likeCount,
            liked,
        };
    }

    // [B-11] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "문제집 공개 범위 수정" })
    @ApiOkResponse({
        description: "문제집 공개 범위 수정 성공",
        type: BookResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 인증이 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiForbiddenResponse({
        description: "사용자 접근 권한이 존재하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "문제집이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(BookResponseDto)
    @Patch(":id/visibility")
    @HttpCode(HttpStatus.OK)
    async updateBookVisibility(
        @GetCurrentUserId() userId: number,
        @Param("id", ParseIntPipe) bookId: number,
        @Body() updateBookVisibilityDto: UpdateBookVisibilityDto,
    ): Promise<BookResponseDto> {
        const { visibility } = updateBookVisibilityDto;
        const book = await this.bookService.updateBookVisibility(
            userId,
            bookId,
            visibility,
        );

        return {
            message: "Book visibility has been updated.",
            book,
        };
    }
}
