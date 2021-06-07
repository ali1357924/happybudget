import { simpleAction } from "store/actions";
import ActionType from "../ActionType";

export const setSubAccountIdAction = simpleAction<number>(ActionType.Template.SubAccount.SetId);
export const requestSubAccountAction = simpleAction<null>(ActionType.Template.SubAccount.Request);
export const loadingSubAccountAction = simpleAction<boolean>(ActionType.Template.SubAccount.Loading);
export const responseSubAccountAction = simpleAction<Model.TemplateSubAccount | undefined>(
  ActionType.Template.SubAccount.Response
);
export const bulkCreateSubAccountsAction = simpleAction<number>(ActionType.Template.SubAccount.BulkCreate);
export const tableChangedAction = simpleAction<Table.Change<Table.TemplateSubAccountRow>>(
  ActionType.Template.SubAccount.TableChanged
);
export const removeSubAccountAction = simpleAction<number>(ActionType.Template.SubAccount.SubAccounts.Delete);
export const deletingSubAccountAction = simpleAction<Redux.ModelListActionPayload>(
  ActionType.Template.SubAccount.SubAccounts.Deleting
);
export const updatingSubAccountAction = simpleAction<Redux.ModelListActionPayload>(
  ActionType.Template.SubAccount.SubAccounts.Updating
);
export const creatingSubAccountAction = simpleAction<boolean>(ActionType.Template.SubAccount.SubAccounts.Creating);
export const requestSubAccountsAction = simpleAction<null>(ActionType.Template.SubAccount.SubAccounts.Request);
export const loadingSubAccountsAction = simpleAction<boolean>(ActionType.Template.SubAccount.SubAccounts.Loading);
export const responseSubAccountsAction = simpleAction<Http.ListResponse<Model.TemplateSubAccount>>(
  ActionType.Template.SubAccount.SubAccounts.Response
);
export const setSubAccountsSearchAction = simpleAction<string>(ActionType.Template.SubAccount.SubAccounts.SetSearch);
export const removeSubAccountFromGroupAction = simpleAction<number>(
  ActionType.Template.SubAccount.SubAccounts.RemoveFromGroup
);
export const addSubAccountToGroupAction = simpleAction<{ id: number; group: number }>(
  ActionType.Template.SubAccount.SubAccounts.AddToGroup
);
export const selectSubAccountAction = simpleAction<number>(ActionType.Template.SubAccount.SubAccounts.Select);
export const deselectSubAccountAction = simpleAction<number>(ActionType.Template.SubAccount.SubAccounts.Deselect);
export const selectAllSubAccountsAction = simpleAction<null>(ActionType.Template.SubAccount.SubAccounts.SelectAll);

export const updateSubAccountInStateAction = simpleAction<Redux.UpdateModelActionPayload<Model.TemplateSubAccount>>(
  ActionType.Template.SubAccount.SubAccounts.UpdateInState
);
export const removeSubAccountFromStateAction = simpleAction<number>(
  ActionType.Template.SubAccount.SubAccounts.RemoveFromState
);
export const addSubAccountToStateAction = simpleAction<Model.TemplateSubAccount>(
  ActionType.Template.SubAccount.SubAccounts.AddToState
);
// Errors Functionality Needs to be Built Back In
export const addErrorsToStateAction = simpleAction<Table.CellError | Table.CellError[]>(
  ActionType.Template.SubAccount.SubAccounts.AddErrors
);
export const requestGroupsAction = simpleAction<null>(ActionType.Template.SubAccount.SubAccounts.Groups.Request);
export const loadingGroupsAction = simpleAction<boolean>(ActionType.Template.SubAccount.SubAccounts.Groups.Loading);
export const responseGroupsAction = simpleAction<Http.ListResponse<Model.TemplateGroup>>(
  ActionType.Template.SubAccount.SubAccounts.Groups.Response
);
export const addGroupToStateAction = simpleAction<Model.TemplateGroup>(
  ActionType.Template.SubAccount.SubAccounts.Groups.AddToState
);
export const updateGroupInStateAction = simpleAction<Redux.UpdateModelActionPayload<Model.TemplateGroup>>(
  ActionType.Template.SubAccount.SubAccounts.Groups.UpdateInState
);
export const removeGroupFromStateAction = simpleAction<number>(
  ActionType.Template.SubAccount.SubAccounts.Groups.RemoveFromState
);
export const deletingGroupAction = simpleAction<Redux.ModelListActionPayload>(
  ActionType.Template.SubAccount.SubAccounts.Groups.Deleting
);
export const deleteGroupAction = simpleAction<number>(ActionType.Template.SubAccount.SubAccounts.Groups.Delete);
