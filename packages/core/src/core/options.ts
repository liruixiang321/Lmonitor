import { InitOptions } from "@lmonitor/types";
import { validateOption } from "@lmonitor/utils";

export class Options {
  dsn = ""; // 监控上报接口的地址
  throttleDelayTime = 0; // click事件的节流时长
  overTime = 10; // 接口超时时长
  whiteBoxElements: string[] = ["html", "body", "#app", "#root"]; // 白屏检测的容器列表
  silentWhiteScreen = false; // 是否开启白屏检测
  skeletonProject = false; // 项目是否有骨架屏
  filterXhrUrlRegExp: any; // 过滤的接口请求正则
  handleHttpStatus: any; // 处理接口返回的 response
  repeatCodeError = false; // 是否去除重复的代码错误，重复的错误只上报一次

  constructor() {}
  //绑定用户配置项
  bindOptions(options: InitOptions): void {
    const {
      dsn,
      filterXhrUrlRegExp,
      throttleDelayTime = 0,
      overTime = 10,
      silentWhiteScreen = false,
      whiteBoxElements = ["html", "body", "#app", "#root"],
      skeletonProject = false,
      handleHttpStatus,
      repeatCodeError = false,
    } = options;

    // TODO: 后续添加validateOption验证
    validateOption(dsn, "dsn", "string") && (this.dsn = dsn);
    validateOption(throttleDelayTime, "throttleDelayTime", "number") &&
      (this.throttleDelayTime = throttleDelayTime);
    validateOption(overTime, "overTime", "number") &&
      (this.overTime = overTime);
    validateOption(filterXhrUrlRegExp, "filterXhrUrlRegExp", "regexp") &&
      (this.filterXhrUrlRegExp = filterXhrUrlRegExp);
    validateOption(silentWhiteScreen, "silentWhiteScreen", "boolean") &&
      (this.silentWhiteScreen = silentWhiteScreen);
    validateOption(skeletonProject, "skeletonProject", "boolean") &&
      (this.skeletonProject = skeletonProject);
    validateOption(whiteBoxElements, "whiteBoxElements", "array") &&
      (this.whiteBoxElements = whiteBoxElements);
    validateOption(handleHttpStatus, "handleHttpStatus", "function") &&
      (this.handleHttpStatus = handleHttpStatus);
    validateOption(repeatCodeError, "repeatCodeError", "boolean") &&
      (this.repeatCodeError = repeatCodeError);
  }
}

// 创建全局唯一的options实例---单例模式
const _support: any = window;
const options = _support.options || (_support.options = new Options());

// 处理配置项
export function handleOptions(paramOptions: InitOptions): void {
  // TODO: 后续添加setSilentFlag、breadcrumb和transportData的配置
  options.bindOptions(paramOptions);
}

export { options };
// 为什么要这样导出options呢为什么不直接导出呢？
