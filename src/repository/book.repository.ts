import { Injectable, Logger } from "@nestjs/common";
import { DataSource, Like, Repository } from "typeorm";
import { Book } from "../book/book.entity";
import { Question } from "../question/question.entity";
import { GetQuestionsQueryDto } from "../section/dto/get-questions-query.dto";

@Injectable()
export class BookRepository extends Repository<Book> {
    private logger = new Logger("BookRepository");

    constructor(private readonly dataSource: DataSource) {
        super(Book, dataSource.createEntityManager());
    }

    async findBooksWithQuery(
        page: number,
        limit: number,
        sort: "createdAt" | "likeCount",
        order: "ASC" | "DESC",
        search: string,
    ): Promise<[Book[], number]> {
        const where = {
            visibility: "public",
            title: search !== "" ? Like(`%${search}%`) : undefined,
        };

        return this.findAndCount({
            where,
            relations: ["publisher"],
            order: {
                [sort]: order,
            },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    async findBooksWithQueryByUserId(
        userId: number,
        page: number = 1,
        limit: number = 10,
        sort: "createdAt" | "likeCount" = "createdAt",
        order: "ASC" | "DESC" = "DESC",
        search: string,
    ): Promise<[Book[], number]> {
        const where = {
            title: search !== "" ? Like(`%${search}%`) : undefined,
            publisher: {
                id: userId,
            },
        };

        return this.findAndCount({
            where,
            relations: ["publisher"],
            order: {
                [sort]: order,
            },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    async findBookById(bookId: number): Promise<Book> {
        return this.findOne({
            where: { id: bookId },
            relations: ["publisher"],
        });
    }

    async findBookAndQuestionsById(bookId: number): Promise<Book> {
        return this.findOne({
            where: { id: bookId },
            relations: ["publisher", "questions"],
        });
    }

    async findQuestionsByBookId(
        bookId: number,
        query: GetQuestionsQueryDto,
    ): Promise<[Question[], number]> {
        const { page, limit, sort, order, search } = query;
        const queryBuilder = this.createQueryBuilder("book")
            .leftJoinAndSelect("book.questions", "question")
            .leftJoinAndSelect("question.writer", "writer")
            .where("book.id = :bookId", { bookId })
            .orderBy(`question.${sort}`, order)
            .skip((page - 1) * limit)
            .take(limit);

        if (search !== "") {
            queryBuilder.andWhere("question.content LIKE :content", {
                content: `%${search}%`,
            });
        }

        const book = await queryBuilder.getOne();

        if (!book) {
            return [[], 0];
        } else {
            return [book.questions, book.questions.length];
        }
    }
}
