import { simpleAction } from "store/actions";

export const ActionType = {
  Account: {
    SetId: "calculator.account.SetId",
    Loading: "calculator.account.Loading",
    Response: "calculator.account.Response",
    Request: "calculator.account.Request",
    UpdateInState: "calculator.account.UpdateInState"
  },
  Comments: {
    Loading: "calculator.account.comments.Loading",
    Response: "calculator.account.comments.Response",
    Request: "calculator.account.comments.Request",
    Submitting: "calculator.account.comments.Submitting",
    Deleting: "calculator.account.comments.Deleting",
    Editing: "calculator.account.comments.Editing",
    Replying: "calculator.account.comments.Replying",
    Delete: "calculator.account.comments.Delete",
    Edit: "calculator.account.comments.Edit",
    Submit: "calculator.account.comments.Submit",
    AddToState: "calculator.account.comments.AddToState",
    RemoveFromState: "calculator.account.comments.RemoveFromState",
    UpdateInState: "calculator.account.comments.UpdateInState"
  },
  SubAccounts: {
    Deleting: "calculator.account.subaccounts.Deleting",
    Creating: "calculator.account.subaccounts.Creating",
    Updating: "calculator.account.subaccounts.Updating",
    Update: "calculator.account.subaccounts.Update",
    Remove: "calculator.account.subaccounts.Remove",
    SetSearch: "calculator.account.subaccounts.SetSearch",
    Loading: "calculator.account.subaccounts.Loading",
    Select: "calculator.account.subaccounts.Select",
    Deselect: "calculator.account.subaccounts.Deselect",
    SelectAll: "calculator.account.subaccounts.SelectAll",
    Response: "calculator.account.subaccounts.Response",
    Request: "calculator.account.subaccounts.Request",
    UpdateInState: "calculator.account.subaccounts.UpdateInState",
    RemoveFromState: "calculator.account.subaccounts.RemoveFromState",
    AddToState: "calculator.account.subaccounts.AddToState",
    RemoveFromGroup: "calculator.account.subaccounts.RemoveFromGroup",
    AddPlaceholders: "calculator.account.subaccounts.AddPlaceholders",
    ActivatePlaceholder: "calculator.account.subaccounts.ActivatePlacholder",
    RemovePlaceholder: "calculator.account.subaccounts.RemovePlaceholder",
    Table: {
      AddErrors: "calculator.account.subaccounts.table.AddErrors",
      UpdateRow: "calculator.account.subaccounts.table.UpdateRow"
    },
    Groups: {
      Delete: "calculator.account.subaccounts.groups.Delete",
      Deleting: "calculator.account.subaccounts.groups.Deleting",
      AddToState: "calculator.account.subaccounts.groups.AddToState",
      AddToTable: "calculator.account.subaccounts.groups.AddToTable",
      RemoveFromTable: "calculator.account.subaccounts.groups.RemoveFromTable",
      UpdateInTable: "calculator.account.subaccounts.groups.UpdateInTable"
    },
    History: {
      Loading: "calculator.account.subaccounts.history.Loading",
      Response: "calculator.account.subaccounts.history.Response",
      Request: "calculator.account.subaccounts.history.Request"
    }
  }
};

export const setAccountIdAction = simpleAction<number>(ActionType.Account.SetId);
export const requestAccountAction = simpleAction<null>(ActionType.Account.Request);
export const loadingAccountAction = simpleAction<boolean>(ActionType.Account.Loading);
export const responseAccountAction = simpleAction<IAccount>(ActionType.Account.Response);
export const updateAccountInStateAction = simpleAction<Partial<IAccount>>(ActionType.Account.UpdateInState);

