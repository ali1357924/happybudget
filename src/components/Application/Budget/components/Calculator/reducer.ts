import { combineReducers } from "redux";
import {
  createDetailResponseReducer,
  createSimpleBooleanReducer,
  createModelListActionReducer,
  createTableReducer,
  createSimplePayloadReducer,
  createListResponseReducer
} from "store/reducerFactories";
import { ActionType } from "./actions";
import {
  createSubAccountRowPlaceholder,
  createAccountRowPlaceholder,
  initializeRowFromAccount,
  initializeRowFromSubAccount
} from "./util";

const rootReducer = combineReducers({
  accounts: combineReducers({
    deleting: createModelListActionReducer(ActionType.Accounts.Deleting, { referenceEntity: "account" }),
    updating: createModelListActionReducer(ActionType.Accounts.Updating, { referenceEntity: "account" }),
    creating: createSimpleBooleanReducer(ActionType.Accounts.Creating),
    comments: createListResponseReducer<IComment>(
      {
        Response: ActionType.Comments.Response,
        Request: ActionType.Comments.Request,
        Loading: ActionType.Comments.Loading
      },
      { referenceEntity: "comment" }
    ),
    table: createTableReducer<Table.AccountRowField, Table.IBudgetRowMeta, Table.IAccountRow, IAccount>(
      {
        AddPlaceholders: ActionType.AccountsTable.AddPlaceholders,
        RemoveRow: ActionType.AccountsTable.RemoveRow,
        UpdateRow: ActionType.AccountsTable.UpdateRow,
        ActivatePlaceholder: ActionType.AccountsTable.ActivatePlaceholder,
        SelectRow: ActionType.AccountsTable.SelectRow,
        DeselectRow: ActionType.AccountsTable.DeselectRow,
        SelectAllRows: ActionType.AccountsTable.SelectAllRows,
        Request: ActionType.AccountsTable.Request,
        Response: ActionType.AccountsTable.Response,
        Loading: ActionType.AccountsTable.Loading,
        SetSearch: ActionType.AccountsTable.SetSearch,
        AddErrors: ActionType.AccountsTable.AddErrors
      },
      createAccountRowPlaceholder,
      initializeRowFromAccount,
      { referenceEntity: "account" }
    )
  }),
  account: combineReducers({
    id: createSimplePayloadReducer(ActionType.Account.SetId),
    detail: createDetailResponseReducer<IAccount, Redux.IDetailResponseStore<IAccount>, Redux.IAction>({
      Response: ActionType.Account.Response,
      Loading: ActionType.Account.Loading,
      Request: ActionType.Account.Request
    }),
    comments: createListResponseReducer<IComment>(
      {
        Response: ActionType.Account.Comments.Response,
        Request: ActionType.Account.Comments.Request,
        Loading: ActionType.Account.Comments.Loading
      },
      { referenceEntity: "comment" }
    ),
    subaccounts: combineReducers({
      deleting: createModelListActionReducer(ActionType.Account.SubAccounts.Deleting, {
        referenceEntity: "subaccount"
      }),
      updating: createModelListActionReducer(ActionType.Account.SubAccounts.Updating, {
        referenceEntity: "subaccount"
      }),
      creating: createSimpleBooleanReducer(ActionType.Account.SubAccounts.Creating),
      table: createTableReducer<Table.SubAccountRowField, Table.IBudgetRowMeta, Table.ISubAccountRow, ISubAccount>(
        {
          AddPlaceholders: ActionType.Account.SubAccountsTable.AddPlaceholders,
          RemoveRow: ActionType.Account.SubAccountsTable.RemoveRow,
          UpdateRow: ActionType.Account.SubAccountsTable.UpdateRow,
          ActivatePlaceholder: ActionType.Account.SubAccountsTable.ActivatePlaceholder,
          SelectRow: ActionType.Account.SubAccountsTable.SelectRow,
          DeselectRow: ActionType.Account.SubAccountsTable.DeselectRow,
          SelectAllRows: ActionType.Account.SubAccountsTable.SelectAllRows,
          Response: ActionType.Account.SubAccountsTable.Response,
          Request: ActionType.Account.SubAccountsTable.Request,
          Loading: ActionType.Account.SubAccountsTable.Loading,
          SetSearch: ActionType.Account.SubAccountsTable.SetSearch,
          AddErrors: ActionType.Account.SubAccountsTable.AddErrors
        },
        createSubAccountRowPlaceholder,
        initializeRowFromSubAccount,
        { referenceEntity: "subaccount" }
      )
    })
  }),
  subaccount: combineReducers({
    id: createSimplePayloadReducer(ActionType.SubAccount.SetId),
    detail: createDetailResponseReducer<ISubAccount, Redux.IDetailResponseStore<ISubAccount>, Redux.IAction>({
      Response: ActionType.SubAccount.Response,
      Loading: ActionType.SubAccount.Loading,
      Request: ActionType.SubAccount.Request
    }),
    comments: createListResponseReducer<IComment>(
      {
        Response: ActionType.SubAccount.Comments.Response,
        Request: ActionType.SubAccount.Comments.Request,
        Loading: ActionType.SubAccount.Comments.Loading
      },
      {
        referenceEntity: "comment",
        keyReducers: { submitting: createModelListActionReducer(ActionType.Comments.Submitting) }
      }
    ),
    subaccounts: combineReducers({
      deleting: createModelListActionReducer(ActionType.SubAccount.SubAccounts.Deleting, {
        referenceEntity: "subaccount"
      }),
      updating: createModelListActionReducer(ActionType.SubAccount.SubAccounts.Updating, {
        referenceEntity: "subaccount"
      }),
      creating: createSimpleBooleanReducer(ActionType.SubAccount.SubAccounts.Creating),
      table: createTableReducer<Table.SubAccountRowField, Table.IBudgetRowMeta, Table.ISubAccountRow, ISubAccount>(
        {
          AddPlaceholders: ActionType.SubAccount.SubAccountsTable.AddPlaceholders,
          RemoveRow: ActionType.SubAccount.SubAccountsTable.RemoveRow,
          UpdateRow: ActionType.SubAccount.SubAccountsTable.UpdateRow,
          ActivatePlaceholder: ActionType.SubAccount.SubAccountsTable.ActivatePlaceholder,
          SelectRow: ActionType.SubAccount.SubAccountsTable.SelectRow,
          DeselectRow: ActionType.SubAccount.SubAccountsTable.DeselectRow,
          SelectAllRows: ActionType.SubAccount.SubAccountsTable.SelectAllRows,
          Response: ActionType.SubAccount.SubAccountsTable.Response,
          Request: ActionType.SubAccount.SubAccountsTable.Request,
          Loading: ActionType.SubAccount.SubAccountsTable.Loading,
          SetSearch: ActionType.SubAccount.SubAccountsTable.SetSearch,
          AddErrors: ActionType.SubAccount.SubAccountsTable.AddErrors
        },
        createSubAccountRowPlaceholder,
        initializeRowFromSubAccount,
        { referenceEntity: "subaccount" }
      )
    })
  })
});

export default rootReducer;
