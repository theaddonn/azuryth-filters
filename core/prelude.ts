import type { Item } from "./addonComponents/item.ts";
import { walkSync } from "@std/fs/walk"
import { existsSync } from "@std/fs/exists"
import type { ComponentStore, JsonObject, JsonValue } from "./addonComponents/types.ts";
import { Block } from "./addonComponents/block.ts";
import { BlockComponent } from "./component.ts";

export class PathInformation {
    resourcePath: string;
    behaviourPath: string;

    constructor(behaviourPath: string, resourcePath: string) {
        behaviourPath = Deno.realPathSync(behaviourPath);
        resourcePath = Deno.realPathSync(resourcePath);
        if (!behaviourPath.endsWith("\\")) {
            behaviourPath = behaviourPath.concat("\\");
        }
        if (!resourcePath.endsWith("\\")) {
            resourcePath = resourcePath.concat("\\");
        }
        this.behaviourPath = behaviourPath;
        this.resourcePath = resourcePath;
    }
}


export class AddonProcessor {
    private customItemComponents: Map<string, ((item: Item) => void)>;
    private customBlockComponents: Map<string, BlockComponent>;

    private blocks: Map<string, [Block, string]>;

    constructor() {
        this.customItemComponents = new Map();
        this.customBlockComponents = new Map();
        this.blocks = new Map();
    }

    addBlockComponent(id: string, callback: BlockComponent) {
        this.customBlockComponents.set(id, callback);
    }

    parseAddon(path: PathInformation) {
        if (existsSync(path.behaviourPath + "blocks")) {
            console.log("Found blocks. Parsing...");
            this.parseBlocks(path.behaviourPath + "blocks")
        }
    }

    private parseBlocks(blocksPath: string) {
        console.log(blocksPath)
        for (const value of walkSync(blocksPath, {followSymlinks: true})) {
            if (!value.isFile) {
                continue;
            }
            const info = Deno.readTextFileSync(value.path);

            const jsonInformation = JSON.parse(info) as JsonObject;
            let block;
            try {
                block = new Block(jsonInformation);
            } catch (err){
                console.error(`Error when parsing ${value.name}, ${err}`);
                continue;
            }
            if (!block.hasCustomComponent()) {
                continue;
            }
            this.blocks.set(block.id, [block, value.path]);
        }
    }

    processAddon() {
        this.handleBlocks();
    }

    private handleBlocks(warnBoundComponent: boolean = false) {
        for (const [_, [block, _path]] of this.blocks) {
            for (const [id, info, context] of block.getCustomComponentsRoot()) {
                const component = this.customBlockComponents.get(id);
                if (!component) {
                    if (warnBoundComponent) {
                        console.warn(`Component ${id} doesn't have a component bound!`);
                    }
                    continue;
                }
                component.generate(block, info, context, false);
                block.components.removeComponent(id);
            }
        }
    }


    saveAddon() {
        this.saveBlocks();
    }

    private saveBlocks() {
        for (const [_, [block, path]] of this.blocks) {
            const blob = block.jsonBlob();
            Deno.writeTextFileSync(path, JSON.stringify(blob));
        }
    }
}