declare module "natural/lib/natural/distance/index.js" {
  export function JaroWinklerDistance(
    s1: string,
    s2: string,
    options?: { dj?: number; ignoreCase?: boolean },
  ): number;
}
