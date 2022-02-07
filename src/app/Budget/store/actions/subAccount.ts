import { redux } from "lib";

export const updateInStateAction = redux.actions.createAction<Redux.UpdateActionPayload<Model.SubAccount>>(
  "budget.subaccount.UpdateInState"
);
export const requestSubAccountAction = redux.actions.createAction<number>("budget.subaccount.Request");
export const loadingSubAccountAction = redux.actions.createAction<boolean>("budget.subaccount.Loading");
export const responseSubAccountAction = redux.actions.createAction<Model.SubAccount | null>(
  "budget.subaccount.Response"
);

export const handleTableChangeEventAction = redux.actions.createContextAction<
  Table.ChangeEvent<Tables.SubAccountRowData, Model.SubAccount>,
  Tables.SubAccountTableContext
>("budget.subaccount.TableChanged");

export const loadingAction = redux.actions.createAction<boolean>("budget.subaccount.TableLoading");

export const requestAction = redux.actions.createContextAction<
  Redux.TableRequestPayload,
  Tables.SubAccountTableContext
>("budget.subaccount.TableRequest");

export const responseAction = redux.actions.createAction<Http.TableResponse<Model.SubAccount>>(
  "budget.subaccount.TableResponse"
);
export const addModelsToStateAction = redux.actions.createAction<Redux.AddModelsToTablePayload<Model.SubAccount>>(
  "budget.subaccount.AddModelsToState"
);
export const updateRowsInStateAction = redux.actions.createAction<
  Redux.UpdateRowsInTablePayload<Tables.SubAccountRowData>
>("budget.subaccount.UpdateRowsInState");
export const setSearchAction = redux.actions.createContextAction<string, Tables.SubAccountTableContext>(
  "budget.subaccount.SetTableSearch"
);
