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
