import type CellRange from "./cell_range";

interface ClipboardClear {
  range: null;
  state: 'clear'  
}

interface ClipboardNotClear {
  range: CellRange;
  state: 'clear'|'copy'|'cut'
}



export default class Clipboard {
  range: CellRange | null;
  state: 'clear'|'copy'|'cut'

  constructor() {
    this.range = null; // CellRange
    this.state = 'clear';
  }

  copy(cellRange:CellRange) {
    this.range = cellRange;
    this.state = 'copy';
    return this;
  }

  cut(cellRange:CellRange) {
    this.range = cellRange;
    this.state = 'cut';
    return this;
  }

  isCopy(): this is ClipboardNotClear {
    return (this as ClipboardNotClear).state === 'copy';
  }

  isCut(): this is ClipboardNotClear {
    return (this as ClipboardNotClear).state === 'cut';
  }

  isClear(): this is ClipboardClear {
    return (this as ClipboardClear).state === 'clear';
  }

  isNotClear(): this is ClipboardNotClear {
    return (this as ClipboardNotClear).state === 'cut' || (this as ClipboardNotClear).state === 'copy';
  }

  clear() {
    this.range = null;
    this.state = 'clear';
  }
}
