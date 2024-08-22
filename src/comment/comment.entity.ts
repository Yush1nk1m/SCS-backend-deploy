import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "../user/user.entity";
import { Action } from "../action/action.entity";

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.comments, { onDelete: "CASCADE" })
    writer: User;

    @ManyToOne(() => Action, (action) => action.comments, {
        onDelete: "CASCADE",
    })
    @Index("IDX_COMMENT_ACTION")
    action: Action;
}
