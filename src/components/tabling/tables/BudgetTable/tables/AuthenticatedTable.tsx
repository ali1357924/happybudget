import {
  AuthenticatedTable,
  AuthenticatedTableProps,
  AuthenticatedTableDataGridProps
} from "components/tabling/generic";

import { tabling } from "lib";

import { AuthenticatedBudgetDataGrid } from "../grids";
import { Framework } from "../framework";

export type AuthenticatedBudgetTableProps<R extends Table.RowData, M extends Model.Model = Model.Model> = Omit<
  AuthenticatedTableProps<R, M, Model.BudgetGroup>,
  "children"
> & {
  readonly tableRef?: NonNullRef<Table.AuthenticatedTableRefObj<R>>;
  readonly onBack?: () => void;
};

/* eslint-disable indent */
const AuthenticatedBudgetTable = <R extends Table.RowData, M extends Model.Model = Model.Model>(
  props: AuthenticatedBudgetTableProps<R, M>
): JSX.Element => {
  return (
    <AuthenticatedTable<R, M, Model.BudgetGroup>
      {...props}
      framework={tabling.aggrid.combineFrameworks(Framework, props.framework)}
    >
      {(params: AuthenticatedTableDataGridProps<R, M, Model.BudgetGroup>) => (
        <AuthenticatedBudgetDataGrid<R, M> {...params} />
      )}
    </AuthenticatedTable>
  );
};

export default AuthenticatedBudgetTable;