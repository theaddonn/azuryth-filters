import { getOrUndefined, JsonObject } from "@azuryth/azuryth-core";




export function getOrDefault<T>(id: string, defaultValue: T, json: JsonObject): T {
    const obj = getOrUndefined<T>(id, json);
    if (obj !== undefined) {
        return obj;
    }
    return defaultValue;
}