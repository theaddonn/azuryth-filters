
export interface SearchFilter {open: string, close: string}

export function findCloseIndex(str: string, information: SearchFilter): number {
    let depth = 1;
    let index = 0;
    while (depth !== 0) {
        if (str.startsWith(information.open)) {
            depth++;
            index += information.open.length;
        } else if (str.startsWith(information.close)) {
            depth--;
            index++;
        } else {
            index++;
        }

        if (str.length === 0) {
            return -1;
        }
        str = str.substring(1);
    }
    return index;
}


export function searchWithScopes(str: string, filter: string, filters: SearchFilter[]): number {
    let depth = 1;
    let index = 0;
    while (index !== str.length) {
        if (depth === 1 && str.startsWith(filter)) {
            return index;
        }
        let fired = false;
        for (const iFilter of filters) {
            if (str.startsWith(iFilter.open)) {
                depth++;
                index += iFilter.open.length;
                fired = true;
            } else if (str.startsWith(iFilter.close)) {
                depth--;
                index += iFilter.close.length
                fired = true;
            }
        }
        if (!fired) {
            index++;
        } 

        str = str.substring(1);
    }
    return -1;

}

export function stb(str: string): boolean {
    if (str === "true") {
        return true;
    } else if (str === "false") {
        return false;
    }
    throw new Error("String wasnt a bool")
}