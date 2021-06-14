import { combineReducers, Reducer } from "redux";
import { createDetailResponseReducer, createSimplePayloadReducer } from "lib/redux/factories";
import { ActionType } from "../../actions";
import { initialTemplateSubAccountsState } from "../../initialState";
import { createSubAccountsReducer } from "../factories";

const rootReducer: Reducer<Modules.Budgeting.Template.SubAccountStore, Redux.Action<any>> = combineReducers({
  id: createSimplePayloadReducer<number | null>(ActionType.Template.SubAccount.SetId, null),
  detail: createDetailResponseReducer<
    Model.TemplateSubAccount,
    Redux.ModelDetailResponseStore<Model.TemplateSubAccount>,
    Redux.Action
  >({
    Response: ActionType.Template.SubAccount.Response,
    Loading: ActionType.Template.SubAccount.Loading,
    Request: ActionType.Template.SubAccount.Request
  }),
  subaccounts: createSubAccountsReducer<
    Modules.Budgeting.Template.SubAccountsStore,
    Model.TemplateSubAccount,
    Model.TemplateGroup
  >(
    "Template",
    {
      Response: ActionType.Template.SubAccount.SubAccounts.Response,
      Request: ActionType.Template.SubAccount.SubAccounts.Request,
      Loading: ActionType.Template.SubAccount.SubAccounts.Loading,
      SetSearch: ActionType.Template.SubAccount.SubAccounts.SetSearch,
      UpdateInState: ActionType.Template.SubAccount.SubAccounts.UpdateInState,
      RemoveFromState: ActionType.Template.SubAccount.SubAccounts.RemoveFromState,
      AddToState: ActionType.Template.SubAccount.SubAccounts.AddToState,
      Select: ActionType.Template.SubAccount.SubAccounts.Select,
      Deselect: ActionType.Template.SubAccount.SubAccounts.Deselect,
      SelectAll: ActionType.Template.SubAccount.SubAccounts.SelectAll,
      Deleting: ActionType.Template.SubAccount.SubAccounts.Deleting,
      Creating: ActionType.Template.SubAccount.SubAccounts.Creating,
      Updating: ActionType.Template.SubAccount.SubAccounts.Updating,
      RemoveFromGroup: ActionType.Template.SubAccount.SubAccounts.RemoveFromGroup,
      AddToGroup: ActionType.Template.SubAccount.SubAccounts.AddToGroup,
      // NOTE: This will cause updates to both the Account and SubAccount level when
      // fringes change, even though only one level is visible at any given time.  We
      // should adjust this, so that it only updates the Account SubAccount(s) or the
      // SubAccount SubAccount(s) when Fringes change.
      Fringes: {
        UpdateInState: ActionType.Template.Fringes.UpdateInState
      },
      Groups: {
        Response: ActionType.Template.SubAccount.SubAccounts.Groups.Response,
        Request: ActionType.Template.SubAccount.SubAccounts.Groups.Request,
        Loading: ActionType.Template.SubAccount.SubAccounts.Groups.Loading,
        RemoveFromState: ActionType.Template.SubAccount.SubAccounts.Groups.RemoveFromState,
        UpdateInState: ActionType.Template.SubAccount.SubAccounts.Groups.UpdateInState,
        AddToState: ActionType.Template.SubAccount.SubAccounts.Groups.AddToState,
        Deleting: ActionType.Template.SubAccount.SubAccounts.Groups.Deleting
      }
    },
    initialTemplateSubAccountsState
  )
});

export default rootReducer;
