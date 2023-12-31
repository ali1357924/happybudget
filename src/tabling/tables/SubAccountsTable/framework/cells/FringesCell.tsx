import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { filter } from "lodash";

import * as selectors from "app/Budgeting/store/selectors";
import { hooks, model, tabling } from "lib";

import { MultipleTags } from "components/tagging";
import { Cell } from "tabling/generic/framework/cells";

export type FringesCellProps<
  B extends Model.Budget | Model.Template,
  P extends Model.Account | Model.SubAccount,
  PUBLIC extends boolean = boolean
> = Table.CellProps<
  Tables.SubAccountRowData,
  Model.SubAccount,
  SubAccountsTableActionContext<B, P, PUBLIC>,
  Tables.SubAccountTableStore,
  number[]
>;

const FringesCell = <
  B extends Model.Budget | Model.Template,
  P extends Model.Account | Model.SubAccount,
  PUBLIC extends boolean = boolean
>({
  value,
  ...props
}: FringesCellProps<B, P, PUBLIC>): JSX.Element => {
  const fringes: Table.BodyRow<Tables.FringeRowData>[] = useSelector((state: Application.Store) =>
    selectors.selectFringes(state, props.tableContext)
  );

  const applicableFringes: Tables.FringeRow[] = useMemo(
    () =>
      model.getModels(
        filter(fringes, (r: Table.BodyRow<Tables.FringeRowData>) => tabling.rows.isModelRow(r)) as Tables.FringeRow[],
        value
      ),
    [hooks.useDeepEqualMemo(fringes), value]
  );

  return (
    <Cell<Tables.SubAccountRowData, Model.SubAccount, SubAccountsTableActionContext, Tables.SubAccountTableStore>
      {...props}
    >
      <MultipleTags<Tables.FringeRow> models={applicableFringes} />
    </Cell>
  );
};

export default React.memo(FringesCell);
