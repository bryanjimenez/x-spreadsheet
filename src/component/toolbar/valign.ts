import DropdownItem from './dropdown_item';
import DropdownAlign from '../dropdown_align';

export default class Valign extends DropdownItem<DropdownAlign> {
  constructor(value:string) {
    super('valign', '', value);
  }

  dropdown() {
    const { value } = this;
    if(!value) throw new Error("Missing value");

    return new DropdownAlign(['top', 'middle', 'bottom'], value);
  }
}
