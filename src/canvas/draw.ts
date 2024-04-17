/* global window */

import { type DefaultSettings } from "../core/data_proxy";

export type LineType = "medium"|"thick"|"dashed"|"dotted"|"double";
export type HAlign = 'center'|"left"|"right";
export type VAlign = "top"|"middle"|"bottom";


class DrawBox {
  x:number;
  y:number;
  // w:number;
  // h:number;

  width:number;
  height:number;
  padding:number;
  bgcolor:string;
  borderTop: [LineType, string] |null;
  borderRight: [LineType, string] |null;
  borderBottom: [LineType, string] |null;
  borderLeft: [LineType, string] |null;

  constructor(x:number, y:number, w:number, h:number, padding = 0) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.padding = padding;
    this.bgcolor = '#ffffff';
    // border: [width, style, color]
    this.borderTop = null;
    this.borderRight = null;
    this.borderBottom = null;
    this.borderLeft = null;
  }

  setBorders({
    top, bottom, left, right,
  }:{top:DrawBox['borderTop'],bottom:DrawBox['borderBottom'],left:DrawBox['borderLeft'],right:DrawBox['borderRight']}) {
    if (top) this.borderTop = top;
    if (right) this.borderRight = right;
    if (bottom) this.borderBottom = bottom;
    if (left) this.borderLeft = left;
  }

  innerWidth() {
    return this.width - (this.padding * 2) - 2;
  }

  innerHeight() {
    return this.height - (this.padding * 2) - 2;
  }

  textx(align:HAlign | undefined) {
    const { width, padding } = this;
    let { x } = this;
    if (align === 'left') {
      x += padding;
    } else if (align === 'center') {
      x += width / 2;
    } else if (align === 'right') {
      x += width - padding;
    }
    return x;
  }

  texty(align:"top"|"middle"|"bottom"|undefined, h:number) {
    const { height, padding } = this;
    let { y } = this;
    if (align === 'top') {
      y += padding;
    } else if (align === 'middle') {
      y += height / 2 - h / 2;
    } else if (align === 'bottom') {
      y += height - padding - h;
    }
    return y;
  }

  topxys():[[number,number],[number,number]] {
    const { x, y, width } = this;
    return [[x, y], [x + width, y]];
  }

  rightxys():[[number,number],[number,number]] {
    const {
      x, y, width, height,
    } = this;
    return [[x + width, y], [x + width, y + height]];
  }

  bottomxys():[[number,number],[number,number]] {
    const {
      x, y, width, height,
    } = this;
    return [[x, y + height], [x + width, y + height]];
  }

  leftxys():[[number,number],[number,number]] {
    const {
      x, y, height,
    } = this;
    return [[x, y], [x, y + height]];
  }
}


class Draw {

  el: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(el:HTMLCanvasElement, width:number, height:number) {
    this.el = el;
    const ctx = el.getContext('2d');
    if(!ctx){
      throw new Error('Not a valid elment');
    }
    
    this.ctx = ctx;
    this.resize(width, height);
    this.ctx.scale(Draw.dpr(), Draw.dpr());
  }

  resize(width:number, height:number) {
    // console.log('dpr:', dpr);
    this.el.style.width = `${width}px`;
    this.el.style.height = `${height}px`;
    this.el.width = npx(width);
    this.el.height = npx(height);
  }

  clear() {
    const { width, height } = this.el;
    this.ctx.clearRect(0, 0, width, height);
    return this;
  }

  attr(options:unknown) {
    Object.assign(this.ctx, options);
    return this;
  }

  save() {
    this.ctx.save();
    this.ctx.beginPath();
    return this;
  }

  restore() {
    this.ctx.restore();
    return this;
  }

  beginPath() {
    this.ctx.beginPath();
    return this;
  }

  translate(x:number, y:number) {
    this.ctx.translate(npx(x), npx(y));
    return this;
  }

  scale(x:number, y:number) {
    this.ctx.scale(x, y);
    return this;
  }

