import { valuesToMap, bodyToList } from "utils";

export function attemptSpawn() {
    for (const name in Game.spawns) {
        const spawn = Game.spawns[name];
        const creeps = spawn.room.find(FIND_MY_CREEPS);
        const max = creeps.length / (spawn.room.find(FIND_SOURCES).length * 3) + 1;

        let energyAvail = spawn.room.energyAvailable;
        const addOn = [CLAIM, WORK, CARRY, MOVE, WORK, MOVE, ATTACK, WORK, WORK, MOVE, CARRY, CARRY, ATTACK];
        const body: BodyPartConstant[] = [WORK, MOVE, CARRY];
        for (const part of body)
            energyAvail -= BODYPART_COST[part];
        for (let i = 0; i < addOn.length && energyAvail > 0; i++) {
            if (energyAvail < BODYPART_COST[addOn[i]])
                continue;
            body.push(addOn[i]);
            energyAvail -= BODYPART_COST[addOn[i]];
        }

        creeps.sort((a, b) => getCreepScore(spawn, a) - getCreepScore(spawn, b));
        const weakest = creeps[creeps.length - 1];
        if (getTheoreticalScore(body) < getCreepScore(spawn, weakest)) {
            if (creeps.length < max - 1)
                break;
            weakest.say("RIP");
            (weakest.memory as any).sacrifice = spawn.id;
            continue;
        }

        const role = getBestRole(body);
        spawn.spawnCreep(body, role + Math.round(Math.random() * 10000), { memory: { role } });
    }
}

export function getBestRole(creep: Creep | BodyPartConstant[]) {
    const body = valuesToMap(creep instanceof Creep ? bodyToList(creep) : creep);
    if (body.get(WORK) ?? 0 >= 1)
        return "claimer";
    // if (body.get(ATTACK) ?? false)
    // return "fighter";

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