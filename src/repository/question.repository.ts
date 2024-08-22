import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { DataSource, Like, Repository } from "typeorm";
import { Question } from "../question/question.entity";
import { User } from "../user/user.entity";
import { Section } from "../section/section.entity";

@Injectable()
export class QuestionRepository extends Repository<Question> {
    private logger = new Logger("QuestionRepository");

    constructor(private readonly dataSource: DataSource) {
        super(Question, dataSource.createEntityManager());
    }

    async findQuestionsBySectionId(
        sectionId: number,
        page: number = 1,
        limit: number = 10,
        sort: "createdAt" | "saved" = "createdAt",
        order: "ASC" | "DESC" = "DESC",
        search: string = "",
    ): Promise<[Question[], number]> {
        const where = {
            section: {
                id: sectionId,
            },
            content: search !== "" ? Like(`%${search}%`) : undefined,
        };

        return this.findAndCount({
            withDeleted: true,
            where,
            relations: ["writer"],
            order: { [sort]: order },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    async findQuestionById(id: number) {
        return this.findOne({ where: { id }, relations: ["writer"] });
    }

    async createQuestion(
        writer: User,
        section: Section,
        content: string,
    ): Promise<Question> {
        const question = this.create({
            content,
            section,
            writer,
        });

        await this.save(question);

        return question;
    }

    async findAndUpdateQuestionContent(
        id: number,
        content: string,
    ): Promise<Question> {
        const question = await this.findOne({ where: { id } });

        if (!question) {
            throw new NotFoundException(
                `Question with id ${id} does not exist.`,
            );
        }

        question.content = content;
        await this.save(question);

        return question;
    }

    async deleteQuestionById(id: number): Promise<void> {
        await this.delete({ id });
    }
}
