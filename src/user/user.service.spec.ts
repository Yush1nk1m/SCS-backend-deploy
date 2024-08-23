import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./user.service";
import { UserRepository } from "../repository/user.repository";
import { BookRepository } from "../repository/book.repository";
import { ConfigService } from "@nestjs/config";
import { User } from "./user.entity";
import {
    BadRequestException,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { faker } from "@faker-js/faker";
import * as bcrypt from "bcrypt";
import { Book } from "../book/book.entity";
import { ContributionType } from "./types/contribution.enum";

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

jest.mock("bcrypt", () => ({
    hash: jest.fn(),
    compare: jest.fn(),
    genSalt: jest.fn(),
}));

describe("UserService", () => {
    let userService: UserService;
    let userRepository: UserRepository;
    let bookRepository: BookRepository;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: UserRepository,
                    useValue: {
                        findAllUsers: jest.fn(),
                        findUserById: jest.fn(),
                        updatePassword: jest.fn(),
                        save: jest.fn(),
                        deleteUserById: jest.fn(),
                        findBooksLikedByUser: jest.fn(),
                        findTotalCreate: jest.fn(),
                        findQuestionsTotalSaved: jest.fn(),
                        findActionsTotalLiked: jest.fn(),
                        findBooksTotalLiked: jest.fn(),
                    },
                },
                {
                    provide: BookRepository,
                    useValue: {
                        findBooksWithQueryByUserId: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue(10),
                    },
                },
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
        userRepository = module.get<UserRepository>(UserRepository);
        bookRepository = module.get<BookRepository>(BookRepository);
        configService = module.get<ConfigService>(ConfigService);
    });

    it("should be defined", () => {
        expect(userService).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(bookRepository).toBeDefined();
        expect(configService).toBeDefined();
    });

    describe("[S-U-01] UserService.findAllUsers()", () => {
        it("[S-U-01-01] Success", async () => {
            // Given
            const users: User[] = [new User(), new User(), new User()];
            const mockedFindAllUsers = jest
                .spyOn(userRepository, "findAllUsers")
                .mockResolvedValueOnce(users);

            // When
            const result = await userService.findAllUsers();

            // Then
            expect(result).toEqual(users);
            expect(mockedFindAllUsers).toHaveBeenCalledTimes(1);
        });

        it("[S-U-01-02] Empty list", async () => {
            // Given
            const users: User[] = [];
            const mockedFindAllUsers = jest
                .spyOn(userRepository, "findAllUsers")
                .mockResolvedValueOnce(users);

            // When
            const result = await userService.findAllUsers();

            // Then
            expect(result).toEqual(users);
            expect(mockedFindAllUsers).toHaveBeenCalledTimes(1);
        });

        it("[S-U-01-03] Failed to find users", async () => {
            // Given
            const mockedFindAllUsers = jest
                .spyOn(userRepository, "findAllUsers")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(userService.findAllUsers()).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedFindAllUsers).toHaveBeenCalledTimes(1);
        });
    });

    describe("[S-U-02] UserService.findUser()", () => {
        // Given
        const userId = faker.number.int();

        it("[S-U-02-01] Success", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            // When
            const result = await userService.findUser(userId);

            // Then
            expect(result).toEqual(user);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-02-02] User not found", async () => {
            // Given
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(null);

            // When & Then
            await expect(userService.findUser(userId)).rejects.toThrow(
                new NotFoundException("The user has not been found."),
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-02-03] Failed to find user", async () => {
            // Given
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(userService.findUser(userId)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });
    });

    describe("[S-U-03] UserService.changeUserPassword()", () => {
        // Given
        const userId = faker.number.int();
        const hashedPassword = "hashed password";
        const salt = "salt";

        it("[S-U-03-01] Success", async () => {
            // Given
            const password = faker.internet.password();
            const newPassword = faker.internet.password();
            const confirmPassword = newPassword;

            const user = new User();
            user.id = userId;
            user.password = faker.internet.password();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedCompare = (
                bcrypt.compare as jest.Mock
            ).mockResolvedValueOnce(true);

            const mockedGenSalt = (
                bcrypt.genSalt as jest.Mock
            ).mockResolvedValueOnce(salt);

            const mockedHash = (bcrypt.hash as jest.Mock).mockResolvedValueOnce(
                hashedPassword,
            );

            const mockedUpdatePassword = jest
                .spyOn(userRepository, "updatePassword")
                .mockResolvedValueOnce();

            // When
            const result = await userService.changeUserPassword(
                userId,
                password,
                newPassword,
                confirmPassword,
            );

            // Then
            expect(result).toBeUndefined();
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedCompare).toHaveBeenCalledWith(password, user.password);
            expect(mockedGenSalt).toHaveBeenCalledWith(10);
            expect(mockedHash).toHaveBeenCalledWith(newPassword, salt);
            expect(mockedUpdatePassword).toHaveBeenCalledTimes(1);
            expect(mockedUpdatePassword).toHaveBeenCalledWith(
                user.id,
                hashedPassword,
            );
        });

        it("[S-U-03-02] Failed to update password", async () => {
            // Given
            const password = faker.internet.password();
            const newPassword = faker.internet.password();
            const confirmPassword = newPassword;

            const user = new User();
            user.id = userId;
            user.password = faker.internet.password();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedCompare = (
                bcrypt.compare as jest.Mock
            ).mockResolvedValueOnce(true);

            const mockedGenSalt = (
                bcrypt.genSalt as jest.Mock
            ).mockResolvedValueOnce(salt);

            const mockedHash = (bcrypt.hash as jest.Mock).mockResolvedValueOnce(
                hashedPassword,
            );

            const mockedUpdatePassword = jest
                .spyOn(userRepository, "updatePassword")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.changeUserPassword(
                    userId,
                    password,
                    newPassword,
                    confirmPassword,
                ),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedCompare).toHaveBeenCalledWith(password, user.password);
            expect(mockedGenSalt).toHaveBeenCalledWith(10);
            expect(mockedHash).toHaveBeenCalledWith(newPassword, salt);
            expect(mockedUpdatePassword).toHaveBeenCalledTimes(1);
            expect(mockedUpdatePassword).toHaveBeenCalledWith(
                user.id,
                hashedPassword,
            );
        });

        it("[S-U-03-03] Failed to hash password", async () => {
            // Given
            const password = faker.internet.password();
            const newPassword = faker.internet.password();
            const confirmPassword = newPassword;

            const user = new User();
            user.id = userId;
            user.password = faker.internet.password();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedCompare = (
                bcrypt.compare as jest.Mock
            ).mockResolvedValueOnce(true);

            const mockedGenSalt = (
                bcrypt.genSalt as jest.Mock
            ).mockResolvedValueOnce(salt);

            const mockedHash = (bcrypt.hash as jest.Mock).mockRejectedValueOnce(
                new InternalServerErrorException(),
            );

            // When & Then
            await expect(
                userService.changeUserPassword(
                    userId,
                    password,
                    newPassword,
                    confirmPassword,
                ),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedCompare).toHaveBeenCalledWith(password, user.password);
            expect(mockedGenSalt).toHaveBeenCalledWith(10);
            expect(mockedHash).toHaveBeenCalledWith(newPassword, salt);
        });

        it("[S-U-03-04] Failed to generate salt", async () => {
            // Given
            const password = faker.internet.password();
            const newPassword = faker.internet.password();
            const confirmPassword = newPassword;

            const user = new User();
            user.id = userId;
            user.password = faker.internet.password();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedCompare = (
                bcrypt.compare as jest.Mock
            ).mockResolvedValueOnce(true);

            const mockedGenSalt = (
                bcrypt.genSalt as jest.Mock
            ).mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.changeUserPassword(
                    userId,
                    password,
                    newPassword,
                    confirmPassword,
                ),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedCompare).toHaveBeenCalledWith(password, user.password);
            expect(mockedGenSalt).toHaveBeenCalledWith(10);
        });

        it("[S-U-03-05] Failed to compare password", async () => {
            // Given
            const password = faker.internet.password();
            const newPassword = faker.internet.password();
            const confirmPassword = newPassword;

            const user = new User();
            user.id = userId;
            user.password = faker.internet.password();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedCompare = (
                bcrypt.compare as jest.Mock
            ).mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.changeUserPassword(
                    userId,
                    password,
                    newPassword,
                    confirmPassword,
                ),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedCompare).toHaveBeenCalledWith(password, user.password);
        });

        it("[S-U-03-06] Incorrect password", async () => {
            // Given
            const password = faker.internet.password();
            const newPassword = faker.internet.password();
            const confirmPassword = newPassword;

            const user = new User();
            user.id = userId;
            user.password = faker.internet.password();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedCompare = (
                bcrypt.compare as jest.Mock
            ).mockResolvedValueOnce(false);

            // When & Then
            await expect(
                userService.changeUserPassword(
                    userId,
                    password,
                    newPassword,
                    confirmPassword,
                ),
            ).rejects.toThrow(
                new UnauthorizedException("The current password is incorrect."),
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedCompare).toHaveBeenCalledWith(password, user.password);
        });

        it("[S-U-03-07] User not found", async () => {
            // Given
            const password = faker.internet.password();
            const newPassword = faker.internet.password();
            const confirmPassword = newPassword;

            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(null);

            // When & Then
            await expect(
                userService.changeUserPassword(
                    userId,
                    password,
                    newPassword,
                    confirmPassword,
                ),
            ).rejects.toThrow(
                new UnauthorizedException(
                    "The given user information is invalid.",
                ),
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-03-08] Failed to find user", async () => {
            // Given
            const password = faker.internet.password();
            const newPassword = faker.internet.password();
            const confirmPassword = newPassword;

            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.changeUserPassword(
                    userId,
                    password,
                    newPassword,
                    confirmPassword,
                ),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-03-09] Incorrect confirm password", async () => {
            // Given
            const password = faker.internet.password();
            const newPassword = faker.internet.password();
            const confirmPassword = faker.internet.password();

            // When & Then
            await expect(
                userService.changeUserPassword(
                    userId,
                    password,
                    newPassword,
                    confirmPassword,
                ),
            ).rejects.toThrow(
                new BadRequestException(
                    "The new password does not match the confirm password.",
                ),
            );
        });
    });

    describe("[S-U-04] UserService.changeUserNickname()", () => {
        // Given
        const userId = faker.number.int();
        const nickname = faker.internet.userName();

        it("[S-U-04-01] Success", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedSave = jest
                .spyOn(userRepository, "save")
                .mockResolvedValueOnce(user);

            // When
            const result = await userService.changeUserNickname(
                userId,
                nickname,
            );

            // Then
            expect(result).toEqual(user);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(user);
        });

        it("[S-U-04-02] Failed to save user", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedSave = jest
                .spyOn(userRepository, "save")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.changeUserNickname(userId, nickname),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(user);
        });

        it("[S-U-04-03] User not found", async () => {
            // Given
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(null);

            // When & Then
            await expect(
                userService.changeUserNickname(userId, nickname),
            ).rejects.toThrow(
                new UnauthorizedException("The user does not exist."),
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-04-04] Failed to find user", async () => {
            // Given
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.changeUserNickname(userId, nickname),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });
    });

    describe("[S-U-05] UserService.deleteUser()", () => {
        // Given
        const userId = faker.number.int();
        const password = faker.internet.password();

        it("[S-U-05-01] Success", async () => {
            // Given
            const confirmMessage = "회원 탈퇴를 희망합니다.";

            const user = new User();
            user.password = faker.internet.password();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedCompare = (
                bcrypt.compare as jest.Mock
            ).mockResolvedValueOnce(true);

            const mockedDeleteUserById = jest
                .spyOn(userRepository, "deleteUserById")
                .mockResolvedValueOnce();

            // When
            const result = await userService.deleteUser(
                userId,
                password,
                confirmMessage,
            );

            // Then
            expect(result).toBeUndefined();
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedCompare).toHaveBeenCalledWith(password, user.password);
            expect(mockedDeleteUserById).toHaveBeenCalledTimes(1);
            expect(mockedDeleteUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-05-02] Failed to delete user", async () => {
            // Given
            const confirmMessage = "회원 탈퇴를 희망합니다.";

            const user = new User();
            user.password = faker.internet.password();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedCompare = (
                bcrypt.compare as jest.Mock
            ).mockResolvedValueOnce(true);

            const mockedDeleteUserById = jest
                .spyOn(userRepository, "deleteUserById")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.deleteUser(userId, password, confirmMessage),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedCompare).toHaveBeenCalledWith(password, user.password);
            expect(mockedDeleteUserById).toHaveBeenCalledTimes(1);
            expect(mockedDeleteUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-05-03] Failed to compare password", async () => {
            // Given
            const confirmMessage = "회원 탈퇴를 희망합니다.";

            const user = new User();
            user.password = faker.internet.password();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedCompare = (
                bcrypt.compare as jest.Mock
            ).mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.deleteUser(userId, password, confirmMessage),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedCompare).toHaveBeenCalledWith(password, user.password);
        });

        it("[S-U-05-04] Incorrect password", async () => {
            // Given
            const confirmMessage = "회원 탈퇴를 희망합니다.";

            const user = new User();
            user.password = faker.internet.password();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedCompare = (
                bcrypt.compare as jest.Mock
            ).mockResolvedValueOnce(false);

            // When & Then
            await expect(
                userService.deleteUser(userId, password, confirmMessage),
            ).rejects.toThrow(
                new UnauthorizedException(
                    "The given user information is invalid.",
                ),
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedCompare).toHaveBeenCalledWith(password, user.password);
        });

        it("[S-U-05-05] User not found", async () => {
            // Given
            const confirmMessage = "회원 탈퇴를 희망합니다.";

            const user = new User();
            user.password = faker.internet.password();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(null);

            // When & Then
            await expect(
                userService.deleteUser(userId, password, confirmMessage),
            ).rejects.toThrow(
                new UnauthorizedException(
                    "The given user information is invalid.",
                ),
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-05-06] Failed to find user", async () => {
            // Given
            const confirmMessage = "회원 탈퇴를 희망합니다.";

            const user = new User();
            user.password = faker.internet.password();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.deleteUser(userId, password, confirmMessage),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-05-07] Incorrect confirm message", async () => {
            // Given
            const confirmMessage = "이상한 확인 메시지";

            // When & Then
            await expect(
                userService.deleteUser(userId, password, confirmMessage),
            ).rejects.toThrow(
                new BadRequestException(
                    "The given confirm message is invalid.",
                ),
            );
        });
    });

    describe("[S-U-06] UserService.getMyBooks()", () => {
        // Given
        const userId = faker.number.int();
        const page = faker.number.int();
        const limit = faker.number.int();
        const sort = "likeCount";
        const order = "ASC";
        const search = faker.lorem.word();

        it("[S-U-06-01] Success", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const books = [new Book(), new Book(), new Book()];
            const total = books.length;
            const mockedFindBooksWithQueryByUserId = jest
                .spyOn(bookRepository, "findBooksWithQueryByUserId")
                .mockResolvedValueOnce([books, total]);

            // When
            const result = await userService.getMyBooks(
                userId,
                page,
                limit,
                sort,
                order,
                search,
            );

            // Then
            expect(result).toEqual([books, total]);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindBooksWithQueryByUserId).toHaveBeenCalledTimes(1);
            expect(mockedFindBooksWithQueryByUserId).toHaveBeenCalledWith(
                userId,
                page,
                limit,
                sort,
                order,
                search,
            );
        });

        it("[S-U-06-02] Success with no query", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const books = [new Book(), new Book(), new Book()];
            const total = books.length;
            const mockedFindBooksWithQueryByUserId = jest
                .spyOn(bookRepository, "findBooksWithQueryByUserId")
                .mockResolvedValueOnce([books, total]);

            // When
            const result = await userService.getMyBooks(userId);

            // Then
            expect(result).toEqual([books, total]);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindBooksWithQueryByUserId).toHaveBeenCalledTimes(1);
            expect(mockedFindBooksWithQueryByUserId).toHaveBeenCalledWith(
                userId,
                1,
                10,
                "createdAt",
                "DESC",
                "",
            );
        });

        it("[S-U-06-03] No books", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const books = [];
            const total = books.length;
            const mockedFindBooksWithQueryByUserId = jest
                .spyOn(bookRepository, "findBooksWithQueryByUserId")
                .mockResolvedValueOnce([books, total]);

            // When
            const result = await userService.getMyBooks(userId);

            // Then
            expect(result).toEqual([books, total]);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindBooksWithQueryByUserId).toHaveBeenCalledTimes(1);
            expect(mockedFindBooksWithQueryByUserId).toHaveBeenCalledWith(
                userId,
                1,
                10,
                "createdAt",
                "DESC",
                "",
            );
        });

        it("[S-U-06-04] Failed to find books", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedFindBooksWithQueryByUserId = jest
                .spyOn(bookRepository, "findBooksWithQueryByUserId")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(userService.getMyBooks(userId)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindBooksWithQueryByUserId).toHaveBeenCalledTimes(1);
            expect(mockedFindBooksWithQueryByUserId).toHaveBeenCalledWith(
                userId,
                1,
                10,
                "createdAt",
                "DESC",
                "",
            );
        });

        it("[S-U-06-05] User not found", async () => {
            // Given
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(null);

            // When & Then
            await expect(userService.getMyBooks(userId)).rejects.toThrow(
                new UnauthorizedException("The user does not exist."),
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-06-06] Failed to find user", async () => {
            // Given
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(userService.getMyBooks(userId)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });
    });

    describe("[S-U-07] UserService.getLikedBooks()", () => {
        // Given
        const userId = faker.number.int();
        const page = faker.number.int();
        const limit = faker.number.int();
        const sort = "likeCount";
        const order = "ASC";
        const search = faker.lorem.word();

        it("[S-U-07-01] Success", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const books = [new Book(), new Book(), new Book()];
            const total = books.length;
            const mockedFindBooksLikedByUser = jest
                .spyOn(userRepository, "findBooksLikedByUser")
                .mockResolvedValueOnce([books, total]);

            // When
            const result = await userService.getLikedBooks(
                userId,
                page,
                limit,
                sort,
                order,
                search,
            );

            // Then
            expect(result).toEqual([books, total]);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindBooksLikedByUser).toHaveBeenCalledTimes(1);
            expect(mockedFindBooksLikedByUser).toHaveBeenCalledWith(
                userId,
                page,
                limit,
                sort,
                order,
                search,
            );
        });

        it("[S-U-07-02] Success with no query", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const books = [new Book(), new Book(), new Book()];
            const total = books.length;
            const mockedFindBooksLikedByUser = jest
                .spyOn(userRepository, "findBooksLikedByUser")
                .mockResolvedValueOnce([books, total]);

            // When
            const result = await userService.getLikedBooks(userId);

            // Then
            expect(result).toEqual([books, total]);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindBooksLikedByUser).toHaveBeenCalledTimes(1);
            expect(mockedFindBooksLikedByUser).toHaveBeenCalledWith(
                userId,
                1,
                10,
                "createdAt",
                "DESC",
                "",
            );
        });

        it("[S-U-07-03] No liked books", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const books = [];
            const total = books.length;
            const mockedFindBooksLikedByUser = jest
                .spyOn(userRepository, "findBooksLikedByUser")
                .mockResolvedValueOnce([books, total]);

            // When
            const result = await userService.getLikedBooks(userId);

            // Then
            expect(result).toEqual([books, total]);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindBooksLikedByUser).toHaveBeenCalledTimes(1);
            expect(mockedFindBooksLikedByUser).toHaveBeenCalledWith(
                userId,
                1,
                10,
                "createdAt",
                "DESC",
                "",
            );
        });

        it("[S-U-07-04] Failed to find books", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedFindBooksLikedByUser = jest
                .spyOn(userRepository, "findBooksLikedByUser")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(userService.getLikedBooks(userId)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindBooksLikedByUser).toHaveBeenCalledTimes(1);
            expect(mockedFindBooksLikedByUser).toHaveBeenCalledWith(
                userId,
                1,
                10,
                "createdAt",
                "DESC",
                "",
            );
        });

        it("[S-U-07-05] User not found", async () => {
            // Given
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(null);

            // When & Then
            await expect(userService.getLikedBooks(userId)).rejects.toThrow(
                new UnauthorizedException("The user does not exist."),
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-07-06] Failed to find user", async () => {
            // Given
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(userService.getLikedBooks(userId)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });
    });

    describe("[S-U-08] UserService.getUserContribution()", () => {
        // Given
        const userId = faker.number.int();
        const total_count = faker.number.int();
        const percentile = faker.number.float();

        it("[S-U-08-01] Success CREATED", async () => {
            // Given
            const mockedFindTotalCreate = jest
                .spyOn(userRepository, "findTotalCreate")
                .mockResolvedValueOnce([total_count, percentile]);

            // When
            const result = await userService.getUserContribution(
                userId,
                ContributionType.CREATED,
            );

            // Then
            expect(result).toEqual([total_count, percentile]);
            expect(mockedFindTotalCreate).toHaveBeenCalledTimes(1);
            expect(mockedFindTotalCreate).toHaveBeenCalledWith(userId);
        });

        it("[S-U-08-05] Failed to find total create", async () => {
            // Given
            const mockedFindTotalCreate = jest
                .spyOn(userRepository, "findTotalCreate")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.getUserContribution(
                    userId,
                    ContributionType.CREATED,
                ),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindTotalCreate).toHaveBeenCalledTimes(1);
            expect(mockedFindTotalCreate).toHaveBeenCalledWith(userId);
        });

        it("[S-U-08-02] Success QUESTION", async () => {
            // Given
            const mockedFindQuestionsTotalSaved = jest
                .spyOn(userRepository, "findQuestionsTotalSaved")
                .mockResolvedValueOnce([total_count, percentile]);

            // When
            const result = await userService.getUserContribution(
                userId,
                ContributionType.QUESTION,
            );

            // Then
            expect(result).toEqual([total_count, percentile]);
            expect(mockedFindQuestionsTotalSaved).toHaveBeenCalledTimes(1);
            expect(mockedFindQuestionsTotalSaved).toHaveBeenCalledWith(userId);
        });

        it("[S-U-08-06] Failed to find questions' total saved", async () => {
            // Given
            const mockedFindQuestionsTotalSaved = jest
                .spyOn(userRepository, "findQuestionsTotalSaved")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.getUserContribution(
                    userId,
                    ContributionType.QUESTION,
                ),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindQuestionsTotalSaved).toHaveBeenCalledTimes(1);
            expect(mockedFindQuestionsTotalSaved).toHaveBeenCalledWith(userId);
        });

        it("[S-U-08-03] Success ACTION", async () => {
            // Given
            const mockedActionsTotalLiked = jest
                .spyOn(userRepository, "findActionsTotalLiked")
                .mockResolvedValueOnce([total_count, percentile]);

            // When
            const result = await userService.getUserContribution(
                userId,
                ContributionType.ACTION,
            );

            // Then
            expect(result).toEqual([total_count, percentile]);
            expect(mockedActionsTotalLiked).toHaveBeenCalledTimes(1);
            expect(mockedActionsTotalLiked).toHaveBeenCalledWith(userId);
        });

        it("[S-U-08-07] Failed to find actions' total liked", async () => {
            // Given
            const mockedActionsTotalLiked = jest
                .spyOn(userRepository, "findActionsTotalLiked")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.getUserContribution(
                    userId,
                    ContributionType.ACTION,
                ),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedActionsTotalLiked).toHaveBeenCalledTimes(1);
            expect(mockedActionsTotalLiked).toHaveBeenCalledWith(userId);
        });

        it("[S-U-08-04] Success BOOK", async () => {
            // Given
            const mockedFindBooksTotalLiked = jest
                .spyOn(userRepository, "findBooksTotalLiked")
                .mockResolvedValueOnce([total_count, percentile]);

            // When
            const result = await userService.getUserContribution(
                userId,
                ContributionType.BOOK,
            );

            // Then
            expect(result).toEqual([total_count, percentile]);
            expect(mockedFindBooksTotalLiked).toHaveBeenCalledTimes(1);
            expect(mockedFindBooksTotalLiked).toHaveBeenCalledWith(userId);
        });

        it("[S-U-08-08] Failed to find books' total liked", async () => {
            // Given
            const mockedFindBooksTotalLiked = jest
                .spyOn(userRepository, "findBooksTotalLiked")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.getUserContribution(userId, ContributionType.BOOK),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindBooksTotalLiked).toHaveBeenCalledTimes(1);
            expect(mockedFindBooksTotalLiked).toHaveBeenCalledWith(userId);
        });
    });

    describe("[S-U-09] UserService.changeUserAffiliation()", () => {
        // Given
        const userId = faker.number.int();
        const affiliation = faker.company.name();

        it("[S-U-09-01] Success", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedSave = jest
                .spyOn(userRepository, "save")
                .mockResolvedValueOnce(user);

            // When
            const result = await userService.changeUserAffiliation(
                userId,
                affiliation,
            );

            // Then
            expect(result).toEqual(user);
            expect(result.affiliation).toBe(affiliation);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(user);
        });

        it("[S-U-09-02] Failed to save", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedSave = jest
                .spyOn(userRepository, "save")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.changeUserAffiliation(userId, affiliation),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(user);
        });

        it("[S-U-09-03] User not found", async () => {
            // Given
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(null);

            // When & Then
            await expect(
                userService.changeUserAffiliation(userId, affiliation),
            ).rejects.toThrow(
                new UnauthorizedException("The user does not exist."),
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-09-04] Failed to find user", async () => {
            // Given
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.changeUserAffiliation(userId, affiliation),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });
    });

    describe("[S-U-10] UserService.changeUserPosition()", () => {
        // Given
        const userId = faker.number.int();
        const position = faker.person.jobArea();

        it("[S-U-10-01] Success", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedSave = jest
                .spyOn(userRepository, "save")
                .mockResolvedValueOnce(user);

            // When
            const result = await userService.changeUserPosition(
                userId,
                position,
            );

            // Then
            expect(result).toEqual(user);
            expect(result.position).toBe(position);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(user);
        });

        it("[S-U-10-02] Failed to save", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const mockedSave = jest
                .spyOn(userRepository, "save")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.changeUserPosition(userId, position),
            ).rejects.toThrow(InternalServerErrorException);

            // Then
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(user);
        });

        it("[S-U-10-03] User not found", async () => {
            // Given
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(null);

            // When & Then
            await expect(
                userService.changeUserPosition(userId, position),
            ).rejects.toThrow(
                new UnauthorizedException("The user does not exist."),
            );

            // Then
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-U-10-04] Failed to find user", async () => {
            // Given
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                userService.changeUserPosition(userId, position),
            ).rejects.toThrow(InternalServerErrorException);

            // Then
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });
    });
});
