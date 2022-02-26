import { redux } from "lib";

export const responseActualOwnersAction =
  redux.actions.createAction<Http.ListResponse<Model.ActualOwner>>("budget.actualowners.Response");
export const setActualOwnersSearchAction = redux.actions.createTableAction<string, Tables.ActualTableContext>(
  "budget.actualowners.SetSearch"
);
export const loadingActualOwnersAction = redux.actions.createAction<boolean>("budget.actualowners.Loading");

export const handleTableEventAction = redux.actions.createTableAction<
  Table.Event<Tables.ActualRowData, Model.Actual>,
  Tables.ActualTableContext
>("budget.actuals.TableChanged");

export const requestAction = redux.actions.createTableAction<Redux.TableRequestPayload, Tables.ActualTableContext>(
  "budget.actuals.Request"
);
export const loadingAction = redux.actions.createAction<boolean>("budget.actuals.Loading");
export const responseAction = redux.actions.createAction<Http.TableResponse<Model.Actual>>("budget.actuals.Response");
export const setSearchAction = redux.actions.createTableAction<string, Tables.ActualTableContext>(
  "budget.actuals.SetSearch"
);
export const responseActualTypesAction =
  redux.actions.createAction<Http.ListResponse<Model.Tag>>("budget.actualstypes.Response");
