import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import { isNil, includes } from "lodash";

import { ColDef } from "ag-grid-community";

import { RenderIfValidId, RenderWithSpinner } from "components/display";
import {
  requestSubAccountAction,
  requestSubAccountSubAccountsAction,
  setSubAccountSubAccountsSearchAction,
  selectSubAccountSubAccountsTableRowAction,
  addSubAccountSubAccountsTablePlaceholdersAction,
  deselectSubAccountSubAccountsTableRowAction,
  removeSubAccountSubAccountAction,
  updateSubAccountSubAccountAction,
  selectAllSubAccountSubAccountsTableRowsAction
} from "../actions";
import { initialSubAccountState } from "../initialState";
import GenericBudgetTable from "./GenericBudgetTable";

const SubAccount = (): JSX.Element => {
  const { budgetId, subaccountId } = useParams<{ budgetId: string; subaccountId: string }>();
  const dispatch = useDispatch();
  const history = useHistory();

  const subAccountStore = useSelector((state: Redux.IApplicationStore) => {
    let subState = initialSubAccountState;
    if (!isNaN(parseInt(subaccountId))) {
      if (!isNil(state.budget.subaccounts[parseInt(subaccountId)])) {
        subState = state.budget.subaccounts[parseInt(subaccountId)];
      }
    }
    return subState;
  });

  useEffect(() => {
    if (!isNaN(parseInt(subaccountId))) {
      dispatch(requestSubAccountAction(parseInt(subaccountId)));
    }
  }, [subaccountId]);

  useEffect(() => {
    if (!isNil(subaccountId) && !isNil(parseInt(subaccountId))) {
      dispatch(requestSubAccountSubAccountsAction(parseInt(subaccountId)));
    }
  }, [subaccountId]);

  return (
    <RenderIfValidId id={[budgetId, subaccountId]}>
      <RenderWithSpinner loading={subAccountStore.subaccounts.table.loading}>
        <GenericBudgetTable<Table.SubAccountRowField, Table.IBudgetRowMeta, Table.ISubAccountRow>
          table={subAccountStore.subaccounts.table.data}
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
          search={subAccountStore.subaccounts.table.search}
          onSearch={(value: string) => dispatch(setSubAccountSubAccountsSearchAction(parseInt(subaccountId), value))}
          saving={
            subAccountStore.subaccounts.deleting.length !== 0 ||
            subAccountStore.subaccounts.updating.length !== 0 ||
            subAccountStore.subaccounts.creating
          }
          onRowAdd={() => dispatch(addSubAccountSubAccountsTablePlaceholdersAction(parseInt(subaccountId)))}
          onRowSelect={(id: number) => dispatch(selectSubAccountSubAccountsTableRowAction(parseInt(subaccountId), id))}
          onRowDeselect={(id: number) =>
            dispatch(deselectSubAccountSubAccountsTableRowAction(parseInt(subaccountId), id))
          }
          onRowDelete={(row: Table.ISubAccountRow) =>
            dispatch(removeSubAccountSubAccountAction(parseInt(subaccountId), row))
          }
          onRowUpdate={(id: number, data: { [key: string]: any }) =>
            dispatch(updateSubAccountSubAccountAction(parseInt(subaccountId), { id, data }))
          }
          onRowExpand={(id: number) => history.push(`/budgets/${budgetId}/subaccounts/${id}`)}
          onSelectAll={() => dispatch(selectAllSubAccountSubAccountsTableRowsAction(parseInt(subaccountId)))}
          estimated={
            !isNil(subAccountStore.detail.data) && !isNil(subAccountStore.detail.data.estimated)
              ? subAccountStore.detail.data.estimated
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
                onChange: (value: Unit, row: Table.ISubAccountRow) => console.log({ value, id: row.id })
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

export default SubAccount;
