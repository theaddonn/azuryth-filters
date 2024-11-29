import { getOrThrow, getOrUndefined } from "../util/json.ts";
import { ComponentStore, type JsonObject, type JsonValue } from "./types.ts";

export class Permutation {
    condition: string;
    components: ComponentStore<JsonValue>;

    constructor(condition: string, components: ComponentStore<JsonValue>) {
        this.components = components;
        this.condition = condition;
    }

    static fromJson(json: JsonObject): Permutation {
        const condition = getOrThrow<string>("condition", json)!;
        const components: Map<string, JsonValue> = new Map();
        const permComponents = getOrThrow<JsonObject>("components", json)!;
        for (const [key, info] of Object.entries(permComponents)) {
            components.set(key, info as JsonValue);
        }

        return new Permutation(condition, new ComponentStore(components));
    }

    static fromObject(condition: string, permComponents: JsonObject): Permutation {
        const components: Map<string, JsonValue> = new Map();
        for (const [key, info] of Object.entries(permComponents)) {
            components.set(key, info as JsonValue);
        }
        return new Permutation(condition, new ComponentStore(components));
    }


    jsonBlob(): JsonObject {
        const json: JsonObject = {};
        const componentInfo = this.components.jsonBlob();
        json["components"] = componentInfo;
        json["condition"] = this.condition;
        return json;
    }
}

export class Block {
    components: ComponentStore<JsonValue>;
    traits: ComponentStore<JsonValue>;
    private permutations: Array<Permutation>;
    private parsedFormat: string;
    description: JsonValue;
    id: string;

    constructor(rawJson: JsonObject) {
        const blockInfo = rawJson["minecraft:block"] as JsonObject;
        const blockComponents = getOrThrow<JsonObject>(
            "components",
            blockInfo
        )!;
        const description = getOrThrow<JsonObject>("description", blockInfo)!;

        const id = getOrThrow<string>("identifier", description)!;
        const format = getOrThrow<string>("format_version", rawJson)!;

        const components: Map<string, JsonValue> = new Map();
        for (const [key, info] of Object.entries(blockComponents)) {
            components.set(key, info as JsonValue);
        }

        const permutations = new Array<Permutation>();

        const blockPermutations = getOrUndefined<JsonValue[]>(
            "permutations",
            blockInfo
        );
        if (blockPermutations) {
            for (const info of blockPermutations) {
                permutations.push(Permutation.fromJson(info as JsonObject));
            }
        }

        const traits = new Map();

        const traitInfo = getOrUndefined<JsonObject>("traits", description); 

        if (traitInfo) {
            for (const [key, info] of Object.entries(traitInfo)) {
                traits.set(key, info as JsonValue);
            }
        }

        this.id = id;
        this.parsedFormat = format;
        this.components = new ComponentStore(components);
        this.permutations = permutations;
        this.description = description;
        this.traits = new ComponentStore(traits);
    }

    pushPermutation(perm: Permutation) {
        this.permutations.push(perm);
    }

    popPermutation(): Permutation | undefined {
        return this.permutations.pop();
    }

    *getCustomComponentsRoot(): IterableIterator<[string, JsonValue, ComponentStore<JsonValue>]> {
        for (const [key, info] of this.components.entries()) {
            if (key.startsWith("minecraft:")) {
                continue;
            }
            yield [key, info, this.components];
        }
    }

    hasCustomComponent(): boolean {
        for (const [key, _] of this.components.entries()) {
            if (!key.startsWith("minecraft:")) {
                return true;
            }
        }
        return false;
    }

    jsonBlob(): JsonObject {
        const permutationInformation = Array.from(this.permutations.map((perm) => perm.jsonBlob()));
        const componentInformation = this.components.jsonBlob();
        let traitInfo: JsonObject | undefined;
        if (this.traits.count()) {
            traitInfo = this.traits.jsonBlob();
        }
        const des = this.description as JsonObject;
        des["identifier"] = this.id;
        if (traitInfo) {
            des["traits"] = traitInfo;
        }

        const endInfo: JsonObject = {};
        endInfo["format_version"] = this.parsedFormat;
        
        const blockInfo: JsonObject = {};
        blockInfo["description"] = des;
        blockInfo["components"] = componentInformation;
        blockInfo["permutations"] = permutationInformation;

        endInfo["minecraft:block"] = blockInfo;

        return endInfo;
    }

}
