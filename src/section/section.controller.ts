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
    UseGuards,
} from "@nestjs/common";
import { SectionService } from "./section.service";
import { Public } from "../common/decorator/public.decorator";
import { SectionResponse } from "./types/response.type";
import { RolesGuard } from "../common/guard/roles.guard";
import { Roles } from "../common/decorator/roles.decorator";
import { CreateSectionDto } from "./dto/create-section.dto";
import { GetCurrentUserId } from "../common/decorator/get-current-user-id.decorator";
import {
    UpdateSectionDescriptionDto,
    UpdateSectionSubjectDto,
} from "./dto/update-section.dto";
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { GetSectionsQueryDto } from "./dto/get-sections-query.dto";
import { SectionResponseDto, SectionsResponseDto } from "./dto/response.dto";
import { BaseResponseDto } from "../common/dto/base-response.dto";
import { GetQuestionsQueryDto } from "./dto/get-questions-query.dto";
import { QuestionsResponseDto } from "../question/dto/response.dto";
import { SetResponseDto } from "../common/decorator/set-response-dto.decorator";

@ApiTags("Section")
@ApiInternalServerErrorResponse({
    description: "예기치 못한 서버 에러 발생",
    type: BaseResponseDto,
})
@Controller("v1/sections")
export class SectionController {
    private logger = new Logger("SectionController");
    constructor(private readonly sectionService: SectionService) {}

    // [S-01] Controller logic
    @ApiOperation({ summary: "모든 섹션 조회" })
    @ApiOkResponse({
        description: "섹션 조회 성공",
        type: SectionsResponseDto,
    })
    @ApiQuery({ name: "sort", enum: ["subject", "id"], required: false })
    @SetResponseDto(SectionsResponseDto)
    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    async getAllSections(
        @Query() query: GetSectionsQueryDto,
    ): Promise<SectionsResponseDto> {
        const { sort, order } = query;
        const sections = await this.sectionService.getAllSections(sort, order);

        return {
            message: "All sections have been found.",
            sections,
        };
    }

    // [S-02] Controller logic
    @ApiOperation({ summary: "특정 섹션 조회" })
    @ApiOkResponse({
        description: "섹션 조회 성공",
        type: SectionResponseDto,
    })
    @ApiNotFoundResponse({
        description: "섹션이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(SectionResponseDto)
    @Public()
    @Get(":id")
    @HttpCode(HttpStatus.OK)
    async getSpecificSection(
        @Param("id", ParseIntPipe) id: number,
    ): Promise<SectionResponseDto> {
        const section = await this.sectionService.getSpecificSection(id);

        return {
            message: `Section with id: ${id} has been found.`,
            section,
        };
    }

    // [S-07] Controller logic
    @ApiOperation({ summary: "특정 섹션의 질문들 조회" })
    @ApiOkResponse({
        description: "질문 조회 성공",
        type: QuestionsResponseDto,
    })
    @ApiNotFoundResponse({
        description: "섹션이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(QuestionsResponseDto)
    @Public()
    @Get(":id/questions")
    @HttpCode(HttpStatus.OK)
    async getQuestionsBySection(
        @Param("id", ParseIntPipe) sectionId: number,
        @Query() query: GetQuestionsQueryDto,
    ): Promise<QuestionsResponseDto> {
        const { page, limit, sort, order, search } = query;
        const [questions, total] =
            await this.sectionService.getQuestionsBySection(
                sectionId,
                page,
                limit,
                sort,
                order,
                search,
            );

        return {
            message: `Questions of section ${sectionId} have been found.`,
            questions,
            total,
        };
    }

    // [S-03] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "새 섹션 생성" })
    @ApiCreatedResponse({
        description: "섹션 생성 성공",
        type: SectionResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 정보가 유효하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(SectionResponseDto)
    @UseGuards(RolesGuard)
    @Roles("admin")
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createSection(
        @GetCurrentUserId(ParseIntPipe) userId: number,
        @Body() createSectionDto: CreateSectionDto,
    ): Promise<SectionResponseDto> {
        const section = await this.sectionService.createSection(
            userId,
            createSectionDto,
        );

        return {
            message: "New section has been created.",
            section,
        };
    }

    // [S-04] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "섹션 제목 수정" })
    @ApiOkResponse({
        description: "섹션 제목 수정 성공",
        type: SectionResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 정보가 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "섹션이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(SectionResponseDto)
    @UseGuards(RolesGuard)
    @Roles("admin")
    @Patch(":id/subject")
    @HttpCode(HttpStatus.OK)
    async updateSectionSubject(
        @Param("id", ParseIntPipe) sectionId: number,
        @Body() updateSectionSubjectDto: UpdateSectionSubjectDto,
    ): Promise<SectionResponse> {
        const section = await this.sectionService.updateSectionSubject(
            sectionId,
            updateSectionSubjectDto,
        );

        return {
            message: "Section subject has been updated.",
            section,
        };
    }

    // [S-05] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "섹션 설명 수정" })
    @ApiOkResponse({
        description: "섹션 설명 수정 성공",
        type: SectionResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 정보가 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "섹션이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(SectionResponseDto)
    @UseGuards(RolesGuard)
    @Roles("admin")
    @Patch(":id/description")
    @HttpCode(HttpStatus.OK)
    async updateSectionDescription(
        @Param("id", ParseIntPipe) sectionId: number,
        @Body() updateSectionDescriptionDto: UpdateSectionDescriptionDto,
    ): Promise<SectionResponse> {
        const section = await this.sectionService.updateSectionDescription(
            sectionId,
            updateSectionDescriptionDto,
        );

        return {
            message: "Section description has been updated.",
            section,
        };
    }

    // [S-06] Controller logic
    @ApiBearerAuth()
    @ApiOperation({ summary: "섹션 삭제" })
    @ApiOkResponse({
        description: "섹션 삭제 성공",
        type: BaseResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: "사용자 정보가 유효하지 않음",
        type: BaseResponseDto,
    })
    @ApiNotFoundResponse({
        description: "섹션이 존재하지 않음",
        type: BaseResponseDto,
    })
    @SetResponseDto(BaseResponseDto)
    @UseGuards(RolesGuard)
    @Roles("admin")
    @Delete(":id")
    @HttpCode(HttpStatus.OK)
    async deleteSection(
        @Param("id", ParseIntPipe) sectionId: number,
    ): Promise<BaseResponseDto> {
        await this.sectionService.deleteSection(sectionId);

        return {
            message: "Section has been deleted.",
        };
    }
}
