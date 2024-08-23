import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./user.service";
import { UserRepository } from "../repository/user.repository";
import { BookRepository } from "../repository/book.repository";
import { ConfigService } from "@nestjs/config";
import { User } from "./user.entity";
import { InternalServerErrorException } from "@nestjs/common";

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
                    },
                },
                {
                    provide: BookRepository,
                    useValue: {},
                },
                {
                    provide: ConfigService,
                    useValue: {},
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

    describe("[S-U-02] UserService.findUser()", () => {});

    describe("[S-U-03] UserService.changeUserPassword()", () => {});

    describe("[S-U-04] UserService.changeUserNickname()", () => {});

    describe("[S-U-05] UserService.deleteUser()", () => {});

    describe("[S-U-06] UserService.getMyBooks()", () => {});

    describe("[S-U-07] UserService.getLikedBooks()", () => {});

    describe("[S-U-08] UserService.getUserContribution()", () => {});

    describe("[S-U-09] UserService.changeUserAffiliation()", () => {});

    describe("[S-U-10] UserService.changeUserPosition()", () => {});
});
