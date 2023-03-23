import { z } from "zod";

import { model } from "lib";

export type Order = 1 | -1 | 0;

export type DefinitiveOrder = 1 | -1;

export type FieldOrder<F extends string = string> = {
  readonly field: F;
  readonly order: Order;
};

export type Ordering<F extends string = string> = FieldOrder<F>[];

const FieldOrderSchema = z
  .object({
    field: z.string().nonempty().toLowerCase(),
    order: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
  })
  .strict();

export type QueryParamValue = string | number | boolean;
export type RawQueryParamValue<F extends string = string> =
  | QueryParamValue
  | undefined
  | null
  | Ordering<F>
  | number[]
  | string[];

export type RawQuery<F extends string = string> = Record<string, RawQueryParamValue<F>>;
export type ProcessedQuery = Record<string, QueryParamValue>;

export type ListQuery<F extends string = string> = {
  readonly ordering?: Ordering<F>;
  readonly ids?: number[];
  readonly exclude?: number[];
};

export type ModelOrderableField<M extends model.ApiModel> = Exclude<keyof M, "id"> & string;

export type ModelListQuery<M extends model.ApiModel> = ListQuery<ModelOrderableField<M>>;

function getQueryOrderingSchema<F extends string = string>(
  fields: F[],
): z.ZodArray<z.ZodType<FieldOrder<F>>>;

function getQueryOrderingSchema(fields?: undefined): z.ZodArray<z.ZodType<FieldOrder<string>>>;

function getQueryOrderingSchema<F extends string = string>(
  fields?: F[] | undefined,
): z.ZodArray<z.ZodType<FieldOrder<string>>> | z.ZodArray<z.ZodType<FieldOrder<F>>> {
  if (fields && fields.length !== 0) {
    let schema: z.ZodType<FieldOrder<F>>;
    if (fields && fields.length > 2) {
      schema = FieldOrderSchema.extend({
        field: z.enum(fields as [F, F, ...F[]]),
      }) as z.ZodType<FieldOrder<F>>;
    } else {
      schema = FieldOrderSchema.extend({
        field: z.literal(fields[0]),
      }) as z.ZodType<FieldOrder<F>>;
    }
    return z.array(schema);
  }
  return z.array(FieldOrderSchema);
}

export function safeQueryOrdering<F extends string = string>(
  param: unknown,
  fields: F[],
): Ordering<F>;

export function safeQueryOrdering(param: unknown): Ordering<string>;

export function safeQueryOrdering<F extends string = string>(
  param: unknown,
  fields?: F[],
): Ordering<F> | Ordering<string> {
  if (fields) {
    const schema = getQueryOrderingSchema(fields);
    return model.ensureObjectOfType<Ordering<F>>(param, schema);
  }
  const schema = getQueryOrderingSchema();
  return model.ensureObjectOfType<Ordering<string>>(param, schema);
}

export function queryParamIsOrdering<F extends string = string>(
  param: unknown,
  fields: F[],
): param is Ordering<F>;

export function queryParamIsOrdering(param: unknown): param is Ordering<string>;

export function queryParamIsOrdering<F extends string = string>(
  param: unknown,
  fields?: F[],
): param is Ordering<F> | Ordering<string> {
  if (fields) {
    const schema = getQueryOrderingSchema(fields);
    return model.isObjectOfType<Ordering<F>>(param, schema) !== false;
  }
  const schema = getQueryOrderingSchema();
  return model.isObjectOfType<Ordering<string>>(param, schema) !== false;
}
