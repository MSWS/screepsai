import { Reason, TaskResult } from "Task";

export function takeoverRoom(creep: Creep, controller: StructureController): TaskResult {
    if (creep.store.getUsedCapacity() === 0)
        return new TaskResult(controller.my, Reason.NO_ENERGY);
    if (controller.my) {
        const result = creep.upgradeController(controller);
        console.log("result: " + result);

        switch (result) {
            case OK:
                return new TaskResult(creep.store.getUsedCapacity() === 0, creep.store.getUsedCapacity() === 0 ? Reason.COMPLETED : Reason.IN_PROGRESS);
            case ERR_NOT_OWNER:
                return new TaskResult(false, Reason.INVALID_TARGET);
            case ERR_NOT_ENOUGH_ENERGY:
                return new TaskResult(false, Reason.NO_ENERGY);
            case ERR_NO_BODYPART:
                return new TaskResult(false, Reason.INVALID_TARGET);
            case ERR_NOT_IN_RANGE:
                creep.moveTo(controller, { visualizePathStyle: { stroke: "#00ffff" } });
                return new TaskResult(false, Reason.NOT_IN_RANGE);
        }
    } else if (creep.getActiveBodyparts(CLAIM) === 0) {
        return new TaskResult(false, Reason.INVALID_TARGET);
    }
    if (controller.level === 0) {
        const result = creep.claimController(controller);
        switch (result) {
            case OK:
                return new TaskResult(true, Reason.COMPLETED);
            case ERR_NOT_OWNER:
            case ERR_INVALID_TARGET:
                creep.attackController(controller);
                return new TaskResult(true, Reason.COMPLETED);
            case ERR_NOT_IN_RANGE:
                creep.moveTo(controller, { visualizePathStyle: { stroke: "#ff3300" } });
                return new TaskResult(false, Reason.NOT_IN_RANGE);
            case ERR_GCL_NOT_ENOUGH:
                creep.reserveController(controller);
                return new TaskResult(true, Reason.COMPLETED);
        }
    } else {
        if (creep.attackController(controller) === ERR_NOT_IN_RANGE)
            creep.moveTo(controller);
    }
    return new TaskResult(false, Reason.NONE);
}