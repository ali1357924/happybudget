import { client } from "api";
import * as services from "./services";

export const getSubAccount = services.retrieveService<Model.SubAccount>((id: number) => ["subaccounts", id]);
export const getSubAccountMarkups = services.detailListService<Model.Markup>((id: number) => [
  "subaccounts",
  id,
  "markups"
]);
export const getSubAccountGroups = services.detailListService<Model.Group>((id: number) => [
  "subaccounts",
  id,
  "groups"
]);
export const deleteSubAccount = services.deleteService((id: number) => ["subaccounts", id]);
export const updateSubAccount = services.detailPatchService<Http.SubAccountPayload, Model.SubAccount>((id: number) => [
  "subaccounts",
  id
]);
export const createSubAccountChild = services.detailPostService<Http.SubAccountPayload, Model.SubAccount>(
  (id: number) => ["subaccounts", id, "children"]
);
export const createSubAccountMarkup = services.detailPostService<
  Http.MarkupPayload,
  Http.BudgetParentContextDetailResponse<Model.Markup, Model.Account>
>((id: number) => ["subaccounts", id, "markups"]);

export const createSubAccountGroup = services.detailPostService<Http.GroupPayload, Model.Group>((id: number) => [
  "subaccounts",
  id,
  "groups"
]);

export const getSubAccountChildren = async <M extends Model.SubAccount | Model.SimpleSubAccount = Model.SubAccount>(
  subaccountId: number,
  query: Http.ListQuery = {},
  options: Http.RequestOptions = {}
): Promise<Http.ListResponse<M>> => {
  const url = services.URL.v1("subaccounts", subaccountId, "children");
  return client.list<M>(url, query, options);
};

export const getSubAccountUnits = async (options: Http.RequestOptions = {}): Promise<Http.ListResponse<Model.Tag>> => {
  const url = services.URL.v1("subaccounts", "units");
  return client.list<Model.Tag>(url, {}, options);
};

export const getSubAccountAttachments = services.detailListService<Model.Attachment>((id: number) => [
  "subaccounts",
  id,
  "attachments"
]);
export const deleteSubAccountAttachment = services.detailDeleteService((id: number, objId: number) => [
  "subaccounts",
  objId,
  "attachments",
  id
]);
export const uploadSubAccountAttachment = services.detailPostService<FormData, { data: Model.Attachment[] }>(
  (id: number) => ["subaccounts", id, "attachments"]
);

export const bulkUpdateSubAccountChildren = async <B extends Model.Budget | Model.Template>(
  id: number,
  data: Http.BulkUpdatePayload<Http.SubAccountPayload>,
  options: Http.RequestOptions = {}
): Promise<Http.BudgetBulkResponse<B, Model.SubAccount, Model.SubAccount>> => {
  const url = services.URL.v1("subaccounts", id, "bulk-update-children");
  return client.patch<Http.BudgetBulkResponse<B, Model.SubAccount, Model.SubAccount>>(url, data, options);
};

export const bulkDeleteSubAccountChildren = async <B extends Model.Budget | Model.Template>(
  id: number,
  ids: number[],
  options: Http.RequestOptions = {}
): Promise<Http.BudgetBulkDeleteResponse<B, Model.SubAccount>> => {
  const url = services.URL.v1("subaccounts", id, "bulk-delete-children");
  return client.patch<Http.BudgetBulkDeleteResponse<B, Model.SubAccount>>(url, { ids }, options);
};

export const bulkDeleteSubAccountMarkups = async <B extends Model.Budget | Model.Template>(
  id: number,
  ids: number[],
  options: Http.RequestOptions = {}
): Promise<Http.BudgetBulkDeleteResponse<B, Model.SubAccount>> => {
  const url = services.URL.v1("subaccounts", id, "bulk-delete-markups");
  return client.patch<Http.BudgetBulkDeleteResponse<B, Model.SubAccount>>(url, { ids }, options);
};

export const bulkCreateSubAccountChildren = async <B extends Model.Budget | Model.Template>(
  id: number,
  payload: Http.BulkCreatePayload<Http.SubAccountPayload>,
  options: Http.RequestOptions = {}
): Promise<Http.BudgetBulkResponse<B, Model.SubAccount, Model.SubAccount>> => {
  const url = services.URL.v1("subaccounts", id, "bulk-create-children");
  return client.patch<Http.BudgetBulkResponse<B, Model.SubAccount, Model.SubAccount>>(url, payload, options);
};
