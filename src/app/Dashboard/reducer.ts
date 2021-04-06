import { Reducer, combineReducers } from "redux";
import { includes, filter } from "lodash";
import { createListResponseReducer } from "store/factories";
import { ActionType, ActionDomains } from "./actions";

const rootReducer: Reducer<Redux.Dashboard.IStore, Redux.Dashboard.IAction<any>> = combineReducers({
  contacts: createListResponseReducer<IContact, Redux.IListResponseStore<IContact>>(
    {
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
    },
    {
      referenceEntity: "contact"
    }
  ),
  budgets: combineReducers({
    active: createListResponseReducer<IBudget, Redux.IListResponseStore<IBudget>, Redux.Dashboard.IAction<any>>(
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
        referenceEntity: "budget",
        excludeActions: (action: Redux.Dashboard.IAction<any>) => {
          return ActionDomains.ACTIVE !== action.domain;
        }
      }
    ),
    trash: createListResponseReducer<IBudget, Redux.Dashboard.ITrashBudgetsListStore, Redux.Dashboard.IAction<any>>(
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
        referenceEntity: "budget",
        excludeActions: (action: Redux.Dashboard.IAction<any>) => {
          return ActionDomains.TRASH !== action.domain;
        },
        transformers: {
          [ActionType.Budgets.PermanentlyDeleting]: (
            payload: { id: number; value: boolean },
            st: Redux.Dashboard.ITrashBudgetsListStore
          ) => {
            if (payload.value === true) {
              if (includes(st.deleting, payload.id)) {
                /* eslint-disable no-console */
                console.warn(`The budget ${payload.id} is already deleting in state.`);
              } else {
                return { deleting: [...st.deleting, payload.id] };
              }
            } else {
              if (!includes(st.deleting, payload.id)) {
                /* eslint-disable no-console */
                console.warn(`The budget ${payload.id} is already not deleting in state.`);
              } else {
                return { deleting: filter(st.deleting, (id: number) => id !== payload.id) };
              }
            }
          },
          [ActionType.Budgets.Restoring]: (
            payload: { id: number; value: boolean },
            st: Redux.Dashboard.ITrashBudgetsListStore
          ) => {
            if (payload.value === true) {
              if (includes(st.restoring, payload.id)) {
                /* eslint-disable no-console */
                console.warn(`The document ${payload.id} is already restoring in state.`);
              } else {
                return { restoring: [...st.restoring, payload.id] };
              }
            } else {
              if (!includes(st.restoring, payload.id)) {
                /* eslint-disable no-console */
                console.warn(`The budget ${payload.id} is already not restoring in state.`);
              } else {
                return { restoring: filter(st.restoring, (id: number) => id !== payload.id) };
              }
            }
          }
        }
      }
    )
  })
});

export default rootReducer;
