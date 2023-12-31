import React, { useRef, useCallback, useEffect, useMemo } from "react";
import { dequal as deepEqual } from "dequal";
import { isEqual, isNil } from "lodash";
import equal from "fast-deep-equal/es6";

type UseEffectParams = Parameters<typeof useEffect>;
type EffectCallback = UseEffectParams[0];
type DependencyList = UseEffectParams[1];
type UseEffectReturn = ReturnType<typeof useEffect>;

export const useIsFirstRender = () => {
  const ref = useRef(true);
  const firstRender = ref.current;
  ref.current = false;
  return firstRender;
};

export const useRefIfNotDefined = <T extends Record<string, unknown>>(
  hook: () => { current: T },
  prop?: { current: T }
): { current: T } => {
  const ref = hook();
  const returnRef = useMemo(() => (!isNil(prop) ? prop : ref), [ref]);
  return returnRef;
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const useDynamicCallback = <T>(callback: (...args: any[]) => T) => {
  const ref = useRef<typeof callback>(callback);
  ref.current = callback;
  const func: typeof callback = (...args: Parameters<typeof callback>) => ref.current.apply(this, args);
  return useCallback(func, []);
};

export type DeepEqualCheck = "lodash" | "dequal" | "fast";

export const deepCompareFn = (method?: DeepEqualCheck) => {
  method = method || "lodash";
  return {
    lodash: isEqual,
    dequal: deepEqual,
    fast: equal
  }[method];
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const deepCompare = (a: any, b: any, method?: DeepEqualCheck) => {
  return deepCompareFn(method)(a, b);
};

export const deepMemo = (c: React.ComponentType<Record<string, unknown>>, method?: DeepEqualCheck) =>
  React.memo(c, deepCompareFn(method));

export const useDeepEqualMemoDeps = (value: DependencyList, method?: DeepEqualCheck) => {
  const ref = useRef<DependencyList>();
  const signalRef = useRef<number>(0);
  if (!deepCompare(value, ref.current, method || "lodash")) {
    ref.current = value;
    signalRef.current += 1;
  }
  return [signalRef.current];
};

export const useDeepEqualEffect = (callback: EffectCallback, dependencies: DependencyList): UseEffectReturn => {
  return useEffect(callback, useDeepEqualMemoDeps(dependencies));
};

export function useDeepEqualMemo<T>(value: T, method?: DeepEqualCheck) {
  const ref = useRef<T | undefined>(undefined);
  const signalRef = useRef<number>(0);

  if (!deepCompare(ref.current, value, method)) {
    ref.current = value;
    signalRef.current += 1;
  }
  return signalRef.current;
}

export function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, []);
  return ref.current;
}