  clearRect(x:number, y:number, w:number, h:number) {
    this.ctx.clearRect(x, y, w, h);
    return this;
  }

  fillRect(x:number, y:number, w:number, h:number) {
    this.ctx.fillRect(npx(x) - 0.5, npx(y) - 0.5, npx(w), npx(h));
    return this;
  }

  fillText(text:string, x:number, y:number) {
    this.ctx.fillText(text, npx(x), npx(y));
    return this;
  }

  private drawFontLine(type:'underline' | 'strike', tx:number, ty:number, align:'center'|"left"|"right"|undefined, valign:"top"|"middle"|"bottom", blheight:number, blwidth:number) {
  const floffset = { x: 0, y: 0 };
  if (type === 'underline') {
    if (valign === 'bottom') {
      floffset.y = 0;
    } else if (valign === 'top') {
      floffset.y = -(blheight + 2);
    } else {
      floffset.y = -blheight / 2;
    }
  } else if (type === 'strike') {
    if (valign === 'bottom') {
      floffset.y = blheight / 2;
    } else if (valign === 'top') {
      floffset.y = -((blheight / 2) + 2);
    }
  }

  if (align === 'center') {
    floffset.x = blwidth / 2;
  } else if (align === 'right') {
    floffset.x = blwidth;
  }
  this.line(
    [tx - floffset.x, ty - floffset.y],
    [tx - floffset.x + blwidth, ty - floffset.y],
  );
}


  /*
    txt: render text
    box: DrawBox
    attr: {
      align: left | center | right
      valign: top | middle | bottom
      color: '#333333',
      strike: false,
      font: {
        name: 'Arial',
        size: 14,
        bold: false,
        italic: false,
      }
    }
    textWrap: text wrapping
  */
  text(mtxt:string, box:DrawBox, attr:Partial<DefaultSettings['style']>, textWrap = true) {
    const { ctx } = this;
    const {
      align, valign, font, color, strike, underline,
    } = attr ?? {};
    const tx = box.textx(align);
    ctx.save();
    ctx.beginPath();
    if(font === undefined){
      throw new Error("Expected font")
    }
    this.attr({
      textAlign: align,
      textBaseline: valign,
      font: `${font?.italic ? 'italic' : ''} ${font?.bold ? 'bold' : ''} ${npx(font.size)}px ${font.name}`,
      fillStyle: color,
      strokeStyle: color,
    });
    const txts = `${mtxt}`.split('\n');
    const biw = box.innerWidth();
    const ntxts:string[] = [];
    txts.forEach((it) => {
      const txtWidth = ctx.measureText(it).width;
      if (textWrap && txtWidth > npx(biw)) {
        let textLine = { w: 0, len: 0, start: 0 };
        for (let i = 0; i < it.length; i += 1) {
          if (textLine.w >= npx(biw)) {
            ntxts.push(it.substring(textLine.start, textLine.start + textLine.len ));
            textLine = { w: 0, len: 0, start: i };
          }
          textLine.len += 1;
          textLine.w += ctx.measureText(it[i]).width + 1;
        }
        if (textLine.len > 0) {
          ntxts.push(it.substr(textLine.start, textLine.len));
        }
      } else {
        ntxts.push(it);
      }
    });
    const txtHeight = (ntxts.length - 1) * (font.size + 2);
    let ty = box.texty(valign, txtHeight);
    ntxts.forEach((txt) => {
      if(valign === undefined){
        throw new Error("Expected valign")
      }
      const txtWidth = ctx.measureText(txt).width;
      this.fillText(txt, tx, ty);
      if (strike) {
        this.drawFontLine('strike', tx, ty, align, valign, font.size, txtWidth);
      }
      if (underline) {
        this.drawFontLine('underline', tx, ty, align, valign, font.size, txtWidth);
      }
      ty += font.size + 2;
    });
    ctx.restore();
    return this;
  }

