import { takeoverRoom } from "takeover";
import { wander } from "wander";
import { Reason, TaskResult } from "./Task";

export function storeEnergy(creep: Creep) {
    const memory = creep.memory as any;
    if (creep.store.getUsedCapacity() === 0) {
        memory.store = {};
        return new TaskResult(true, Reason.COMPLETED);
    }

    let store: StructureContainer | StructureExtension | StructureFactory | StructureSpawn | StructureController | RoomPosition | ConstructionSite;
    if (!memory.store || !memory.store.target) {
        let possible: (StructureContainer | StructureExtension | StructureFactory | StructureSpawn)[] =
            creep.room.find(FIND_MY_STRUCTURES, { filter: s => hasEnergy(s) }) as unknown[] as (StructureContainer | StructureExtension | StructureFactory | StructureSpawn)[];
        possible = possible.filter(s => hasEnergy(s)).map(s => s as StructureContainer | StructureExtension | StructureFactory | StructureSpawn);
        possible.sort((a, b) => getContainerScore(creep, a) - getContainerScore(creep, b));
        store = possible[0];
        if (store)
            memory.store = { target: store.id };
    }
    if (memory.store.target instanceof String) {
        const args = memory.store.target.split(",");
        store = new RoomPosition(parseInt(args[0]), parseInt(args[1]), args[2]);
    } else {
        store = Game.getObjectById(memory.store.target) as StructureContainer | StructureExtension | StructureFactory | StructureSpawn;
    }

    if (!store || (!(store instanceof RoomPosition) && store.store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0)) {
        const sites: (StructureController | ConstructionSite)[] = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
        sites.push(targetController(creep));
        sites.sort((a, b) => ((a instanceof ConstructionSite) ? getConstructionScore(creep, a) : getControllerScore(creep, a)) - ((b instanceof ConstructionSite) ? getConstructionScore(creep, b) : getControllerScore(creep, b)));
        store = sites[0];
        memory.store = { target: (store instanceof RoomPosition) ? store.x + "," + store.y + "," + store.roomName : store.id };
    }
    if (!store) {
        memory.store = {};
        return new TaskResult(false, Reason.INVALID_TARGET);
    }

    if (store instanceof StructureController) {
        const result = takeoverRoom(creep, store);
        if (result.success)
            memory.store = {};
        return result;
    } else if (store instanceof RoomPosition) {
        creep.moveTo(store, { visualizePathStyle: { stroke: "#00ff88" } });
        return new TaskResult(false, Reason.IN_PROGRESS);
    } else if (store instanceof ConstructionSite) {
        const result = creep.build(store);
        switch (result) {
            case OK:
                return new TaskResult(false, Reason.IN_PROGRESS);
            case ERR_NOT_IN_RANGE:
                creep.moveTo(store, { visualizePathStyle: { stroke: "#ffff00" } });
                return new TaskResult(false, Reason.NOT_IN_RANGE);
        }
        return new TaskResult(false, Reason.IN_PROGRESS);
    }
    const result = creep.transfer(store, RESOURCE_ENERGY);
    switch (result) {
        case OK:
            return new TaskResult(true, Reason.COMPLETED);
        case ERR_BUSY:
        case ERR_NOT_ENOUGH_ENERGY:
            return new TaskResult(false, Reason.INVALID_TARGET);
        case ERR_NOT_IN_RANGE:
            creep.moveTo(store, { visualizePathStyle: { stroke: "#ccffee" } });
            return new TaskResult(false, Reason.NOT_IN_RANGE);
        default:
            return new TaskResult(false, Reason.NONE);
    }
}

export function getContainerScore(creep: Creep, container: StructureContainer | StructureExtension | StructureFactory | StructureSpawn): number {
    let score = 0;

    score += (container.store.getUsedCapacity(RESOURCE_ENERGY) / container.store.getCapacity(RESOURCE_ENERGY)) * 30;
    const path = PathFinder.search(creep.pos, { pos: container.pos, range: 1 });
    score += path.cost;
    return score;
}

export function getConstructionScore(creep: Creep, site: ConstructionSite): number {
    let score = 0;
    score -= (site.progress / site.progressTotal) * 100;
    score += site.progressTotal / 250;
    const path = PathFinder.search(creep.pos, { pos: site.pos, range: 1 });
    score += path.cost;
    return score;
}

export function getControllerScore(creep: Creep, controller: StructureController) {
    let score = 0;
    const path = PathFinder.search(creep.pos, { pos: controller.pos, range: 1 });
    score += controller.level * 10;
    score += controller.ticksToDowngrade / 100000;
    score += path.cost;
    return score;
}

export function hasEnergy(s: Structure): s is StructureContainer | StructureExtension | StructureFactory | StructureSpawn {
    const sp = [STRUCTURE_CONTAINER.toString(), STRUCTURE_EXTENSION.toString(), STRUCTURE_FACTORY.toString(), STRUCTURE_SPAWN.toString()];
    return sp.includes(s.structureType);
}

export function targetController(creep: Creep) {
    const controllers = [];
    for (const name in Game.rooms) {
        const room = Game.rooms[name];
        if (!room.controller || (!room.controller.my && creep.getActiveBodyparts(CLAIM) === 0))
            continue;
        controllers.push(room.controller);
    }

    controllers.sort((a, b) => getControllerScore(creep, a) - getControllerScore(creep, b));
    return controllers[0];
}