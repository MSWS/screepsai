const cache = new Map<RoomPosition, Map<RoomPosition, PathStep[]>>();

export function buildRoad(start: RoomPosition, end: RoomPosition) {
    const paths = cache.get(start) ?? new Map();
    const path = paths.get(end) ?? start.findPathTo(end, { ignoreCreeps: true, range: 1, maxOps: 400000, maxRooms: 2 });
    // paths.set(end, path);
    // cache.set(start, paths);
    for (const step of path) {
        const pos = new RoomPosition(step.x, step.y, start.roomName);
        pos.createConstructionSite(STRUCTURE_ROAD);
    }
}