  border(style:"medium"|"thick"|"dashed"|"dotted"|"double", color:string) {
    const { ctx } = this;
    //@ts-expect-error
    ctx.lineWidth = thinLineWidth;
    ctx.strokeStyle = color;
    // console.log('style:', style);
    if (style === 'medium') {
      ctx.lineWidth = npx(2) - 0.5;
    } else if (style === 'thick') {
      ctx.lineWidth = npx(3);
    } else if (style === 'dashed') {
      ctx.setLineDash([npx(3), npx(2)]);
    } else if (style === 'dotted') {
      ctx.setLineDash([npx(1), npx(1)]);
    } else if (style === 'double') {
      ctx.setLineDash([npx(2), 0]);
    }
    return this;
  }

  line(...xys:[number,number][]) {
    const { ctx } = this;
    if (xys.length > 1) {
      ctx.beginPath();
      const [x, y] = xys[0];
      ctx.moveTo(Draw.npxLine(x), Draw.npxLine(y));
      for (let i = 1; i < xys.length; i += 1) {
        const [x1, y1] = xys[i];
        ctx.lineTo(Draw.npxLine(x1), Draw.npxLine(y1));
      }
      ctx.stroke();
    }
    return this;
  }

  
  strokeBorders(box:DrawBox) {
    const { ctx } = this;
    ctx.save();
    // border
    const {
      borderTop, borderRight, borderBottom, borderLeft,
    } = box;
    if (borderTop) {
      this.border(...borderTop);
      // console.log('box.topxys:', box.topxys());
      this.line(...box.topxys());
    }
    if (borderRight) {
      this.border(...borderRight);
      this.line(...box.rightxys());
    }
    if (borderBottom) {
      this.border(...borderBottom);
      this.line(...box.bottomxys());
    }
    if (borderLeft) {
      this.border(...borderLeft);
      this.line(...box.leftxys());
    }
    ctx.restore();
  }

  dropdown(box:DrawBox) {
    const { ctx } = this;
    const {
      x, y, width, height,
    } = box;
    const sx = x + width - 15;
    const sy = y + height - 15;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(npx(sx), npx(sy));
    ctx.lineTo(npx(sx + 8), npx(sy));
    ctx.lineTo(npx(sx + 4), npx(sy + 6));
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, .45)';
    ctx.fill();
    ctx.restore();
  }

  error(box:DrawBox) {
    const { ctx } = this;
    const { x, y, width } = box;
    const sx = x + width - 1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(npx(sx - 8), npx(y - 1));
    ctx.lineTo(npx(sx), npx(y - 1));
    ctx.lineTo(npx(sx), npx(y + 8));
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 0, 0, .65)';
    ctx.fill();
    ctx.restore();
  }

  frozen(box:DrawBox) {
    const { ctx } = this;
    const { x, y, width } = box;
    const sx = x + width - 1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(npx(sx - 8), npx(y - 1));
    ctx.lineTo(npx(sx), npx(y - 1));
    ctx.lineTo(npx(sx), npx(y + 8));
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 255, 0, .85)';
    ctx.fill();
    ctx.restore();
  }

  rect(box:DrawBox, dtextcb:Function) {
    const { ctx } = this;
    const {
      x, y, width, height, bgcolor,
    } = box;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = bgcolor || '#fff';
    ctx.rect(Draw.npxLine(x + 1), Draw.npxLine(y + 1), Draw.npx(width - 2), Draw.npx(height - 2));
    ctx.clip();
    ctx.fill();
    dtextcb();
    ctx.restore();
  }

  static dpr() {
    return window.devicePixelRatio || 1;
  }
  
  static thinLineWidth() {
    return Draw.dpr() - 0.5;
  }
  
  static npx(px:number) {
    return Math.trunc(px * Draw.dpr());
  }
  
  static npxLine(px:number) {
    const n = Draw.npx(px);
    return n > 0 ? n - 0.5 : 0.5;
  }
}

export default {};
const npx = Draw.npx;
const thinLineWidth = Draw.thinLineWidth;
export {
  Draw,
  DrawBox,
  thinLineWidth,
  npx,
};
