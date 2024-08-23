import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { AuthRepository } from "../repository/auth.repository";
import { MailerService } from "@nestjs-modules/mailer";
import { EmailDto } from "./dto/email.dto";
import { User } from "../user/user.entity";
import {
    ConflictException,
    InternalServerErrorException,
    UnauthorizedException,
} from "@nestjs/common";
import { VerificationDto } from "./dto/verification.dto";
import { Verification } from "./verification.entity";
import { DataSource } from "typeorm";
import { UserRepository } from "../repository/user.repository";
import { SignupDto } from "./dto/signup.dto";
import { createMockDto } from "../util/create-mock-dto";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

// mock @Transactional() decorator
jest.mock("typeorm-transactional", () => ({
    Transactional: jest.fn().mockImplementation(() => {
        return function (
            target,
            propertyKey: string,
            descriptor: PropertyDescriptor,
        ) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                return originalMethod.apply(this, args);
            };
            return descriptor;
        };
    }),
    IsolationLevel: {
        REPEATABLE_READ: "REPEATABLE_READ",
    },
}));

describe("AuthService", () => {
    let authService: AuthService;
    let authRepository: AuthRepository;
    let userRepository: UserRepository;
    let mailerService: MailerService;
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
                        createUser: jest.fn(),
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
                    useValue: {},
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
        dataSource = module.get<DataSource>(DataSource);
    });

    it("should be defined", () => {
        expect(authService).toBeDefined();
        expect(authRepository).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(mailerService).toBeDefined();
        expect(dataSource).toBeDefined();
    });

    describe("[S-A-01] AuthService.sendVerificationMail()", () => {
        // Given
        const emailDto = createMockDto(EmailDto);
        const user = createMockDto(User);
    });

    describe("[S-A-02] AuthService.verifySignupCode()", () => {});

    describe("[S-A-03] AuthService.signup()", () => {});
});
