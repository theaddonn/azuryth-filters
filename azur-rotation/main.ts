import { PathInformation, AddonProcessor } from "@azuryth/azuryth-core"

const info = new PathInformation("BP", "RP");

const processor = new AddonProcessor();
try {
    processor.parseAddon(info);
} catch (err) {
    console.error(err)
} 