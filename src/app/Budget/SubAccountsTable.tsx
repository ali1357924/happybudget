import { useSelector } from "react-redux";
import { isNil, includes, find, filter, map } from "lodash";
import classNames from "classnames";

import { ColDef, ColSpanParams, ProcessCellForExportParams } from "ag-grid-community";

import { SubAccountUnitModelsList } from "lib/model";
import { SubAccountMapping } from "lib/tabling/mappings";
import { currencyValueFormatter } from "lib/tabling/formatters";
import { floatValueSetter, integerValueSetter } from "lib/tabling/valueSetters";
import { getKeyValue } from "lib/util";

import BudgetTable from "./BudgetTable";
import { selectFringes, selectBudgetDetail, selectBudgetDetailLoading } from "./store/selectors";

interface SubAccountsTableProps {
  data: ISubAccount[];
  groups?: IGroup<ISimpleSubAccount>[];
  placeholders?: Table.SubAccountRow[];
  selected?: number[];
  tableFooterIdentifierValue?: string | null;
  tableTotals?: { [key: string]: any };
  search: string;
  saving: boolean;
  onSearch: (value: string) => void;
  onRowSelect: (id: number) => void;
  onRowDeselect: (id: number) => void;
  onRowUpdate: (payload: Table.RowChange) => void;
  onRowBulkUpdate?: (payload: Table.RowChange[]) => void;
  onRowAdd: () => void;
  onRowDelete: (row: Table.SubAccountRow) => void;
  onRowExpand?: (id: number) => void;
  onSelectAll: () => void;
  onGroupRows: (rows: Table.SubAccountRow[]) => void;
  onDeleteGroup: (group: IGroup<ISimpleSubAccount>) => void;
  onEditGroup: (group: IGroup<ISimpleSubAccount>) => void;
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
  onRowSelect,
  onRowUpdate,
  onRowDeselect,
  onRowBulkUpdate,
  onRowAdd,
  onRowDelete,
  onRowExpand,
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
      ISubAccount,
      IGroup<ISimpleSubAccount>,
      Http.ISubAccountPayload,
      ISimpleSubAccount
    >
      data={data}
      groups={groups}
      placeholders={placeholders}
      mapping={SubAccountMapping}
      selected={selected}
      loadingBudget={loadingBudget}
      sizeColumnsToFit={false}
      identifierField={"identifier"}
      identifierFieldHeader={"Line"}
      identifierColumn={{ width: 70, cellRendererParams: { className: "subaccount-identifier" } }}
      tableFooterIdentifierValue={tableFooterIdentifierValue}
      budgetFooterIdentifierValue={!isNil(budgetDetail) ? `${budgetDetail.name} Total` : "Total"}
      isCellEditable={(row: Table.SubAccountRow, colDef: ColDef) => {
        if (includes(["unit", "fringes"], colDef.field)) {
          return false;
        } else if (includes(["identifier", "description", "name"], colDef.field)) {
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
      processCellForClipboard={(params: ProcessCellForExportParams) => {
        if (!isNil(params.node)) {
          const row: Table.SubAccountRow = params.node.data;
          const colDef = params.column.getColDef();
          if (!isNil(colDef.field)) {
            if (colDef.field === "unit" && !isNil(row.unit)) {
              const choiceModel: SubAccountUnitOptionModel | undefined = find(SubAccountUnitModelsList, {
                id: row.unit
              } as any);
              if (!isNil(choiceModel)) {
                return choiceModel.name;
              } else {
                /* eslint-disable no-console */
                console.error(
                  `Corrupted Cell Found! Could not convert model value ${row.unit} for field ${colDef.field}
                  to a name.`
                );
                return "";
              }
            } else if (colDef.field === "fringes") {
              // TODO: We might need to wrap this method in a useDynamicCallback hook, because
              // this method is fed directly into AG Grid and we are accessing a part of the state
              // inside the method.
              const subAccountFringes: IFringe[] = filter(
                map(row.fringes, (id: number) => {
                  const fringe: IFringe | undefined = find(fringes, { id });
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
                (fringe: IFringe | null) => fringe !== null
              ) as IFringe[];
              return map(subAccountFringes, (fringe: IFringe) => fringe.name).join(", ");
            } else {
              return getKeyValue<Table.SubAccountRow, keyof Table.SubAccountRow>(
                colDef.field as keyof Table.SubAccountRow
              )(row);
            }
          }
        }
      }}
      bodyColumns={[
        {
          field: "description",
          headerName: "Category Description",
          flex: 100,
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
          valueSetter: integerValueSetter("quantity")
        },
        {
          field: "unit",
          headerName: "Unit",
          cellClass: classNames("cell--centered"),
          cellRenderer: "SubAccountUnitCell",
          width: 100,
          cellRendererParams: {
            onChange: (unit: SubAccountUnit, row: Table.SubAccountRow) =>
              onRowUpdate({
                id: row.id,
                data: {
                  unit: {
                    oldValue: row.unit,
                    newValue: unit
                  }
                }
              })
          }
        },
        {
          field: "multiplier",
          headerName: "X",
          width: 50,
          cellStyle: { textAlign: "right" },
          valueSetter: floatValueSetter("multiplier")
        },
        {
          field: "rate",
          headerName: "Rate",
          width: 70,
          cellStyle: { textAlign: "right" },
          valueFormatter: currencyValueFormatter,
          valueSetter: floatValueSetter("rate")
        },
        {
          field: "fringes",
          headerName: "Fringes",
          cellClass: classNames("cell--centered"),
          cellRenderer: "FringesCell",
          minWidth: 150,
          cellRendererParams: {
            onClear: (row: Table.SubAccountRow, colDef: ColDef) => {
              onRowUpdate({
                id: row.id,
                data: {
                  fringes: {
                    oldValue: row.fringes,
                    newValue: []
                  }
                }
              });
            },
            hideClear: (row: Table.SubAccountRow, colDef: ColDef) => row.fringes.length === 0,
            onChange: (ids: number[], row: Table.SubAccountRow) =>
              onRowUpdate({
                id: row.id,
                data: {
                  fringes: {
                    oldValue: row.fringes,
                    newValue: ids
                  }
                }
              })
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
