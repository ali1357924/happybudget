import { redux } from "lib";

export const updateInStateAction = redux.actions.createAction<Redux.UpdateActionPayload<Model.Account>>(
  "template.account.UpdateInState"
);
export const requestAccountAction = redux.actions.createAction<number>("template.account.Request");
export const loadingAccountAction = redux.actions.createAction<boolean>("template.account.Loading");
export const responseAccountAction = redux.actions.createAction<Model.Account | null>("template.account.Response");

export const handleTableChangeEventAction = redux.actions.createContextAction<
  Table.ChangeEvent<Tables.SubAccountRowData, Model.SubAccount>,
  Tables.SubAccountTableContext
>("template.account.TableChanged");

export const loadingAction = redux.actions.createAction<boolean>("template.account.TableLoading");

export const requestAction = redux.actions.createContextAction<
  Redux.TableRequestPayload,
  Tables.SubAccountTableContext
>("template.account.TableRequest");

export const responseAction = redux.actions.createAction<Http.TableResponse<Model.SubAccount>>(
  "template.account.TableResponse"
);

export const addModelsToStateAction = redux.actions.createAction<Redux.AddModelsToTablePayload<Model.SubAccount>>(
  "template.account.AddModelsToState"
);

export const setSearchAction = redux.actions.createContextAction<string, Tables.SubAccountTableContext>(
  "template.account.SetTableSearch"
);
