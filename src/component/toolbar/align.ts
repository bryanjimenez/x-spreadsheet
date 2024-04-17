import DropdownItem from './dropdown_item';
import DropdownAlign from '../dropdown_align';

export default class Align extends DropdownItem<DropdownAlign> {
  constructor(value:string) {
    super('align', '', value);
  }

  dropdown() {
    const { value } = this;
    const v = value!; // value is required in constructor
    return new DropdownAlign(['left', 'center', 'right'], v);
  }
}
