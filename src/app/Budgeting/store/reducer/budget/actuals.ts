import { Reducer } from "redux";
import { filter } from "lodash";
import { createListResponseReducer, createTablePlaceholdersReducer } from "lib/redux/factories";
import { ActualRowManager } from "lib/tabling/managers";
import { ActionType } from "../../actions";
import { initialActualsState } from "../../initialState";

const listResponseReducer = createListResponseReducer<Model.Actual, Redux.Budget.ActualsStore>(
  {
    Response: ActionType.Budget.Actuals.Response,
    Request: ActionType.Budget.Actuals.Request,
    Loading: ActionType.Budget.Actuals.Loading,
    SetSearch: ActionType.Budget.Actuals.SetSearch,
    UpdateInState: ActionType.Budget.Actuals.UpdateInState,
    RemoveFromState: ActionType.Budget.Actuals.RemoveFromState,
    AddToState: ActionType.Budget.Actuals.AddToState,
    Select: ActionType.Budget.Actuals.Select,
    Deselect: ActionType.Budget.Actuals.Deselect,
    SelectAll: ActionType.Budget.Actuals.SelectAll,
    Deleting: ActionType.Budget.Actuals.Deleting,
    Updating: ActionType.Budget.Actuals.Updating,
    Creating: ActionType.Budget.Actuals.Creating
  },
  {
    strictSelect: false,
    initialState: initialActualsState,
    subReducers: {
      placeholders: createTablePlaceholdersReducer(
        {
          AddToState: ActionType.Budget.Actuals.Placeholders.AddToState,
          RemoveFromState: ActionType.Budget.Actuals.Placeholders.RemoveFromState,
          UpdateInState: ActionType.Budget.Actuals.Placeholders.UpdateInState,
          Clear: ActionType.Budget.Actuals.Request
        },
        ActualRowManager
      )
    }
  }
);

const rootReducer: Reducer<Redux.Budget.ActualsStore, Redux.Action<any>> = (
  state: Redux.Budget.ActualsStore = initialActualsState,
  action: Redux.Action<any>
): Redux.Budget.ActualsStore => {
  let newState = { ...state };

  newState = listResponseReducer(newState, action);

  if (action.type === ActionType.Budget.Actuals.Placeholders.Activate) {
    const payload: Table.ActivatePlaceholderPayload<Model.Actual> = action.payload;
    newState = {
      ...newState,
      placeholders: filter(
        newState.placeholders,
        (placeholder: Table.ActualRow) => placeholder.id !== action.payload.id
      ),
      data: [...newState.data, payload.model]
    };
  }
  return newState;
};

export default rootReducer;