import DropdownItem from './dropdown_item';
import DropdownColor from '../dropdown_color';

export default class TextColor extends DropdownItem<DropdownColor> {
  constructor(color:string) {
    super('color', undefined, color);
  }

  dropdown() {
    const { tag, value } = this;
    const color = value!; // color is required in constructor
    return new DropdownColor(tag, color);
  }
}
