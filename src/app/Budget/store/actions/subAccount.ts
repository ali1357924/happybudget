import { createAction } from "@reduxjs/toolkit";
import ActionType from "./ActionType";

export const setSubAccountIdAction = createAction<ID>(ActionType.SubAccount.SetId);
export const requestSubAccountAction = createAction<null>(ActionType.SubAccount.Request);
export const loadingSubAccountAction = createAction<boolean>(ActionType.SubAccount.Loading);
export const responseSubAccountAction = createAction<Model.SubAccount | undefined>(ActionType.SubAccount.Response);
// Not currently used, because the reducer handles the logic, but we may need to use in the near future.
export const updateParentSubAccountInStateAction = createAction<Partial<Model.Account>>(
  ActionType.SubAccount.UpdateInState
);

export const handleTableChangeEventAction = createAction<Table.ChangeEvent<Tables.SubAccountRowData, Model.SubAccount>>(
  ActionType.SubAccount.SubAccounts.TableChanged
);
export const savingTableAction = createAction<boolean>(ActionType.SubAccount.SubAccounts.Saving);
export const requestAction = createAction<null>(ActionType.SubAccount.SubAccounts.Request);
export const loadingAction = createAction<boolean>(ActionType.SubAccount.SubAccounts.Loading);
export const responseAction = createAction<Http.TableResponse<Model.SubAccount, Model.BudgetGroup>>(
  ActionType.SubAccount.SubAccounts.Response
);
export const addModelsToStateAction = createAction<Redux.AddModelsToTablePayload<Model.SubAccount>>(
  ActionType.SubAccount.SubAccounts.AddToState
);
export const addPlaceholdersToState = createAction<Table.RowAdd<Tables.SubAccountRowData, Model.SubAccount>[]>(
  ActionType.SubAccount.SubAccounts.AddPlaceholdersToState
);
export const setSearchAction = createAction<string>(ActionType.SubAccount.SubAccounts.SetSearch);

export const requestCommentsAction = createAction<null>(ActionType.SubAccount.Comments.Request);
export const responseCommentsAction = createAction<Http.ListResponse<Model.Comment>>(
  ActionType.SubAccount.Comments.Response
);
export const loadingCommentsAction = createAction<boolean>(ActionType.SubAccount.Comments.Loading);
export const createCommentAction = createAction<{
  parent?: ID;
  data: Http.CommentPayload;
}>(ActionType.SubAccount.Comments.Create);
export const creatingCommentAction = createAction<boolean>(ActionType.SubAccount.Comments.Creating);
export const deleteCommentAction = createAction<ID>(ActionType.SubAccount.Comments.Delete);
export const updateCommentAction = createAction<Redux.UpdateActionPayload<Model.Comment>>(
  ActionType.SubAccount.Comments.Update
);
export const replyingToCommentAction = createAction<Redux.ModelListActionPayload>(
  ActionType.SubAccount.Comments.Replying
);
export const deletingCommentAction = createAction<Redux.ModelListActionPayload>(
  ActionType.SubAccount.Comments.Deleting
);
export const updatingCommentAction = createAction<Redux.ModelListActionPayload>(
  ActionType.SubAccount.Comments.Updating
);
export const addCommentToStateAction = createAction<{
  data: Model.Comment;
  parent?: ID;
}>(ActionType.SubAccount.Comments.AddToState);
export const removeCommentFromStateAction = createAction<ID>(ActionType.SubAccount.Comments.RemoveFromState);
export const updateCommentInStateAction = createAction<
  Redux.UpdateActionPayload<Redux.UpdateActionPayload<Model.Comment>>
>(ActionType.SubAccount.Comments.UpdateInState);

export const addGroupToStateAction = createAction<Model.BudgetGroup>(ActionType.SubAccount.Groups.AddToState);
export const updateGroupInStateAction = createAction<Redux.UpdateActionPayload<Model.BudgetGroup>>(
  ActionType.SubAccount.Groups.UpdateInState
);
export const requestHistoryAction = createAction<null>(ActionType.SubAccount.History.Request);
export const loadingHistoryAction = createAction<boolean>(ActionType.SubAccount.History.Loading);
export const responseHistoryAction = createAction<Http.ListResponse<Model.HistoryEvent>>(
  ActionType.SubAccount.History.Response
);
