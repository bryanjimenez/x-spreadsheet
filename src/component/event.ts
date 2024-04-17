/* global window */
import { type Element } from "./element";
import { type Direction } from "./sheet";

export interface HTMLEvent extends Event {
  target: HTMLElement
}

export interface HTMLInputEvent extends Event {
  target: HTMLInputElement
}

export function bind(target:Window|HTMLElement, name:string, fn:EventListener) {
  target.addEventListener(name, fn);
}

export function unbind(target:Window|HTMLElement, name:string, fn:EventListener) {
  target.removeEventListener(name, fn);
}
export function unbindClickoutside(el:Element<HTMLElement>) {
  if ('xclickoutside' in el) {
    unbind(window.document.body, 'click', el.xclickoutside);
    delete el.xclickoutside;
  }
}

// the left mouse button: mousedown → mouseup → click
// the right mouse button: mousedown → contenxtmenu → mouseup
// the right mouse button in firefox(>65.0): mousedown → contenxtmenu → mouseup → click on window
export function bindClickoutside(el:Element<HTMLElement>, cb?:Function) {
  el.xclickoutside = (evt:MouseEvent) => {
    // ignore double click
    // console.log('evt:', evt);
    if (evt.detail === 2 || el.contains(evt.target)) return;
    if (cb) cb(el);
    else {
      el.hide();
      unbindClickoutside(el);
    }
  };
  bind(window.document.body, 'click', el.xclickoutside);
}
export function mouseMoveUp(target:Window, movefunc:EventListener, upfunc:EventListener) {
  bind(target, 'mousemove', movefunc);
  const xEvtUp = (evt:Event) => {
    unbind(target, 'mousemove', movefunc);
    unbind(target, 'mouseup', xEvtUp);
    upfunc(evt);
  };
  bind(target, 'mouseup', xEvtUp);
}

function calTouchDirection(spanx:number, spany:number, evt:TouchEvent, cb:(d:string, span:number, evt:Event)=>void) {
  let direction = '';
  // console.log('spanx:', spanx, ', spany:', spany);
  if (Math.abs(spanx) > Math.abs(spany)) {
    // horizontal
    direction = spanx > 0 ? 'right' : 'left';
    cb(direction, spanx, evt);
  } else {
    // vertical
    direction = spany > 0 ? 'down' : 'up';
    cb(direction, spany, evt);
  }
}
// cb = (direction, distance) => {}
export function bindTouch(target:HTMLElement, { move, end }:{move:(d: Direction, span: number, evt: Event) => void, end:(d: string, span: number, evt: Event) => void}) {
  let startx = 0;
  let starty = 0;
  bind(target, 'touchstart', (evt:Event) => {
    if(evt instanceof TouchEvent){
      const { pageX, pageY } = evt.touches[0];
      startx = pageX;
      starty = pageY;
    }
  });
  bind(target, 'touchmove', (evt:Event) => {
    if (!move) return;
    if(evt instanceof TouchEvent){
      const { pageX, pageY } = evt.changedTouches[0];
      const spanx = pageX - startx;
      const spany = pageY - starty;
      if (Math.abs(spanx) > 10 || Math.abs(spany) > 10) {
        // console.log('spanx:', spanx, ', spany:', spany);
        calTouchDirection(spanx, spany, evt, move);
        startx = pageX;
        starty = pageY;
      }
      evt.preventDefault();
    }
  });
  bind(target, 'touchend', (evt:Event) => {
    if (!end) return;
    if(evt instanceof TouchEvent){
      const { pageX, pageY } = evt.changedTouches[0];
      const spanx = pageX - startx;
      const spany = pageY - starty;
      calTouchDirection(spanx, spany, evt, end);
    }
  });
}

// eventemiter
export function createEventEmitter() {
  const listeners = new Map();

  function on(eventName:string, callback:Function) {
    const push = () => {
      const currentListener = listeners.get(eventName);
      return (Array.isArray(currentListener)
          && currentListener.push(callback))
          || false;
    };

    const create = () => listeners.set(eventName, [].concat(callback));

    return (listeners.has(eventName)
        && push())
        || create();
  }

  function fire(eventName: string, args:unknown[]) {
    const exec = () => {
      const currentListener = listeners.get(eventName);
      for (const callback of currentListener) callback.call(null, ...args);
    };

    return listeners.has(eventName)
        && exec();
  }

  function removeListener(eventName:string, callback:EventListener) {
    const remove = () => {
      const currentListener = listeners.get(eventName);
      const idx = currentListener.indexOf(callback);
      return (idx >= 0)
          && currentListener.splice(idx, 1)
          && listeners.get(eventName).length === 0
          && listeners.delete(eventName);
    };

    return listeners.has(eventName)
        && remove();
  }

  function once(eventName:string, callback:EventListener) {
    const execCalllback = (...args:string[]) => {
      callback.call(null, ...args);
      removeListener(eventName, execCalllback);
    };

    return on(eventName, execCalllback);
  }

  function removeAllListeners() {
    listeners.clear();
  }

  return {
    get current() {
      return listeners;
    },
    on,
    once,
    fire,
    removeListener,
    removeAllListeners,
  };
}
