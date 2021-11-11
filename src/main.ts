import { claim } from "claim";
import "./harvest";
import { harvest } from "./harvest";

const knownRooms: string[] = [];

module.exports.loop = function () {
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        const memory = creep.memory as any;
        switch (memory.role) {
            case "harvester":
                harvest(creep);
                continue;
            case "claimer":
                claim(creep);
                continue;
            default:
                memory.role = getBestRole(creep);
                continue;
        }
    }

    for (const name in Game.spawns) {
        const spawn = Game.spawns[name];
        if (spawn.room.find(FIND_MY_CREEPS).length >= spawn.room.find(FIND_SOURCES).length * 3 + 1)
            continue;
        const energyAvail = spawn.room.energyAvailable;
        const addOn = [CLAIM, MOVE, WORK, CARRY, MOVE, MOVE];
        const body: BodyPartConstant[] = [WORK, MOVE, CARRY];
        for (let i = 300; i < energyAvail && (i - 300) / 100 < addOn.length; i += 100) {
            body.push(addOn[(i - 300) / 100]);
        }
        spawn.spawnCreep(body, "Minion" + Math.round(Math.random() * 10000));
    }

    for (const name in Memory.creeps) {
        if (!Game.creeps[name])
            delete Memory.creeps[name];
    }
};

function getBestRole(creep: Creep) {
    if (creep.getActiveBodyparts(CLAIM) && creep.getActiveBodyparts(MOVE) && creep.getActiveBodyparts(WORK))
        return "claimer";
    return "harvester";
}