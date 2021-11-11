import { buildRoad } from "buildRoad";
import { Reason, TaskResult } from "./Task";

export function getEnergy(creep: Creep): TaskResult {
    const memory = creep.memory as any;
    if (creep.store.getFreeCapacity() === 0) {
        memory.getenergy = {};
        return new TaskResult(true, Reason.COMPLETED);
    }
    let target = memory.getenergy ? memory.getenergy.target : undefined;
    let source: Source | Mineral<MineralConstant> | Deposit;

    if (!target) {
        const possible = creep.room.find(FIND_SOURCES_ACTIVE, { filter: s => !isSourceBlocked(s.pos) || s.pos.isNearTo(creep.pos) });
        if (!possible || possible.length === 0)
            return new TaskResult(false, Reason.NO_VALID_TARGET);
        possible.sort((a, b) => getSourceScore(creep, a) - getSourceScore(creep, b));
        memory.getenergy = { target: possible[0].id };
    }

    source = Game.getObjectById(memory.getenergy.target) as Source | Mineral<MineralConstant> | Deposit;
    if (isSourceBlocked(source.pos) && !creep.pos.isNearTo(source.pos)) {
        target = undefined;
        let possible = creep.room.find(FIND_SOURCES_ACTIVE);
        possible = possible.filter(s => s.id !== source.id);
        possible.sort((a, b) => getSourceScore(creep, a) - getSourceScore(creep, b));
        if (!possible)
            return new TaskResult(false, Reason.NO_VALID_TARGET);
        source = possible[0];
        memory.getenergy = { target: source.id };
    }

    if (!source)
        return new TaskResult(false, Reason.INVALID_TARGET);
    if (creep.room.controller)
        buildRoad(source.pos, creep.room.controller.pos);

    switch (creep.harvest(source)) {
        case OK:
            if (creep.store.getFreeCapacity() === 0) {
                return new TaskResult(true, Reason.COMPLETED);
            } else {
                return new TaskResult(false, Reason.IN_PROGRESS);
            }
        case ERR_BUSY:
            return new TaskResult(false, Reason.INVALID_TARGET);
        case ERR_NO_BODYPART:
            return new TaskResult(false, Reason.INVALID_TARGET);
        case ERR_NOT_IN_RANGE:
            creep.moveTo(source, { visualizePathStyle: {}, maxOps: 10000 });
            return new TaskResult(false, Reason.NOT_IN_RANGE);
        default:
            return new TaskResult(false, Reason.NONE);
    }
}

export function getSourceScore(creep: Creep, source: Source): number {
    let score = 0;
    for (const creep of source.pos.findInRange(FIND_MY_CREEPS, 1)) {
        score += (creep.store.getCapacity() - creep.store.energy) / 2;
    }
    const path = PathFinder.search(creep.pos, { pos: source.pos, range: 1 });
    score += path.cost;
    if (path.incomplete || isSourceBlocked(source.pos))
        score += 100;
    return score;
}

export function isSourceBlocked(pos: RoomPosition): boolean {
    const avail = [
        true, true, true,
        true, false, true,
        true, true, true];
    for (const creep of pos.findInRange(FIND_CREEPS, 1)) {
        const index = ((creep.pos.x - pos.x + 1) % 3) + ((creep.pos.y - pos.y) + 1) * 3;
        avail[index] = false;
    }
    const terrain = Game.rooms[pos.roomName].getTerrain();
    for (let i = 0; i < 9; i++) {
        if (i == 4)
            continue;
        const x = (i % 3) - 1 + pos.x;
        const y = Math.floor(i / 3) - 1 + pos.y;
        if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
            avail[i] = false;
            // new RoomPosition(x, y, pos.roomName).createFlag("WALL" + x + ", " + y, COLOR_RED);
        }
    }
    return !avail.includes(true);
}