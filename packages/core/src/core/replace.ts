import { on, replaceAop, throttle } from "@lmonitor/utils";
import { options } from "./options";
import { notify, subscribeEvent } from "./subscribe";
import { EVENTTYPES } from "@lmonitor/common";
import { ReplaceHandler } from "@lmonitor/types";

/**
 * 判断当前接口是否需要过滤
 */
function isFilterHttpUrl(url: string): boolean {
  return options.filterXhrUrlRegExp && options.filterXhrUrlRegExp.test(url);
}

/**
 * 根据事件类型替换原生事件
 */
function replace(type: EVENTTYPES): void {
  switch (type) {
    case EVENTTYPES.XHR:
      xhrReplace();
      break;
    case EVENTTYPES.FETCH:
      fetchReplace();
      break;
    case EVENTTYPES.ERROR:
      listenError();
      break;
    case EVENTTYPES.UNHANDLEDREJECTION:
      unhandledrejectionReplace();
      break;
    case EVENTTYPES.HISTORY:
      historyReplace();
      break;
    case EVENTTYPES.HASHCHANGE:
      listenHashchange();
      break;
    case EVENTTYPES.CLICK:
      domReplace();
      break;
    default:
      break;
  }
}

/**
 * 添加替换事件处理
 * 如果订阅成功则进行替换
 */
export function addReplaceHandler(handler: ReplaceHandler): void {
  if (!subscribeEvent(handler)) return;
  replace(handler.type);
}

export function xhrReplace(): void {
  if (!("XMLHttpRequest" in window)) {
    return;
  }
  const originalXhrProto = XMLHttpRequest.prototype;
  replaceAop(originalXhrProto, "open", (originalOpen: Function) => {
    return function (this: any, ...args: any[]): void {
      this.websee_xhr = {
        method: typeof args[0] === "string" ? args[0].toUpperCase() : args[0],
        url: args[1],
        sTime: Date.now(),
        type: EVENTTYPES.XHR,
      };
      originalOpen.apply(this, args);
    };
  });

  replaceAop(originalXhrProto, "send", (originalSend: Function) => {
    return function (this: any, ...args: any[]): void {
      const { method, url } = this.websee_xhr;
      // 监听loadend事件，接口成功或失败都会执行
      on(this, "loadend", function (this: any) {
        // TODO isSdkTransportUrl 判断当前接口是否为上报的接口
        // TODO isFilterHttpUrl 判断当前接口是否为需要过滤掉的接口
        if (isFilterHttpUrl(url)) return;

        const { responseType, response, status } = this;
        this.websee_xhr.requestData = args[0];
        this.websee_xhr.time = this.websee_xhr.sTime;
        this.websee_xhr.Status = status;
        if (["", "json", "text"].indexOf(responseType) !== -1) {
          if (
            options.handleHttpStatus &&
            typeof options.handleHttpStatus == "function"
          ) {
            this.websee_xhr.response = JSON.parse(response);
          }
        }
        this.websee_xhr.elapsedTime = Date.now() - this.websee_xhr.sTime;

        notify(EVENTTYPES.XHR, this.websee_xhr);
      });
      originalSend.apply(this, args);
    };
  });
}

export function fetchReplace(): any {
  if (!("fetch" in window)) {
    return;
  }
  replaceAop(window, EVENTTYPES.FETCH, (originalFetch: Function) => {
    return function (url: any, config: Partial<Request> = {}): void {
      const sTime = Date.now();
      const method = (config && config.method) || "GET";
      let fetchData = {
        type: EVENTTYPES.FETCH,
        method,
        requestData: config && config.body,
        url,
        response: "",
      };
      const headers = new Headers(config.headers || {});
      Object.assign(headers, {
        setRequestHeader: headers.set,
      });
      config = Object.assign({}, config, headers);
      return originalFetch.apply(window, [url, config]).then(
        (res: any) => {
          // 克隆一份，防止被标记已消费
          const tempRes = res.clone();
          const eTime = Date.now();
          fetchData = Object.assign({}, fetchData, {
            elapsedTime: eTime - sTime,
            Status: tempRes.status,
            time: sTime,
            response: tempRes,
          });
          tempRes.text().then((data: any) => {
            fetchData.response = data;
            // TODO isSdkTransportUrl 判断当前接口是否为上报的接口
            // TODO isFilterHttpUrl 判断当前接口是否为需要过滤掉的接口
            if (isFilterHttpUrl(url)) return;
            // TODO handleHttpStatus 处理接口状态,只有报错的接口才上报response
            if (
              options.handleHttpStatus &&
              typeof options.handleHttpStatus == "function"
            ) {
              fetchData.response = JSON.parse(data);
            }
            notify(EVENTTYPES.FETCH, fetchData);
          });
          return res;
        },
        (err: any) => {
          const eTime = Date.now();
          if (isFilterHttpUrl(url)) return;
          fetchData = Object.assign({}, fetchData, {
            elapsedTime: eTime - sTime,
            status: 0,
            time: sTime,
            response: err,
          });
          notify(EVENTTYPES.FETCH, fetchData);
          throw err;
        }
      );
    };
  });
}
/**
 * 监听error事件
 */
function listenError(): void {
  window.addEventListener(EVENTTYPES.ERROR, function (e: ErrorEvent) {
    notify(EVENTTYPES.ERROR, e);
  });
}

/**
 * 监听unhandledrejection事件
 */
function unhandledrejectionReplace(): void {
  window.addEventListener(
    EVENTTYPES.UNHANDLEDREJECTION,
    function (e: PromiseRejectionEvent) {
      notify(EVENTTYPES.UNHANDLEDREJECTION, e);
    }
  );
}

let lastHref: string = window.location.href;
/**
 * 重写history相关事件
 */
function historyReplace(): void {
  const oldOnpopstate = window.onpopstate;
  window.onpopstate = function (this: any, ev: PopStateEvent): any {
    const to = window.location.href;
    const from = lastHref;
    lastHref = to;
    notify(EVENTTYPES.HISTORY, {
      from,
      to,
    });
    oldOnpopstate && oldOnpopstate.apply(this, [ev]);
  };
  function historyReplaceFn(originalHistoryFn: Function): any {
    return function (this: History, ...args: any[]): void {
      const url = args.length > 2 ? args[2] : undefined;
      if (url) {
        const from = lastHref;
        const to = String(url);
        lastHref = to;
        notify(EVENTTYPES.HISTORY, {
          from,
          to,
        });
      }
      return originalHistoryFn.apply(this, args);
    };
  }
  window.history.pushState = historyReplaceFn(window.history.pushState);
  window.history.replaceState = historyReplaceFn(window.history.replaceState);
}

/**
 * 监听hashchange事件
 */
function listenHashchange(): void {
  window.addEventListener(EVENTTYPES.HASHCHANGE, function (e: HashChangeEvent) {
    notify(EVENTTYPES.HASHCHANGE, e);
  });
}

/**
 * 监听点击事件
 */
function domReplace(): void {
  if (!window.document) return;
  const throttleClick = throttle(notify, options.throttleDelayTime);
  window.addEventListener(
    EVENTTYPES.CLICK,
    function (e: MouseEvent) {
      throttleClick(EVENTTYPES.CLICK, {
        category: "click",
        data: e,
      });
    },
    true
  );
}
