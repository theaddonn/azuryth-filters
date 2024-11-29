import type { Block } from "./addonComponents/block.ts";
import type { ComponentStore, JsonValue } from "./addonComponents/types.ts";


export interface BlockComponent {
    generate: ((block: Block, info: JsonValue, localJsonContext: ComponentStore<JsonValue>, isPermutation: boolean) => void);
}