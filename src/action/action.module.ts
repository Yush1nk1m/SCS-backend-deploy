import { Module } from "@nestjs/common";
import { ActionController } from "./action.controller";
import { ActionService } from "./action.service";

@Module({
    imports: [],
    controllers: [ActionController],
    providers: [ActionService],
    exports: [],
})
export class ActionModule {}
