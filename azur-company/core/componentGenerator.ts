import type { JsonValue } from "@azuryth/azuryth-core";
import { ComponentInformation, ComponentType } from "./config.ts";



export class ComponentGenerator {
    private id: number;
    private blockComponentInformation: Map<string, ComponentInformation> 
    private itemComponentInformation: Map<string, ComponentInformation> 
    private blockComponentInstances: Array<{id: number, info: JsonValue, baseId: string, componentInfo: ComponentInformation}>;
    private itemComponentInstances: Array<{id: number, info: JsonValue, baseId: string, componentInfo: ComponentInformation}>;


    constructor(information: ComponentInformation[]) {
        this.id = 0;
        this.blockComponentInformation = new Map();
        this.itemComponentInformation = new Map();
        this.blockComponentInstances = [];
        this.itemComponentInstances = [];


        for (const info of information) {
            if (info.type === ComponentType.Item) {
                this.itemComponentInformation.set(info.componentId, info);
            } else {
                this.blockComponentInformation.set(info.componentId, info);
            }
        }
    }


    addComponentReference(id: string, info: JsonValue, item: boolean): string | undefined {
        if (item) {
            if (!this.itemComponentInformation.has(id)) {
                return;
            }
        } else {
            if (!this.blockComponentInformation.has(id)) {
                return;
            }
        }
        if (item) {
            const customInfo = this.itemComponentInformation.get(id)!;
            this.itemComponentInstances.push({id: this.id, info: info, baseId: id, componentInfo: customInfo});
        } else {
            const customInfo = this.blockComponentInformation.get(id)!;
            this.blockComponentInstances.push({id: this.id, info: info, baseId: id, componentInfo: customInfo});
        }
        this.id += 1;
        return `${id}_${this.id - 1}`;
    }


    generateRegisterPass(requireComponentImports: boolean): string {
        let mainString = "";
        if (requireComponentImports) {
            console.log("Building External Imports");
            mainString += this.buildImportsExternal();
        } else {
            console.log("Building Internal Imports");
            mainString += this.buildImportsInternal();
        }

        mainString += `
        import {world} from "@minecraft/server";

        function bindCustomComponents(event) {
        `;
        for (const {id, info, baseId, componentInfo} of this.blockComponentInstances) {
            mainString += `event.blockComponentRegistry.registerCustomComponent(
                "${baseId}_${id}",
                new ${componentInfo.class}(${JSON.stringify(info)})
            );
            `
        }
        for (const {id, info, baseId, componentInfo} of this.itemComponentInstances) {
            mainString += `event.itemComponentRegistry.registerCustomComponent(
                "${baseId}_${id}",
                new ${componentInfo.class}(${JSON.stringify(info)})
            );
            `
        }
        mainString += `}


        export function createBinder() {
            world.beforeEvents.worldInitialize.subscribe((event) => {bindCustomComponents(event)});
        }`
        return mainString;
    }

    private buildImportsExternal(): string {
        let returnInfo = "";
        for (const [_id, info] of this.blockComponentInformation) {
            if (info.path === undefined) {
                continue;
            }
            returnInfo += `import { ${info.class} } from "${info.path!}";
            `
        }
        for (const [_id, info] of this.itemComponentInformation) {
            if (info.path === undefined) {
                continue;
            }
            returnInfo += `import { ${info.class} } from "${info.path!}";
            `
        }
        return returnInfo;
    }

    private buildImportsInternal(): string {
        let returnInfo = "";
        
        for (const [_id, info] of this.blockComponentInformation) {
            returnInfo += `import { ${info.class} } from "./main";
            `
        }
        for (const [_id, info] of this.itemComponentInformation) {
            returnInfo += `import { ${info.class} } from "./main";
            `
        }

        console.log(`${returnInfo}`);
        return returnInfo; 
    }
}