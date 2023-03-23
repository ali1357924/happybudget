import * as api from "api";

import * as model from "../../model";
import * as rows from "../rows";

import * as table from "./table";

export type ShareConfig<
  T extends model.PublicTypedApiModel,
  R extends rows.Row,
  M extends model.RowTypedApiModel,
> = {
  readonly instance: T;
  readonly table: table.TableInstance<R, M>;
  readonly onCreated?: (token: model.PublicToken) => void;
  readonly onUpdated?: (token: model.PublicToken) => void;
  readonly onDeleted?: () => void;
  readonly create: (
    id: number,
    payload: api.PublicTokenPayload,
    options: Http.RequestOptions,
  ) => Promise<model.PublicToken>;
};
