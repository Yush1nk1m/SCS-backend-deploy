import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from "typeorm";

@Entity()
export class Verification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    verificationCode: string;

    @Column({ default: false })
    verified: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
