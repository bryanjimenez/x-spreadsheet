import DropdownItem from './dropdown_item';
import DropdownBorder from '../dropdown_border';

export default class Border extends DropdownItem<DropdownBorder> {
  constructor() {
    super('border');
  }

  dropdown() {
    return new DropdownBorder();
  }
}
