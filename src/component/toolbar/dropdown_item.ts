import type Dropdown from '../dropdown';
import Item from './item';

export default class DropdownItem<T extends Dropdown > extends Item {
  //DropdownFormat|DropdownFont|DropdownFontSize|DropdownColor|DropdownBorder|DropdownAlign|DropdownFormula|DropdownMore
  declare dd:T
  //@ts-expect-error overriding signature
  dropdown():T {}

  getValue(v:unknown) {
    // dropdown value (color, alignment, etc.)
    // { mode:BorderType, style:string, color:string }
    // if(typeof v !=="string"){
    //   throw new Error("Expected string value")
    // }
    return v;
  }

  element() {
    const { tag } = this;
    // this.dropdown is from inherited subobject's
    this.dd = this.dropdown();
    this.dd.change = (it:unknown) => this.change(tag, this.getValue(it));
    return super.element().child(
      this.dd,
    );
  }

  setState(v:string) {
    if (v) {
      this.value = v;
      this.dd.setTitle(v);
    }
  }
}
