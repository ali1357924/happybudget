import React from "react";

import PublicTable, { PublicTableProps } from "./PublicTable";
import Columns from "./Columns";

export type PublicBudgetProps<P extends Model.Account | Model.SubAccount> = Omit<
  PublicTableProps<Model.Budget, P>,
  "domain" | "columns"
>;

const PublicBudgetTable = <P extends Model.Account | Model.SubAccount>(props: PublicBudgetProps<P>): JSX.Element => (
  <PublicTable {...props} domain={"budget"} columns={Columns} />
);

export default React.memo(PublicBudgetTable) as typeof PublicBudgetTable;
