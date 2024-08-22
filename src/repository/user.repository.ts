import { Injectable, Logger } from "@nestjs/common";
import { User } from "../user/user.entity";
import { Brackets, DataSource, Repository } from "typeorm";
import { Book } from "../book/book.entity";

@Injectable()
export class UserRepository extends Repository<User> {
    private logger = new Logger("UserRepository");

    constructor(private readonly dataSource: DataSource) {
        super(User, dataSource.createEntityManager());
    }

    async findAllUsers(): Promise<User[]> {
        return this.find({
            select: ["id", "email", "nickname", "affiliation", "position"],
        });
    }

    async findUserById(id: number): Promise<User> {
        return this.findOne({ where: { id } });
    }

    async findUserAndBooksById(id: number): Promise<User> {
        return this.findOne({
            where: { id },
            relations: ["books"],
        });
    }

    async findUserAndLikedBooksById(id: number): Promise<User> {
        return this.findOne({
            where: { id },
            relations: ["likedBooks"],
        });
    }

    async findUserBrieflyById(id: number): Promise<User> {
        return this.findOne({
            where: { id },
            select: {
                id: true,
                nickname: true,
            },
        });
    }

    async findUserByEmail(email: string): Promise<User> {
        return this.findOne({ where: { email } });
    }

    async createUser(
        email: string,
        password: string,
        nickname: string,
        affiliation: string,
        position: string,
        role: string = "user",
    ): Promise<User> {
        const user = this.create({
            email,
            password,
            nickname,
            affiliation,
            position,
            role,
        });

        return this.save(user);
    }

    async updateRefreshToken(id: number, refreshToken: string): Promise<void> {
        await this.update({ id }, { refreshToken });
    }

    async updatePassword(id: number, password: string): Promise<void> {
        // remove refresh token to protect user information
        await this.update({ id }, { password, refreshToken: null });
    }

    async updateNickname(id: number, nickname: string): Promise<void> {
        await this.update({ id }, { nickname });
    }

    async deleteUserById(id: number): Promise<void> {
        await this.softDelete({ id });
    }

    async findBooksLikedByUser(
        userId: number,
        page: number = 1,
        limit: number = 10,
        sort: "createdAt" | "likeCount" = "createdAt",
        order: "ASC" | "DESC" = "DESC",
        search: string,
    ): Promise<[Book[], number]> {
        const query = this.createQueryBuilder("user")
            .leftJoinAndSelect("user.likedBooks", "book")
            .leftJoinAndSelect("book.publisher", "publisher")
            .where("user.id = :userId", { userId })
            .andWhere(
                new Brackets((innerQuery) => {
                    innerQuery
                        .where("book.visibility = :PUBLIC", {
                            PUBLIC: "public",
                        })
                        .orWhere("publisher.id = :userId", { userId });
                }),
            )
            .orderBy(`book.${sort}`, order)
            .skip((page - 1) * limit)
            .take(limit);

        if (search !== "") {
            query.andWhere("book.title LIKE :title", { title: `%${search}%` });
        }

        const user = await query.getOne();
        if (!user) {
            return [[], 0];
        } else {
            return [user.likedBooks, user.likedBooks.length];
        }
    }

    // find total number o questions, actions and books written by user and its percentile
    async findTotalCreate(id: number): Promise<[number, number]> {
        const query = `
            WITH user_contributions AS (
                SELECT
                    u.id,
                    (COALESCE(COUNT(DISTINCT q.id), 0) +
                    COALESCE(COUNT(DISTINCT a.id), 0) +
                    COALESCE(COUNT(DISTINCT b.id), 0)) AS total_count
                FROM
                    "user" u
                LEFT JOIN question q ON q."writerId" = u.id
                LEFT JOIN action a ON a."writerId" = u.id
                LEFT JOIN book b ON b."publisherId" = u.id
                GROUP BY u.id
            ),
            ranked_contributions AS (
                SELECT
                    id,
                    total_count,
                    PERCENT_RANK() OVER (ORDER BY total_count DESC) AS percentile
                FROM
                    user_contributions
            )
            SELECT
                rc.total_count,
                rc.percentile
            FROM
                ranked_contributions rc
            WHERE
                rc.id = $1;
        `;

        const result = await this.dataSource.query(query, [id]);
        return [result[0].total_count, Math.round(result[0].percentile * 100)];
    }

    // find total number of saved count of questions written by user and its percentile
    async findQuestionsTotalSaved(id: number): Promise<[number, number]> {
        const query = `
            WITH user_questions AS (
                SELECT
                    u.id,
                    COALESCE(SUM(q.saved), 0) AS total_saved
                FROM
                    "user" u
                LEFT JOIN question q ON q."writerId" = u.id
                GROUP BY u.id
            ),
            ranked_questions_saved AS (
                SELECT
                    id,
                    total_saved,
                    PERCENT_RANK() OVER (ORDER BY total_saved DESC) AS percentile
                FROM
                    user_questions
            )
            SELECT
                rqs.total_saved,
                rqs.percentile
            FROM
                ranked_questions_saved rqs
            WHERE
                rqs.id = $1;
        `;

        const result = await this.dataSource.query(query, [id]);
        return [result[0].total_saved, Math.round(result[0].percentile * 100)];
    }

    // find total number of liked count of actions written by user and its percentile
    async findActionsTotalLiked(id: number): Promise<[number, number]> {
        const query = `
            WITH user_actions AS (
                SELECT
                    u.id,
                    COALESCE(SUM(a."likeCount"), 0) AS total_liked
                FROM
                    "user" u
                LEFT JOIN action a ON a."writerId" = u.id
                GROUP BY u.id
            ),
            ranked_actions_liked AS (
                SELECT
                    id,
                    total_liked,
                    PERCENT_RANK() OVER (ORDER BY total_liked DESC) AS percentile
                FROM
                    user_actions
            )
            SELECT
                ral.total_liked,
                ral.percentile
            FROM
                ranked_actions_liked ral
            WHERE
                ral.id = $1;
        `;

        const result = await this.dataSource.query(query, [id]);
        return [result[0].total_liked, Math.round(result[0].percentile * 100)];
    }

    // find total number of liked count of books written by user and its percentile
    async findBooksTotalLiked(id: number): Promise<[number, number]> {
        const query = `
            WITH user_books AS (
                SELECT
                    u.id,
                    COALESCE(SUM(b."likeCount"), 0) AS total_liked
                FROM
                    "user" u
                LEFT JOIN book b ON b."publisherId" = u.id
                GROUP BY u.id
            ),
            ranked_books_liked AS (
                SELECT
                    id,
                    total_liked,
                    PERCENT_RANK() OVER (ORDER BY total_liked DESC) AS percentile
                FROM
                    user_books
            )
            SELECT
                rbl.total_liked,
                rbl.percentile
            FROM
                ranked_books_liked rbl
            WHERE
                rbl.id = $1;
        `;

        const result = await this.dataSource.query(query, [id]);
        return [result[0].total_liked, Math.round(result[0].percentile * 100)];
    }
}
