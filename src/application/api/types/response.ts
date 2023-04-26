import * as schemas from "lib/schemas";

export type FileUploadResponse = {
  readonly fileUrl: string;
};

export type ApiResponseBody = schemas.Json;

/**
 * The form of the JSON body for responses rendered on the server when the request is successful.
 */
export type ApiSuccessResponse<D extends ApiResponseBody = ApiResponseBody> = D;

export type ListResponseIteree = schemas.Json;

export type ApiListResponse<M extends ListResponseIteree> = {
  readonly data: M[];
  readonly count: number;
};

export type MarkupResponseType<
  B extends import("lib/model/budgeting").Budget | import("lib/model/budgeting").Template =
    | import("lib/model/budgeting").Budget
    | import("lib/model/budgeting").Template,
  A extends import("lib/model/budgeting").Account | import("lib/model/budgeting").SubAccount =
    | import("lib/model/budgeting").Account
    | import("lib/model/budgeting").SubAccount,
> =
  | ParentChildResponse<B, import("lib/model/budgeting").Markup>
  | AncestryResponse<B, A, import("lib/model/budgeting").Markup>;

export const markupResponseTypeIsAncestry = <
  B extends import("lib/model/budgeting").Budget | import("lib/model/budgeting").Template =
    | import("lib/model/budgeting").Budget
    | import("lib/model/budgeting").Template,
  A extends import("lib/model/budgeting").Account | import("lib/model/budgeting").SubAccount =
    | import("lib/model/budgeting").Account
    | import("lib/model/budgeting").SubAccount,
>(
  response: MarkupResponseType<B, A>,
): response is AncestryResponse<B, A, import("lib/model/budgeting").Markup> =>
  (response as AncestryResponse<B, A, import("lib/model/budgeting").Markup>).parent !== undefined &&
  (response as AncestryResponse<B, A, import("lib/model/budgeting").Markup>).budget !== undefined;

export type ReorderResponse = { data: number[] };

export type ParentResponse<PARENT extends import("lib/model").ApiModel> = {
  readonly parent: PARENT;
};

export type ParentChildResponse<
  PARENT extends import("lib/model").ApiModel,
  CHILD extends import("lib/model").ApiModel,
> = ParentResponse<PARENT> & {
  readonly data: CHILD;
};

export type AncestryResponse<
  GP extends import("lib/model").ApiModel,
  PARENT extends import("lib/model").ApiModel,
  CHILD extends import("lib/model").ApiModel,
> = ParentChildResponse<PARENT, CHILD> & {
  readonly budget: GP;
};

export type ChildListResponse<CHILD extends import("lib/model").ApiModel> = {
  readonly children: CHILD[];
};

export type ParentChildListResponse<
  PARENT extends import("lib/model").ApiModel,
  CHILD extends import("lib/model").ApiModel,
> = ParentResponse<PARENT> & ChildListResponse<CHILD>;

export type ParentsResponse<
  GP extends import("lib/model").ApiModel,
  PARENT extends import("lib/model").ApiModel,
> = {
  readonly budget: GP;
  readonly parent: PARENT;
};

export type AncestryListResponse<
  GP extends import("lib/model").ApiModel,
  PARENT extends import("lib/model").ApiModel,
  CHILD extends import("lib/model").ApiModel,
> = ParentChildListResponse<PARENT, CHILD> & {
  readonly budget: GP;
};
