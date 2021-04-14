import { useSelector } from "react-redux";
import { isNil, includes, find, filter, map } from "lodash";
import classNames from "classnames";

import { ColDef, ColSpanParams, ValueSetterParams } from "ag-grid-community";

import { SubAccountUnits } from "lib/model";
import { SubAccountRowManager } from "lib/tabling/managers";
import { currencyValueFormatter } from "lib/tabling/formatters";
import { floatValueSetter, integerValueSetter, choiceModelValueSetter } from "lib/tabling/valueSetters";

import BudgetTable, { CookiesProps } from "./BudgetTable";
import { selectFringes, selectBudgetDetail, selectBudgetDetailLoading } from "./store/selectors";

interface SubAccountsTableProps {
  data: Model.SubAccount[];
  groups?: Model.Group<Model.SimpleSubAccount>[];
  placeholders?: Table.SubAccountRow[];
  selected?: number[];
  tableFooterIdentifierValue?: string | null;
  tableTotals?: { [key: string]: any };
  search: string;
  saving: boolean;
  renderFlag: boolean;
  cookies?: CookiesProps;
  onSearch: (value: string) => void;
  onRowSelect: (id: number) => void;
  onRowDeselect: (id: number) => void;
  onRowUpdate: (payload: Table.RowChange<Table.SubAccountRow>) => void;
  onRowBulkUpdate?: (payload: Table.RowChange<Table.SubAccountRow>[]) => void;
  onRowAdd: () => void;
  onRowDelete: (row: Table.SubAccountRow) => void;
  onRowExpand?: (id: number) => void;
  onBack: () => void;
  onSelectAll: () => void;
  onGroupRows: (rows: Table.SubAccountRow[]) => void;
  onDeleteGroup: (group: Model.Group<Model.SimpleSubAccount>) => void;
  onEditGroup: (group: Model.Group<Model.SimpleSubAccount>) => void;
  onRowRemoveFromGroup: (row: Table.SubAccountRow) => void;
}

