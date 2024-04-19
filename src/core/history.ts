export default class History {
  undoItems: string[];
  redoItems: string[];

  constructor() {
    this.undoItems = [];
    this.redoItems = [];
  }

  add(data: unknown) {
    this.undoItems.push(JSON.stringify(data));
    this.redoItems = [];
  }

  canUndo() {
    return this.undoItems.length > 0;
  }

  canRedo() {
    return this.redoItems.length > 0;
  }

  undo(currentd: unknown, cb: (arg: unknown) => void) {
    const { undoItems, redoItems } = this;
    if (this.canUndo()) {
      redoItems.push(JSON.stringify(currentd));

      // TODO: cb argument is data_proxy requires some initial values ex: autofilter
      cb(JSON.parse(undoItems.pop() ?? "{}"));
    }
  }

  redo(currentd: unknown, cb: (arg: unknown) => void) {
    const { undoItems, redoItems } = this;
    if (this.canRedo()) {
      undoItems.push(JSON.stringify(currentd));
      cb(JSON.parse(redoItems.pop() ?? "{}"));
    }
  }
}
