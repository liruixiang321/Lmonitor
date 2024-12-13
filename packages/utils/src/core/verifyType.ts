export function typeofAny(target: any): string {
  return Object.prototype.toString.call(target).slice(8, -1).toLowerCase();
}
