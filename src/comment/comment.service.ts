import {
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { CommentRepository } from "../repository/comment.repository";
import { UserRepository } from "../repository/user.repository";
import { ActionRepository } from "../repository/action.repository";
import { Comment } from "./comment.entity";
import { IsolationLevel, Transactional } from "typeorm-transactional";

@Injectable()
export class CommentService {
    private logger = new Logger("CommentService");

    constructor(
        private readonly commentRepository: CommentRepository,
        private readonly userRepository: UserRepository,
        private readonly actionRepository: ActionRepository,
    ) {}

    // [CM-01] Service logic
    async createComment(
        userId: number,
        actionId: number,
        content: string,
    ): Promise<Comment> {
        // find user from DB
        const writer = await this.userRepository.findUserById(userId);

        // if user does not exist, it is an error
        if (!writer) {
            throw new UnauthorizedException("User does not exist.");
        }

        // find an action from DB
        const action = await this.actionRepository.findActionById(actionId);

        // if the action does not exist, it is an error
        if (!action) {
            throw new NotFoundException(
                `Action with id ${actionId} has not been found.`,
            );
        }

        // create a comment and return
        const comment = this.commentRepository.create({
            content,
            writer,
            action,
        });

        return this.commentRepository.save(comment);
    }

    // [CM-02] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async updateComment(
        userId: number,
        commentId: number,
        content: string,
    ): Promise<Comment> {
        // find a comment from DB
        const comment = await this.commentRepository.findCommentById(commentId);

        // if the comment does not exist, it is an error
        if (!comment) {
            throw new NotFoundException(
                `Comment with id ${commentId} has not been found.`,
            );
        }

        // if writer's id is not equal to user id
        if (comment.writer.id !== userId) {
            throw new ForbiddenException(
                "Comment has not been written by user.",
            );
        }

        // update content of the comment
        comment.content = content;
        return this.commentRepository.save(comment);
    }

    // [CM-03] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async deleteComment(userId: number, commentId: number): Promise<void> {
        // find a comment from DB
        const comment = await this.commentRepository.findCommentById(commentId);

        // if the comment does not exist, it is an error
        if (!comment) {
            throw new NotFoundException(
                `Comment with id ${commentId} has not been found.`,
            );
        }

        // if the comment has not been written by user, it is an error
        if (comment.writer.id !== userId) {
            throw new ForbiddenException(
                "Comment has not been written by user.",
            );
        }

        // delete the comment
        await this.commentRepository.delete({ id: commentId });
    }
}
