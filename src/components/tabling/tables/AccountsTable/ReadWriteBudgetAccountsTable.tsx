import { useMemo } from "react";
import { isNil } from "lodash";

import { util, hooks, tabling } from "lib";
import { framework } from "components/tabling/generic";

import { ReadWriteBudgetTable, ReadWriteBudgetTableProps } from "../BudgetTable";
import AccountsTable, { AccountsTableProps, WithAccountsTableProps } from "./AccountsTable";

type R = Tables.AccountRow;
type M = Model.Account;

export type ReadWriteBudgetAccountsTableProps = AccountsTableProps &
  Omit<ReadWriteBudgetTableProps<R, M>, "columns" | "cookieNames" | "budgetType" | "levelType" | "getRowChildren"> & {
    readonly budget?: Model.Budget;
    readonly tableRef?: NonNullRef<BudgetTable.ReadWriteTableRefObj<R, M>>;
    readonly cookieNames?: Table.CookieNames;
    readonly onExportPdf: () => void;
    readonly onEditGroup: (group: Model.Group) => void;
  };

const ReadWriteBudgetAccountsTable = (
  props: WithAccountsTableProps<ReadWriteBudgetAccountsTableProps>
): JSX.Element => {
  const tableRef = tabling.hooks.useReadWriteBudgetTableIfNotDefined(props.tableRef);

  const columns = useMemo<Table.Column<R, M>[]>((): Table.Column<R, M>[] => {
    return [
      ...util.updateInArray<Table.Column<R, M>>(
        props.columns,
        { field: "identifier" },
        {
          cellRendererParams: {
            onGroupEdit: props.onEditGroup
          }
        }
      ),
      framework.columnObjs.CalculatedColumn({
        field: "estimated",
        headerName: "Estimated",
        footer: {
          value: !isNil(props.budget) && !isNil(props.budget.estimated) ? props.budget.estimated : 0.0
        }
      }),
      framework.columnObjs.CalculatedColumn({
        field: "actual",
        headerName: "Actual",
        footer: {
          value: !isNil(props.budget) && !isNil(props.budget.actual) ? props.budget.actual : 0.0
        }
      }),
      framework.columnObjs.CalculatedColumn({
        field: "variance",
        headerName: "Variance",
        footer: {
          value: !isNil(props.budget) && !isNil(props.budget.variance) ? props.budget.variance : 0.0
        }
      })
    ];
  }, [hooks.useDeepEqualMemo(props.columns)]);

  return (
    <ReadWriteBudgetTable<R, M>
      {...props}
      actions={(params: Table.ReadWriteMenuActionParams<R, M>) => [
        {
          icon: "folder",
          disabled: true,
          label: "Group",
          isWriteOnly: true
        },
        {
          icon: "badge-percent",
          disabled: true,
          label: "Mark Up",
          isWriteOnly: true
        },
        ...(isNil(props.actions) ? [] : Array.isArray(props.actions) ? props.actions : props.actions(params)),
        framework.actions.ToggleColumnAction<R, M>(tableRef.current, params),
        framework.actions.ExportPdfAction(props.onExportPdf),
        framework.actions.ExportCSVAction(
          tableRef.current,
          params,
          !isNil(props.budget) ? `${props.budget.type}_${props.budget.name}_accounts` : ""
        )
      ]}
      columns={columns}
      budgetType={"budget"}
    />
  );
};

export default AccountsTable<ReadWriteBudgetAccountsTableProps>(ReadWriteBudgetAccountsTable);
