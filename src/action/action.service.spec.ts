import { Test, TestingModule } from "@nestjs/testing";
import { ActionService } from "./action.service";
import { ActionRepository } from "../repository/action.repository";
import { QuestionRepository } from "../repository/question.repository";
import { UserRepository } from "../repository/user.repository";
import { CommentRepository } from "../repository/comment.repository";
import { faker } from "@faker-js/faker";
import { Action } from "./action.entity";
import { User } from "../user/user.entity";
import { Question } from "../question/question.entity";
import { Comment } from "../comment/comment.entity";

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

describe("ActionService", () => {
    let actionService: ActionService;
    let actionRepository: ActionRepository;
    let questionRepository: QuestionRepository;
    let userRepository: UserRepository;
    let commentRepository: CommentRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ActionService,
                {
                    provide: ActionRepository,
                    useValue: {
                        findActionById: jest.fn(),
                        findActionDetailById: jest.fn(),
                        findActionAndLikesById: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: QuestionRepository,
                    useValue: {
                        findQuestionById: jest.fn(),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {
                        findUserById: jest.fn(),
                    },
                },
                {
                    provide: CommentRepository,
                    useValue: {
                        findCommentsByActionId: jest.fn(),
                    },
                },
            ],
        }).compile();

        actionService = module.get<ActionService>(ActionService);
        actionRepository = module.get<ActionRepository>(ActionRepository);
        questionRepository = module.get<QuestionRepository>(QuestionRepository);
        userRepository = module.get<UserRepository>(UserRepository);
        commentRepository = module.get<CommentRepository>(CommentRepository);
    });

    it("should be defined", () => {
        expect(actionService).toBeDefined();
        expect(actionRepository).toBeDefined();
        expect(questionRepository).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(commentRepository).toBeDefined();
    });

    describe("[S-AC-01] ActionService.getSpecificAction()", () => {
        // Given
        const actionId = faker.number.int();

        it("[S-AC-01-01] Success", async () => {
            // Given
            const content = faker.lorem.text();
            const action = new Action();
            action.content = content;
            const mockedFindActionById = jest
                .spyOn(actionRepository, "findActionById")
                .mockResolvedValueOnce(action);

            const sanizitedHtml = faker.lorem.text();
            const mockedSanitizeHtmlForClient = jest
                .spyOn(actionService, "sanitizeHtmlForClient")
                .mockResolvedValueOnce(sanizitedHtml);

            // When
            const result = await actionService.getSpecificAction(actionId);

            // Then
            expect(result).toEqual(action);
            expect(result.content).toBe(sanizitedHtml);
            expect(mockedFindActionById).toHaveBeenCalledTimes(1);
            expect(mockedFindActionById).toHaveBeenCalledWith(actionId);
            expect(mockedSanitizeHtmlForClient).toHaveBeenCalledTimes(1);
            expect(mockedSanitizeHtmlForClient).toHaveBeenCalledWith(content);
        });
    });

    describe("[S-AC-02] ActionService.createAction()", () => {
        // Given
        const userId = faker.number.int();
        const questionId = faker.number.int();
        const title = faker.lorem.sentence();
        const content = faker.lorem.text();

        it("[S-AC-02-01] Success", async () => {
            // Given
            const writer = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(writer);

            const question = new Question();
            const mockedFindQuestionById = jest
                .spyOn(questionRepository, "findQuestionById")
                .mockResolvedValueOnce(question);

            const imageUrls = [
                faker.internet.url(),
                faker.internet.url(),
                faker.internet.url(),
            ];
            const mockedExtractImageUrls = jest
                .spyOn(actionService, "extractImageUrls")
                .mockReturnValueOnce(imageUrls);

            const sanitizedHtml = faker.lorem.text();
            const mockedParseAndSanitizeMarkdown = jest
                .spyOn(actionService, "parseAndSanitizeMarkdown")
                .mockResolvedValueOnce(sanitizedHtml);

            const action = new Action();
            const mockedCreate = jest
                .spyOn(actionRepository, "create")
                .mockReturnValueOnce(action);

            const mockedSave = jest
                .spyOn(actionRepository, "save")
                .mockResolvedValueOnce(action);

            // When
            const result = await actionService.createAction(
                userId,
                questionId,
                title,
                content,
            );

            // Then
            expect(result).toEqual(action);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindQuestionById).toHaveBeenCalledTimes(1);
            expect(mockedFindQuestionById).toHaveBeenCalledWith(questionId);
            expect(mockedExtractImageUrls).toHaveBeenCalledTimes(1);
            expect(mockedExtractImageUrls).toHaveBeenCalledWith(content);
            expect(mockedParseAndSanitizeMarkdown).toHaveBeenCalledTimes(1);
            expect(mockedParseAndSanitizeMarkdown).toHaveBeenCalledWith(
                content,
            );
            expect(mockedCreate).toHaveBeenCalledTimes(1);
            expect(mockedCreate).toHaveBeenCalledWith({
                title,
                content: sanitizedHtml,
                rawContent: content,
                imageUrls,
                question,
                writer,
            });
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(action);
        });
    });

    describe("[S-AC-03] ActionService.updateAction()", () => {
        // Given
        const userId = faker.number.int();
        const actionId = faker.number.int();
        const title = faker.lorem.sentence();
        const content = faker.lorem.text();

        it("[S-AC-03-01] Success", async () => {
            // Given
            const writer = new User();
            writer.id = userId;
            const action = new Action();
            action.writer = writer;
            const mockedFindActionById = jest
                .spyOn(actionRepository, "findActionById")
                .mockResolvedValueOnce(action);

            const imageUrls = [
                faker.internet.url(),
                faker.internet.url(),
                faker.internet.url(),
            ];
            const mockedExtractImageUrls = jest
                .spyOn(actionService, "extractImageUrls")
                .mockReturnValueOnce(imageUrls);

            const sanitizedHtml = faker.lorem.text();
            const mockedParseAndSanitizeMarkdown = jest
                .spyOn(actionService, "parseAndSanitizeMarkdown")
                .mockResolvedValueOnce(sanitizedHtml);

            const mockedSave = jest
                .spyOn(actionRepository, "save")
                .mockResolvedValueOnce(action);

            // When
            const result = await actionService.updateAction(
                userId,
                actionId,
                title,
                content,
            );

            // Then
            expect(result).toEqual(action);
            expect(result.title).toBe(title);
            expect(result.content).toBe(sanitizedHtml);
            expect(result.rawContent).toBe(content);
            expect(result.imageUrls).toEqual(imageUrls);
            expect(mockedFindActionById).toHaveBeenCalledTimes(1);
            expect(mockedFindActionById).toHaveBeenCalledWith(actionId);
            expect(mockedExtractImageUrls).toHaveBeenCalledTimes(1);
            expect(mockedExtractImageUrls).toHaveBeenCalledWith(content);
            expect(mockedParseAndSanitizeMarkdown).toHaveBeenCalledTimes(1);
            expect(mockedParseAndSanitizeMarkdown).toHaveBeenCalledWith(
                content,
            );
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(action);
        });
    });

    describe("[S-AC-04] ActionService.deleteAction()", () => {
        // Given
        const userId = faker.number.int();
        const actionId = faker.number.int();

        it("[S-AC-04-01] Success", async () => {
            // Given
            const writer = new User();
            writer.id = userId;
            const action = new Action();
            action.writer = writer;
            const mockedFindActionById = jest
                .spyOn(actionRepository, "findActionById")
                .mockResolvedValueOnce(action);

            const mockedDelete = jest
                .spyOn(actionRepository, "delete")
                .mockResolvedValueOnce(null);

            // When
            const result = await actionService.deleteAction(userId, actionId);

            // Then
            expect(result).toBeUndefined();
            expect(mockedFindActionById).toHaveBeenCalledTimes(1);
            expect(mockedFindActionById).toHaveBeenCalledWith(actionId);
            expect(mockedDelete).toHaveBeenCalledTimes(1);
            expect(mockedDelete).toHaveBeenCalledWith({ id: actionId });
        });
    });

    describe("[S-AC-05] ActionService.getRawContent()", () => {
        // Given
        const userId = faker.number.int();
        const actionId = faker.number.int();

        it("[S-AC-05-01] Success", async () => {
            // Given
            const writer = new User();
            writer.id = userId;
            const action = new Action();
            action.writer = writer;
            action.rawContent = faker.lorem.text();
            const mockedFindActionById = jest
                .spyOn(actionRepository, "findActionById")
                .mockResolvedValueOnce(action);

            // When
            const result = await actionService.getRawContent(userId, actionId);

            // Then
            expect(result).toBe(action.rawContent);
            expect(mockedFindActionById).toHaveBeenCalledTimes(1);
            expect(mockedFindActionById).toHaveBeenCalledWith(actionId);
        });
    });

    describe("[S-AC-06] ActionService.toggleLike()", () => {
        // Given
        const userId = faker.number.int();
        const actionId = faker.number.int();

        it("[S-AC-06-01] Success - Like", async () => {
            // Given
            const user = new User();
            user.id = userId;
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const action = new Action();
            action.likedBy = [];
            action.likeCount = 0;
            const mockedFindActionAndLikesById = jest
                .spyOn(actionRepository, "findActionAndLikesById")
                .mockResolvedValueOnce(action);

            const mockedSave = jest
                .spyOn(actionRepository, "save")
                .mockResolvedValueOnce(action);

            // When
            const result = await actionService.toggleLike(userId, actionId);

            // Then
            expect(result).toEqual([true, 1]);
            expect(
                action.likedBy.some((likedUser) => likedUser.id === user.id),
            ).toBeTruthy();
            expect(action.likeCount).toBe(1);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindActionAndLikesById).toHaveBeenCalledTimes(1);
            expect(mockedFindActionAndLikesById).toHaveBeenCalledWith(actionId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(action);
        });

        it("[S-AC-06-02] Success - Unlike", async () => {
            // Given
            const user = new User();
            user.id = userId;
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const action = new Action();
            action.likedBy = [user];
            action.likeCount = 1;
            const mockedFindActionAndLikesById = jest
                .spyOn(actionRepository, "findActionAndLikesById")
                .mockResolvedValueOnce(action);

            const mockedSave = jest
                .spyOn(actionRepository, "save")
                .mockResolvedValueOnce(action);

            // When
            const result = await actionService.toggleLike(userId, actionId);

            // Then
            expect(result).toEqual([false, 0]);
            expect(
                action.likedBy.some((likedUser) => likedUser.id === user.id),
            ).toBeFalsy();
            expect(action.likeCount).toBe(0);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindActionAndLikesById).toHaveBeenCalledTimes(1);
            expect(mockedFindActionAndLikesById).toHaveBeenCalledWith(actionId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(action);
        });
    });

    describe("[S-AC-07] ActionService.getLike()", () => {
        // Given
        const userId = faker.number.int();
        const actionId = faker.number.int();

        it("[S-AC-07-01] Success - Liked", async () => {
            // Given
            const user = new User();
            user.id = userId;
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const action = new Action();
            action.likedBy = [user];
            action.likeCount = 1;
            const mockedFindActionAndLikesById = jest
                .spyOn(actionRepository, "findActionAndLikesById")
                .mockResolvedValueOnce(action);

            // When
            const result = await actionService.getLike(userId, actionId);

            // Then
            expect(result).toEqual([true, 1]);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindActionAndLikesById).toHaveBeenCalledTimes(1);
            expect(mockedFindActionAndLikesById).toHaveBeenCalledWith(actionId);
        });

        it("[S-AC-07-02] Success - Not liked", async () => {
            // Given
            const user = new User();
            user.id = userId;
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const action = new Action();
            action.likedBy = [];
            action.likeCount = 0;
            const mockedFindActionAndLikesById = jest
                .spyOn(actionRepository, "findActionAndLikesById")
                .mockResolvedValueOnce(action);

            // When
            const result = await actionService.getLike(userId, actionId);

            // Then
            expect(result).toEqual([false, 0]);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindActionAndLikesById).toHaveBeenCalledTimes(1);
            expect(mockedFindActionAndLikesById).toHaveBeenCalledWith(actionId);
        });
    });

    describe("[S-AC-08] ActionService.getComments()", () => {
        // Given
        const actionId = faker.number.int();
        const page = faker.number.int();
        const limit = faker.number.int();
        const sort = "createdAt";
        const order = "ASC";

        it("[S-AC-08-01] Success", async () => {
            // Given
            const action = new Action();
            action.id = actionId;
            const mockedFindActionById = jest
                .spyOn(actionRepository, "findActionById")
                .mockResolvedValueOnce(action);

            const comments = [new Comment(), new Comment(), new Comment()];
            const total = comments.length;
            const mockedFindCommentsByActionId = jest
                .spyOn(commentRepository, "findCommentsByActionId")
                .mockResolvedValueOnce([comments, total]);

            // When
            const result = await actionService.getComments(
                actionId,
                page,
                limit,
                sort,
                order,
            );

            // Then
            expect(result).toEqual([comments, total]);
            expect(mockedFindActionById).toHaveBeenCalledTimes(1);
            expect(mockedFindActionById).toHaveBeenCalledWith(actionId);
            expect(mockedFindCommentsByActionId).toHaveBeenCalledTimes(1);
            expect(mockedFindCommentsByActionId).toHaveBeenCalledWith(
                actionId,
                page,
                limit,
                sort,
                order,
            );
        });
    });
});
