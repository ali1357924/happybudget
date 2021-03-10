import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import { isNil, includes } from "lodash";

import { ColDef } from "ag-grid-community";

import { RenderIfValidId, RenderWithSpinner } from "components/display";
import {
  setAccountIdAction,
  addAccountSubAccountsTablePlaceholdersAction,
  deselectAccountSubAccountsTableRowAction,
  removeAccountSubAccountAction,
  requestAccountSubAccountsAction,
  selectAccountSubAccountsTableRowAction,
  setAccountSubAccountsSearchAction,
  updateAccountSubAccountAction,
  selectAllAccountSubAccountsTableRowsAction
} from "../actions";
import { initialAccountState } from "../initialState";
import GenericBudgetTable from "./GenericBudgetTable";

const Account = (): JSX.Element => {
  const { budgetId, accountId } = useParams<{ budgetId: string; accountId: string }>();
  const dispatch = useDispatch();
  const history = useHistory();

  const accountStore = useSelector((state: Redux.IApplicationStore) => {
    let subState = initialAccountState;
    if (!isNaN(parseInt(accountId))) {
      if (!isNil(state.budget.accounts.details[parseInt(accountId)])) {
        subState = state.budget.accounts.details[parseInt(accountId)];
      }
    }
    return subState;
  });

  useEffect(() => {
    if (!isNaN(parseInt(accountId))) {
      dispatch(setAccountIdAction(parseInt(accountId)));
    }
  }, [accountId]);

  useEffect(() => {
    if (!isNil(budgetId) && !isNaN(parseInt(budgetId)) && !isNil(accountId) && !isNil(parseInt(accountId))) {
      dispatch(requestAccountSubAccountsAction(parseInt(accountId)));
    }
  }, [budgetId, accountId]);

  return (
    <RenderIfValidId id={[budgetId, accountId]}>
      <RenderWithSpinner loading={accountStore.subaccounts.table.loading || accountStore.detail.loading}>
        <GenericBudgetTable<Table.SubAccountRowField, Table.IBudgetRowMeta, Table.ISubAccountRow>
          table={accountStore.subaccounts.table.data}
          isCellEditable={(row: Table.ISubAccountRow, colDef: ColDef) => {
            if (includes(["estimated", "actual", "unit"], colDef.field)) {
              return false;
            } else if (includes(["line", "description", "name"], colDef.field)) {
              return true;
            } else {
              return row.meta.subaccounts.length === 0;
            }
          }}
          highlightNonEditableCell={(row: Table.ISubAccountRow, colDef: ColDef) => {
            return !includes(["quantity", "multiplier", "rate", "unit"], colDef.field);
          }}
          search={accountStore.subaccounts.table.search}
          onSearch={(value: string) => dispatch(setAccountSubAccountsSearchAction(parseInt(accountId), value))}
          saving={
            accountStore.subaccounts.deleting.length !== 0 ||
            accountStore.subaccounts.updating.length !== 0 ||
            accountStore.subaccounts.creating
          }
          onRowAdd={() => dispatch(addAccountSubAccountsTablePlaceholdersAction(parseInt(accountId)))}
          onRowSelect={(id: number) => dispatch(selectAccountSubAccountsTableRowAction(parseInt(accountId), id))}
          onRowDeselect={(id: number) => dispatch(deselectAccountSubAccountsTableRowAction(parseInt(accountId), id))}
          onRowDelete={(row: Table.ISubAccountRow) => dispatch(removeAccountSubAccountAction(parseInt(accountId), row))}
          onRowUpdate={(id: number, data: { [key: string]: any }) =>
            dispatch(updateAccountSubAccountAction(parseInt(accountId), { id, data }))
          }
          onRowExpand={(id: number) => history.push(`/budgets/${budgetId}/subaccounts/${id}`)}
          onSelectAll={() => dispatch(selectAllAccountSubAccountsTableRowsAction(parseInt(accountId)))}
          estimated={
            !isNil(accountStore.detail.data) && !isNil(accountStore.detail.data.estimated)
              ? accountStore.detail.data.estimated
              : 0.0
          }
          columns={[
            {
              field: "line",
              headerName: "Line"
            },
            {
              field: "description",
              headerName: "Category Description"
            },
            {
              field: "name",
              headerName: "Name"
            },
            {
              field: "quantity",
              headerName: "Quantity",
              cellStyle: { textAlign: "right" }
            },
            {
              field: "unit",
              headerName: "Unit",
              cellStyle: { textAlign: "right" },
              cellRenderer: "UnitCell",
              cellRendererParams: {
                onChange: (value: Unit, row: Table.ISubAccountRow) =>
                  dispatch(
                    updateAccountSubAccountAction(parseInt(accountId), {
                      id: row.id,
                      data: { unit: value }
                    })
                  )
              }
            },
            {
              field: "multiplier",
              headerName: "X",
              cellStyle: { textAlign: "right" }
            },
            {
              field: "rate",
              headerName: "Rate",
              cellStyle: { textAlign: "right" }
            },
            {
              field: "estimated",
              headerName: "Estimated",
              cellStyle: { textAlign: "right" }
            },
            {
              field: "actual",
              headerName: "Actual",
              cellStyle: { textAlign: "right" }
            }
          ]}
        />
      </RenderWithSpinner>
    </RenderIfValidId>
  );
};

export default Account;
