import { includes, isNil } from "lodash";
import * as parsers from "./parsers";

const DEFAULT_REQUIRED = true;

type EnvMap<T> = Partial<{ [key in NodeJS.ProcessEnv["REACT_APP_PRODUCTION_ENV"]]: T }>;
type EnvMappedValue<T> = EnvMap<T> | T;

const valueIsMapped = <T>(d: EnvMappedValue<T>): d is EnvMap<T> => typeof d === "object";

export type ConfigValue = boolean | number | string;
type ConfigSource = "memory" | "node";
type RawValue = [string, ConfigSource] | undefined;

/**
 * Configuration messages are used in the Error that is raised when a value
 * fails to be correctly parsed or fails validation checks.
 */
export type ConfigMessageCallbackParams<T> = {
  readonly name: string;
  readonly value: T;
};
export type ConfigMessageCallback<T> = (p: ConfigMessageCallbackParams<T>) => string;
export type ConfigMessage<T> = string | ConfigMessageCallback<T>;

/**
 * Validators are responsible for validating that a *defined* value read from
 * the ENV file or local storage meets certain criteria.  Validators are applied
 * after any potential parsers.
 */
type ConfigValidatorResult<T, B extends boolean = boolean> = ConfigMessage<T> | B;
type FailedConfigValidatorResult<T> = {
  readonly result: ConfigValidatorResult<T, false>;
  readonly value: T;
};
type ConfigValidator<T> = (v: T) => ConfigValidatorResult<T>;
type ConfigRawValidator = ConfigValidator<string | undefined>;

const isConfigValidatorResult = <V>(
  result: FailedConfigValidatorResult<V> | parsers.FailedConfigParserResult
): result is FailedConfigValidatorResult<V> => (result as FailedConfigValidatorResult<V>).result !== undefined;

type IEnvVar<V extends ConfigValue, UV extends V | undefined = V> = {
  readonly getValue: () => UV;
};

type ConfigParams<V extends ConfigValue> = {
  readonly parser?: parsers.Parser<V>;
  readonly required?: EnvMappedValue<boolean>;
  readonly defaultValue?: EnvMappedValue<V>;
  /* Either the the `nodeSourceName` or `memorySourceName` (or both) must be
     included. */
  readonly nodeSourceName?: keyof NodeJS.ProcessEnv & string;
  readonly memorySourceName?: string;
  readonly validators?: SingleOrArray<ConfigValidator<V>>;
  readonly rawValidators?: SingleOrArray<ConfigRawValidator>;
  readonly warning?: EnvMappedValue<() => void>;
};

class _Config<V extends ConfigValue, UV extends V | undefined = V> implements IEnvVar<V, UV> {
  private readonly parser: parsers.Parser<V> | undefined;
  private readonly required: EnvMappedValue<boolean> | undefined;
  private readonly defaultValue: EnvMappedValue<V> | undefined;
  private readonly _nodeSourceName: (keyof NodeJS.ProcessEnv & string) | undefined;
  private readonly memorySourceName: string | undefined;
  private readonly validators: ConfigValidator<V>[];
  private readonly rawValidators: ConfigRawValidator[];
  private readonly warning?: EnvMappedValue<() => void>;

  constructor(config: ConfigParams<V>) {
    this.parser = config.parser;
    this.warning = config.warning;
    this.required = config.required;
    this.defaultValue = config.defaultValue;
    this._nodeSourceName = config.nodeSourceName;
    this.memorySourceName = config.memorySourceName;
    this.validators =
      config.validators === undefined ? [] : Array.isArray(config.validators) ? config.validators : [config.validators];
    this.rawValidators =
      config.rawValidators === undefined
        ? []
        : Array.isArray(config.rawValidators)
        ? config.rawValidators
        : [config.rawValidators];
  }

  public static getProdEnv = (): NodeJS.ProcessEnv["REACT_APP_PRODUCTION_ENV"] => {
    if (
      process.env.REACT_APP_PRODUCTION_ENV == undefined ||
      !includes(["prod", "dev", "local"], process.env.REACT_APP_PRODUCTION_ENV)
    ) {
      throw new Error(
        `Invalid value ${process.env.REACT_APP_PRODUCTION_ENV} encountered for ` +
          "parameter that must be specified as 'prod', 'dev' or 'local'."
      );
    }
    return process.env.REACT_APP_PRODUCTION_ENV;
  };

  public getValue = (): UV => {
    let value: V | undefined = this.getDefault();
    let source: ConfigSource | undefined = undefined;
    let rawValue: string;

    const raw = this.getRawValue();
    if (raw !== undefined) {
      [rawValue, source] = raw;
      this.performRawValidation(rawValue);
      if (!isNil(this.parser)) {
        const parserResult = this.parser(rawValue);
        if (parsers.isParserFailedResult(parserResult)) {
          this.failedValidation(parserResult, source);
        } else {
          value = parserResult;
        }
      } else {
        value = rawValue as V;
      }
    } else {
      this.performRawValidation(raw);
    }
    if (value === undefined) {
      const isRequired = this.getIsRequired();
      if (isRequired === true) {
        throw new Error(`Config ${this.getExternalName(source)} is not defined and is required.`);
      }
      if (!isNil(this.warning) && valueIsMapped(this.warning)) {
        const warnFn = this.warning[_Config.getProdEnv()];
        warnFn?.();
      } else {
        this.warning?.();
      }
    } else {
      /* The source will only be undefined in the case that the value is
         undefined. */
      this.performValidation(value, source);
    }
    /* It is up to the developer at this point to type UV such that it excludes
       undefined values in the case that the configuration is required. */
    return value as UV;
  };

