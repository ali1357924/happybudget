import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isNil, find } from "lodash";
import { createSelector } from "reselect";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/pro-solid-svg-icons";

import { CellClassParams, SuppressKeyboardEventParams } from "@ag-grid-community/core";

import { getKeyValue } from "lib/util";
import { PaymentMethods } from "lib/model";
import { findChoiceForName } from "lib/model/util";
import { currencyValueFormatter, dateValueFormatter } from "lib/tabling/formatters";
import { ActualRowManager } from "lib/tabling/managers";
import { floatValueSetter, dateTimeValueSetter } from "lib/tabling/valueSetters";

import { WrapInApplicationSpinner } from "components";
import { simpleDeepEqualSelector, simpleShallowEqualSelector } from "store/selectors";

import { setInstanceAction } from "../../store/actions/budget";
import {
  requestActualsAction,
  setActualsSearchAction,
  addPlaceholdersToStateAction,
  deselectActualAction,
  selectActualAction,
  removeActualAction,
  updateActualAction,
  selectAllActualsAction,
  bulkUpdateBudgetActualsAction,
  requestBudgetItemsAction,
  requestBudgetItemsTreeAction
} from "../../store/actions/budget/actuals";
import { selectBudgetDetail } from "../../store/selectors";
import BudgetTable, { BudgetTableActionsParams } from "../BudgetTable";

const selectSelectedRows = simpleDeepEqualSelector(
  (state: Redux.ApplicationStore) => state.budgeting.budget.actuals.selected
);
const selectActuals = simpleDeepEqualSelector((state: Redux.ApplicationStore) => state.budgeting.budget.actuals.data);
const selectTableSearch = simpleShallowEqualSelector(
  (state: Redux.ApplicationStore) => state.budgeting.budget.actuals.search
);
const selectPlaceholders = simpleShallowEqualSelector(
  (state: Redux.ApplicationStore) => state.budgeting.budget.actuals.placeholders
);
const selectActualsLoading = simpleShallowEqualSelector(
  (state: Redux.ApplicationStore) => state.budgeting.budget.actuals.loading
);
const selectSaving = createSelector(
  (state: Redux.ApplicationStore) => state.budgeting.budget.actuals.deleting,
  (state: Redux.ApplicationStore) => state.budgeting.budget.actuals.updating,
  (state: Redux.ApplicationStore) => state.budgeting.budget.actuals.creating,
  (deleting: Redux.ModelListActionInstance[], updating: Redux.ModelListActionInstance[], creating: boolean) =>
    deleting.length !== 0 || updating.length !== 0 || creating === true
);
const selectBudgetItems = simpleDeepEqualSelector(
  (state: Redux.ApplicationStore) => state.budgeting.budget.budgetItems.data
);

