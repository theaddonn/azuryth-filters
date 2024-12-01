import { getOrThrow } from "../util/json.ts";
import { ComponentStore, type JsonObject, type JsonValue } from "./types.ts";



export class Item {
    components: ComponentStore<JsonValue>;
    id: string;
    private description: JsonObject;
    private formatString: string;
    constructor(json: JsonObject) {
        console.log(JSON.stringify(json))
        const format = getOrThrow<string>("format_version", json)!;
        const item = getOrThrow<JsonObject>("minecraft:item", json)!;
        const description = getOrThrow<JsonObject>("description", item)!;
        const id = getOrThrow<string>("identifier", description)!;

        const components: Map<string, JsonValue> = new Map();
        const itemComponents = getOrThrow<JsonObject>("components", item)!;
        for (const [key, val] of Object.entries(itemComponents)) {
            components.set(key, val);
        }

        this.id = id;
        this.components = new ComponentStore(components);
        this.description = description;
        this.formatString = format;
    }


    *getCustomComponentsRoot(): IterableIterator<[string, JsonValue]> {
        for (const [key, info] of this.components.entries()) {
            if (key.startsWith("minecraft:")) {
                continue;
            }
            yield [key, info];
        }
    }

    hasCustomComponent(): boolean {
        for (const [key, _] of this.components.entries()) {
            if (!key.startsWith("minecraft:")) {
                return true;
            }
        }
        return false
    }

    jsonBlob(): JsonObject {
        const components = this.components.jsonBlob();
        const description = this.description;
        description["identifer"] = this.id;

        const json: JsonObject = {};
        json["format_version"] = this.formatString;

        const info: JsonObject = {};
        info["components"]  = components;
        info["description"] = description;

        json["minecraft:item"] = info;
        return json
    }
}