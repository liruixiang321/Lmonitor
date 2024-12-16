import { EVENTTYPES } from "@lmonitor/common";
import { ReplaceHandler } from "@lmonitor/types";

// 存储事件处理函数的对象
const handlers: { [key in EVENTTYPES]?: Function[] } = {};

/**
 * 订阅事件
 * @param handler 事件处理对象
 * @returns boolean 是否订阅成功
 */
export function subscribeEvent(handler: ReplaceHandler): boolean {
  if (!handler) return false;
  
  // 初始化事件处理数组
  handlers[handler.type] = handlers[handler.type] || [];
  handlers[handler.type]?.push(handler.callback);
  return true;
}

/**
 * 通知事件发生
 * @param type 事件类型
 * @param data 事件数据
 */
export function notify(type: EVENTTYPES, data?: any): void {
  if (!type || !handlers[type]) return;
  
  // 执行所有注册的事件处理函数
  handlers[type]?.forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error(
        `Lmonitor: 事件处理发生错误\nType:${type}\nError:`,
        error
      );
    }
  });
}
