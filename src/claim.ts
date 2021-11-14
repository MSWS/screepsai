import { getEnergy } from "getEnergy";
import { targetController } from "storeEnergy";
import { takeoverRoom } from "takeover";
import { Reason } from "Task";

export function claim(creep: Creep) {
    const control = targetController(creep);
    const result = takeoverRoom(creep, control);

    if (result.reason === Reason.NO_ENERGY)
        return getEnergy(creep);
    return result;
}