import type { JsonObject } from "../addonComponents/types.ts";


export function contains(key: string, blob: JsonObject): boolean {
    return key in blob;
}

export function getOrThrow<T>(key: string, blob: JsonObject): T | undefined {
    if (!contains(key, blob)) {
        throw new Error(`Json is missing: ${key}`);
    }
    return blob[key] as T;
}

export function getOrUndefined<T>(key: string, blob: JsonObject): T | undefined {
    if (!contains(key, blob)) {
        return undefined;
    }
    return blob[key] as T;
}