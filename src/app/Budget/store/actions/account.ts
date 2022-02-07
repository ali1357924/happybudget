import { redux } from "lib";

export const updateInStateAction =
  redux.actions.createAction<Redux.UpdateActionPayload<Model.Account>>("budget.account.UpdateInState");
export const requestAccountAction = redux.actions.createAction<number>("budget.account.Request");
export const loadingAccountAction = redux.actions.createAction<boolean>("budget.account.Loading");
export const responseAccountAction = redux.actions.createAction<Model.Account | null>("budget.account.Response");

export const handleTableChangeEventAction = redux.actions.createContextAction<
  Table.ChangeEvent<Tables.SubAccountRowData, Model.SubAccount>,
  Tables.SubAccountTableContext
>("budget.account.TableChanged");

export const loadingAction = redux.actions.createAction<boolean>("budget.account.TableLoading");

export const requestAction = redux.actions.createContextAction<
  Redux.TableRequestPayload,
  Tables.SubAccountTableContext
>("budget.account.TableRequest");

export const responseAction =
  redux.actions.createAction<Http.TableResponse<Model.SubAccount>>("budget.account.TableResponse");

export const addModelsToStateAction = redux.actions.createAction<Redux.AddModelsToTablePayload<Model.SubAccount>>(
  "budget.account.AddModelsToState"
);

export const updateRowsInStateAction = redux.actions.createAction<
  Redux.UpdateRowsInTablePayload<Tables.SubAccountRowData>
>("budget.account.UpdateRowsInState");

export const setSearchAction = redux.actions.createContextAction<string, Tables.SubAccountTableContext>(
  "budget.account.SetTableSearch"
);
