import { targetController } from "storeEnergy";
import { takeoverRoom } from "takeover";

export function claim(creep: Creep) {
    const control = targetController(creep);
    return takeoverRoom(creep, control);
}