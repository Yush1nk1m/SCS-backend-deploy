import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { AuthRepository } from "../repository/auth.repository";
import { MailerService } from "@nestjs-modules/mailer";
import { DataSource } from "typeorm";
import { UserRepository } from "../repository/user.repository";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { faker } from "@faker-js/faker";
import {
    BadRequestException,
    ConflictException,
    InternalServerErrorException,
    UnauthorizedException,
} from "@nestjs/common";
import { createMockDto } from "../util/test/create-mock-dto";
import { User } from "../user/user.entity";
import { Verification } from "./verification.entity";
import * as bcrypt from "bcrypt";
import { Tokens } from "./types/tokens.type";

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
    hash: jest.fn().mockResolvedValue("hashed password"),
    compare: jest.fn().mockResolvedValue(true),
    genSalt: jest.fn().mockResolvedValue("salt"),
}));

describe("AuthService", () => {
    let authService: AuthService;
    let authRepository: AuthRepository;
    let userRepository: UserRepository;
    let mailerService: MailerService;
    let configService: ConfigService;
    let jwtService: JwtService;
    let dataSource: DataSource;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: AuthRepository,
                    useValue: {
                        createVerification: jest.fn(),
                        findVerification: jest.fn(),
                        updateVerification: jest.fn(),
                        deleteVerification: jest.fn(),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {
                        findUserByEmail: jest.fn(),
                        findUserById: jest.fn(),
                        createUser: jest.fn(),
                        updateRefreshToken: jest.fn(),
                    },
                },
                {
                    provide: MailerService,
                    useValue: {
                        sendMail: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {},
                },
                {
                    provide: DataSource,
                    useValue: {
                        createQueryRunner: jest.fn(),
                    },
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        authRepository = module.get<AuthRepository>(AuthRepository);
        userRepository = module.get<UserRepository>(UserRepository);
        mailerService = module.get<MailerService>(MailerService);
        configService = module.get<ConfigService>(ConfigService);
        jwtService = module.get<JwtService>(JwtService);
        dataSource = module.get<DataSource>(DataSource);
    });

    it("should be defined", () => {
        expect(authService).toBeDefined();
        expect(authRepository).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(mailerService).toBeDefined();
        expect(configService).toBeDefined();
        expect(jwtService).toBeDefined();
        expect(dataSource).toBeDefined();
    });

    describe("[S-A-01] AuthService.sendVerificationMail()", () => {
        // Given
        const email = faker.internet.email();

        it("[S-A-01-01] Success", async () => {
            // Given
            const mockedFindUserByEmail = jest
                .spyOn(userRepository, "findUserByEmail")
                .mockResolvedValueOnce(null);

            const mockedCreateVerification = jest
                .spyOn(authRepository, "createVerification")
                .mockResolvedValueOnce();

            const mockedSendMail = jest
                .spyOn(mailerService, "sendMail")
                .mockResolvedValueOnce(null);

            // When & Then
            await expect(
                authService.sendVerificationMail(email),
            ).resolves.toBeUndefined();

            // Additional checks
            expect(mockedFindUserByEmail).toHaveBeenCalledTimes(1);
            expect(mockedFindUserByEmail).toHaveBeenCalledWith(email);
            expect(mockedCreateVerification).toHaveBeenCalledTimes(1);
            expect(mockedCreateVerification).toHaveBeenCalledWith(
                email,
                expect.any(String),
            );
            expect(mockedSendMail).toHaveBeenCalledTimes(1);
            const sentOption = mockedSendMail.mock.calls[0][0];
            expect(sentOption.context.verificationCode).toHaveLength(6);
        });

        it("[S-A-01-02] Failed to send mail", async () => {
            // Given
            const mockedFindUserByEmail = jest
                .spyOn(userRepository, "findUserByEmail")
                .mockResolvedValueOnce(null);

            const mockedCreateVerification = jest
                .spyOn(authRepository, "createVerification")
                .mockResolvedValueOnce();

            const mockedSendMail = jest
                .spyOn(mailerService, "sendMail")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                authService.sendVerificationMail(email),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserByEmail).toHaveBeenCalledTimes(1);
            expect(mockedFindUserByEmail).toHaveBeenCalledWith(email);
            expect(mockedCreateVerification).toHaveBeenCalledTimes(1);
            expect(mockedCreateVerification).toHaveBeenCalledWith(
                email,
                expect.any(String),
            );
            expect(mockedSendMail).toHaveBeenCalledTimes(1);
            const sentOption = mockedSendMail.mock.calls[0][0];
            expect(sentOption.context.verificationCode).toHaveLength(6);
        });

        it("[S-A-01-03] Failed to create user", async () => {
            // Given
            const mockedFindUserByEmail = jest
                .spyOn(userRepository, "findUserByEmail")
                .mockResolvedValueOnce(null);

            const mockedCreateVerification = jest
                .spyOn(authRepository, "createVerification")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                authService.sendVerificationMail(email),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserByEmail).toHaveBeenCalledTimes(1);
            expect(mockedFindUserByEmail).toHaveBeenCalledWith(email);
            expect(mockedCreateVerification).toHaveBeenCalledTimes(1);
            expect(mockedCreateVerification).toHaveBeenCalledWith(
                email,
                expect.any(String),
            );
            const createdCode = mockedCreateVerification.mock.calls[0][1];
            expect(createdCode).toHaveLength(6);
        });

        it("[S-A-01-04] Same mail exists", async () => {
            // Given
            const user = createMockDto(User);
            const mockedFindUserByEmail = jest
                .spyOn(userRepository, "findUserByEmail")
                .mockResolvedValueOnce(user);

            // When & Then
            await expect(
                authService.sendVerificationMail(email),
            ).rejects.toThrow(
                new ConflictException(
                    "An user with the same email already exists.",
                ),
            );

            // Additional checks
            expect(mockedFindUserByEmail).toHaveBeenCalledTimes(1);
            expect(mockedFindUserByEmail).toHaveBeenCalledWith(email);
        });
    });

    describe("[S-A-02] AuthService.verifySignupCode()", () => {
        // Given
        const email = faker.internet.email();
        const verificationCode = faker.string.alphanumeric({ length: 6 });
        const verification = new Verification();
        verification.email = email;
        verification.verificationCode = verificationCode;

        it("[S-A-02-01] Success", async () => {
            // Given
            const mockedFindVerification = jest
                .spyOn(authRepository, "findVerification")
                .mockResolvedValueOnce(verification);

            const mockedUpdateVerification = jest
                .spyOn(authRepository, "updateVerification")
                .mockResolvedValueOnce();

            // When & Then
            await expect(
                authService.verifySignupCode(email, verificationCode),
            ).resolves.toBeUndefined();

            // Additional checks
            expect(mockedFindVerification).toHaveBeenCalledTimes(1);
            expect(mockedFindVerification).toHaveBeenCalledWith(
                email,
                verificationCode,
            );
            expect(mockedUpdateVerification).toHaveBeenCalledTimes(1);
            expect(mockedUpdateVerification).toHaveBeenCalledWith(
                email,
                verificationCode,
                true,
            );
        });

        it("[S-A-02-02] Failed to update verification", async () => {
            // Given
            const mockedFindVerification = jest
                .spyOn(authRepository, "findVerification")
                .mockResolvedValueOnce(verification);

            const mockedUpdateVerification = jest
                .spyOn(authRepository, "updateVerification")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                authService.verifySignupCode(email, verificationCode),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindVerification).toHaveBeenCalledTimes(1);
            expect(mockedFindVerification).toHaveBeenCalledWith(
                email,
                verificationCode,
            );
            expect(mockedUpdateVerification).toHaveBeenCalledTimes(1);
            expect(mockedUpdateVerification).toHaveBeenCalledWith(
                email,
                verificationCode,
                true,
            );
        });

        it("[S-A-02-03] No verification data", async () => {
            // Given
            const mockedFindVerification = jest
                .spyOn(authRepository, "findVerification")
                .mockResolvedValueOnce(null);

            // When & Then
            await expect(
                authService.verifySignupCode(email, verificationCode),
            ).rejects.toThrow(
                new BadRequestException("Verification code is not valid."),
            );

            // Additional checks
            expect(mockedFindVerification).toHaveBeenCalledTimes(1);
            expect(mockedFindVerification).toHaveBeenCalledWith(
                email,
                verificationCode,
            );
        });

        it("[S-A-02-04] Failed to find verification", async () => {
            // Given
            const mockedFindVerification = jest
                .spyOn(authRepository, "findVerification")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                authService.verifySignupCode(email, verificationCode),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindVerification).toHaveBeenCalledTimes(1);
            expect(mockedFindVerification).toHaveBeenCalledWith(
                email,
                verificationCode,
            );
        });
    });

    describe("[S-A-03] AuthService.signup()", () => {
        // Given
        const email = faker.internet.email();
        const password = faker.internet.password();
        const nickname = faker.internet.userName();
        const affiliation = faker.company.name();
        const position = faker.person.jobTitle();
        const verificationCode = faker.string.alphanumeric({ length: 6 });

        it("[S-A-03-01] Success", async () => {
            // Given
            const verification = new Verification();
            verification.email = email;
            verification.verificationCode = verificationCode;
            verification.verified = true;
            const mockedFindVerification = jest
                .spyOn(authRepository, "findVerification")
                .mockResolvedValueOnce(verification);

            const mockedDeleteVerification = jest
                .spyOn(authRepository, "deleteVerification")
                .mockResolvedValueOnce();

            const user = new User();
            user.email = email;
            user.password = "hashed password";
            user.nickname = nickname;
            user.affiliation = affiliation;
            user.position = position;
            const mockedCreateUser = jest
                .spyOn(userRepository, "createUser")
                .mockResolvedValueOnce(user);

            // When
            const result = await authService.signup(
                email,
                password,
                nickname,
                affiliation,
                position,
                verificationCode,
            );

            // Then
            expect(result).toEqual(user);
            expect(mockedFindVerification).toHaveBeenCalledTimes(1);
            expect(mockedFindVerification).toHaveBeenCalledWith(
                email,
                verificationCode,
            );
            expect(mockedDeleteVerification).toHaveBeenCalledTimes(1);
            expect(mockedDeleteVerification).toHaveBeenCalledWith(email);
            expect(mockedCreateUser).toHaveBeenCalledTimes(1);
            expect(mockedCreateUser).toHaveBeenCalledWith(
                email,
                "hashed password",
                nickname,
                affiliation,
                position,
            );
        });

        it("[S-A-03-02] Failed to create user", async () => {
            // Given
            const verification = new Verification();
            verification.email = email;
            verification.verificationCode = verificationCode;
            verification.verified = true;
            const mockedFindVerification = jest
                .spyOn(authRepository, "findVerification")
                .mockResolvedValueOnce(verification);

            const mockedDeleteVerification = jest
                .spyOn(authRepository, "deleteVerification")
                .mockResolvedValueOnce();

            const mockedCreateUser = jest
                .spyOn(userRepository, "createUser")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When
            await expect(
                authService.signup(
                    email,
                    password,
                    nickname,
                    affiliation,
                    position,
                    verificationCode,
                ),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindVerification).toHaveBeenCalledTimes(1);
            expect(mockedFindVerification).toHaveBeenCalledWith(
                email,
                verificationCode,
            );
            expect(mockedDeleteVerification).toHaveBeenCalledTimes(1);
            expect(mockedDeleteVerification).toHaveBeenCalledWith(email);
            expect(mockedCreateUser).toHaveBeenCalledTimes(1);
            expect(mockedCreateUser).toHaveBeenCalledWith(
                email,
                "hashed password",
                nickname,
                affiliation,
                position,
            );
        });

        it("[S-A-03-03] Failed to delete verification", async () => {
            // Given
            const verification = new Verification();
            verification.email = email;
            verification.verificationCode = verificationCode;
            verification.verified = true;
            const mockedFindVerification = jest
                .spyOn(authRepository, "findVerification")
                .mockResolvedValueOnce(verification);

            const mockedDeleteVerification = jest
                .spyOn(authRepository, "deleteVerification")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When
            await expect(
                authService.signup(
                    email,
                    password,
                    nickname,
                    affiliation,
                    position,
                    verificationCode,
                ),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindVerification).toHaveBeenCalledTimes(1);
            expect(mockedFindVerification).toHaveBeenCalledWith(
                email,
                verificationCode,
            );
            expect(mockedDeleteVerification).toHaveBeenCalledTimes(1);
            expect(mockedDeleteVerification).toHaveBeenCalledWith(email);
        });

        it("[S-A-03-04] Not verified", async () => {
            // Given
            const verification = new Verification();
            verification.email = email;
            verification.verificationCode = verificationCode;
            verification.verified = false;
            const mockedFindVerification = jest
                .spyOn(authRepository, "findVerification")
                .mockResolvedValueOnce(verification);

            // When
            await expect(
                authService.signup(
                    email,
                    password,
                    nickname,
                    affiliation,
                    position,
                    verificationCode,
                ),
            ).rejects.toThrow(
                new UnauthorizedException(
                    "User's email has not been verified.",
                ),
            );

            // Additional checks
            expect(mockedFindVerification).toHaveBeenCalledTimes(1);
            expect(mockedFindVerification).toHaveBeenCalledWith(
                email,
                verificationCode,
            );
        });

        it("[S-A-03-05] Failed to find verification", async () => {
            // Given
            const mockedFindVerification = jest
                .spyOn(authRepository, "findVerification")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When
            await expect(
                authService.signup(
                    email,
                    password,
                    nickname,
                    affiliation,
                    position,
                    verificationCode,
                ),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindVerification).toHaveBeenCalledTimes(1);
            expect(mockedFindVerification).toHaveBeenCalledWith(
                email,
                verificationCode,
            );
        });
    });

    describe("[S-A-04] AuthService.login()", () => {
        // Given
        const email = faker.internet.email();
        const password = faker.internet.password();

        it("[S-A-04-01] Success", async () => {
            // Given
            const user = new User();
            user.id = faker.number.int();
            user.email = email;
            user.password = password;
            user.nickname = faker.internet.userName();
            user.role = "user";
            const mockedFindUserByEmail = jest
                .spyOn(userRepository, "findUserByEmail")
                .mockResolvedValueOnce(user);

            const tokens: Tokens = {
                accessToken: "access token",
                refreshToken: "refresh token",
            };
            const mockedGetTokens = jest
                .spyOn(authService, "getTokens")
                .mockResolvedValueOnce(tokens);

            const mockedUpdateRefreshToken = jest
                .spyOn(authService, "updateRefreshToken")
                .mockResolvedValueOnce();

            // When
            const result = await authService.login(email, password);

            // Then
            expect(result).toEqual(tokens);
            expect(mockedFindUserByEmail).toHaveBeenCalledTimes(1);
            expect(mockedFindUserByEmail).toHaveBeenCalledWith(email);
            expect(mockedGetTokens).toHaveBeenCalledTimes(1);
            expect(mockedGetTokens).toHaveBeenCalledWith(
                user.id,
                user.email,
                user.nickname,
                user.role,
            );
            expect(mockedUpdateRefreshToken).toHaveBeenCalledTimes(1);
            expect(mockedUpdateRefreshToken).toHaveBeenCalledWith(
                user.id,
                tokens.refreshToken,
            );
        });

        it("[S-A-04-02] Failed to update refresh token", async () => {
            // Given
            const user = new User();
            user.id = faker.number.int();
            user.email = email;
            user.password = password;
            user.nickname = faker.internet.userName();
            user.role = "user";
            const mockedFindUserByEmail = jest
                .spyOn(userRepository, "findUserByEmail")
                .mockResolvedValueOnce(user);

            const tokens: Tokens = {
                accessToken: "access token",
                refreshToken: "refresh token",
            };
            const mockedGetTokens = jest
                .spyOn(authService, "getTokens")
                .mockResolvedValueOnce(tokens);

            const mockedUpdateRefreshToken = jest
                .spyOn(authService, "updateRefreshToken")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(authService.login(email, password)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedFindUserByEmail).toHaveBeenCalledTimes(1);
            expect(mockedFindUserByEmail).toHaveBeenCalledWith(email);
            expect(mockedGetTokens).toHaveBeenCalledTimes(1);
            expect(mockedGetTokens).toHaveBeenCalledWith(
                user.id,
                user.email,
                user.nickname,
                user.role,
            );
            expect(mockedUpdateRefreshToken).toHaveBeenCalledTimes(1);
            expect(mockedUpdateRefreshToken).toHaveBeenCalledWith(
                user.id,
                tokens.refreshToken,
            );
        });

        it("[S-A-04-03] Failed to get tokens", async () => {
            // Given
            const user = new User();
            user.id = faker.number.int();
            user.email = email;
            user.password = password;
            user.nickname = faker.internet.userName();
            user.role = "user";
            const mockedFindUserByEmail = jest
                .spyOn(userRepository, "findUserByEmail")
                .mockResolvedValueOnce(user);

            const mockedGetTokens = jest
                .spyOn(authService, "getTokens")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(authService.login(email, password)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedFindUserByEmail).toHaveBeenCalledTimes(1);
            expect(mockedFindUserByEmail).toHaveBeenCalledWith(email);
            expect(mockedGetTokens).toHaveBeenCalledTimes(1);
            expect(mockedGetTokens).toHaveBeenCalledWith(
                user.id,
                user.email,
                user.nickname,
                user.role,
            );
        });

        it("[S-A-04-04] Failed to compare password", async () => {
            // Given
            const user = new User();
            user.id = faker.number.int();
            user.email = email;
            user.password = password;
            user.nickname = faker.internet.userName();
            user.role = "user";
            const mockedFindUserByEmail = jest
                .spyOn(userRepository, "findUserByEmail")
                .mockResolvedValueOnce(user);

            (bcrypt.compare as jest.Mock).mockRejectedValueOnce(
                new InternalServerErrorException(),
            );

            // When & Then
            await expect(authService.login(email, password)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedFindUserByEmail).toHaveBeenCalledTimes(1);
            expect(mockedFindUserByEmail).toHaveBeenCalledWith(email);
        });

        it("[S-A-04-05] Not valid information", async () => {
            // Given
            const user = new User();
            user.id = faker.number.int();
            user.email = email;
            user.password = password;
            user.nickname = faker.internet.userName();
            user.role = "user";
            const mockedFindUserByEmail = jest
                .spyOn(userRepository, "findUserByEmail")
                .mockResolvedValueOnce(user);

            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

            // When & Then
            await expect(authService.login(email, password)).rejects.toThrow(
                new UnauthorizedException(
                    "The given user information is not valid.",
                ),
            );

            // Additional checks
            expect(mockedFindUserByEmail).toHaveBeenCalledTimes(1);
            expect(mockedFindUserByEmail).toHaveBeenCalledWith(email);
        });

        it("[S-A-04-06] Failed to find user", async () => {
            // Given
            const user = new User();
            user.id = faker.number.int();
            user.email = email;
            user.password = password;
            user.nickname = faker.internet.userName();
            user.role = "user";
            const mockedFindUserByEmail = jest
                .spyOn(userRepository, "findUserByEmail")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(authService.login(email, password)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedFindUserByEmail).toHaveBeenCalledTimes(1);
            expect(mockedFindUserByEmail).toHaveBeenCalledWith(email);
        });
    });

    describe("[S-A-05] AuthService.refreshJwtTokens()", () => {
        // Given
        const userId = faker.number.int();
        const refreshToken = faker.string.alphanumeric();

        it("[S-A-05-01] Success", async () => {
            // Given
            const user = new User();
            user.id = faker.number.int();
            user.email = faker.internet.email();
            user.nickname = faker.internet.userName();
            user.role = "user";
            user.refreshToken = refreshToken;
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValue(user);

            const tokens: Tokens = {
                accessToken: "new access token",
                refreshToken: "new refresh token",
            };
            const mockedGetTokens = jest
                .spyOn(authService, "getTokens")
                .mockResolvedValueOnce(tokens);

            const mockedUpdateRefreshToken = jest
                .spyOn(authService, "updateRefreshToken")
                .mockResolvedValueOnce();

            // When
            const result = await authService.refreshJwtTokens(
                userId,
                refreshToken,
            );

            // Then
            expect(result).toEqual(tokens);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedGetTokens).toHaveBeenCalledTimes(1);
            expect(mockedGetTokens).toHaveBeenCalledWith(
                user.id,
                user.email,
                user.nickname,
                user.role,
            );
            expect(mockedUpdateRefreshToken).toHaveBeenCalledTimes(1);
            expect(mockedUpdateRefreshToken).toHaveBeenCalledWith(
                user.id,
                tokens.refreshToken,
            );
        });

        it("[S-A-05-02] Failed to update refresh token", async () => {
            // Given
            const user = new User();
            user.id = faker.number.int();
            user.email = faker.internet.email();
            user.nickname = faker.internet.userName();
            user.role = "user";
            user.refreshToken = refreshToken;
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValue(user);

            const tokens: Tokens = {
                accessToken: "new access token",
                refreshToken: "new refresh token",
            };
            const mockedGetTokens = jest
                .spyOn(authService, "getTokens")
                .mockResolvedValueOnce(tokens);

            const mockedUpdateRefreshToken = jest
                .spyOn(authService, "updateRefreshToken")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                authService.refreshJwtTokens(userId, refreshToken),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedGetTokens).toHaveBeenCalledTimes(1);
            expect(mockedGetTokens).toHaveBeenCalledWith(
                user.id,
                user.email,
                user.nickname,
                user.role,
            );
            expect(mockedUpdateRefreshToken).toHaveBeenCalledTimes(1);
            expect(mockedUpdateRefreshToken).toHaveBeenCalledWith(
                user.id,
                tokens.refreshToken,
            );
        });

        it("[S-A-05-03] Failed to get tokens", async () => {
            // Given
            const user = new User();
            user.id = faker.number.int();
            user.email = faker.internet.email();
            user.nickname = faker.internet.userName();
            user.role = "user";
            user.refreshToken = refreshToken;
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValue(user);

            const mockedGetTokens = jest
                .spyOn(authService, "getTokens")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                authService.refreshJwtTokens(userId, refreshToken),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedGetTokens).toHaveBeenCalledTimes(1);
            expect(mockedGetTokens).toHaveBeenCalledWith(
                user.id,
                user.email,
                user.nickname,
                user.role,
            );
        });

        it("[S-A-05-04] Failed to compare refresh token", async () => {
            // Given
            const user = new User();
            user.id = faker.number.int();
            user.email = faker.internet.email();
            user.nickname = faker.internet.userName();
            user.role = "user";
            user.refreshToken = refreshToken;
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValue(user);

            (bcrypt.compare as jest.Mock).mockRejectedValueOnce(
                new InternalServerErrorException(),
            );

            // When & Then
            await expect(
                authService.refreshJwtTokens(userId, refreshToken),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-A-05-05] Not valid information", async () => {
            // Given
            const user = new User();
            user.id = faker.number.int();
            user.email = faker.internet.email();
            user.nickname = faker.internet.userName();
            user.role = "user";
            user.refreshToken = refreshToken;
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValue(user);

            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

            // When & Then
            await expect(
                authService.refreshJwtTokens(userId, refreshToken),
            ).rejects.toThrow(
                new UnauthorizedException("The token is not valid."),
            );

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });

        it("[S-A-05-06] Failed to find user", async () => {
            // Given
            const user = new User();
            user.id = faker.number.int();
            user.email = faker.internet.email();
            user.nickname = faker.internet.userName();
            user.role = "user";
            user.refreshToken = refreshToken;
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                authService.refreshJwtTokens(userId, refreshToken),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
        });
    });

    describe("[S-A-06] AuthService.logout()", () => {
        // Given
        const userId = faker.number.int();

        it("[S-A-06-01] Success", async () => {
            // Given
            const mockedUpdateRefreshToken = jest
                .spyOn(userRepository, "updateRefreshToken")
                .mockResolvedValueOnce();

            // When
            const result = await authService.logout(userId);

            // Then
            expect(result).toBeUndefined();
            expect(mockedUpdateRefreshToken).toHaveBeenCalledTimes(1);
            expect(mockedUpdateRefreshToken).toHaveBeenCalledWith(userId, null);
        });

        it("[S-A-06-02] Failed to update refresh token", async () => {
            // Given
            const mockedUpdateRefreshToken = jest
                .spyOn(userRepository, "updateRefreshToken")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & then
            await expect(authService.logout(userId)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedUpdateRefreshToken).toHaveBeenCalledTimes(1);
            expect(mockedUpdateRefreshToken).toHaveBeenCalledWith(userId, null);
        });
    });
});
