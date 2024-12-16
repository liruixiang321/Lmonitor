import { Callback, IAnyObject } from "@lmonitor/types";
import { typeofAny } from "./verifyType";

export function validateOption(
  target: any,
  targetName: string,
  expectType: string
): any {
  if (!target) return false;
  if (typeofAny(target) !== expectType) {
    console.warn(`[Lmonitor warn]: ${targetName} type must be ${expectType}`);
  } else {
    return true;
  }
}

export function replaceAop(
  source: IAnyObject,
  name: string,
  replacement: Callback,
  isForced = false
) {
  if (source === undefined) return;
  if (name in source || isForced) {
    const originalFunc = source[name];
    const wrapped = replacement(originalFunc);
    if (typeof wrapped === "function") {
      source[name] = wrapped;
    }
  }
}
/**
 * 添加事件监听器
 * ../export
 * ../param {{ addEventListener: Function }} target
 * ../param {keyof TotalEventName} eventName
 * ../param {Function} handler
 * ../param {(boolean | Object)} opitons addEventListener函数中的options
 * ../returns
 */
export function on(
  target: any,
  eventName: string,
  handler: Callback,
  opitons = false
): void {
  target.addEventListener(eventName, handler, opitons);
}

//节流函数:一定时间内只执行一次

export function throttle(fn: Callback, time: number): Callback {
  let canrun = true;
  return function (this: any, ...args: any[]) {
    if (!canrun) return;
    fn.apply(this, args);
    canrun = false;
    setTimeout(() => {
      canrun = true;
    }, time);
  };
}

//防抖函数：一定时间内多次点击只出发一次
export function debounce(fn: Callback, time: number): Callback {
  let timer: any = null;
  return function (this: any, ...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, time);
  };
}
