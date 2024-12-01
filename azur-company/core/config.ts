import {
    getOrThrow,
    getOrUndefined,
    JsonObject,
} from "@azuryth/azuryth-core";

export enum ComponentType {
    Block = "block",
    Item = "item",
}

export interface ComponentInformation {
    class: string;
    componentId: string;
    path?: string;
    type: ComponentType;
}

export function gatherComponentInformation(): [
    boolean,
    ComponentInformation[],
    string
] {
    const rawConfig: JsonObject = JSON.parse(
        Deno.readTextFileSync("data/azur-company/config.json")
    );
    const information = getOrThrow<JsonObject[]>("componentList", rawConfig)!;
    const informationArray = new Array<ComponentInformation>();
    for (const info of information) {
        const componentClass = getOrThrow<string>("class", info)!;
        const componentId = getOrThrow<string>("componentId", info)!;
        const path = getOrUndefined<string>("path", info);
        const type = getOrThrow<ComponentType>("type", info)!;
        informationArray.push({
            class: componentClass,
            componentId: componentId,
            path: path,
            type: type,
        });
    }
    return [getOrUndefined("heterogeneousJs", rawConfig) as boolean, informationArray, getOrThrow<string>("mainJs", rawConfig)!];
}