const SubAccountsTable = ({
  data,
  groups,
  placeholders,
  selected,
  tableFooterIdentifierValue,
  search,
  saving,
  tableTotals,
  renderFlag,
  cookies,
  onRowSelect,
  onRowUpdate,
  onRowDeselect,
  onRowBulkUpdate,
  onRowAdd,
  onRowDelete,
  onRowExpand,
  onBack,
  onSelectAll,
  onSearch,
  onGroupRows,
  onDeleteGroup,
  onEditGroup,
  onRowRemoveFromGroup
}: SubAccountsTableProps): JSX.Element => {
  const budgetDetail = useSelector(selectBudgetDetail);
  const loadingBudget = useSelector(selectBudgetDetailLoading);
  const fringes = useSelector(selectFringes);

  return (
    <BudgetTable<
      Table.SubAccountRow,
      Model.SubAccount,
      Model.Group<Model.SimpleSubAccount>,
      Http.SubAccountPayload,
      Model.SimpleSubAccount
    >
      data={data}
      groups={groups}
      placeholders={placeholders}
      manager={SubAccountRowManager}
      selected={selected}
      loadingBudget={loadingBudget}
      renderFlag={renderFlag}
      cookies={cookies}
      sizeColumnsToFit={false}
      identifierField={"identifier"}
      identifierFieldHeader={"Line"}
      identifierColumn={{ width: 70, cellRendererParams: { className: "subaccount-identifier" } }}
      tableFooterIdentifierValue={tableFooterIdentifierValue}
      budgetFooterIdentifierValue={!isNil(budgetDetail) ? `${budgetDetail.name} Total` : "Total"}
      isCellEditable={(row: Table.SubAccountRow, colDef: ColDef) => {
        if (includes(["identifier", "description", "name"], colDef.field)) {
          return true;
        } else {
          return row.meta.children.length === 0;
        }
      }}
      search={search}
      onSearch={onSearch}
      saving={saving}
      rowRefreshRequired={(existing: Table.SubAccountRow, row: Table.SubAccountRow) => existing.unit !== row.unit}
      onRowAdd={onRowAdd}
      onRowSelect={onRowSelect}
      onRowDeselect={onRowDeselect}
      onRowDelete={onRowDelete}
      onRowUpdate={onRowUpdate}
      onRowBulkUpdate={onRowBulkUpdate}
      onRowExpand={onRowExpand}
      onBack={onBack}
      groupParams={{
        onDeleteGroup,
        onRowRemoveFromGroup,
        onGroupRows,
        onEditGroup
      }}
      onSelectAll={onSelectAll}
      tableTotals={tableTotals}
      budgetTotals={{
        estimated: !isNil(budgetDetail) && !isNil(budgetDetail.estimated) ? budgetDetail.estimated : 0.0,
        variance: !isNil(budgetDetail) && !isNil(budgetDetail.variance) ? budgetDetail.variance : 0.0,
        actual: !isNil(budgetDetail) && !isNil(budgetDetail.actual) ? budgetDetail.actual : 0.0
      }}
      processCellForClipboard={{
        fringes: (row: Table.SubAccountRow) => {
          const subAccountFringes: Model.Fringe[] = filter(
            map(row.fringes, (id: number) => {
              const fringe: Model.Fringe | undefined = find(fringes, { id });
              if (!isNil(fringe)) {
                return fringe;
              } else {
                /* eslint-disable no-console */
                console.error(
                  `Corrupted Cell Found! Could not convert model value ${id} for field fringes
                  to a name.`
                );
                return null;
              }
            }),
            (fringe: Model.Fringe | null) => fringe !== null
          ) as Model.Fringe[];
          return map(subAccountFringes, (fringe: Model.Fringe) => fringe.name).join(", ");
        }
      }}
      bodyColumns={[
        {
          field: "description",
          headerName: "Category Description",
          flex: 100,
          sortable: true,
          colSpan: (params: ColSpanParams) => {
            const row: Table.SubAccountRow = params.data;
            if (!isNil(params.data.meta) && !isNil(params.data.meta.children)) {
              return row.meta.children.length !== 0 ? 7 : 1;
            }
            return 1;
          }
        },
        {
          field: "name",
          headerName: "Name",
          width: 80
        },
        {
          field: "quantity",
          headerName: "Qty",
          width: 60,
          cellStyle: { textAlign: "right" },
          valueSetter: integerValueSetter<Table.SubAccountRow>("quantity")
        },
        {
          field: "unit",
          headerName: "Unit",
          cellClass: "cell--centered",
          cellRenderer: "SubAccountUnitCell",
          width: 100,
          valueSetter: choiceModelValueSetter<Table.SubAccountRow, Model.SubAccountUnit>("unit", SubAccountUnits, {
            allowNull: true
          })
        },
        {
          field: "multiplier",
          headerName: "X",
          width: 50,
          cellStyle: { textAlign: "right" },
          valueSetter: floatValueSetter<Table.SubAccountRow>("multiplier")
        },
        {
          field: "rate",
          headerName: "Rate",
          width: 70,
          cellStyle: { textAlign: "right" },
          valueFormatter: currencyValueFormatter,
          valueSetter: floatValueSetter<Table.SubAccountRow>("rate")
        },
        {
          field: "fringes",
          headerName: "Fringes",
          cellClass: classNames("cell--centered"),
          cellRenderer: "FringesCell",
          minWidth: 150,
          valueSetter: (params: ValueSetterParams): boolean => {
            // In the case that the value is an Array, the value will have been  provided as an Array
            // of IDs from the Fringes dropdown.
            if (Array.isArray(params.newValue)) {
              params.data.fringes = params.newValue;
              return true;
            } else if (params.newValue === undefined) {
              // In the case that the user clears the cell via a backspace, the value will be undefined.
              params.data.fringes = [];
              return true;
            } else if (typeof params.newValue === "string") {
              // In the case that the value is a string, it will have been provided from the user
              // editing the cell manually or via Copy/Paste, because the processCellForClipboard
              // formats the value as a comma-separated list of names.
              const names = params.newValue.split(",");
              const fringeIds: number[] = filter(
                map(names, (name: string) => {
                  const fringe: Model.Fringe | undefined = find(fringes, (fr: Model.Fringe) => fr.name === name.trim());
                  if (!isNil(fringe)) {
                    return fringe.id;
                  }
                  return null;
                }),
                (value: number | null) => value !== null
              ) as number[];
              params.data.fringes = fringeIds;
              return true;
            } else {
              return false;
            }
          }
        }
      ]}
      calculatedColumns={[
        {
          field: "estimated",
          headerName: "Estimated"
        },
        {
          field: "actual",
          headerName: "Actual"
        },
        {
          field: "variance",
          headerName: "Variance"
        }
      ]}
    />
  );
};

export default SubAccountsTable;
