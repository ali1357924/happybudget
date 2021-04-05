import { Reducer, combineReducers } from "redux";
import { isNil, reduce } from "lodash";
import {
  createListResponseReducer,
  createDetailResponseReducer,
  createSimpleBooleanReducer,
  createSimplePayloadReducer,
  createCommentsListResponseReducer
} from "store/factories";

import { ActionType } from "../actions";
import initialState from "../initialState";

import accountRootReducer from "./account";
import accountsRootReducer from "./accounts";
import actualsRootReducer from "./actuals";
import fringesRootReducer from "./fringes";
import subAccountRootReducer from "./subAccount";

const genericReducer = combineReducers({
  instance: createSimplePayloadReducer<IAccount | ISubAccount | null>(ActionType.SetInstance, null),
  commentsHistoryDrawerOpen: createSimpleBooleanReducer(ActionType.SetCommentsHistoryDrawerVisibility),
  account: accountRootReducer,
  subaccount: subAccountRootReducer,
  actuals: actualsRootReducer,
  accounts: accountsRootReducer,
  fringes: fringesRootReducer,
  budget: combineReducers({
    id: createSimplePayloadReducer<number | null>(ActionType.Budget.SetId, null),
    detail: createDetailResponseReducer<IBudget, Redux.IDetailResponseStore<IBudget>, Redux.IAction>({
      Response: ActionType.Budget.Response,
      Loading: ActionType.Budget.Loading,
      Request: ActionType.Budget.Request
    }),
    comments: createCommentsListResponseReducer({
      Response: ActionType.Budget.Comments.Response,
      Request: ActionType.Budget.Comments.Request,
      Loading: ActionType.Budget.Comments.Loading,
      AddToState: ActionType.Budget.Comments.AddToState,
      RemoveFromState: ActionType.Budget.Comments.RemoveFromState,
      UpdateInState: ActionType.Budget.Comments.UpdateInState,
      Creating: ActionType.Budget.Comments.Creating,
      Deleting: ActionType.Budget.Comments.Deleting,
      Updating: ActionType.Budget.Comments.Updating,
      Replying: ActionType.Budget.Comments.Replying
    })
  }),
  budgetItems: createListResponseReducer<IBudgetItem>(
    {
      Response: ActionType.BudgetItems.Response,
      Loading: ActionType.BudgetItems.Loading
    },
    { referenceEntity: "budget item" }
  ),
  budgetItemsTree: createListResponseReducer<IBudgetItemNode>(
    {
      Response: ActionType.BudgetItemsTree.Response,
      Loading: ActionType.BudgetItemsTree.Loading
    },
    { referenceEntity: "budget item tree node" }
  )
});

const rootReducer: Reducer<Redux.Budget.IStore> = (
  state: Redux.Budget.IStore = initialState,
  action: Redux.IAction<any>
): Redux.Budget.IStore => {
  let newState = genericReducer(state, action);

  if (!isNil(action.payload)) {
    if (
      action.type === ActionType.SubAccount.SubAccounts.UpdateInState ||
      action.type === ActionType.SubAccount.SubAccounts.RemoveFromState ||
      action.type === ActionType.SubAccount.SubAccounts.AddToState ||
      action.type === ActionType.SubAccount.SubAccounts.Placeholders.UpdateInState
    ) {
      // Update the overall SubAccount based on the underlying SubAccount(s) present and any potential
      // placeholders present.
      const subAccounts: ISubAccount[] = newState.subaccount.subaccounts.data;
      const placeholders: Table.SubAccountRow[] = newState.subaccount.subaccounts.placeholders;
      // Right now, the backend is configured such that the Actual value for the overall SubAccount is
      // determined from the Actual values tied to that SubAccount, not the underlying SubAccount(s).
      // If that logic changes in the backend, we need to also make that adjustment here.
      let payload: Partial<ISubAccount> = {
        estimated:
          reduce(subAccounts, (sum: number, s: ISubAccount) => sum + (s.estimated || 0), 0) +
          reduce(placeholders, (sum: number, s: Table.SubAccountRow) => sum + (s.estimated || 0), 0)
      };
      if (!isNil(newState.subaccount.detail.data)) {
        if (!isNil(newState.subaccount.detail.data.actual) && !isNil(payload.estimated)) {
          payload = { ...payload, variance: payload.estimated - newState.subaccount.detail.data.actual };
        }
        if (!isNil(newState.subaccount.detail.data)) {
          newState = {
            ...newState,
            subaccount: {
              ...newState.subaccount,
              detail: {
                ...newState.subaccount.detail,
                data: { ...newState.subaccount.detail.data, ...payload }
              }
            }
          };
        }
      }
    } else if (
      action.type === ActionType.Account.SubAccounts.UpdateInState ||
      action.type === ActionType.Account.SubAccounts.RemoveFromState ||
      action.type === ActionType.Account.SubAccounts.AddToState ||
      action.type === ActionType.Account.SubAccounts.Placeholders.UpdateInState
    ) {
      // Update the overall Account based on the underlying SubAccount(s) present and any potential
      // placeholders present.
      const subAccounts: ISubAccount[] = newState.account.subaccounts.data;
      const placeholders: Table.SubAccountRow[] = newState.account.subaccounts.placeholders;
      // Right now, the backend is configured such that the Actual value for the overall Account is
      // determined from the Actual values of the underlying SubAccount(s).  If that logic changes
      // in the backend, we need to also make that adjustment here.
      const actual =
        reduce(subAccounts, (sum: number, s: ISubAccount) => sum + (s.actual || 0), 0) +
        reduce(placeholders, (sum: number, s: Table.SubAccountRow) => sum + (s.actual || 0), 0);
      const estimated =
        reduce(subAccounts, (sum: number, s: ISubAccount) => sum + (s.estimated || 0), 0) +
        reduce(placeholders, (sum: number, s: Table.SubAccountRow) => sum + (s.estimated || 0), 0);
      if (!isNil(newState.account.detail.data)) {
        newState = {
          ...newState,
          account: {
            ...newState.account,
            detail: {
              ...newState.account.detail,
              data: { ...newState.account.detail.data, actual, estimated, variance: estimated - actual }
            }
          }
        };
      }
    }
  }
  return newState;
};

export default rootReducer;