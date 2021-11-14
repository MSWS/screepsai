import { Reason, TaskResult } from "Task";

export function maintain(creep: Creep) {
    const memory = creep.memory as any;
    if (creep.store.getUsedCapacity() === 0) {
        memory.maintain = undefined;
        return new TaskResult(true, Reason.COMPLETED);
    }

    let site: AnyStructure;

    if (!memory.maintain) {
        const sites = creep.room.find(FIND_STRUCTURES, { filter: t => t.structureType !== STRUCTURE_CONTROLLER && t.hits && t.hits !== t.hitsMax });
        if (!sites || sites.length === 0)
            return new TaskResult(false, Reason.NO_VALID_TARGET);
        sites.sort((a, b) => getStructureScore(creep, a) - getStructureScore(creep, b));
        site = sites[0];
        memory.maintain = site.id;
    } else {
        site = Game.getObjectById(memory.maintain) as AnyStructure;
    }

    if (!site || !site.hits) {
        memory.maintain = undefined;
        return new TaskResult(true, Reason.COMPLETED);
    }

    const result = creep.repair(site);
    switch (result) {
        case OK:
            memory.maintain = undefined;

            if (site.hits >= site.hitsMax) {
                return new TaskResult(true, Reason.COMPLETED);
            }
            return new TaskResult(false, Reason.IN_PROGRESS);
        case ERR_INVALID_TARGET:
            memory.maintain = undefined;
            return new TaskResult(true, Reason.COMPLETED);
        case ERR_NOT_IN_RANGE:
            creep.moveTo(site, { visualizePathStyle: { stroke: "#00ff33" } });
            return new TaskResult(false, Reason.NOT_IN_RANGE);
        default:
            return new TaskResult(false, Reason.NONE);
    }
}

export function getStructureScore(creep: Creep, container: AnyStructure): number {
    let score = 0;
    if (!container.hitsMax || !container.hits) {
        score += 500;
    } else {
        score += (container.hits / container.hitsMax) * 500;
        score -= (container.hitsMax - container.hits) / 500;
    }
    const path = PathFinder.search(creep.pos, { pos: container.pos, range: 1 });
    score += path.cost;
    return score;
}