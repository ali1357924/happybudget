import { combineReducers, Reducer } from "redux";
import { createDetailResponseReducer, createSimplePayloadReducer } from "lib/redux/factories";
import { ActionType } from "../../actions";
import { initialTemplateSubAccountsState } from "../../initialState";
import { createSubAccountsReducer } from "../factories";

const rootReducer: Reducer<Modules.Budgeting.Template.AccountStore, Redux.Action<any>> = combineReducers({
  id: createSimplePayloadReducer<number | null>(ActionType.Template.Account.SetId, null),
  detail: createDetailResponseReducer<
    Model.TemplateAccount,
    Redux.ModelDetailResponseStore<Model.TemplateAccount>,
    Redux.Action
  >({
    Response: ActionType.Template.Account.Response,
    Loading: ActionType.Template.Account.Loading,
    Request: ActionType.Template.Account.Request,
    UpdateInState: ActionType.Template.Account.UpdateInState
  }),
  subaccounts: createSubAccountsReducer<
    Modules.Budgeting.Template.SubAccountsStore,
    Model.TemplateSubAccount,
    Model.TemplateGroup
  >(
    "Template",
    {
      Response: ActionType.Template.Account.SubAccounts.Response,
      Request: ActionType.Template.Account.SubAccounts.Request,
      Loading: ActionType.Template.Account.SubAccounts.Loading,
      SetSearch: ActionType.Template.Account.SubAccounts.SetSearch,
      UpdateInState: ActionType.Template.Account.SubAccounts.UpdateInState,
      RemoveFromState: ActionType.Template.Account.SubAccounts.RemoveFromState,
      AddToState: ActionType.Template.Account.SubAccounts.AddToState,
      Select: ActionType.Template.Account.SubAccounts.Select,
      Deselect: ActionType.Template.Account.SubAccounts.Deselect,
      SelectAll: ActionType.Template.Account.SubAccounts.SelectAll,
      Deleting: ActionType.Template.Account.SubAccounts.Deleting,
      Creating: ActionType.Template.Account.SubAccounts.Creating,
      Updating: ActionType.Template.Account.SubAccounts.Updating,
      RemoveFromGroup: ActionType.Template.Account.SubAccounts.RemoveFromGroup,
      AddToGroup: ActionType.Template.Account.SubAccounts.AddToGroup,
      // NOTE: This will cause updates to both the Account and SubAccount level when
      // fringes change, even though only one level is visible at any given time.  We
      // should adjust this, so that it only updates the Account SubAccount(s) or the
      // SubAccount SubAccount(s) when Fringes change.
      Fringes: {
        UpdateInState: ActionType.Template.Fringes.UpdateInState
      },
      Groups: {
        Response: ActionType.Template.Account.SubAccounts.Groups.Response,
        Request: ActionType.Template.Account.SubAccounts.Groups.Request,
        Loading: ActionType.Template.Account.SubAccounts.Groups.Loading,
        RemoveFromState: ActionType.Template.Account.SubAccounts.Groups.RemoveFromState,
        UpdateInState: ActionType.Template.Account.SubAccounts.Groups.UpdateInState,
        AddToState: ActionType.Template.Account.SubAccounts.Groups.AddToState,
        Deleting: ActionType.Template.Account.SubAccounts.Groups.Deleting
      }
    },
    initialTemplateSubAccountsState
  )
});

export default rootReducer;
