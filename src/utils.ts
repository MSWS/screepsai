export function valuesToMap<T>(values: T[]): Map<T, number> {
    const map = new Map<T, number>();
    for (const value of values)
        map.set(value, (map.get(value) ?? 0) + 1);
    return map;
}

export function bodyToList(creep: Creep) {
    const result = [];
    for (const body of creep.body) {
        result.push(body.type);
    }
    return result;
}