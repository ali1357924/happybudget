import * as types from "../types";

export type PublicToken = types.ApiModel<{
  readonly public_id: string;
  readonly is_expired: boolean;
  readonly expires_at: string | null;
  readonly created_at: string;
}>;

export type PublicTypedApiModel<
  TP extends types.ApiModelType = types.ApiModelType,
  T extends types.JsonObject = types.JsonObject,
> = types.TypedApiModel<
  TP,
  T & {
    readonly public_token: PublicToken | null;
  }
>;
