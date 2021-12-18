import {
  AuthenticatedGrid,
  DataGrid,
  DataGridProps,
  authenticateDataGrid,
  AuthenticatedDataGridProps
} from "tabling/generic";

import BudgetDataGrid, { BudgetDataGridProps } from "./makeDataGrid";

export type AuthenticatedBudgetDataGridProps<
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel
> = AuthenticatedDataGridProps<R, M> & BudgetDataGridProps<R>;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const DG = DataGrid<any, any, AuthenticatedBudgetDataGridProps<any, any>>()(AuthenticatedGrid) as {
  <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(props: DataGridProps<R, M>): JSX.Element;
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const DGW = authenticateDataGrid<any, any, AuthenticatedBudgetDataGridProps<any, any>>()(DG);

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export default BudgetDataGrid<any, AuthenticatedBudgetDataGridProps<any>>(DGW) as {
  <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
    props: AuthenticatedBudgetDataGridProps<R, M>
  ): JSX.Element;
};
