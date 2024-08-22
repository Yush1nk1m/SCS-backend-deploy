import { Injectable, Logger } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Comment } from "../comment/comment.entity";

@Injectable()
export class CommentRepository extends Repository<Comment> {
    private logger = new Logger("CommentRepository");

    constructor(private readonly dataSource: DataSource) {
        super(Comment, dataSource.createEntityManager());
    }

    async findCommentById(id: number): Promise<Comment> {
        return this.findOne({
            where: { id },
            relations: ["writer"],
        });
    }

    async findCommentsByActionId(
        actionId: number,
        page: number = 1,
        limit: number = 10,
        sort: "createdAt" = "createdAt",
        order: "ASC" | "DESC" = "DESC",
    ): Promise<[Comment[], number]> {
        return this.findAndCount({
            where: {
                action: {
                    id: actionId,
                },
            },
            relations: ["writer"],
            order: {
                [sort]: order,
            },
            skip: (page - 1) * limit,
            take: limit,
        });
    }
}