const Actuals = (): JSX.Element => {
  const dispatch = useDispatch();
  const loading = useSelector(selectActualsLoading);
  const budgetItems = useSelector(selectBudgetItems);
  const data = useSelector(selectActuals);
  const placeholders = useSelector(selectPlaceholders);
  const selected = useSelector(selectSelectedRows);
  const search = useSelector(selectTableSearch);
  const saving = useSelector(selectSaving);
  const budgetDetail = useSelector(selectBudgetDetail);

  useEffect(() => {
    dispatch(setInstanceAction(null));
    dispatch(requestActualsAction(null));
    dispatch(requestBudgetItemsAction(null));
    dispatch(requestBudgetItemsTreeAction(null));
  }, []);

  return (
    <WrapInApplicationSpinner loading={loading}>
      <BudgetTable<Table.ActualRow, Model.Actual, Model.Group, Http.ActualPayload>
        data={data}
        placeholders={placeholders}
        manager={ActualRowManager}
        selected={selected}
        // TODO: Make this field use an object that has the `object_id` and `parent_type`
        // in it, removing the requirement of the rowRefreshRequired callback.
        identifierField={"object_id"}
        identifierFieldHeader={"Account"}
        identifierColumn={{
          minWidth: 200,
          cellClass: "borderless",
          processCellForClipboard: (row: Table.ActualRow) => {
            const item: Model.BudgetLineItem | undefined = find(budgetItems, {
              id: row.object_id,
              type: row.parent_type
            } as any);
            if (!isNil(item)) {
              return item.identifier || "";
            }
            return "";
          },
          cellRenderer: "BudgetItemCell",
          cellRendererParams: {
            onChange: (object_id: number, parent_type: "account" | "subaccount", row: Table.ActualRow) => {
              dispatch(
                updateActualAction({
                  id: row.id,
                  data: {
                    object_id: { newValue: object_id, oldValue: row.object_id },
                    parent_type: { oldValue: row.parent_type, newValue: parent_type }
                  }
                })
              );
            }
          }
        }}
        indexColumn={{ width: 40, maxWidth: 50 }}
        nonEditableCells={["object_id"]}
        search={search}
        onSearch={(value: string) => dispatch(setActualsSearchAction(value))}
        saving={saving}
        onRowAdd={() => dispatch(addPlaceholdersToStateAction(1))}
        onRowSelect={(id: number) => dispatch(selectActualAction(id))}
        onRowDeselect={(id: number) => dispatch(deselectActualAction(id))}
        onRowDelete={(row: Table.ActualRow) => dispatch(removeActualAction(row.id))}
        onRowUpdate={(payload: Table.RowChange<Table.ActualRow>) => dispatch(updateActualAction(payload))}
        onRowBulkUpdate={(changes: Table.RowChange<Table.ActualRow>[]) =>
          dispatch(bulkUpdateBudgetActualsAction(changes))
        }
        onSelectAll={() => dispatch(selectAllActualsAction(null))}
        rowRefreshRequired={(existing: Table.ActualRow, row: Table.ActualRow) => {
          return (
            existing.object_id !== row.object_id ||
            existing.parent_type !== row.parent_type ||
            existing.payment_method !== row.payment_method
          );
        }}
        cellClass={(params: CellClassParams) => (params.colDef.field === "object_id" ? "no-select" : undefined)}
        exportFileName={"actuals.csv"}
        actions={(params: BudgetTableActionsParams<Table.ActualRow, Model.Group>) => [
          {
            tooltip: "Delete",
            icon: <FontAwesomeIcon icon={faTrashAlt} />,
            disabled: params.selectedRows.length === 0,
            onClick: params.onDelete
          }
        ]}
        columns={[
          {
            field: "description",
            headerName: "Description",
            flex: 100
          },
          {
            field: "vendor",
            headerName: "Vendor",
            flex: 1
          },
          {
            field: "purchase_order",
            headerName: "Purchase Order",
            flex: 1
          },
          {
            field: "date",
            headerName: "Date",
            cellStyle: { textAlign: "right" },
            flex: 1,
            valueFormatter: dateValueFormatter,
            valueSetter: dateTimeValueSetter<Table.ActualRow>("date")
          },
          {
            field: "payment_method",
            headerName: "Payment Method",
            cellClass: "cell--centered",
            cellRenderer: "PaymentMethodCell",
            flex: 1,
            cellEditor: "PaymentMethodCellEditor",
            clearBeforeEdit: true,
            // Required to allow the dropdown to be selectable on Enter key.
            suppressKeyboardEvent: (params: SuppressKeyboardEventParams) => {
              if (params.event.code === "Enter" && params.editing) {
                return true;
              }
              return false;
            },
            processCellForClipboard: (row: Table.ActualRow) => {
              const payment_method = getKeyValue<Table.ActualRow, keyof Table.ActualRow>("payment_method")(row);
              if (isNil(payment_method)) {
                return "";
              }
              return payment_method.name;
            },
            processCellFromClipboard: (name: string) => {
              if (name.trim() === "") {
                return null;
              }
              const payment_method = findChoiceForName<Model.PaymentMethod>(PaymentMethods, name);
              if (!isNil(payment_method)) {
                return payment_method;
              }
              return null;
            }
          },
          {
            field: "payment_id",
            headerName: "Payment ID",
            flex: 1
          },
          {
            field: "value",
            headerName: "Actual",
            flex: 1,
            valueFormatter: currencyValueFormatter,
            valueSetter: floatValueSetter<Table.ActualRow>("value"),
            tableTotal: !isNil(budgetDetail) && !isNil(budgetDetail.actual) ? budgetDetail.actual : 0.0
          }
        ]}
      />
    </WrapInApplicationSpinner>
  );
};

export default Actuals;
