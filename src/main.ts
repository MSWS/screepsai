import { build } from "build";
import { buildRoad } from "buildRoad";
import { claim } from "claim";
import { sacrifice } from "sacrifice";
import { attemptSpawn, getBestRole } from "spawning";
import { bodyToList, valuesToMap } from "utils";
import "./harvest";
import { harvest } from "./harvest";

const knownRooms: string[] = [];

const link = [FIND_SOURCES, FIND_MY_STRUCTURES, FIND_MY_SPAWNS];

const delay = new Map<string, number>();

module.exports.loop = function () {
    tickCreeps();

    if (Game.time - (delay.get("attemptSpawn") ?? Game.time) > 50) {
        attemptSpawn();
        delay.set("attemptSpawn", Game.time);
    }

    for (const name in Memory.creeps) {
        if (!Game.creeps[name])
            delete Memory.creeps[name];
    }
};

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