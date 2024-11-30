import type { JsonObject } from "@azuryth/azuryth-core"

export function getSettings(): JsonObject {
    if (Deno.args.length !== 1) {
        return {
            scriptDir: "BP/scripts"
        }
    } else {
        const config = JSON.parse(Deno.args[0]);
        if (!("scriptDir" in config)) {
            return {
                scriptDir: "BP/scripts"
            }
        } else {
            return config as JsonObject
        }
    }
}