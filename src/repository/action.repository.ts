import { Injectable, Logger } from "@nestjs/common";
import { DataSource, Like, Repository } from "typeorm";
import { Action } from "../action/action.entity";
import { User } from "../user/user.entity";

@Injectable()
export class ActionRepository extends Repository<Action> {
    private logger = new Logger("ActionRepository");

    constructor(private readonly dataSource: DataSource) {
        super(Action, dataSource.createEntityManager());
    }

    async findActionById(id: number): Promise<Action> {
        return this.findOne({ where: { id }, relations: ["writer"] });
    }

    async findActionDetailById(id: number): Promise<Action> {
        return this.findOne({
            where: { id },
            relations: ["writer", "question"],
            select: {
                id: true,
                title: true,
                content: true,
                likeCount: true,
                createdAt: true,
                updatedAt: true,
                writer: {
                    id: true,
                    nickname: true,
                },
                question: {
                    id: true,
                    content: true,
                },
            },
        });
    }

    async findActionByWriterAndId(writer: User, id: number): Promise<Action> {
        return this.findOne({
            where: {
                id,
                writer,
            },
        });
    }

    async findActionsByQuestionId(
        questionId: number,
        page: number = 1,
        limit: number = 10,
        sort: "updatedAt" | "likeCount" = "updatedAt",
        order: "ASC" | "DESC" = "DESC",
        search: string = "",
    ): Promise<[Action[], number]> {
        const where = {
            question: {
                id: questionId,
            },
            title: search !== "" ? Like(`%${search}%`) : undefined,
        };

        return this.findAndCount({
            where,
            relations: ["writer"],
            order: {
                [sort]: order,
            },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    async findActionAndLikesById(id: number): Promise<Action> {
        return this.findOne({
            where: { id },
            relations: ["likedBy"],
        });
    }
}
