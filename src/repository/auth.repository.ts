import { Injectable, Logger } from "@nestjs/common";
import { Verification } from "../auth/verification.entity";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class AuthRepository extends Repository<Verification> {
    private logger = new Logger("AuthRepository");

    constructor(private readonly dataSource: DataSource) {
        super(Verification, dataSource.createEntityManager());
    }

    async createVerification(
        email: string,
        verificationCode: string,
    ): Promise<void> {
        // create or update a verification row on database
        await this.upsert([{ email, verificationCode }], ["email"]);
    }

    async updateVerification(
        email: string,
        verificationCode: string,
        verified: boolean,
    ): Promise<void> {
        await this.update({ email, verificationCode }, { verified });
    }

    async findVerification(
        email: string,
        verificationCode: string,
    ): Promise<Verification> {
        return this.findOne({
            where: { email, verificationCode },
        });
    }

    async deleteVerification(email: string): Promise<void> {
        await this.delete({ email });
    }
}
