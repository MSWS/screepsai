import { Reason, TaskResult } from "Task";

export function sacrifice(creep: Creep) {
    const memory = creep.memory as any;
    if (!memory.sacrifice)
        return new TaskResult(false, Reason.INVALID_TARGET);
    const spawn = Game.getObjectById(memory.sacrifice) as StructureSpawn;
    const result = spawn.recycleCreep(creep)
    switch (result) {
        case OK:
            return new TaskResult(true, Reason.COMPLETED);
        case ERR_NOT_IN_RANGE:
            creep.moveTo(spawn, { visualizePathStyle: { stroke: "#dd3333" } });
            return new TaskResult(false, Reason.NOT_IN_RANGE);
        case ERR_RCL_NOT_ENOUGH:
            return new TaskResult(false, Reason.INVALID_TARGET);
        default:
            return new TaskResult(false, Reason.NONE);
    }
}