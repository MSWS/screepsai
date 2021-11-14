import { build } from "build";
import { claim } from "claim";
import { sacrifice } from "sacrifice";
import { attemptSpawn, getBestRole } from "spawning";
import "./harvest";
import { harvest } from "./harvest";

const toLink: { source: RoomPosition, target: RoomPosition }[] = [];
const knownRooms: string[] = [], roomsToMap: string[] = [];
const link = [FIND_SOURCES, FIND_MY_SPAWNS, FIND_MY_STRUCTURES, FIND_EXIT, FIND_DEPOSITS, FIND_MINERALS];

const delay = new Map<string, number>();

module.exports.loop = function () {
    tickCreeps();
    attemptMapping();

    // for (const name in Game.constructionSites) {
    //     const site = Game.constructionSites[name];
    //     site.remove();
    // }

    if (Game.time - (delay.get("attemptSpawn") ?? 0) > 20) {
        attemptSpawn();
        delay.set("attemptSpawn", Game.time);
        console.log("Attempting spawn");
    }

    for (const name in Memory.creeps) {
        if (!Game.creeps[name])
            delete Memory.creeps[name];
    }
};

function attemptMapping() {
    for (const name in Game.rooms) {
        if (knownRooms.includes(name))
            continue;
        roomsToMap.push(name);
        knownRooms.push(name);
    }

    if (roomsToMap.length > 0) {
        const name = roomsToMap.pop();
        if (!name)
            return;
        const room = Game.rooms[name];
        if (room.controller && !room.controller.my)
            return;
        console.log("Room: " + room);

        for (const starts of link) {
            for (const ends of link) {
                for (const start of room.find(starts)) {
                    for (const end of room.find(ends)) {
                        if (start === end)
                            continue;
                        toLink.push({ source: start instanceof RoomPosition ? start : start.pos, target: end instanceof RoomPosition ? end : end.pos });
                    }
                    if (room.controller)
                        toLink.push({ source: start instanceof RoomPosition ? start : start.pos, target: room.controller.pos });
                }
            }

        }
        console.log("Mapped Room " + name);
        return;
    }

    if (toLink.length === 0)
        return;
    const lk = toLink.pop();
    if (!lk)
        return;
    const room = Game.rooms[lk.source.roomName];
    const path = lk.source.findPathTo(lk.target, { ignoreCreeps: true, maxRooms: 1, range: 1 });
    for (const p of path) {
        const result = room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
        if (result == ERR_INVALID_ARGS || result == ERR_INVALID_TARGET)
            continue;
        if (result !== OK)
            return;
    }
    console.log("Mapped " + lk.source.x + ", " + lk.source.y + " to " + lk.target.x + ", " + lk.target.y);
}

function tickCreeps() {
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
}