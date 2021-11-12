import { constants, INSPECT_MAX_BYTES } from "buffer";
import { buildRoad } from "buildRoad";
import { execFile } from "child_process";
import { takeoverRoom } from "takeover";
import { wander } from "wander";
import { Reason, TaskResult } from "./Task";

export function storeEnergy(creep: Creep) {
    const memory = creep.memory as any;
    if (creep.store.getUsedCapacity() === 0) {
        memory.store = {};
        return new TaskResult(true, Reason.COMPLETED);
    }

    let store;
    if (!memory.store || !memory.store.target) {
        store = findBestStore(creep);
        memory.store = { target: store instanceof RoomPosition ? store.x + "," + store.y + "," + store.roomName : store.id };
    }
    if (memory.store.target instanceof String) {
        const args = memory.store.target.split(",");
        store = new RoomPosition(parseInt(args[0]), parseInt(args[1]), args[2]);
    } else {
        store = Game.getObjectById(memory.store.target) as AnyStructure;
    }

    if (!store || (!(store instanceof RoomPosition || store instanceof StructureRampart ||
        store instanceof StructureController || store instanceof StructureExtractor ||
        store instanceof StructureInvaderCore || store instanceof StructureKeeperLair ||
        store instanceof StructureObserver || store instanceof StructurePowerBank ||
        store instanceof StructurePortal || store instanceof StructureRoad || store instanceof StructureWall) && store.store && store.store.getFreeCapacity(RESOURCE_ENERGY) === 0)) {

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
    } else if (store instanceof StructureRampart) {
        if (creep.repair(store) === ERR_NOT_IN_RANGE) {
            creep.moveTo(store);
        }
    }

    const source = creep.pos.findClosestByPath(FIND_SOURCES);
    if (source)
        buildRoad(source.pos, store.pos);
    const result = creep.transfer(store, RESOURCE_ENERGY);
    switch (result) {
        case OK:
            return new TaskResult(false, Reason.IN_PROGRESS);
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

export function findBestStore(creep: Creep): AnyStructure | RoomPosition | ConstructionSite {
    let possible: (AnyStructure | RoomPosition | ConstructionSite)[] =
        creep.room.find(FIND_MY_STRUCTURES, { filter: s => hasEnergy(s) }) as AnyStructure[];

    const sites: (StructureController | ConstructionSite)[] = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
    possible.push(targetController(creep));
    for (const site of sites)
        possible.push(site);
    possible.sort((a, b) => sort(creep, a, b));
    console.log(possible.join(", "));
    return possible[0];
}

export function sort(creep: Creep, a: AnyStructure | RoomPosition | ConstructionSite, b: AnyStructure | RoomPosition | ConstructionSite) {
    let sa, sb;
    if (a instanceof ConstructionSite) {
        sa = getConstructionScore(creep, a);
    } else if (a instanceof RoomPosition) {
        sa = PathFinder.search(creep.pos, { pos: a, range: 1 }).cost;
    } else {
        sa = getContainerScore(creep, a);
    }
    if (b instanceof ConstructionSite) {
        sb = getConstructionScore(creep, b);
    } else if (b instanceof RoomPosition) {
        sb = PathFinder.search(creep.pos, { pos: b, range: 1 }).cost;
    } else {
        sb = getContainerScore(creep, b);
    }
    return sa - sb;
}

export function getContainerScore(creep: Creep, container: AnyStructure): number {
    let score = 0;
    if (container instanceof StructureController) {
        score += Math.max(container.ticksToDowngrade / 10000, 0) * 10;
        score += (container.level / 8) * 15;
    } else if (container instanceof StructureExtractor || container instanceof StructureInvaderCore || container instanceof StructureKeeperLair || container instanceof StructureObserver
        || container instanceof StructurePowerBank || container instanceof StructurePortal) {
        score += 50;
    } else if (container instanceof StructureWall) {
        score += container.hits / container.hitsMax * 40;
    } else if (container instanceof StructureRampart || container instanceof StructureRoad) {
        score += (container.hits / container.hitsMax) * 20;
    } else {
        score += (container.store.getUsedCapacity(RESOURCE_ENERGY) / container.store.getCapacity(RESOURCE_ENERGY)) * 10;
        score += (Math.max(container.store.getCapacity(RESOURCE_ENERGY) / 5000, 5) / 5) * 10;
    }
    const path = PathFinder.search(creep.pos, { pos: container.pos, range: 1 });
    score += path.cost;
    return score;
}

export function getConstructionScore(creep: Creep, site: ConstructionSite): number {
    let score = 0;
    score -= (site.progress / site.progressTotal) * 50;
    score += Math.min(site.progressTotal / 250, 50) / 50 * 20;
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

export function hasEnergy(s: Structure): s is StructureContainer | StructureExtension | StructureFactory | StructureSpawn | StructureRampart {
    const sp = [STRUCTURE_CONTAINER.toString(), STRUCTURE_EXTENSION.toString(), STRUCTURE_FACTORY.toString(), STRUCTURE_SPAWN.toString(), STRUCTURE_RAMPART.toString(), STRUCTURE_ROAD.toString()];
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