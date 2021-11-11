import { sacrifice } from "sacrifice";
import { storeEnergy } from "storeEnergy";
import { Reason } from "Task";
import { wander } from "wander";
import { getEnergy } from "./getEnergy";

export function harvest(creep: Creep) {
    const memory = creep.memory as any;
    if (memory.sacrifice) {
        sacrifice(creep);
        return;
    }
    if (memory.harvesting) {
        const result = getEnergy(creep);
        if (result.success)
            memory.harvesting = false;
        if (result.reason === Reason.NO_VALID_TARGET)
            wander(creep);
        return;
    }
    if (storeEnergy(creep).success)
        memory.harvesting = true;
}