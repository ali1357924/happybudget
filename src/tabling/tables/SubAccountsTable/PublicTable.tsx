import { useMemo } from "react";
import { useSelector } from "react-redux";
import { map } from "lodash";

import { model, tabling, hooks } from "lib";

import { selectors } from "app/Budgeting/store";
import { PublicBudgetTable, PublicBudgetTableProps } from "../BudgetTable";
import useKeyboardNavigation, { UseKeyboardNavigationReturnType } from "./useKeyboardNavigation";
import { Framework } from "./framework";

type R = Tables.SubAccountRowData;
type M = Model.SubAccount;
type S = Tables.SubAccountTableStore;

type OmitProps =
  | keyof UseKeyboardNavigationReturnType<R>
  | "showPageFooter"
  | "pinFirstColumn"
  | "tableId"
  | "menuPortalId"
  | "framework";

export type PublicTableProps<B extends Model.BaseBudget, P extends Model.Account | Model.SubAccount> = Omit<
  PublicBudgetTableProps<R, M, S>,
  OmitProps
> & {
  readonly id: P["id"];
  readonly domain: B["domain"];
  readonly budgetId: B["id"];
  readonly parent: P | null;
  readonly parentType: P["type"];
  readonly tokenId: string;
  readonly actionContext: Tables.SubAccountTableContext;
  readonly onOpenFringesModal: () => void;
};

const PublicTable = <B extends Model.BaseBudget, P extends Model.Account | Model.SubAccount>(
  props: PublicTableProps<B, P>
): JSX.Element => {
  const { onBack, onLeft, onRight, onRowExpand } = useKeyboardNavigation({ ...props, authenticated: false });

  const fringes = useSelector((s: Application.Store) =>
    selectors.selectFringes(s, { domain: props.domain, parentType: props.parentType })
  );

  const processFringesCellForClipboard = hooks.useDynamicCallback((row: R) => {
    const fs = model.getModels<Tables.FringeRow>(fringes, row.fringes, { modelName: "fringe" });
    return map(fs, (fringe: Tables.FringeRow) => fringe.id).join(", ");
  });

  const columns = useMemo(
    () =>
      tabling.columns.normalizeColumns(props.columns, {
        fringes: {
          headerComponentParams: { onEdit: () => props.onOpenFringesModal() },
          processCellForClipboard: processFringesCellForClipboard
        },
        identifier: { headerName: props.parentType === "account" ? "Account" : "Line" },
        description: { headerName: `${props.parentType === "account" ? "SubAccount" : "Detail"} Description` }
      }),
    [props.onOpenFringesModal, props.parentType, hooks.useDeepEqualMemo(props.columns), processFringesCellForClipboard]
  );

  return (
    <PublicBudgetTable
      {...props}
      columns={columns}
      menuPortalId={"supplementary-header"}
      showPageFooter={true}
      pinFirstColumn={true}
      tableId={`public-${props.domain}-${props.parentType}-subaccounts`}
      framework={Framework}
      onBack={onBack}
      onRowExpand={onRowExpand}
      onLeft={onLeft}
      onRight={onRight}
    />
  );
};

export default PublicTable;
