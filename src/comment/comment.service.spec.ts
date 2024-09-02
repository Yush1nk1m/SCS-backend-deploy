import { Test, TestingModule } from "@nestjs/testing";
import { CommentService } from "./comment.service";
import { CommentRepository } from "../repository/comment.repository";
import { UserRepository } from "../repository/user.repository";
import { ActionRepository } from "../repository/action.repository";
import { faker } from "@faker-js/faker";
import { User } from "../user/user.entity";
import { Action } from "../action/action.entity";
import { Comment } from "./comment.entity";

// mock @Transactional() decorator
jest.mock("typeorm-transactional", () => ({
    Transactional: jest.fn().mockImplementation(() => {
        return function (
            target,
            propertyKey: string,
            descriptor: PropertyDescriptor,
        ) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: unknown[]) {
                return originalMethod.apply(this, args);
            };
            return descriptor;
        };
    }),
    IsolationLevel: {
        REPEATABLE_READ: "REPEATABLE_READ",
    },
}));

describe("CommentService", () => {
    let commentService: CommentService;
    let commentRepository: CommentRepository;
    let userRepository: UserRepository;
    let actionRepository: ActionRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommentService,
                {
                    provide: CommentRepository,
                    useValue: {
                        findCommentById: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {
                        findUserById: jest.fn(),
                    },
                },
                {
                    provide: ActionRepository,
                    useValue: {
                        findActionById: jest.fn(),
                    },
                },
            ],
        }).compile();

        commentService = module.get<CommentService>(CommentService);
        commentRepository = module.get<CommentRepository>(CommentRepository);
        userRepository = module.get<UserRepository>(UserRepository);
        actionRepository = module.get<ActionRepository>(ActionRepository);
    });

    it("should be defined", () => {
        expect(commentService).toBeDefined();
        expect(commentRepository).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(actionRepository).toBeDefined();
    });

    describe("[S-CM-01]: CommentService.createComment()", () => {
        // Given
        const userId = faker.number.int();
        const actionId = faker.number.int();
        const content = faker.lorem.sentence();

        it("[S-CM-01-01] Success", async () => {
            // Given
            const writer = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(writer);

            const action = new Action();
            const mockedFindActionById = jest
                .spyOn(actionRepository, "findActionById")
                .mockResolvedValueOnce(action);

            const comment = new Comment();
            const mockedCreate = jest
                .spyOn(commentRepository, "create")
                .mockReturnValueOnce(comment);

            const mockedSave = jest
                .spyOn(commentRepository, "save")
                .mockResolvedValueOnce(comment);

            // When
            const result = await commentService.createComment(
                userId,
                actionId,
                content,
            );

            // Then
            expect(result).toEqual(comment);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindActionById).toHaveBeenCalledTimes(1);
            expect(mockedFindActionById).toHaveBeenCalledWith(actionId);
            expect(mockedCreate).toHaveBeenCalledTimes(1);
            expect(mockedCreate).toHaveBeenCalledWith({
                content,
                writer,
                action,
            });
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(comment);
        });
    });

    describe("[S-CM-02]: CommentService.updateComment()", () => {
        // Given
        const userId = faker.number.int();
        const commentId = faker.number.int();
        const content = faker.lorem.sentence();

        it("[S-CM-02-01] Success", async () => {
            // Given
            const writer = new User();
            writer.id = userId;
            const comment = new Comment();
            comment.writer = writer;
            const mockedFindCommentById = jest
                .spyOn(commentRepository, "findCommentById")
                .mockResolvedValueOnce(comment);

            const mockedSave = jest
                .spyOn(commentRepository, "save")
                .mockResolvedValueOnce(comment);

            // When
            const result = await commentService.updateComment(
                userId,
                commentId,
                content,
            );

            // Then
            expect(result).toEqual(comment);
            expect(result.content).toBe(content);
            expect(mockedFindCommentById).toHaveBeenCalledTimes(1);
            expect(mockedFindCommentById).toHaveBeenCalledWith(commentId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(comment);
        });
    });

    describe("[S-CM-03]: CommentService.deleteComment()", () => {
        // Given
        const userId = faker.number.int();
        const commentId = faker.number.int();

        it("[S-CM-03-01] Success", async () => {
            // Given
            const writer = new User();
            writer.id = userId;
            const comment = new Comment();
            comment.writer = writer;
            const mockedFindCommentById = jest
                .spyOn(commentRepository, "findCommentById")
                .mockResolvedValueOnce(comment);

            const mockedDelete = jest
                .spyOn(commentRepository, "delete")
                .mockResolvedValueOnce(null);

            // When
            const result = await commentService.deleteComment(
                userId,
                commentId,
            );

            // Then
            expect(result).toBeUndefined();
            expect(mockedFindCommentById).toHaveBeenCalledTimes(1);
            expect(mockedFindCommentById).toHaveBeenCalledWith(commentId);
            expect(mockedDelete).toHaveBeenCalledTimes(1);
            expect(mockedDelete).toHaveBeenCalledWith({ id: commentId });
        });
    });
});
