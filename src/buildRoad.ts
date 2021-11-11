export function buildRoad(start: RoomPosition, end: RoomPosition) {
    for (const step of start.findPathTo(end, { ignoreCreeps: true, range: 1 })) {
        const pos = new RoomPosition(step.x, step.y, start.roomName);
        pos.createConstructionSite(STRUCTURE_ROAD);
    }
}
