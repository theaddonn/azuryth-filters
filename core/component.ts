import type { Block } from "./addonComponents/block.ts";
import type { Item } from "./addonComponents/item.ts";
import type { ComponentStore, JsonValue } from "./addonComponents/types.ts";


export interface BlockComponent {
    generate: ((block: Block, info: JsonValue, localJsonContext: ComponentStore<JsonValue>, isPermutation: boolean) => void);
}

export interface ItemComponent {
    generate: ((item: Item, info: JsonValue, localJsonContext: ComponentStore<JsonValue>) => void);
}