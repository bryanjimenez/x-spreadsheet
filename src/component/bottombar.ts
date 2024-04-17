import Dropdown from "./dropdown";
import { type Element, h } from "./element";
import { type HTMLEvent, type HTMLInputEvent, bindClickoutside, unbindClickoutside } from "./event";
import FormInput from "./form_input";
import Icon from "./icon";
import { cssPrefix } from "../config";
// Record: temp not used
// import { xtoast } from './message';
import { tf } from "../locale/locale";
import { type Offset } from "./selector";
import { type DefaultSettings } from "../core/data_proxy";

class DropdownMore extends Dropdown {
  contentClick: Function
  constructor(click:Function) {
    const icon = new Icon("ellipsis");
    super(icon, "auto", false, "top-left");
    this.contentClick = click;
  }

  reset(items:string[]) {
    const eles = items.map((it, i) =>
      h("div", `${cssPrefix}-item`)
        .css("width", "150px")
        .css("font-weight", "normal")
        .on("click", () => {
          this.contentClick(i);
          this.hide();
        })
        .child(it)
    );
    this.setContentChildren(...eles);
  }

  setTitle() {}
}

const menuItems = [{ key: "delete", title: tf("contextmenu.deleteSheet") }];


class ContextMenu {
  el: Element<HTMLDivElement>;
  itemClick: Function;

  constructor() {
    this.el = h("div", `${cssPrefix}-contextmenu`)
      .css("width", "160px")
      .children(...this.buildMenu())
      .hide();
    this.itemClick = () => {};
  }

  private buildMenuItem(item: typeof menuItems[0]) {
    return h("div", `${cssPrefix}-item`)
      .child(item.title())
      .on("click", () => {
        this.itemClick(item.key);
        this.hide();
      });
  }
  
  private buildMenu() {
    return menuItems.map((it) => this.buildMenuItem(it));
  }

  hide() {
    const { el } = this;
    el.hide();
    unbindClickoutside(el);
  }

  setOffset(offset:Offset) {
    const { el } = this;
    el.offset(offset);
    el.show();
    bindClickoutside(el);
  }
}

class Bottombar {
  addFunc?: Function
  swapFunc: (index:number)=>void;
  deleteFunc?: Function;
  updateFunc: (index:number,value:string)=>void;
  dataNames: string[];
  activeEl: Element<HTMLElement> | null;
  deleteEl: Element<HTMLElement> | null;

  el: Element<HTMLDivElement>;
  moreEl: DropdownMore;
  items: Element<HTMLElement>[];
  menuEl: Element<HTMLElement>;
  contextMenu: ContextMenu;


  constructor(
    addFunc = () => {},
    swapFunc:(index:number)=>void = () => {},
    deleteFunc = () => {},
    updateFunc:(index:number,value:string)=>void = () => {}
  ) {
    this.swapFunc = swapFunc;
    this.updateFunc = updateFunc;
    this.dataNames = [];
    this.activeEl = null;
    this.deleteEl = null;
    this.items = [];
    this.moreEl = new DropdownMore((i:number) => {
      this.clickSwap2(this.items[i]);
    });
    this.contextMenu = new ContextMenu();
    this.contextMenu.itemClick = deleteFunc;
    this.el = h("div", `${cssPrefix}-bottombar`).children(
      this.contextMenu.el,
      (this.menuEl = h("ul", `${cssPrefix}-menu`).child(
        h("li", "").children(
          new Icon("add").on("click", () => {
            addFunc();
          }),
          h("span", "").child(this.moreEl)
        )
      ))
    );
  }
  addItem<T extends {mode?:string}>(name:string, active:boolean, options:T) {
    this.dataNames.push(name);
    const item = h("li", active ? "active" : "").child(name);
    item
      .on("click", () => {
        this.clickSwap2(item);
      })
      .on("contextmenu", ({target}:HTMLEvent) => {
        if (options.mode === "read") return;
        const { offsetLeft, offsetHeight } = target;
        this.contextMenu.setOffset({
          left: offsetLeft,
          bottom: offsetHeight + 1,
        });
        this.deleteEl = item;
      })
      .on("dblclick", () => {
        if (options.mode === "read") return;
        const v = item.html();
        const input = new FormInput("auto", "");
        input.val(v);
        input.input.on("blur", ({ target }:HTMLInputEvent) => {
          const { value } = target;
          const nindex = this.dataNames.findIndex((it) => it === v);
          this.renameItem(nindex, value);
          /*
        this.dataNames.splice(nindex, 1, value);
        this.moreEl.reset(this.dataNames);
        item.html('').child(value);
        this.updateFunc(nindex, value);
        */
        });
        item.html("").child(input.el);
        input.focus();
      });
    if (active) {
      this.clickSwap(item);
    }
    this.items.push(item);
    this.menuEl.child(item);
    this.moreEl.reset(this.dataNames);
  }

  renameItem(index:number, value:string) {
    this.dataNames.splice(index, 1, value);
    this.moreEl.reset(this.dataNames);
    this.items[index].html("").child(value);
    this.updateFunc(index, value);
  }

  clear() {
    this.items.forEach((it) => {
      this.menuEl.removeChild(it.el);
    });
    this.items = [];
    this.dataNames = [];
    this.moreEl.reset(this.dataNames);
  }

  deleteItem() {
    const { activeEl, deleteEl } = this;
    if (this.items.length > 1 && deleteEl!==null) {
      const index = this.items.findIndex((it) => it === deleteEl);
      this.items.splice(index, 1);
      this.dataNames.splice(index, 1);
      this.menuEl.removeChild(deleteEl.el);
      this.moreEl.reset(this.dataNames);
      if (activeEl === deleteEl) {
        const [f] = this.items;
        this.activeEl = f;
        this.activeEl.toggle();
        return [index, 0];
      }
      return [index, -1];
    }
    return [-1];
  }

  clickSwap2(item:Element<HTMLElement>) {
    const index = this.items.findIndex((it) => it === item);
    this.clickSwap(item);
    if (this.activeEl !== null) {
      this.activeEl.toggle();
    }
    this.swapFunc(index);
  }

  clickSwap(item:Element<HTMLElement>) {
    if (this.activeEl !== null) {
      this.activeEl.toggle();
    }
    this.activeEl = item;
  }
}

export default Bottombar;
