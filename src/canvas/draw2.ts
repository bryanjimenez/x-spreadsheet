class Draw {

  el: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D

  constructor(el:HTMLCanvasElement) {
    this.el = el;

    const ctx = el.getContext('2d');
    if(!ctx){
      throw new Error('Not a valid elment');
    }

    this.ctx = ctx;
  }

  clear() {
    const { width, height } = this.el;
    this.ctx.clearRect(0, 0, width, height);
    return this;
  }

  attr(m:unknown) {
    Object.assign(this.ctx, m);
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

  closePath() {
    this.ctx.closePath();
    return this;
  }

  measureText(text:string) {
    return this.ctx.measureText(text);
  }

  rect(x:number, y:number, width:number, height:number) {
    this.ctx.rect(x, y, width, height);
    return this;
  }

  scale(x:number, y:number) {
    this.ctx.scale(x, y);
    return this;
  }

  rotate(angle:number) {
    this.ctx.rotate(angle);
    return this;
  }

  translate(x:number, y:number) {
    this.ctx.translate(x, y);
    return this;
  }

  transform(a:number, b:number, c:number, d:number, e:number) {
    //@ts-expect-error this.ctx.transform 6th variable
    this.ctx.transform(a, b, c, d, e);
    return this;
  }

  fillRect(x:number, y:number, w:number, h:number) {
    this.ctx.fillRect(x, y, w, h);
    return this;
  }

  strokeRect(x:number, y:number, w:number, h:number) {
    this.ctx.strokeRect(x, y, w, h);
    return this;
  }

  fillText(text:string, x:number, y:number, maxWidth:number) {
    this.ctx.fillText(text, x, y, maxWidth);
    return this;
  }

  strokeText(text:string, x:number, y:number, maxWidth:number) {
    this.ctx.strokeText(text, x, y, maxWidth);
    return this;
  }
}

export default {};
export {
  Draw,
};
