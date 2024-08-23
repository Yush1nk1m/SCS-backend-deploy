import { MailerService } from "@nestjs-modules/mailer";
import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";
import { AuthRepository } from "../repository/auth.repository";
import { User } from "../user/user.entity";
import { UserRepository } from "../repository/user.repository";
import { IsolationLevel, Transactional } from "typeorm-transactional";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { Tokens } from "./types/tokens.type";
import { JwtPayload } from "./types/jwt-payload.type";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
    private logger = new Logger("AuthService");

    constructor(
        private readonly authRepository: AuthRepository,
        private readonly userRepository: UserRepository,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) {}

    // [A-01] Service logic
    async sendVerificationMail(email: string): Promise<void> {
        // generate a random verification code
        const verificationCode = Math.random().toString(36).substring(2, 8);

        // check if it is already registered
        const user = await this.userRepository.findUserByEmail(email);
        if (user) {
            throw new ConflictException(
                "An user with the same email already exists.",
            );
        }

        // create(or update) a verification data on database
        await this.authRepository.createVerification(email, verificationCode);
        this.logger.verbose(
            `Verification(email: ${email}, code: ${verificationCode}) has been created.`,
        );

        try {
            // send a verification mail
            await this.mailerService.sendMail({
                to: email,
                subject: "Study Computer Science - Email Verification",
                template: "./verification",
                context: {
                    verificationCode,
                },
            });
            this.logger.verbose(
                `A verification mail has been sent to ${email}.`,
            );
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException(
                "An error has been occurred while sending a mail.",
            );
        }
    }

    // [A-02] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async verifySignupCode(
        email: string,
        verificationCode: string,
    ): Promise<void> {
        // find verification data from DB
        const verification = await this.authRepository.findVerification(
            email,
            verificationCode,
        );

        // if such a verification data exists
        if (verification) {
            // check it is verified
            await this.authRepository.updateVerification(
                email,
                verificationCode,
                true,
            );
        }
        // if there's no verification data
        else {
            // throw exception
            throw new BadRequestException("Verification code is not valid.");
        }
    }

    // [A-03] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async signup(
        email: string,
        password: string,
        nickname: string,
        affiliation: string,
        position: string,
        verificationCode: string,
    ): Promise<User> {
        // hash password
        const salt = await bcrypt.genSalt(
            parseInt(this.configService.get("SALT_LENGTH")) || 10,
        );
        const hashedPassword = await bcrypt.hash(password, salt);

        // find verification information
        const verification = await this.authRepository.findVerification(
            email,
            verificationCode,
        );

        // check if it is verified
        if (verification && verification.verified) {
            // delete the information from DB
            await this.authRepository.deleteVerification(email);

            // create a new user's information
            const user = await this.userRepository.createUser(
                email,
                hashedPassword,
                nickname,
                affiliation,
                position,
            );

            return user;
        } else {
            throw new UnauthorizedException(
                "User's email has not been verified",
            );
        }
    }

    // [A-04] Service logic
    async login(email: string, password: string): Promise<Tokens> {
        // find an user with the same email address
        const user = await this.userRepository.findUserByEmail(email);

        // if the user exists and password is correct
        if (user && (await bcrypt.compare(password, user.password))) {
            // generate JWT tokens
            const tokens = await this.getTokens(
                user.id,
                user.email,
                user.nickname,
                user.role,
            );

            // update refresh token's information on DB
            await this.updateRefreshToken(user.id, tokens.refreshToken);

            // return JWT tokens
            return tokens;
        } else {
            throw new UnauthorizedException(
                "The given user information is not valid.",
            );
        }
    }

    // [A-05] Service logic
    async refreshJwtTokens(
        userId: number,
        refreshToken: string,
    ): Promise<Tokens> {
        // find user from DB
        const user = await this.userRepository.findUserById(userId);

        if (
            user &&
            user.refreshToken && // if the user exists and a refresh token also exists
            (await bcrypt.compare(refreshToken, user.refreshToken)) // check if the hashed refresh token is the same
        ) {
            // get new tokens
            const tokens = await this.getTokens(
                user.id,
                user.email,
                user.nickname,
                user.role,
            );

            // update new refresh token
            await this.updateRefreshToken(user.id, tokens.refreshToken);

            // return new tokens
            return tokens;
        } else {
            throw new UnauthorizedException("The token is not valid.");
        }
    }

    // [A-04], [A-05] Common service logic
    async updateRefreshToken(
        userId: number,
        refreshToken: string,
    ): Promise<void> {
        // hash refresh token
        const salt = await bcrypt.genSalt(
            parseInt(this.configService.get("SALT_LENGTH")) || 10,
        );
        const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

        // save the hashed refresh token on DB
        await this.userRepository.updateRefreshToken(
            userId,
            hashedRefreshToken,
        );
    }

    // [A-04], [A-05] Common service logic
    async getTokens(
        userId: number,
        email: string,
        nickname: string,
        role: string,
    ): Promise<Tokens> {
        // generate JWT payload content
        const jwtPayload: JwtPayload = {
            sub: userId,
            email,
            nickname,
            role,
        };

        // sign JWT tokens with Passport.js
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(jwtPayload, {
                secret: this.configService.get("JWT_ACCESS_SECRET"),
                expiresIn: this.configService.get("JWT_ACCESS_EXPIRESIN"),
            }),
            this.jwtService.signAsync(jwtPayload, {
                secret: this.configService.get("JWT_REFRESH_SECRET"),
                expiresIn: this.configService.get("JWT_REFRESH_EXPIRESIN"),
            }),
        ]);

        // return generated JWT tokens
        return {
            accessToken,
            refreshToken,
        };
    }

    // [A-06] Service logic
    async logout(userId: number): Promise<void> {
        await this.userRepository.updateRefreshToken(userId, null);
    }
}
