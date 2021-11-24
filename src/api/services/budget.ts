import { client } from "api";
import * as services from "./services";

export const getBudget = services.retrieveService<Model.Budget>((id: number) => ["budgets", id]);
export const getBudgetPdf = services.retrieveService<Model.PdfBudget>((id: number) => ["budgets", id, "pdf"]);
export const getBudgets = services.listService<Model.SimpleBudget>(["budgets"]);
export const getBudgetAccounts = services.detailListService<Model.Account>((id: number) => ["budgets", id, "accounts"]);
export const getBudgetAccountMarkups = services.detailListService<Model.Markup>((id: number) => [
  "budgets",
  id,
  "markups"
]);
export const getBudgetAccountGroups = services.detailListService<Model.Group>((id: number) => [
  "budgets",
  id,
  "groups"
]);
export const getBudgetActualOwners = services.detailListService<Model.ActualOwner>((id: number) => [
  "budgets",
  id,
  "actual-owners"
]);
export const getBudgetFringes = services.detailListService<Model.Fringe>((id: number) => ["budgets", id, "fringes"]);
export const getBudgetActuals = services.detailListService<Model.Actual>((id: number) => ["budgets", id, "actuals"]);
export const deleteBudget = services.deleteService((id: number) => ["budgets", id]);
export const updateBudget = services.detailPatchService<Http.BudgetPayload, Model.Budget>((id: number) => [
  "budgets",
  id
]);
export const createBudget = services.postService<Http.BudgetPayload, Model.Budget>(["budgets"]);

export const createBudgetAccount = services.detailPostService<Http.AccountPayload, Model.Account>((id: number) => [
  "budgets",
  id,
  "accounts"
]);

export const createBudgetAccountGroup = services.detailPostService<Http.GroupPayload, Model.Group>((id: number) => [
  "budgets",
  id,
  "groups"
]);

export const createBudgetFringe = services.detailPostService<Http.FringePayload, Model.Fringe>((id: number) => [
  "budgets",
  id,
  "fringes"
]);

export const duplicateBudget = async (id: number, options: Http.RequestOptions = {}): Promise<Model.Budget> => {
  const url = services.URL.v1("budgets", id, "duplicate");
  return client.post<Model.Budget>(url, {}, options);
};

export const createBudgetAccountMarkup = services.detailPostService<
  Http.MarkupPayload,
  Http.BudgetContextDetailResponse<Model.Markup>
>((id: number) => ["budgets", id, "markups"]);

export const bulkDeleteBudgetMarkups = async (
  id: number,
  ids: number[],
  options: Http.RequestOptions = {}
): Promise<Http.BulkDeleteResponse<Model.Budget>> => {
  const url = services.URL.v1("budgets", id, "bulk-delete-markups");
  return client.patch<Http.BulkDeleteResponse<Model.Budget>>(url, { ids }, options);
};

export const bulkUpdateBudgetAccounts = async (
  id: number,
  data: Http.BulkUpdatePayload<Http.AccountPayload>,
  options: Http.RequestOptions = {}
): Promise<Http.BulkResponse<Model.Budget, Model.Account>> => {
  const url = services.URL.v1("budgets", id, "bulk-update-accounts");
  return client.patch<Http.BulkResponse<Model.Budget, Model.Account>>(url, data, options);
};

export const bulkDeleteBudgetAccounts = async (
  id: number,
  ids: number[],
  options: Http.RequestOptions = {}
): Promise<Http.BulkDeleteResponse<Model.Budget>> => {
  const url = services.URL.v1("budgets", id, "bulk-delete-accounts");
  return client.patch<Http.BulkDeleteResponse<Model.Budget>>(url, { ids }, options);
};

export const bulkCreateBudgetAccounts = async (
  id: number,
  payload: Http.BulkCreatePayload<Http.AccountPayload>,
  options: Http.RequestOptions = {}
): Promise<Http.BulkResponse<Model.Budget, Model.Account>> => {
  const url = services.URL.v1("budgets", id, "bulk-create-accounts");
  return client.patch<Http.BulkResponse<Model.Budget, Model.Account>>(url, payload, options);
};

export const bulkUpdateBudgetActuals = async (
  id: number,
  data: Http.BulkUpdatePayload<Http.ActualPayload>,
  options: Http.RequestOptions = {}
): Promise<Http.BulkResponse<Model.Budget, Model.Actual>> => {
  const url = services.URL.v1("budgets", id, "bulk-update-actuals");
  return client.patch<Http.BulkResponse<Model.Budget, Model.Actual>>(url, data, options);
};

export const bulkDeleteBudgetActuals = async (
  id: number,
  ids: number[],
  options: Http.RequestOptions = {}
): Promise<Http.BulkDeleteResponse<Model.Budget>> => {
  const url = services.URL.v1("budgets", id, "bulk-delete-actuals");
  return client.patch<Http.BulkDeleteResponse<Model.Budget>>(url, { ids }, options);
};

export const bulkCreateBudgetActuals = async (
  id: number,
  payload: Http.BulkCreatePayload<Http.ActualPayload>,
  options: Http.RequestOptions = {}
): Promise<Http.BulkResponse<Model.Budget, Model.Actual>> => {
  const url = services.URL.v1("budgets", id, "bulk-create-actuals");
  return client.patch<Http.BulkResponse<Model.Budget, Model.Actual>>(url, payload, options);
};

export const bulkUpdateBudgetFringes = async (
  id: number,
  data: Http.BulkUpdatePayload<Http.FringePayload>,
  options: Http.RequestOptions = {}
): Promise<Http.BulkResponse<Model.Budget, Model.Fringe>> => {
  const url = services.URL.v1("budgets", id, "bulk-update-fringes");
  return client.patch<Http.BulkResponse<Model.Budget, Model.Fringe>>(url, data, options);
};

export const bulkDeleteBudgetFringes = async (
  id: number,
  ids: number[],
  options: Http.RequestOptions = {}
): Promise<Http.BulkDeleteResponse<Model.Budget>> => {
  const url = services.URL.v1("budgets", id, "bulk-delete-fringes");
  return client.patch<Http.BulkDeleteResponse<Model.Budget>>(url, { ids }, options);
};

export const bulkCreateBudgetFringes = async (
  id: number,
  payload: Http.BulkCreatePayload<Http.FringePayload>,
  options: Http.RequestOptions = {}
): Promise<Http.BulkResponse<Model.Budget, Model.Fringe>> => {
  const url = services.URL.v1("budgets", id, "bulk-create-fringes");
  return client.patch<Http.BulkResponse<Model.Budget, Model.Fringe>>(url, payload, options);
};
