import DropdownItem from './dropdown_item';
import DropdownFormat from '../dropdown_format';

export default class Format extends DropdownItem<DropdownFormat> {
  constructor() {
    super('format');
  }

  getValue(it:unknown):string {
    if(!it || typeof it !== "object" ||  !('key' in it) || typeof it.key !=="string" ){
      throw new Error("Expected Format name")
    }
    return it.key;
  }

  dropdown() {
    return new DropdownFormat();
  }
}
