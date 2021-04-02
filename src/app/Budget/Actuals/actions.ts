import { simpleAction } from "store/actions";
import { ActionType } from "../actions";

export const updateActualAction = simpleAction<Table.RowChange>(ActionType.Actuals.Update);
export const removeActualAction = simpleAction<number>(ActionType.Actuals.Remove);
export const deletingActualAction = simpleAction<Redux.ModelListActionPayload>(ActionType.Actuals.Deleting);
export const updatingActualAction = simpleAction<Redux.ModelListActionPayload>(ActionType.Actuals.Updating);
export const creatingActualAction = simpleAction<boolean>(ActionType.Actuals.Creating);
export const requestActualsAction = simpleAction<null>(ActionType.Actuals.Request);
export const loadingActualsAction = simpleAction<boolean>(ActionType.Actuals.Loading);
export const responseActualsAction = simpleAction<Http.IListResponse<IActual>>(ActionType.Actuals.Response);
export const setActualsSearchAction = simpleAction<string>(ActionType.Actuals.SetSearch);
export const selectActualAction = simpleAction<number>(ActionType.Actuals.Select);
export const deselectActualAction = simpleAction<number>(ActionType.Actuals.Deselect);
export const selectAllActualsAction = simpleAction<null>(ActionType.Actuals.SelectAll);

// Errors Functionality Needs to be Built Back In
export const addErrorsToStateAction = simpleAction<Table.CellError | Table.CellError[]>(ActionType.Actuals.AddErrors);

export const activatePlaceholderAction = simpleAction<Table.ActivatePlaceholderPayload<IActual>>(
  ActionType.Actuals.Placeholders.Activate
);
export const removePlaceholderFromStateAction = simpleAction<number>(ActionType.Actuals.Placeholders.RemoveFromState);
export const addPlaceholdersToStateAction = simpleAction<number>(ActionType.Actuals.Placeholders.AddToState);
export const updatePlaceholderInStateAction = simpleAction<Table.ActualRow>(
  ActionType.Actuals.Placeholders.UpdateInState
);

export const updateActualInStateAction = simpleAction<IActual>(ActionType.Actuals.UpdateInState);
export const removeActualFromStateAction = simpleAction<number>(ActionType.Actuals.RemoveFromState);
// Not currently used, because the reducer handles the logic, but we may need to use in the near future.
export const addActualToStateAction = simpleAction<IActual>(ActionType.Actuals.AddToState);
