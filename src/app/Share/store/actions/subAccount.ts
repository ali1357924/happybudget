import { createAction } from "@reduxjs/toolkit";
import ActionType from "./ActionType";

export const setSubAccountIdAction = createAction<ID>(ActionType.SubAccount.SetId);
export const requestSubAccountAction = createAction<null>(ActionType.SubAccount.Request);
export const loadingSubAccountAction = createAction<boolean>(ActionType.SubAccount.Loading);
export const responseSubAccountAction = createAction<Model.SubAccount | null>(ActionType.SubAccount.Response);

export const requestAction = createAction<null>(ActionType.SubAccount.SubAccounts.Request);
export const clearAction = createAction<null>(ActionType.SubAccount.SubAccounts.Clear);
export const loadingAction = createAction<boolean>(ActionType.SubAccount.SubAccounts.Loading);
export const responseAction = createAction<Http.TableResponse<Model.SubAccount, Model.BudgetGroup>>(
  ActionType.SubAccount.SubAccounts.Response
);

export const setSearchAction = createAction<string>(ActionType.SubAccount.SubAccounts.SetSearch);
