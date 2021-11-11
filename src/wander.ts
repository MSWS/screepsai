import { Reason, TaskResult } from "Task";

export function wander(creep: Creep) {
    const exit = creep.pos.findClosestByPath(FIND_EXIT);
    if (!exit)
        return new TaskResult(false, Reason.NO_VALID_TARGET);
    creep.moveTo(exit, { visualizePathStyle: { stroke: "#333333" } });
    creep.say("Wander");
    return new TaskResult(false, Reason.NOT_IN_RANGE);
}