import { Item } from "./addonComponents/item.ts";
import { walkSync } from "@std/fs/walk"
import { existsSync } from "@std/fs/exists"
import type { JsonObject} from "./addonComponents/types.ts";
import { Block } from "./addonComponents/block.ts";
import type { BlockComponent, ItemComponent } from "./component.ts";

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
    private customItemComponents: Map<string, ItemComponent>;
    private customBlockComponents: Map<string, BlockComponent>;

    private blocks: Map<string, [Block, string]>;
    private items: Map<string, [Item, string]>;

    constructor() {
        this.customItemComponents = new Map();
        this.customBlockComponents = new Map();
        this.blocks = new Map();
        this.items = new Map();
    }

    addBlockComponent(id: string, callback: BlockComponent) {
        this.customBlockComponents.set(id, callback);
    }

    addItemComponent(id: string, callback: ItemComponent) {
        this.customItemComponents.set(id, callback);
    }

    parseAddon(path: PathInformation) {
        if (existsSync(path.behaviourPath + "blocks")) {
            console.log("Found blocks. Parsing...");
            this.parseBlocks(path.behaviourPath + "blocks")
        }

        if (existsSync(path.behaviourPath + "items")) {
            console.log("Found items. Parsing...");
            this.parseItems(path.behaviourPath + "items")
        }
    }

    private parseBlocks(blocksPath: string) {
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
    private parseItems(itemPath: string) {
        for (const value of walkSync(itemPath, {followSymlinks: true})) {
            if (!value.isFile) {
                continue;
            }
            const info = Deno.readTextFileSync(value.path);

            const jsonInformation = JSON.parse(info) as JsonObject;
            let item;
            try {
                item = new Item(jsonInformation);
            } catch (err){
                console.error(`Error when parsing ${value.name}, ${err}`);
                continue;
            }
            if (!item.hasCustomComponent()) {
                continue;
            }
            this.items.set(item.id, [item, value.path]);
        }
    }

    processAddon() {
        this.handleBlocks();
        this.handleItems();
    }

    private handleBlocks() {
        for (const [_, [block, _path]] of this.blocks) {
            for (const [id, info, context] of block.getCustomComponentsRoot()) {
                const component = this.customBlockComponents.get(id);
                if (!component) {
                    continue;
                }
                component.generate(block, info, context, false);
                block.components.removeComponent(id);
            }

            for (const [id, info, context] of block.getCustomComponentsPermutation()) {
                const component = this.customBlockComponents.get(id);
                if (!component) {
                    continue;
                }
                component.generate(block, info, context, true);
                context.removeComponent(id);
            }
        }
    }
    private handleItems() {
        for (const [_, [item, _path]] of this.items) {
            for (const [id, info] of item.getCustomComponentsRoot()) {
                const component = this.customItemComponents.get(id);
                if (!component) {
                    continue;
                }
                component.generate(item, info, item.components);
                item.components.removeComponent(id);
            }
        }
    }


    saveAddon() {
        this.saveBlocks();
        this.saveItems();
    }

    private saveBlocks() {
        for (const [_, [block, path]] of this.blocks) {
            const blob = block.jsonBlob();
            Deno.writeTextFileSync(path, JSON.stringify(blob));
        }
    }
    private saveItems() {
        for (const [_, [item, path]] of this.items) {
            const blob = item.jsonBlob();
            Deno.writeTextFileSync(path, JSON.stringify(blob));
        }
    }
}