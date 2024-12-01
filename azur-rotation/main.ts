import {
    PathInformation,
    AddonProcessor,
    type BlockComponent,
    type JsonValue,
    type Block,
    Permutation,
    getOrUndefined,
    type JsonObject,
    ParserEnabled,
} from "@azuryth/azuryth-core";

const info = new PathInformation("BP", "RP");

enum Mode {
    Cardinal = "minecraft:cardinal_direction",
    Facing = "minecraft:facing_direction",
}

class Rotation implements BlockComponent {
    constructor() {
        this.generate = this.generate.bind(this);
    }

    private shared = [
        {
            transform: [0, 0, 0],
            dir: "north",
        },
        {
            transform: [0, 90, 0],
            dir: "west",
        },
        {
            transform: [0, 180, 0],
            dir: "south",
        },
        {
            transform: [0, -90, 0],
            dir: "east",
        },
    ];

    private upDown = [
        {
            transform: [90, 0, 0],
            dir: "up",
        },
        {
            transform: [-90, 0, 0],
            dir: "down",
        },

    ]

    private utilityGenerate(target: Block, mode: Mode) {
        for (const { transform, dir } of this.shared) {
            target.pushPermutation(
                Permutation.fromObject(`q.block_state('${mode}') == '${dir}'`, {
                    "minecraft:transformation": { rotation: transform },
                })
            );
        }
        if (mode != Mode.Facing) {
            return;
        }
        for (const { transform, dir } of this.upDown) {
            target.pushPermutation(
                Permutation.fromObject(`q.block_state('${mode}') == '${dir}'`, {
                    "minecraft:transformation": { rotation: transform },
                })
            );
        }
    }

    generate(block: Block, info: JsonValue) {
        if (typeof info !== 'object') {
            throw new TypeError(`Expected object got ${typeof info} when generating rotations`);
        }
        const y = getOrUndefined<boolean>("y_rotation", info as JsonObject);

        let mode: Mode;
        if (y) {
            mode = Mode.Facing;
        } else {
            mode = Mode.Cardinal;
        }
        this.utilityGenerate(block, mode);

        const trait: JsonObject = {};
        trait["enabled_states"] = [mode];
        if (!y) {
            trait["y_rotation_offset"] = 180
        }
        block.traits.setComponent("minecraft:placement_direction", trait);
    }
}

const processor = new AddonProcessor();
processor.addBlockComponent("azur:rotation", new Rotation());

try {
    processor.parseAddon(info, new ParserEnabled(false));
    processor.processAddon();
    processor.saveAddon();
} catch (err) {
    console.error(err);
}
