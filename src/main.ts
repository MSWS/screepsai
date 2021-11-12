import { build } from "build";
import { buildRoad } from "buildRoad";
import { claim } from "claim";
import { sacrifice } from "sacrifice";
import "./harvest";
import { harvest } from "./harvest";

const knownRooms: string[] = [];

const link = [FIND_SOURCES, FIND_MY_STRUCTURES, FIND_MY_SPAWNS];

module.exports.loop = function () {
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        const memory = creep.memory as any;
        if (memory.sacrifice) {
            sacrifice(creep);
            continue;
        }
        switch (memory.role) {
            case "harvester":
                harvest(creep);
                continue;
            case "claimer":
                claim(creep);
                continue;
            case "builder":
                build(creep);
                continue;
            default:
                memory.role = getBestRole(creep);
                continue;
        }
    }

    for (const name in Game.spawns) {
        const spawn = Game.spawns[name];
        const creeps = spawn.room.find(FIND_MY_CREEPS);

        let energyAvail = spawn.room.energyAvailable;
        if (energyAvail / spawn.room.energyCapacityAvailable < creeps.length / (spawn.room.find(FIND_SOURCES).length * 3 + 1))
            continue;
        const addOn = [CLAIM, WORK, CARRY, MOVE, CARRY, MOVE, ATTACK];
        const body: BodyPartConstant[] = [WORK, MOVE, CARRY];
        for (const part of body)
            energyAvail -= BODYPART_COST[part];
        for (let i = 0; i < addOn.length && energyAvail > 0; i++) {
            if (energyAvail < BODYPART_COST[addOn[i]])
                continue;
            body.push(addOn[i]);
            energyAvail -= BODYPART_COST[addOn[i]];
        }

        if (creeps.length >= spawn.room.find(FIND_SOURCES).length * 3 + 1) {
            creeps.sort((a, b) => getCreepScore(spawn, a) - getCreepScore(spawn, b));
            const weakest = creeps[creeps.length - 1];
            if (getTheoreticalScore(body) < getCreepScore(spawn, weakest)) {
                weakest.say("RIP");
                (weakest.memory as any).sacrifice = spawn.id;
                continue;
            }
            continue;
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

    return Math.random() > .5 ? "builder" : "harvester";
}

function getCreepScore(spawn: StructureSpawn, creep: Creep) {
    let result = 0;
    for (const body of creep.body) {
        result -= BODYPART_COST[body.type];
    }

    result -= creep.store.getCapacity();

    if (creep.room.controller) {
        const cost = PathFinder.search(creep.pos, { pos: spawn.pos, range: 1 }).cost;
        result += cost;
    }

    result -= (creep.ticksToLive ?? CREEP_LIFE_TIME) / CREEP_LIFE_TIME * 40;
    return result;
}

function getTheoreticalScore(body: BodyPartConstant[]) {
    let result = 0;
    for (const b of body) {
        result -= BODYPART_COST[b];
    }
    result -= 20;
    return result;
}