/*
  Actions Pertaining to Account Comments
*/
export const requestCommentsAction = simpleAction<null>(ActionType.Comments.Request);
export const responseCommentsAction = simpleAction<Http.IListResponse<IComment>>(ActionType.Comments.Response);
export const loadingCommentsAction = simpleAction<boolean>(ActionType.Comments.Loading);
export const submitCommentAction = simpleAction<{ parent?: number; data: Http.ICommentPayload }>(
  ActionType.Comments.Submit
);
export const submittingCommentAction = simpleAction<boolean>(ActionType.Comments.Submitting);
export const deleteCommentAction = simpleAction<number>(ActionType.Comments.Delete);
export const editCommentAction = simpleAction<Redux.UpdateModelActionPayload<IComment>>(ActionType.Comments.Edit);
export const replyingToCommentAction = simpleAction<Redux.ModelListActionPayload>(ActionType.Comments.Replying);
export const deletingCommentAction = simpleAction<Redux.ModelListActionPayload>(ActionType.Comments.Deleting);
export const editingCommentAction = simpleAction<Redux.ModelListActionPayload>(ActionType.Comments.Editing);
export const addCommentToStateAction = simpleAction<{ data: IComment; parent?: number }>(
  ActionType.Comments.AddToState
);
export const removeCommentFromStateAction = simpleAction<number>(ActionType.Comments.RemoveFromState);
export const updateCommentInStateAction = simpleAction<Redux.UpdateModelActionPayload<IComment>>(
  ActionType.Comments.UpdateInState
);
/*
  Actions Pertaining to Account Sub Accounts
*/
export const updateSubAccountAction = simpleAction<Table.RowChange>(ActionType.SubAccounts.Update);
export const removeSubAccountAction = simpleAction<number>(ActionType.SubAccounts.Remove);
export const deletingSubAccountAction = simpleAction<Redux.ModelListActionPayload>(ActionType.SubAccounts.Deleting);
export const updatingSubAccountAction = simpleAction<Redux.ModelListActionPayload>(ActionType.SubAccounts.Updating);
export const creatingSubAccountAction = simpleAction<boolean>(ActionType.SubAccounts.Creating);
export const requestSubAccountsAction = simpleAction<null>(ActionType.SubAccounts.Request);
export const loadingSubAccountsAction = simpleAction<boolean>(ActionType.SubAccounts.Loading);
export const responseSubAccountsAction = simpleAction<Http.IListResponse<ISubAccount>>(ActionType.SubAccounts.Response);
export const setSubAccountsSearchAction = simpleAction<string>(ActionType.SubAccounts.SetSearch);
export const removeSubAccountFromGroupAction = simpleAction<number>(ActionType.SubAccounts.RemoveFromGroup);
export const activatePlaceholderAction = simpleAction<Table.ActivatePlaceholderPayload<ISubAccount>>(
  ActionType.SubAccounts.ActivatePlaceholder
);
export const removePlaceholderAction = simpleAction<number>(ActionType.SubAccounts.RemovePlaceholder);
export const addPlaceholdersAction = simpleAction<number>(ActionType.SubAccounts.AddPlaceholders);
export const selectSubAccountAction = simpleAction<number>(ActionType.SubAccounts.Select);
export const deselectSubAccountAction = simpleAction<number>(ActionType.SubAccounts.Deselect);
export const selectAllSubAccountsAction = simpleAction<null>(ActionType.SubAccounts.SelectAll);

export const addSubAccountToStateAction = simpleAction<ISubAccount>(ActionType.SubAccounts.AddToState);
export const updateSubAccountInStateAction = simpleAction<ISubAccount>(ActionType.SubAccounts.UpdateInState);
export const removeSubAccountFromStateAction = simpleAction<number>(ActionType.SubAccounts.RemoveFromState);

/*
  Actions Pertaining to Account Sub Accounts Table
*/
export const updateTableRowAction = simpleAction<{
  id: number;
  data: Partial<Table.SubAccountRow>;
}>(ActionType.SubAccounts.Table.UpdateRow);
export const addErrorsToTableAction = simpleAction<Table.CellError | Table.CellError[]>(
  ActionType.SubAccounts.Table.AddErrors
);

/*
  Actiosn Pertaining to Account Sub Accounts Groups
*/
export const addGroupToStateAction = simpleAction<IGroup<ISimpleSubAccount>>(ActionType.SubAccounts.Groups.AddToState);
export const addGroupToTableAction = simpleAction<{ group: INestedGroup; ids: number[] }>(
  ActionType.SubAccounts.Groups.AddToTable
);
export const updateGroupInTableAction = simpleAction<{
  groupId: number;
  group: Partial<INestedGroup>;
}>(ActionType.SubAccounts.Groups.UpdateInTable);
export const removeGroupFromTableAction = simpleAction<number>(ActionType.SubAccounts.Groups.RemoveFromTable);
export const deletingGroupAction = simpleAction<boolean>(ActionType.SubAccounts.Groups.Deleting);
export const deleteGroupAction = simpleAction<number>(ActionType.SubAccounts.Groups.Delete);

/*
  Actions Pertaining to Account Sub Accounts History
*/
export const requestSubAccountsHistoryAction = simpleAction<null>(ActionType.SubAccounts.History.Request);
export const loadingSubAccountsHistoryAction = simpleAction<boolean>(ActionType.SubAccounts.History.Loading);
export const responseSubAccountsHistoryAction = simpleAction<Http.IListResponse<HistoryEvent>>(
  ActionType.SubAccounts.History.Response
);