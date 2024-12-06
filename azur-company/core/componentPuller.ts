import {
    CommentRange,
    Project,
    SourceFile,
} from "@ts-morph/ts-morph";
import { findCloseIndex, searchWithScopes, stb } from "./string.ts";
import { FilterSettings } from "./cli.ts";
export enum ComponentType {
    Block = "block",
    Item = "item",
}

export interface ComponentInformation {
    readonly class: string;
    readonly componentId: string;
    readonly path: string;
    readonly type: ComponentType;
    readonly overrideFunc?: string;
    readonly passId: boolean;
}

export class ComponentConfig {
    readonly id!: string;
    readonly overrideFunc?: string;
    readonly performTypeCheck: boolean = false;
    readonly passId: boolean = false;
    constructor(args: [string, string][]) {
        for (const [name, val] of args) {
            if (name === "id") {
                this.id = val;
            } else if (name === "functionOverride") {
                this.overrideFunc = val;
            } else if (name === "passId") {
                this.passId = stb(val);
            }
        }
        if (this.id === undefined) {
            throw new SyntaxError("No ID passed in when making component");
        }
    }
}

export class ComponentRipper {
    private sources: SourceFile[];
    private filter: string;
    private project: Project;

    constructor(scriptSearchFilter: string, project: Project) {
        this.filter = scriptSearchFilter;
        this.project = project; 
        this.sources = [];
    }

    rip(config: FilterSettings): ComponentInformation[] {
        try {
            this.pullSourceFiles();
        } catch (err) {
            console.error(err);
        }
        let out: ComponentInformation[] = [];
        for (const source of this.sources) {
            try {
                const comps = this.pluckComponents(source, config);
                out = out.concat(comps);
            } catch (err) {
                console.error(`Failed to pluck components with err: ${err}`);
            }
        }
        return out;
    }

    private pullSourceFiles() {
        this.sources = this.project.addSourceFilesAtPaths(this.filter);
    }

    private pluckComponents(source: SourceFile, config: FilterSettings): ComponentInformation[] {
        const allClasses = source.getClasses();
        const out: ComponentInformation[] = [];
        for (const classDecl of allClasses) {
            const comments = classDecl.getLeadingCommentRanges();
            let cfg: ComponentConfig | undefined;
            for (const comment of comments) {

                cfg = this.parseComponentConfiguration(comment);
                if (cfg) {
                    break;
                }
            }

            if (!cfg) {
                continue;
            }

            let componentType: ComponentType | undefined;
            for (const derived of classDecl.getImplements()) {
                if (derived.print() === "ItemCustomComponent") {
                    componentType = ComponentType.Item;
                    break;
                } else if (derived.print() === "BlockCustomComponent") {
                    componentType = ComponentType.Block;
                    break;
                }
            }
            if (!componentType) {
                throw new SyntaxError(
                    `Component ${cfg.id} doesn't derive from a valid component`
                );
            }

            let path = source.getFilePath() as string;
            const sourceMapIdx = path.indexOf(config.scriptDir) + config.scriptDir.length;
            path = path.slice(sourceMapIdx, path.length - 3);
            path = "./" + path;

            out.push({
                class: classDecl.getName()!,
                componentId: cfg.id,
                path: path,
                type: componentType,
                overrideFunc: cfg.overrideFunc,
                passId: cfg.passId
            });
        }
        return out;
    }

    private parseComponentConfiguration(
        comment: CommentRange
    ): ComponentConfig | undefined {
        const getterPosition = comment.getText().indexOf("Generate(");
        if (getterPosition === -1) {
            return;
        }

        const parseSource = comment
            .getText()
            .substring(getterPosition + "Generate(".length);

        const findEnd = (source: string) => {
            const index = findCloseIndex(source, { open: "(", close: ")" });
            if (index !== -1) {
                return source.slice(0, index - 1);
            }
            throw new Error(
                `Unterminated generate call in: ${comment
                    .getSourceFile()
                    .getBaseName()}`
            );
        };

        const splitOutArgs = (argStr: string) => {
            const out: [string, string][] = [];
            let idx = 0;

            while (idx !== -1) {
                idx = searchWithScopes(argStr, ",", [
                    { open: "(", close: ")" },
                    { open: "{", close: "}" },
                    { open: "<", close: ">" },
                ]);
                let whole;
                if (idx === -1) {
                    whole = argStr.trim();
                } else {
                    whole = argStr.slice(0, idx);
                    argStr = argStr.slice(idx + 1).trimStart();
                }

                if (!whole) {
                    continue;
                }
                const colonIndex = whole.indexOf(":");
                const name = whole.slice(0, colonIndex).trim();
                const value = whole.slice(colonIndex + 1).trim();
                out.push([name, value]);
            }
            return out;
        };

        const argString = findEnd(parseSource);
        return new ComponentConfig(splitOutArgs(argString));
    }
}
