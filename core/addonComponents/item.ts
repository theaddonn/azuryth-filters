import type { JsonObject, JsonValue } from "./types.ts";



export class Item {
    private components: Map<string, JsonValue>;
    id: string;
    constructor(id: string) {
        this.components = new Map();
        this.id = id;
    }

    static fromJson(json: JsonObject): Item | undefined {
        try {
            if (json === null) {
                throw new Error("Null json passed");
            }
            const itemInfo = json["minecraft:item"] as JsonObject;
            const item = new Item(itemInfo["description"] as JsonObject ["identifier"] as string);
            return item;
        } catch (err){
            console.error(err);
        }


    }

    hasComponent(id: string): boolean {
        return id in this.components
    }

    setComponent(id: string, data: JsonValue): Item {
        this.components.set(id, data);
        return this;
    }
}