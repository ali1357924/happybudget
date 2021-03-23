import { combineReducers } from "redux";
import {
  createSimpleBooleanReducer,
  createModelListActionReducer,
  createTableReducer,
  createListResponseReducer
} from "store/factories";
import { createActualRowPlaceholder, initializeRowFromActual } from "model/mappings";

import { ActionType } from "./actions";

const rootReducer = combineReducers({
  deleting: createModelListActionReducer(ActionType.Deleting, { referenceEntity: "actual" }),
  updating: createModelListActionReducer(ActionType.Updating, { referenceEntity: "actual" }),
  creating: createSimpleBooleanReducer(ActionType.Creating),
  budgetItems: createListResponseReducer<IBudgetItem>(
    {
      Response: ActionType.BudgetItems.Response,
      Request: ActionType.BudgetItems.Request,
      Loading: ActionType.BudgetItems.Loading
    },
    { referenceEntity: "budget item" }
  ),
  budgetItemsTree: createListResponseReducer<IBudgetItemNode>(
    {
      Response: ActionType.BudgetItemsTree.Response,
      Request: ActionType.BudgetItemsTree.Request,
      Loading: ActionType.BudgetItemsTree.Loading
    },
    { referenceEntity: "budget item tree node" }
  ),
  table: createTableReducer<Table.ActualRow, IActual>(
    {
      AddPlaceholders: ActionType.ActualsTable.AddPlaceholders,
      RemoveRow: ActionType.ActualsTable.RemoveRow,
      UpdateRow: ActionType.ActualsTable.UpdateRow,
      ActivatePlaceholder: ActionType.ActualsTable.ActivatePlaceholder,
      SelectRow: ActionType.ActualsTable.SelectRow,
      DeselectRow: ActionType.ActualsTable.DeselectRow,
      SelectAllRows: ActionType.ActualsTable.SelectAllRows,
      Request: ActionType.ActualsTable.Request,
      Response: ActionType.ActualsTable.Response,
      Loading: ActionType.ActualsTable.Loading,
      SetSearch: ActionType.ActualsTable.SetSearch,
      AddErrors: ActionType.ActualsTable.AddErrors,
      // TODO: This should be allowed to not be defined.
      AddGroupToRows: "",
      RemoveGroupFromRows: ""
    },
    createActualRowPlaceholder,
    initializeRowFromActual,
    { referenceEntity: "actual" }
  )
});

export default rootReducer;