  private get externalNodeSourceName(): string | undefined {
    if (this._nodeSourceName !== undefined && this._nodeSourceName.startsWith("REACT_APP_")) {
      return this._nodeSourceName.split("REACT_APP_")[1];
    }
    return this._nodeSourceName;
  }

  private get internalNodeSourceName(): string | undefined {
    if (this._nodeSourceName !== undefined && !this._nodeSourceName.startsWith("REACT_APP_")) {
      return `REACT_APP_${this._nodeSourceName}`;
    }
    return this._nodeSourceName;
  }

  private get externalName(): string {
    if (isNil(this.memorySourceName) && isNil(this.externalNodeSourceName)) {
      throw new Error("Configuration does not specify `memorySourceName` or `nodeSourceName`.");
    }
    return (this.externalNodeSourceName || this.memorySourceName) as string;
  }

  private getExternalName = (source?: ConfigSource) =>
    source === undefined
      ? this.externalName
      : ({
          memory: this.memorySourceName,
          node: this.externalNodeSourceName
        }[source] as string);

  private failedValidation = <CV extends V | string | undefined>(
    result: FailedConfigValidatorResult<CV> | parsers.FailedConfigParserResult,
    source?: ConfigSource
  ) => {
    let message = `Invalid value ${String(result.value)} provided for config ${this.getExternalName(source)}.`;
    if (isConfigValidatorResult(result)) {
      const content = result.result;
      if (typeof content === "string") {
        message = content;
      } else if (typeof content === "function") {
        message = content({ value: result.value, name: this.getExternalName(source) });
      }
    } else if (typeof result.message === "string") {
      message = result.message;
    } else if (typeof result.message === "function") {
      message = result.message({ name: this.getExternalName(source), value: result.value });
    }
    throw new Error(message);
  };

  private performValidation = (v: V, source?: ConfigSource) => {
    for (let i = 0; i < this.validators.length; i++) {
      const result = this.validators[i](v);
      if (result !== true) {
        this.failedValidation({ result, value: v }, source);
      }
    }
  };

  private performRawValidation = (v: string | undefined, source?: ConfigSource) => {
    for (let i = 0; i < this.rawValidators.length; i++) {
      const result = this.rawValidators[i](v);
      if (result !== true) {
        this.failedValidation({ result, value: v }, source);
      }
    }
  };

  public getIsRequired = (): boolean => {
    const r = this.required;
    if (isNil(r)) {
      return false;
    } else if (valueIsMapped<boolean>(r)) {
      const mapped = r[_Config.getProdEnv()];
      return mapped === undefined ? DEFAULT_REQUIRED : mapped;
    } else {
      return r;
    }
  };

  private getDefault = (): V | undefined => {
    const d = this.defaultValue;
    if (isNil(d)) {
      return undefined;
    } else if (valueIsMapped<V>(d)) {
      return d[_Config.getProdEnv()];
    } else {
      return d;
    }
  };

  private getRawValue = (): RawValue => {
    if (isNil(this.memorySourceName) && isNil(this.internalNodeSourceName)) {
      throw new Error("Configuration does not specify `memorySourceName` or `nodeSourceName`.");
    }
    // Priority should be given to values that are present in the ENV file.
    let rawValue = this.getRawValueFromEnv();
    if (rawValue === undefined) {
      rawValue = this.getRawValueFromMemory();
      if (rawValue !== undefined) {
        return [rawValue, "memory"];
      }
      return rawValue;
    }
    return [rawValue, "node"];
  };

  private getRawValueFromEnv = (): string | undefined =>
    this.internalNodeSourceName !== undefined ? process.env[this.internalNodeSourceName] : undefined;

  private getRawValueFromMemory = (): string | undefined => {
    if (isNil(this.memorySourceName)) {
      return undefined;
    }
    const memoryValue = localStorage.getItem(this.memorySourceName);
    /* LocalStorage will not return `undefined` if the value is not present, but
       `null`.  We need to treat missing values as `undefined` to be consistent
       with the manner in which we read the values from an env file. */
    return memoryValue === null ? undefined : memoryValue;
  };
}

export const Config = <V extends ConfigValue, UV extends V | undefined = V>(config: ConfigParams<V>) =>
  new _Config<V, UV>(config).getValue();

export const BooleanConfig = (config: Omit<ConfigParams<boolean>, "parser">) =>
  Config<boolean>({
    ...config,
    parser: parsers.booleanParser()
  });

export default Config;
