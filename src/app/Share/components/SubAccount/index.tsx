import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { createSelector } from "reselect";
import { isNil, map } from "lodash";

import { redux, budgeting } from "lib";

import { RenderIfValidId, WrapInApplicationSpinner } from "components";
import { Portal, BreadCrumbs } from "components/layout";
import { EntityTextButton } from "components/buttons";
import { EntityText } from "components/typography";

import { actions } from "../../store";
import SubAccountsTable from "./SubAccountsTable";

const selectDetail = redux.selectors.simpleDeepEqualSelector(
  (state: Modules.Unauthenticated.Store) => state.share.subaccount.detail.data
);
const selectSubAccountsLoading = redux.selectors.simpleShallowEqualSelector(
  (state: Modules.Unauthenticated.Store) => state.share.subaccount.table.loading
);
const selectGroupsLoading = redux.selectors.simpleShallowEqualSelector(
  (state: Modules.Unauthenticated.Store) => state.share.subaccount.table.groups.loading
);
const selectLoading = createSelector(
  selectSubAccountsLoading,
  selectGroupsLoading,
  (tableLoading: boolean, groupsLoading: boolean) => tableLoading || groupsLoading
);

interface SubAccountProps {
  readonly budgetId: number;
  readonly budget: Model.Budget | undefined;
}

const SubAccount = ({ budgetId, budget }: SubAccountProps): JSX.Element => {
  const { subaccountId } = useParams<{ subaccountId: string }>();
  const dispatch = useDispatch();

  const loading = useSelector(selectLoading);
  const detail = useSelector(selectDetail);

  useEffect(() => {
    if (!isNaN(parseInt(subaccountId))) {
      dispatch(actions.subAccount.setSubAccountIdAction(parseInt(subaccountId)));
      // TODO: It might not be necessary to get a fresh set of fringes everytime the SubAccount changes,
      // we might be able to move this further up in the tree - but for now it is safer to rely on the
      // source of truth from the API more often than not.
      dispatch(actions.subAccount.requestFringesAction(null));
    }
  }, [subaccountId]);

  useEffect(() => {
    if (!isNil(budgetId) && !isNaN(parseInt(subaccountId))) {
      budgeting.urls.setBudgetLastVisited(budgetId, `/budgets/${budgetId}/subaccounts/${subaccountId}`);
    }
  }, [budgetId]);

  return (
    <RenderIfValidId id={[subaccountId]}>
      <Portal id={"breadcrumbs"}>
        <BreadCrumbs
          params={{ b: budget, subaccount: detail }}
          items={[
            {
              requiredParams: ["b"],
              func: ({ b }: { b: Model.Budget }) => ({
                id: b.id,
                primary: true,
                label: b.name,
                tooltip: { title: "Top Sheet", placement: "bottom" },
                url: budgeting.urls.getUrl(b)
              })
            },
            {
              requiredParams: ["b", "subaccount"],
              func: ({ b, subaccount }: { b: Model.Budget; subaccount: Model.SubAccount }) => {
                const siblings = subaccount.siblings || [];
                const ancestors = subaccount.ancestors || [];
                return [
                  ...map(ancestors.slice(1), (ancestor: Model.Entity) => {
                    return {
                      id: ancestor.id,
                      render: () => <EntityText fillEmpty={"---------"}>{ancestor}</EntityText>,
                      url: budgeting.urls.getUrl(b, ancestor)
                    };
                  }),
                  {
                    id: subaccount.id,
                    url: budgeting.urls.getUrl(b, subaccount),
                    render: () => {
                      if (siblings.length !== 0) {
                        return <EntityTextButton fillEmpty={"---------"}>{subaccount}</EntityTextButton>;
                      }
                      return <EntityText fillEmpty={"---------"}>{subaccount}</EntityText>;
                    },
                    options: map(siblings, (option: Model.SimpleSubAccount) => ({
                      id: option.id,
                      url: budgeting.urls.getUrl(b, option),
                      render: () => <EntityText fillEmpty={"---------"}>{option}</EntityText>
                    }))
                  }
                ];
              }
            }
          ]}
        />
      </Portal>
      <WrapInApplicationSpinner loading={loading}>
        <SubAccountsTable budget={budget} budgetId={budgetId} subaccountId={parseInt(subaccountId)} />
      </WrapInApplicationSpinner>
    </RenderIfValidId>
  );
};

export default SubAccount;