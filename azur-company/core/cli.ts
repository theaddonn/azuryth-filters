
export interface FilterSettings {
    scriptDir: string,
    bpDir: string,
    mainFileName: string,
    globPattern: string,
}

export function getSettings(): FilterSettings {
    if (Deno.args.length !== 1) {
        return {
            scriptDir: "data/gametests/src",
            bpDir: "BP",
            mainFileName: "/main.ts",
            globPattern: "/**/*"
        }
    } else {
        const config = JSON.parse(Deno.args[0]);
        if (!("scriptDir" in config)) {
            return {
                scriptDir: "data/gametests/src",
                bpDir: "BP",
                mainFileName: "/main.ts",
                globPattern: "/**/*"
            }
        } else {
            const defaultConfig = {
                scriptDir: "data/gametests/src",
                bpDir: "BP",
                mainFileName: "/main.ts",
                globPattern: "/**/*"
            };

            for (const name of Object.keys(defaultConfig)) {
                if (name in config) {
                    defaultConfig[name as keyof typeof defaultConfig] = config[name]
                } else {
                    console.warn(`Unknown CLI value: ${name}`);
                }
            }
            return defaultConfig;
        }
    }
}