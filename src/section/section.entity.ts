import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "../user/user.entity";
import { Question } from "../question/question.entity";

@Entity()
export class Section {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index("IDX_SECTION_SUBJECT")
    subject: string;

    @Column({ nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.sections, { onDelete: "CASCADE" })
    creator: User;

    @OneToMany(() => Question, (question) => question.section, {
        cascade: true,
    })
    questions: Question[];
}
