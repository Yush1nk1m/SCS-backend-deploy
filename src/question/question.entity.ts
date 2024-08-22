import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "../user/user.entity";
import { Section } from "../section/section.entity";
import { Action } from "../action/action.entity";
import { Book } from "../book/book.entity";

@Entity()
@Index(["section", "saved"])
@Index(["section", "createdAt"])
export class Question {
    @PrimaryGeneratedColumn()
    @Index("IDX_QUESTION_ID")
    id: number;

    @Column()
    @Index("IDX_QUESTION_CONTENT")
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ default: 0 })
    saved: number;

    @ManyToOne(() => User, (user) => user.questions, {
        onDelete: "CASCADE",
    })
    writer: User;

    @ManyToOne(() => Section, (section) => section.questions, {
        onDelete: "CASCADE",
    })
    @Index("IDX_QUESTION_SECTION")
    section: Section;

    @OneToMany(() => Action, (action) => action.question, { cascade: true })
    actions: Action[];

    @ManyToMany(() => Book, (book) => book.questions, {
        onDelete: "CASCADE",
    })
    books: Book[];
}
