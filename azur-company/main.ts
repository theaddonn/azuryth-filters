import { BlockComponent, JsonValue, ComponentStore, Block, ItemComponent, Item, AddonProcessor, getOrThrow } from "@azuryth/azuryth-core";
import { getSettings } from "./core/cli.ts";
import { ComponentGenerator } from "./core/componentGenerator.ts";
import { ComponentType, gatherComponentInformation } from "./core/config.ts";

let base = getOrThrow<string>("scriptDir", getSettings())!;
if (!base.endsWith("/")) {
  base += "/"
}

console.log("Gathering Components")
const [offsets, information, mainPath] = gatherComponentInformation();
console.log(`Found ${information.length} components!`);

const generator = new ComponentGenerator(information);

class ComponentResolver implements BlockComponent, ItemComponent {
  private id: string;
  private isItem: boolean;
  constructor(id: string, isItem: boolean) {
    this.id = id;
    this.isItem = isItem;
    this.generate = this.generate.bind(this);
  }
  generate(_block: Block | Item, info: JsonValue, localJsonContext: ComponentStore<JsonValue>) {
    const newId = generator.addComponentReference(this.id, info, this.isItem);
    if (newId === undefined) {
      return;
    }
    const componentArray = localJsonContext.getComponentOrDefault<string[]>("minecraft:custom_components", []);
    componentArray.push(newId);
    localJsonContext.setComponent("minecraft:custom_components", componentArray);
  }
}


const addon = new AddonProcessor();


for (const info of information) {
  const resolver = new ComponentResolver(info.componentId, info.type === ComponentType.Item);
  if (info.type === ComponentType.Item) {
    addon.addItemComponent(info.componentId, resolver);
  } else {
    addon.addBlockComponent(info.componentId, resolver);
  }
}

addon.processAddon();

const registerJS = generator.generateRegisterPass(offsets);
const writeRequest = Deno.writeTextFile(base + "register.js", registerJS);

let main = Deno.readTextFileSync(base + mainPath);
main += `
import {createBinder} from "./register.js;"
createBinder();
`

Deno.writeTextFileSync(base + mainPath, main);
writeRequest.then(() => {}, () => {});