import type { JsonValue } from "@azuryth/azuryth-core";
import { ComponentInformation, ComponentType } from "./componentPuller.ts";
import { FunctionDeclaration, Project, SourceFile } from "@ts-morph/ts-morph";

export class ComponentGenerator {
    private indexId: number;
    private blockComponentInformation: Map<string, ComponentInformation>;
    private itemComponentInformation: Map<string, ComponentInformation>;
    private blockComponentInstances: Array<{
        indexId: number;
        info: JsonValue;
        baseId: string;
        componentInfo: ComponentInformation;
        ownerId: string;
    }>;
    private itemComponentInstances: Array<{
        indexId: number;
        info: JsonValue;
        baseId: string;
        componentInfo: ComponentInformation;
        ownerId: string;
    }>;
    private project: Project;

    constructor(information: ComponentInformation[], proj: Project) {
        this.indexId = 0;
        this.blockComponentInformation = new Map();
        this.itemComponentInformation = new Map();
        this.blockComponentInstances = [];
        this.itemComponentInstances = [];
        this.project = proj;

        for (const info of information) {
            if (info.type === ComponentType.Item) {
                this.itemComponentInformation.set(info.componentId, info);
            } else {
                this.blockComponentInformation.set(info.componentId, info);
            }
        }
    }

    addComponentReference(
        id: string,
        info: JsonValue,
        item: boolean,
        ownerId: string
    ): string | undefined {
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
            this.itemComponentInstances.push({
                indexId: this.indexId,
                info: info,
                baseId: id,
                componentInfo: customInfo,
                ownerId: ownerId
            });
        } else {
            const customInfo = this.blockComponentInformation.get(id)!;
            this.blockComponentInstances.push({
                indexId: this.indexId,
                info: info,
                baseId: id,
                componentInfo: customInfo,
                ownerId: ownerId
            });
        }
        this.indexId += 1;
        return `${id}_${this.indexId - 1}`;
    }

    generateSource(basePath: string) {
        const file = this.project.createSourceFile(
            basePath + "/azur_company_register.ts"
        );
        this.emitIncludes(file);
        const func = file.addFunction({
            name: "registerGeneratedComponentsFromAzurCompany",
            parameters: [{ name: "event" }],
            isExported: true,
        });
        this.emitFunctionBody(func);
    }

    private emitIncludes(file: SourceFile) {
        const uniqueIncludes: Set<ComponentInformation> = new Set();
        for (const block of this.blockComponentInstances) {
            uniqueIncludes.add(block.componentInfo);
        }
        for (const item of this.itemComponentInstances) {
            uniqueIncludes.add(item.componentInfo);
        }

        for (const info of uniqueIncludes) {
            file.addImportDeclaration({
                namedImports: [{ name: info.class }],
                moduleSpecifier: info.path,
            });
        }
    }

    private emitFunctionBody(func: FunctionDeclaration) {
        const emitCaller = (
            info: ComponentInformation,
            jsonParam: JsonValue,
            callerId: string
        ) => {
            if (info.overrideFunc) {
                let base = `${info.class}.${info.overrideFunc}(${JSON.stringify(
                    jsonParam
                )}`;
                if (info.passId) {
                    base += `, "${callerId}"`;
                }
                base += ")";
                return base;
                
            } else {
                let base = `new ${info.class}(${JSON.stringify(jsonParam)}`;
                if (info.passId) {
                    base += `, "${callerId}"`;
                }
                base += ")";
                return base;
            }
        };
        const funcStatements: string[] = [];
        for (const block of this.blockComponentInstances) {
            funcStatements.push(
                `event.blockComponentRegistry.registerCustomComponent("${
                    block.baseId
                }_${block.indexId}", ${emitCaller(
                    block.componentInfo,
                    block.info,
                    block.ownerId
                )});`
            );
        }
        for (const item of this.itemComponentInstances) {
            funcStatements.push(
                `event.itemComponentRegistry.registerCustomComponent("${
                    item.baseId
                }_${item.indexId}", ${emitCaller(
                    item.componentInfo,
                    item.info,
                    item.ownerId
                )});`
            );
        }
        func.addStatements(funcStatements);
    }
}
