import { simpleAction } from "store/actions";
import ActionType from "./ActionType";

export { default as ActionType } from "./ActionType";

export const setBudgetIdAction = simpleAction<number>(ActionType.Budget.SetId);
export const setInstanceAction = simpleAction<Model.Account | Model.SubAccount | null>(ActionType.SetInstance);
export const requestBudgetAction = simpleAction<null>(ActionType.Budget.Request);
export const loadingBudgetAction = simpleAction<boolean>(ActionType.Budget.Loading);
export const responseBudgetAction = simpleAction<Model.Budget | undefined>(ActionType.Budget.Response);
export const setCommentsHistoryDrawerVisibilityAction = simpleAction<boolean>(
  ActionType.SetCommentsHistoryDrawerVisibility
);

export const loadingBudgetItemsAction = simpleAction<boolean>(ActionType.BudgetItems.Loading);
export const responseBudgetItemsAction = simpleAction<Http.ListResponse<Model.BudgetItem>>(
  ActionType.BudgetItems.Response
);

export const loadingBudgetItemsTreeAction = simpleAction<boolean>(ActionType.BudgetItemsTree.Loading);
export const responseBudgetItemsTreeAction = simpleAction<Http.ListResponse<Model.BudgetItemNode>>(
  ActionType.BudgetItemsTree.Response
);

export const loadingFringesAction = simpleAction<boolean>(ActionType.Budget.Fringes.Loading);
export const responseFringesAction = simpleAction<Http.ListResponse<Model.Fringe>>(ActionType.Budget.Fringes.Response);
export const clearFringesPlaceholdersToStateAction = simpleAction<null>(ActionType.Budget.Fringes.Placeholders.Clear);
export const addFringesPlaceholdersToStateAction = simpleAction<number>(
  ActionType.Budget.Fringes.Placeholders.AddToState
);
