import { getEnergy } from "getEnergy";
import { harvest } from "harvest";
import { maintain } from "maintenance";
import { Reason } from "Task";
import { wander } from "wander";

export function build(creep: Creep) {
    const memory = creep.memory as any;
    if (memory.harvesting === true) {
        const result = getEnergy(creep);
        if (result.success)
            memory.harvesting = false;
        if (result.reason === Reason.NO_VALID_TARGET)
            wander(creep);
        return;
    }

    const build = maintain(creep);

    if (build.reason === Reason.NO_VALID_TARGET) {
        harvest(creep);
    } else if (build.success) {
        memory.harvesting = true;
    }
}