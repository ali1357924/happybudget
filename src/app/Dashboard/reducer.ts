import { Reducer, combineReducers } from "redux";
import { initialListResponseState } from "store/initialState";
import { createListResponseReducer, createAgnosticModelListActionReducer } from "lib/redux/factories";
import { ActionType, ActionDomains } from "./actions";

const PermanentlyDeletingReducer = createAgnosticModelListActionReducer();
const RestoringReducer = createAgnosticModelListActionReducer();

const rootReducer: Reducer<Redux.Dashboard.Store, Redux.Dashboard.Action<any>> = combineReducers({
  contacts: createListResponseReducer<Model.Contact, Redux.ListResponseStore<Model.Contact>>({
    Response: ActionType.Contacts.Response,
    Request: ActionType.Contacts.Request,
    Loading: ActionType.Contacts.Loading,
    Select: ActionType.Contacts.Select,
    SetSearch: ActionType.Contacts.SetSearch,
    SetPage: ActionType.Contacts.SetPage,
    SetPageSize: ActionType.Contacts.SetPageSize,
    SetPageAndSize: ActionType.Contacts.SetPageAndSize,
    AddToState: ActionType.Contacts.AddToState,
    RemoveFromState: ActionType.Contacts.RemoveFromState,
    UpdateInState: ActionType.Contacts.UpdateInState,
    Creating: ActionType.Contacts.Creating,
    Updating: ActionType.Contacts.Updating,
    Deleting: ActionType.Contacts.Deleting
  }),
  budgets: combineReducers({
    active: createListResponseReducer<Model.Budget, Redux.ListResponseStore<Model.Budget>, Redux.Dashboard.Action<any>>(
      {
        Response: ActionType.Budgets.Response,
        Loading: ActionType.Budgets.Loading,
        Select: ActionType.Budgets.Select,
        SetSearch: ActionType.Budgets.SetSearch,
        SetPage: ActionType.Budgets.SetPage,
        SetPageSize: ActionType.Budgets.SetPageSize,
        SetPageAndSize: ActionType.Budgets.SetPageAndSize,
        AddToState: ActionType.Budgets.AddToState,
        RemoveFromState: ActionType.Budgets.RemoveFromState,
        UpdateInState: ActionType.Budgets.UpdateInState,
        Deleting: ActionType.Budgets.Deleting
      },
      {
        excludeActions: (action: Redux.Dashboard.Action<any>) => {
          return ActionDomains.ACTIVE !== action.domain;
        }
      }
    ),
    trash: createListResponseReducer<Model.Budget, Redux.Dashboard.TrashBudgetsListStore, Redux.Dashboard.Action<any>>(
      {
        Response: ActionType.Budgets.Response,
        Loading: ActionType.Budgets.Loading,
        Select: ActionType.Budgets.Select,
        SetSearch: ActionType.Budgets.SetSearch,
        SetPage: ActionType.Budgets.SetPage,
        SetPageSize: ActionType.Budgets.SetPageSize,
        SetPageAndSize: ActionType.Budgets.SetPageAndSize,
        AddToState: ActionType.Budgets.AddToState,
        RemoveFromState: ActionType.Budgets.RemoveFromState,
        UpdateInState: ActionType.Budgets.UpdateInState
      },
      {
        excludeActions: (action: Redux.Dashboard.Action<any>) => {
          return ActionDomains.TRASH !== action.domain;
        },
        extensions: {
          [ActionType.Budgets.PermanentlyDeleting]: (
            st: Redux.Dashboard.TrashBudgetsListStore = {
              ...initialListResponseState,
              restoring: [],
              permanentlyDeleting: []
            },
            action: Redux.Action<Redux.ModelListActionPayload>
          ) => {
            return {
              ...st,
              permanentlyDeleting: PermanentlyDeletingReducer(st.permanentlyDeleting, action)
            };
          },
          [ActionType.Budgets.Restoring]: (
            st: Redux.Dashboard.TrashBudgetsListStore = {
              ...initialListResponseState,
              restoring: [],
              permanentlyDeleting: []
            },
            action: Redux.Action<Redux.ModelListActionPayload>
          ) => {
            return {
              ...st,
              restoring: RestoringReducer(st.restoring, action)
            };
          }
        }
      }
    )
  })
});

export default rootReducer;
