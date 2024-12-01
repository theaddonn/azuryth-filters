import { AddonProcessor, PathInformation } from "./addon.ts";

const addon = new AddonProcessor();
const path = new PathInformation("BP", "RP");

addon.parseAddon(path);
addon.saveAddon();
