export type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonValue[] 
  | { [key: string]: JsonValue };

export type JsonObject = {[key: string]: JsonValue};


export class ComponentStore<T> {
  private components: Map<string, T>

  constructor(components: Map<string, T> = new Map()) {
    this.components = components;
  }


  hasComponent(key: string): boolean {
    return this.components.has(key);
  }

  setComponent(key: string, val: T) {
    this.components.set(key, val);
  }

  removeComponent(key: string) {
    this.components.delete(key);
  }

  getComponent(key: string): T | undefined {
    return this.components.get(key);
  }

  getComponentOrDefault<R>(key: string, defaultValue: R): R {
    const comp = this.getComponent(key);
    if (comp !== undefined) {
      return comp as R;
    }
    return defaultValue;
  }

  entries(): IterableIterator<[string, T]> {
    return this.components.entries();
  }

  count(): number {
    return this.components.size
  }

  jsonBlob(): JsonObject {
    const returnData: JsonObject = {};
    for (const [key, val] of this.components) {
      returnData[key] = val as JsonValue;
    }
    return returnData;
  }
}