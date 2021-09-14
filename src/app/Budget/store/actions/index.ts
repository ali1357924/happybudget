import { createAction } from "@reduxjs/toolkit";
import ActionType from "./ActionType";

export * as account from "./account";
export * as accounts from "./accounts";
export * as actuals from "./actuals";
export * as pdf from "./pdf";
export * as subAccount from "./subAccount";

export { default as ActionType } from "./ActionType";

export const wipeStateAction = createAction<null>(ActionType.WipeState);
export const setBudgetIdAction = createAction<ID | null>(ActionType.SetId);
export const setBudgetAutoIndex = createAction<boolean>(ActionType.SetAutoIndex);
export const loadingBudgetAction = createAction<boolean>(ActionType.Loading);
export const responseBudgetAction = createAction<Model.Budget | null>(ActionType.Response);
export const setCommentsHistoryDrawerVisibilityAction = createAction<boolean>(
  ActionType.SetCommentsHistoryDrawerVisibility
);
export const updateBudgetInStateAction = createAction<Redux.UpdateActionPayload<Model.Budget>>(
  ActionType.UpdateInState
);

export const loadingFringesAction = createAction<boolean>(ActionType.Fringes.Loading);
export const requestFringesAction = createAction<null>(ActionType.Fringes.Request);
export const clearFringesAction = createAction<null>(ActionType.Fringes.Clear);
export const responseFringesAction = createAction<Http.TableResponse<Model.Fringe>>(ActionType.Fringes.Response);
export const handleFringesTableChangeEventAction = createAction<Table.ChangeEvent<Tables.FringeRowData, Model.Fringe>>(
  ActionType.Fringes.TableChanged
);
export const savingFringesTableAction = createAction<boolean>(ActionType.Fringes.Saving);
export const setFringesSearchAction = createAction<string>(ActionType.Fringes.SetSearch);
export const addFringeModelsToStateAction = createAction<Redux.AddModelsToTablePayload<Model.Fringe>>(
  ActionType.Fringes.AddToState
);

export const responseSubAccountUnitsAction = createAction<Http.ListResponse<Model.Tag>>(
  ActionType.SubAccountUnits.Response
);
export const responseFringeColorsAction = createAction<Http.ListResponse<string>>(ActionType.FringeColors.Response);