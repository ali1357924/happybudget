import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Cookies from "universal-cookie";
import { createSelector } from "reselect";
import { isNil } from "lodash";

import { RenderIfValidId, WrapInApplicationSpinner } from "components/display";
import { simpleDeepEqualSelector, simpleShallowEqualSelector } from "store/selectors";

import { setInstanceAction } from "../store/actions";
import { setAccountIdAction } from "../store/actions/account";
import { selectBudgetId } from "../store/selectors";
import AccountBudgetTable from "./AccountBudgetTable";
import AccountCommentsHistory from "./AccountCommentsHistory";

const selectDetail = simpleDeepEqualSelector((state: Redux.IApplicationStore) => state.budget.account.detail.data);
const selectSubAccountsLoading = simpleShallowEqualSelector(
  (state: Redux.IApplicationStore) => state.budget.account.subaccounts.loading
);
const selectDeletingGroups = simpleShallowEqualSelector(
  (state: Redux.IApplicationStore) => state.budget.account.subaccounts.groups.deleting.length !== 0
);
const selectLoading = createSelector(
  selectSubAccountsLoading,
  selectDeletingGroups,
  (tableLoading: boolean, deletingGroups: boolean) => tableLoading || deletingGroups
);

const Account = (): JSX.Element => {
  const { accountId } = useParams<{ budgetId: string; accountId: string }>();
  const dispatch = useDispatch();
  const budgetId = useSelector(selectBudgetId);
  const loading = useSelector(selectLoading);
  const detail = useSelector(selectDetail);

  useEffect(() => {
    if (!isNaN(parseInt(accountId))) {
      dispatch(setAccountIdAction(parseInt(accountId)));
    }
  }, [accountId]);

  useEffect(() => {
    if (!isNil(detail)) {
      dispatch(setInstanceAction(detail));
    }
  }, [detail]);

  useEffect(() => {
    if (!isNil(budgetId) && !isNaN(parseInt(accountId))) {
      const cookies = new Cookies();
      cookies.set("budget-last-visited", `/budgets/${budgetId}/accounts/${accountId}`);
    }
  }, [budgetId]);

  return (
    <RenderIfValidId id={[accountId]}>
      <WrapInApplicationSpinner loading={loading}>
        <AccountBudgetTable accountId={parseInt(accountId)} />
      </WrapInApplicationSpinner>
      <AccountCommentsHistory />
    </RenderIfValidId>
  );
};

export default Account;
