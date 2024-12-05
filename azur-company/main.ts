import {
    BlockComponent,
    JsonValue,
    ComponentStore,
    Block,
    ItemComponent,
    Item,
    AddonProcessor,
    PathInformation,
    ParserEnabled,
} from "@azuryth/azuryth-core";
import { FilterSettings, getSettings } from "./core/cli.ts";
import { ComponentGenerator } from "./core/componentGenerator.ts";
import {
    ComponentInformation,
    ComponentRipper,
    ComponentType,
} from "./core/componentPuller.ts";
import { CodeBlockWriter, Project } from "@ts-morph/ts-morph";

class ComponentResolver implements BlockComponent, ItemComponent {
    private id: string;
    private isItem: boolean;
    private generator: ComponentGenerator;
    constructor(id: string, isItem: boolean, gen: ComponentGenerator) {
        this.id = id;
        this.isItem = isItem;
        this.generator = gen;
        this.generate = this.generate.bind(this);
    }
    generate(
        _block: Block | Item,
        info: JsonValue,
        localJsonContext: ComponentStore<JsonValue>
    ) {
        const newId = this.generator.addComponentReference(
            this.id,
            info,
            this.isItem
        );
        if (newId === undefined) {
            return;
        }
        console.log(`Bound ${this.id}`);
        const componentArray = localJsonContext.getComponentOrDefault<string[]>(
            "minecraft:custom_components",
            []
        );
        componentArray.push(newId);
        localJsonContext.setComponent(
            "minecraft:custom_components",
            componentArray
        );
    }
}

function fixBlocks(blk: Block, addon: AddonProcessor) {
    const baseComponents = blk.components.getComponent(
        "minecraft:custom_components"
    ) as string[] | undefined;
    if (!baseComponents) {
        return;
    }

    for (const perm of blk.permutations) {
        const custom = perm.components.getComponent(
            "minecraft:custom_components"
        ) as string[] | undefined;
        if (!custom) {
            continue;
        }
        for (const [id, _] of addon.getBlockComponents()) {
            for (const baseComponent of baseComponents) {
                const customAndPerm =
                    custom.findIndex((val) => {
                        return (
                            val.startsWith(id) && baseComponent.startsWith(id)
                        );
                    }) > -1;
                
                if (!customAndPerm) {
                    const baseOnly = baseComponent.startsWith(id);
                    if (baseOnly) {
                        custom.push(baseComponent);
                    }
                }
            }
        }
    }
}

function main() {
    const base = getSettings()!;
    if (!base.scriptDir.endsWith("/")) {
        base.scriptDir += "/";
    }

    const project = new Project({ compilerOptions: { allowJs: true } });
    const ripper = new ComponentRipper(
        base.scriptDir + base.globPattern,
        project
    );

    const information = ripper.rip(base);

    const generator = new ComponentGenerator(information, project);

    const addon = new AddonProcessor();

    bindComponents(addon, generator, information);
    addRegisterCall(base, project);

    const path = new PathInformation(base.bpDir, "RP");

    addon.parseAddon(path, new ParserEnabled(true, true));
    addon.processAddon();

    for (const block of addon.getBlocks()) {
        fixBlocks(block, addon);
    }

    generator.generateSource(base.scriptDir);

    const prommise = project.save();

    addon.saveAddon();

    prommise.catch((err) => console.error(`Failed to save ${err}`));
}
main();

function bindComponents(
    addon: AddonProcessor,
    generator: ComponentGenerator,
    information: ComponentInformation[]
) {
    for (const info of information) {
        const resolver = new ComponentResolver(
            info.componentId,
            info.type === ComponentType.Item,
            generator
        );
        if (info.type === ComponentType.Item) {
            addon.addItemComponent(info.componentId, resolver);
        } else {
            addon.addBlockComponent(info.componentId, resolver);
        }
    }
}

function addRegisterCall(filterSettings: FilterSettings, project: Project) {
    const mainFile = project.getSourceFileOrThrow(
        filterSettings.scriptDir + filterSettings.mainFileName
    );

    const leading = mainFile.getLeadingCommentRanges();
    const trailing = mainFile.getTrailingCommentRanges();
    const writer = (writer: CodeBlockWriter) => {
        writer
            .writeLine(
                `import {registerGeneratedComponentsFromAzurCompany} from '${"./azur_company_register"}'`
            )
            .writeLine(
                `import { world as AzurCompanyWorldType} from '@minecraft/server'`
            )
            .writeLine(
                `AzurCompanyWorldType.beforeEvents.worldInitialize.subscribe((event) => {registerGeneratedComponentsFromAzurCompany(event)});`
            );
    };
    for (const commentRange of leading) {
        if (commentRange.getText().includes("// azur_company(emit)")) {
            mainFile.replaceText(
                [commentRange.getPos(), commentRange.getEnd()],
                writer
            );
            return;
        }
    }
    for (const commentRange of trailing) {
        if (commentRange.getText().includes("// azur_company(emit)")) {
            mainFile.replaceText(
                [commentRange.getPos(), commentRange.getEnd()],
                writer
            );
            return;
        }
    }
    console.warn(
        "No dedicated emmition specified (add // azur_company(emit) to a line in your main file to tell Azur-Company where to emit)"
    );
    mainFile.addStatements(writer);
}
