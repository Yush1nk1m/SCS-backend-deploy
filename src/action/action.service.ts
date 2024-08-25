import {
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { ActionRepository } from "../repository/action.repository";
import { Action } from "./action.entity";
import { QuestionRepository } from "../repository/question.repository";
import { marked } from "marked";
import * as sanitizeHtml from "sanitize-html";
import { sanitizeOptions } from "../config/sanitize-config";
import { UserRepository } from "../repository/user.repository";
import { IsolationLevel, Transactional } from "typeorm-transactional";
import { LikeCount, Liked } from "./types/like.type";
import { Comment } from "../comment/comment.entity";
import { CommentRepository } from "../repository/comment.repository";

@Injectable()
export class ActionService {
    private logger = new Logger("ActionService");

    constructor(
        private readonly actionRepository: ActionRepository,
        private readonly questionRepository: QuestionRepository,
        private readonly userRepository: UserRepository,
        private readonly commentRepository: CommentRepository,
    ) {}

    // extract image URLs from markdown text
    extractImageUrls(content: string): string[] {
        const regex = /!\[.*?\]\((https:\/\/.*\.s3\.amazonaws\.com\/.*?)\)/g;
        const matches = content.matchAll(regex);
        return Array.from(matches, (m) => m[1]);
    }

    // Method for saving markdown content on DB
    async parseAndSanitizeMarkdown(markdown: string): Promise<string> {
        // parse markdown to HTML
        const rawHtml = await marked(markdown);
        this.logger.verbose(`rawHtml: ${rawHtml}`);

        // HTML sanitize (to prevent XSS attack)
        try {
            const sanitizedHtml = sanitizeHtml(rawHtml, sanitizeOptions);
            this.logger.verbose(`sanitizedHtml: ${sanitizedHtml}`);

            return sanitizedHtml;
        } catch (error) {
            this.logger.error(`Sanitize error: ${error}`);
            this.logger.error(`Error stack: ${error.stack}`);
            throw error;
        }
    }

    // Method for delivering markdown content to client
    async sanitizeHtmlForClient(html: string): Promise<string> {
        // HTML sanitize again (to prevent XSS attack)
        return sanitizeHtml(html, sanitizeOptions);
    }

    // [AC-01] Service logic
    async getSpecificAction(actionId: number): Promise<Action> {
        // find an action with the specified id from DB
        const action = await this.actionRepository.findActionById(actionId);

        // if the action does not exist, it is an error
        if (!action) {
            throw new NotFoundException(
                `Action with id ${actionId} has not been found.`,
            );
        }

        // sanitize HTML data for client
        action.content = await this.sanitizeHtmlForClient(action.content);

        return action;
    }

    // [AC-02] Service logic
    async createAction(
        userId: number,
        questionId: number,
        title: string,
        content: string,
    ): Promise<Action> {
        // find user from DB
        const writer = await this.userRepository.findUserById(userId);

        // if user does not exist, it is an error
        if (!writer) {
            throw new UnauthorizedException("User not exists.");
        }

        // find a question with the specified id from DB
        const question =
            await this.questionRepository.findQuestionById(questionId);

        // if the question does not exist, it is an error
        if (!question) {
            throw new NotFoundException(
                `Question with id ${questionId} has not been found.`,
            );
        }

        // extract image URLs from markdown content
        const imageUrls = this.extractImageUrls(content);
        this.logger.verbose("Extracted image URLs:", imageUrls);

        // parse and sanitize markdown content
        const sanitizedHtml = await this.parseAndSanitizeMarkdown(content);
        this.logger.verbose("Sanitized HTML:", sanitizedHtml);

        // create action
        const action = this.actionRepository.create({
            title,
            content: sanitizedHtml,
            rawContent: content,
            imageUrls,
            question,
            writer,
        });

        return this.actionRepository.save(action);
    }

    // [AC-03] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async updateAction(
        userId: number,
        actionId: number,
        title: string,
        content: string,
    ): Promise<Action> {
        // find an action which is written by user
        const action = await this.actionRepository.findActionById(actionId);

        // if the action does not exist, it is an error
        if (!action) {
            throw new NotFoundException(
                `Action with id ${actionId} has not been found.`,
            );
        }

        // if the action has not been written by user, it is an error
        if (action.writer.id !== userId) {
            throw new ForbiddenException("User cannot access to the action.");
        }

        // extract image URLs from markdown content
        const imageUrls = this.extractImageUrls(content);
        this.logger.verbose("Updated extracted image URLs:", imageUrls);

        // parse and sanitize markdown content
        const sanitizedHtml = await this.parseAndSanitizeMarkdown(content);
        this.logger.verbose("Updated sanitized HTML:", sanitizedHtml);

        // update action information and save
        action.title = title;
        action.content = sanitizedHtml;
        action.rawContent = content;
        action.imageUrls = imageUrls;

        return this.actionRepository.save(action);
    }

    // [AC-04] Controller logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async deleteAction(userId: number, actionId: number): Promise<void> {
        // find action from DB
        const action = await this.actionRepository.findActionById(actionId);

        // if action does not exist, it is an error
        if (!action) {
            throw new NotFoundException(
                `Action with id ${actionId} does not exist.`,
            );
        }

        // if writer is not equal, request is forbidden
        if (action.writer.id !== userId) {
            throw new ForbiddenException("Access is not allowed.");
        }

        // delete action
        await this.actionRepository.delete({ id: actionId });
    }

    // [AC-05] Service logic
    async getRawContent(userId: number, actionId: number): Promise<string> {
        // find action from DB
        const action = await this.actionRepository.findActionById(actionId);

        // if action does not exist, it is an error
        if (!action) {
            throw new NotFoundException(
                `Action with id ${actionId} does not exist.`,
            );
        }

        // if writer is not equal, request is forbidden
        if (action.writer.id !== userId) {
            throw new ForbiddenException("Access is not allowed.");
        }

        // return raw markdown content
        return action.rawContent;
    }

    // [AC-06] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async toggleLike(
        userId: number,
        actionId: number,
    ): Promise<[Liked, LikeCount]> {
        // find user from DB
        const user = await this.userRepository.findUserById(userId);

        // if user does not exist, it is an error
        if (!user) {
            throw new UnauthorizedException("User does not exist.");
        }

        // find action from DB
        const action =
            await this.actionRepository.findActionAndLikesById(actionId);

        // if action does not exist, it is an error
        if (!action) {
            throw new NotFoundException("Action has not been found.");
        }

        // save liked status
        let liked: boolean = null;

        // if user has already liked action
        if (action.likedBy.some((likedUser) => likedUser.id === user.id)) {
            action.likedBy = action.likedBy.filter(
                (likedUser) => likedUser.id !== user.id,
            );
            action.likeCount--;
            liked = false;
        }
        // if user has not liked action
        else {
            action.likedBy.push(user);
            action.likeCount++;
            liked = true;
        }

        await this.actionRepository.save(action);

        return [liked, action.likeCount];
    }

    // [AC-07] Service logic
    async getLike(
        userId: number,
        actionId: number,
    ): Promise<[Liked, LikeCount]> {
        // find user from DB
        const user = await this.userRepository.findUserById(userId);

        // if user does not exist, it is an error
        if (!user) {
            throw new UnauthorizedException("User does not exist.");
        }

        // find action from DB
        const action =
            await this.actionRepository.findActionAndLikesById(actionId);

        // if action does not exist, it is an error
        if (!action) {
            throw new NotFoundException("Action has not been found.");
        }

        const liked = action.likedBy.some(
            (likedUser) => likedUser.id === userId,
        );

        return [liked, action.likeCount];
    }

    // [AC-08] Service logic
    async getComments(
        actionId: number,
        page: number = 1,
        limit: number = 100,
        sort: "createdAt" = "createdAt",
        order: "ASC" | "DESC" = "DESC",
    ): Promise<[Comment[], number]> {
        // find an action from DB
        const action = await this.actionRepository.findActionById(actionId);

        // if the action does not exist, it is an error
        if (!action) {
            throw new NotFoundException(
                `Action with id ${actionId} has not been found.`,
            );
        }

        return this.commentRepository.findCommentsByActionId(
            actionId,
            page,
            limit,
            sort,
            order,
        );
    }
}
