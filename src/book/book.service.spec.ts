import { Test, TestingModule } from "@nestjs/testing";
import { BookService } from "./book.service";
import { BookRepository } from "../repository/book.repository";
import { QuestionRepository } from "../repository/question.repository";
import { UserRepository } from "../repository/user.repository";
import { faker } from "@faker-js/faker";
import { Book } from "./book.entity";
import { BookVisibility } from "./types/book-visibility.type";
import { User } from "../user/user.entity";
import { Question } from "../question/question.entity";

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

describe("BookService", () => {
    let bookService: BookService;
    let bookRepository: BookRepository;
    let questionRepository: QuestionRepository;
    let userRepository: UserRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BookService,
                {
                    provide: BookRepository,
                    useValue: {
                        findBooksWithQuery: jest.fn(),
                        findBookAndQuestionsById: jest.fn(),
                        findBookById: jest.fn(),
                        findQuestionsByBookId: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: QuestionRepository,
                    useValue: {
                        decreaseSaveCountsByIds: jest.fn(),
                        findQuestionById: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {
                        findUserById: jest.fn(),
                        findUserAndLikedBooksById: jest.fn(),
                        save: jest.fn(),
                    },
                },
            ],
        }).compile();

        bookService = module.get<BookService>(BookService);
        bookRepository = module.get<BookRepository>(BookRepository);
        questionRepository = module.get<QuestionRepository>(QuestionRepository);
        userRepository = module.get<UserRepository>(UserRepository);
    });

    it("should be defined", () => {
        expect(bookService).toBeDefined();
        expect(bookRepository).toBeDefined();
        expect(questionRepository).toBeDefined();
        expect(userRepository).toBeDefined();
    });

    describe("[S-B-01] BookService.getBooks()", () => {
        // Given
        const page = faker.number.int();
        const limit = faker.number.int();
        const sort = "likeCount";
        const order = "ASC";
        const search = faker.lorem.word();

        it("[S-B-01-01] Success", async () => {
            // Given
            const books = [new Book(), new Book(), new Book()];
            const mockedFindBooksWithQuery = jest
                .spyOn(bookRepository, "findBooksWithQuery")
                .mockResolvedValueOnce([books, books.length]);

            // When
            const result = await bookService.getBooks(
                page,
                limit,
                sort,
                order,
                search,
            );

            // Then
            expect(result).toEqual([books, books.length]);
            expect(mockedFindBooksWithQuery).toHaveBeenCalledTimes(1);
            expect(mockedFindBooksWithQuery).toHaveBeenCalledWith(
                page,
                limit,
                sort,
                order,
                search,
            );
        });
    });

    describe("[S-B-02] BookService.getBook()", () => {
        // Given
        const bookId = faker.number.int();

        it("[S-B-02-01] Success", async () => {
            // Given
            const book = new Book();
            const mockedFindBookById = jest
                .spyOn(bookRepository, "findBookById")
                .mockResolvedValueOnce(book);

            // When
            const result = await bookService.getBook(bookId);

            // Then
            expect(result).toEqual(book);
            expect(mockedFindBookById).toHaveBeenCalledTimes(1);
            expect(mockedFindBookById).toHaveBeenCalledWith(bookId);
        });
    });

    describe("[S-B-03] BookService.createBook()", () => {
        // Given
        const userId = faker.number.int();
        const visibility = BookVisibility.PUBLIC;
        const title = faker.lorem.sentence();
        const description = faker.lorem.sentence();

        it("[S-B-03-01] Success", async () => {
            // Given
            const publisher = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(publisher);

            const book = new Book();
            const mockedCreate = jest
                .spyOn(bookRepository, "create")
                .mockReturnValueOnce(book);

            const mockedSave = jest
                .spyOn(bookRepository, "save")
                .mockResolvedValueOnce(book);

            // When
            const result = await bookService.createBook(
                userId,
                visibility,
                title,
                description,
            );

            // Then
            expect(result).toEqual(book);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedCreate).toHaveBeenCalledTimes(1);
            expect(mockedCreate).toHaveBeenCalledWith({
                visibility,
                title,
                description,
                publisher,
            });
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(book);
        });
    });

    describe("[S-B-04] BookService.updateBook()", () => {
        // Given
        const userId = faker.number.int();
        const bookId = faker.number.int();
        const title = faker.lorem.sentence();
        const description = faker.lorem.sentence();

        it("[S-B-04-01] Success", async () => {
            // Given
            const publisher = new User();
            publisher.id = userId;
            const book = new Book();
            book.publisher = publisher;
            const mockedFindBookById = jest
                .spyOn(bookRepository, "findBookById")
                .mockResolvedValueOnce(book);

            const mockedSave = jest
                .spyOn(bookRepository, "save")
                .mockResolvedValueOnce(book);

            // When
            const result = await bookService.updateBook(
                userId,
                bookId,
                title,
                description,
            );

            // Then
            expect(result).toEqual(book);
            expect(result.title).toBe(title);
            expect(result.description).toBe(description);
            expect(mockedFindBookById).toHaveBeenCalledTimes(1);
            expect(mockedFindBookById).toHaveBeenCalledWith(bookId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(book);
        });
    });

    describe("[S-B-06] BookService.deleteBook()", () => {
        // Given
        const userId = faker.number.int();
        const bookId = faker.number.int();

        it("[S-B-06-01] Success", async () => {
            // Given
            const publisher = new User();
            publisher.id = userId;
            const questions = Array(3).map(() => {
                const question = new Question();
                question.id = faker.number.int();
                return question;
            });
            const book = new Book();
            book.publisher = publisher;
            book.questions = questions;
            const mockedFindBookAndQuestionsById = jest
                .spyOn(bookRepository, "findBookAndQuestionsById")
                .mockResolvedValueOnce(book);

            const questionIds = book.questions.map((q) => q.id);
            const mockedDecreaseSaveCountsByIds = jest
                .spyOn(questionRepository, "decreaseSaveCountsByIds")
                .mockResolvedValueOnce();

            const mockedDelete = jest
                .spyOn(bookRepository, "delete")
                .mockResolvedValueOnce(null);

            // When
            const result = await bookService.deleteBook(userId, bookId);

            // Then
            expect(result).toBeUndefined();
            expect(mockedFindBookAndQuestionsById).toHaveBeenCalledTimes(1);
            expect(mockedFindBookAndQuestionsById).toHaveBeenCalledWith(bookId);
            expect(mockedDecreaseSaveCountsByIds).toHaveBeenCalledTimes(1);
            expect(mockedDecreaseSaveCountsByIds).toHaveBeenCalledWith(
                questionIds,
            );
            expect(mockedDelete).toHaveBeenCalledTimes(1);
            expect(mockedDelete).toHaveBeenCalledWith({ id: bookId });
        });
    });

    describe("[S-B-07] BookService.saveQuestion()", () => {});

    describe("[S-B-08] BookService.deleteQuestion()", () => {});

    describe("[S-B-09] BookService.toggleLike()", () => {});

    describe("[S-B-10] BookService.getLike()", () => {});

    describe("[S-B-11] BookService.updateBookVisibility()", () => {});

    describe("[S-B-12] BookService.getQuestionsOfBook()", () => {});
});
