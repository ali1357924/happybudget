import { useSelector } from "react-redux";
import { isNil } from "lodash";

import { BudgetSubAccountRowManager } from "lib/tabling/managers";

import { selectBudgetFringes, selectBudgetDetail, selectBudgetDetailLoading } from "../store/selectors";
import SubAccountsBudgetTable, { SubAccountsBudgetTableProps } from "../SubAccountsBudgetTable";

const SubAccountsTable = ({
  ...props
}: Omit<
  SubAccountsBudgetTableProps<Table.BudgetSubAccountRow, Model.BudgetSubAccount, Model.BudgetGroup>,
  "manager" | "fringes" | "fringesCellRenderer"
>): JSX.Element => {
  const detail = useSelector(selectBudgetDetail);
  const loadingBudget = useSelector(selectBudgetDetailLoading);
  const fringes = useSelector(selectBudgetFringes);

  return (
    <SubAccountsBudgetTable<Table.BudgetSubAccountRow, Model.BudgetSubAccount, Model.BudgetGroup>
      manager={BudgetSubAccountRowManager}
      loadingBudget={loadingBudget}
      fringes={fringes}
      fringesCellRenderer={"BudgetFringesCell"}
      budgetTotals={{
        estimated: !isNil(detail) && !isNil(detail.estimated) ? detail.estimated : 0.0,
        variance: !isNil(detail) && !isNil(detail.variance) ? detail.variance : 0.0,
        actual: !isNil(detail) && !isNil(detail.actual) ? detail.actual : 0.0
      }}
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
      {...props}
    />
  );
};

export default SubAccountsTable;
