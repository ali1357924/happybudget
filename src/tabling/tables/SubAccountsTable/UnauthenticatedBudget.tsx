import React, { useMemo } from "react";
import { isNil, map } from "lodash";

import { models, tabling, hooks } from "lib";
import { framework } from "tabling/generic";

import { UnauthenticatedBudgetTable, UnauthenticatedBudgetTableProps } from "../BudgetTable";
import SubAccountsTable, { WithSubAccountsTableProps } from "./SubAccountsTable";
import Columns from "./Columns";

type R = Tables.SubAccountRowData;
type M = Model.SubAccount;

export type UnauthenticatedBudgetProps = Omit<UnauthenticatedBudgetTableProps<R, M>, "columns"> & {
  readonly subAccountUnits: Model.Tag[];
  readonly fringes: Tables.FringeRow[];
  readonly categoryName: "Sub Account" | "Detail";
  readonly identifierFieldHeader: "Account" | "Line";
  readonly exportFileName: string;
};

const UnauthenticatedBudgetSubAccountsTable = (
  props: WithSubAccountsTableProps<UnauthenticatedBudgetProps>
): JSX.Element => {
  const table = tabling.hooks.useTableIfNotDefined(props.table);

  const processFringesCellForClipboard = hooks.useDynamicCallback((row: R) => {
    const fringes = models.getModelsByIds<Tables.FringeRow>(props.fringes, row.fringes);
    return map(fringes, (fringe: Tables.FringeRow) => fringe.data.name).join(", ");
  });

  const columns = useMemo(
    () =>
      tabling.columns.normalizeColumns(Columns, {
        identifier: (col: Table.Column<R, M>) => ({
          ...col,
          headerName: props.identifierFieldHeader
        }),
        description: { headerName: `${props.categoryName} Description` },
        unit: (col: Table.Column<R, M>) => ({ ...col, models: props.subAccountUnits }),
        fringes: {
          processCellForClipboard: processFringesCellForClipboard
        }
      }),
    [props.fringes, props.categoryName, props.subAccountUnits, props.identifierFieldHeader]
  );

  return (
    <UnauthenticatedBudgetTable<R, M>
      {...props}
      table={table}
      columns={columns}
      actions={(params: Table.UnauthenticatedMenuActionParams<R, M>) => [
        ...(isNil(props.actions) ? [] : Array.isArray(props.actions) ? props.actions : props.actions(params)),
        framework.actions.ToggleColumnAction<R, M>(table.current, params),
        framework.actions.ExportCSVAction<R, M>(table.current, params, props.exportFileName)
      ]}
    />
  );
};

export default React.memo(SubAccountsTable<UnauthenticatedBudgetProps>(UnauthenticatedBudgetSubAccountsTable));