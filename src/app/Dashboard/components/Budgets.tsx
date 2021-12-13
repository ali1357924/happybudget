import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { map, isNil } from "lodash";
import { Pagination } from "antd";

import * as api from "api";
import { redux, notifications } from "lib";

import { Icon } from "components";
import { PrimaryButtonIconToggle, DefaultButtonIconToggle } from "components/buttons";
import { BudgetCard } from "components/cards";
import { BudgetDropdown, OrderingDropdown } from "components/dropdowns";
import { NoBudgets } from "components/empty";
import { Input } from "components/fields";
import { Page } from "components/layout";
import { EditBudgetModal, DeleteBudgetModal, CreateBudgetModal } from "components/modals";
import { BudgetEmptyIcon } from "components/svgs";

import { actions } from "../store";

const selectBudgets = (state: Application.Authenticated.Store) => state.dashboard.budgets.data;
const selectBudgetsResponseReceived = (state: Application.Authenticated.Store) =>
  state.dashboard.budgets.responseWasReceived;
const selectLoadingBudgets = (state: Application.Authenticated.Store) => state.dashboard.budgets.loading;
const selectBudgetPage = (state: Application.Authenticated.Store) => state.dashboard.budgets.page;
const selectBudgetPageSize = (state: Application.Authenticated.Store) => state.dashboard.budgets.pageSize;
const selectBudgetsCount = (state: Application.Authenticated.Store) => state.dashboard.budgets.count;
const selectBudgetsSearch = (state: Application.Authenticated.Store) => state.dashboard.budgets.search;
const selectBudgetsOrdering = (state: Application.Authenticated.Store) => state.dashboard.budgets.ordering;

const Budgets = (): JSX.Element => {
  const [isDeleting, setDeleting, setDeleted] = redux.hooks.useTrackModelActions([]);
  const [isDuplicating, setDuplicating, setDuplicated] = redux.hooks.useTrackModelActions([]);

  const [budgetToEdit, setBudgetToEdit] = useState<number | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Model.Budget | null>(null);
  const [createBudgetModalOpen, setCreateBudgetModalOpen] = useState(false);
  const history = useHistory();

  const dispatch: Redux.Dispatch = useDispatch();
  const budgets = useSelector(selectBudgets);
  const loading = useSelector(selectLoadingBudgets);
  const responseWasReceived = useSelector(selectBudgetsResponseReceived);
  const page = useSelector(selectBudgetPage);
  const pageSize = useSelector(selectBudgetPageSize);
  const count = useSelector(selectBudgetsCount);
  const search = useSelector(selectBudgetsSearch);
  const ordering = useSelector(selectBudgetsOrdering);

  useEffect(() => {
    dispatch(actions.requestBudgetsAction(null));
  }, []);

  return (
    <React.Fragment>
      <Page
        pageProps={{ className: "dashboard-page" }}
        className={"budgets"}
        loading={loading}
        title={"My Budgets"}
        contentScrollable={true}
        subMenu={[
          <Input
            placeholder={"Search Projects..."}
            value={search}
            allowClear={true}
            prefix={<Icon icon={"search"} weight={"light"} />}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              dispatch(actions.setBudgetsSearchAction(event.target.value))
            }
          />,
          <BudgetDropdown onNewBudget={() => setCreateBudgetModalOpen(true)}>
            <PrimaryButtonIconToggle
              breakpoint={"medium"}
              icon={<Icon icon={"plus"} weight={"light"} />}
              text={"Create Budget"}
            />
          </BudgetDropdown>,
          <OrderingDropdown
            ordering={ordering}
            onChange={(field: string, order: Http.Order) =>
              dispatch(actions.updateBudgetsOrderingAction({ field, order }))
            }
            models={[
              { id: "created_at", icon: "bars-sort", label: "Created" },
              { id: "updated_at", icon: "timer", label: "Last Updated" },
              { id: "name", icon: "sort-alpha-down", label: "Name" }
            ]}
          >
            <DefaultButtonIconToggle
              breakpoint={"medium"}
              icon={<Icon icon={"bars-filter"} weight={"light"} />}
              text={"Order By"}
            />
          </OrderingDropdown>
        ]}
      >
        {budgets.length === 0 && responseWasReceived ? (
          <NoBudgets
            title={"You don't have any templates yet! Create a new budget."}
            subTitle={
              // eslint-disable-next-line quotes
              'Tip: Click the "Create Budget" button above and create an empty budget or start one from a template.'
            }
          >
            <BudgetEmptyIcon />
          </NoBudgets>
        ) : (
          <div className={"dashboard-card-grid"}>
            {map(budgets, (budget: Model.Budget, index: number) => {
              return (
                <BudgetCard
                  key={index}
                  budget={budget}
                  disabled={isDeleting(budget.id)}
                  duplicating={isDuplicating(budget.id)}
                  onClick={() => history.push(`/budgets/${budget.id}`)}
                  onEdit={() => setBudgetToEdit(budget.id)}
                  onDelete={() => setBudgetToDelete(budget)}
                  onDuplicate={(e: MenuItemModelClickEvent) => {
                    setDuplicating(budget.id);
                    api
                      .duplicateBudget(budget.id)
                      .then((response: Model.Budget) => {
                        e.closeParentDropdown?.();
                        dispatch(actions.addBudgetToStateAction(response));
                      })
                      .catch((err: Error) => notifications.requestError(err))
                      .finally(() => setDuplicated(budget.id));
                  }}
                />
              );
            })}
          </div>
        )}
        {budgets.length !== 0 && responseWasReceived && (
          <Page.Footer>
            <Pagination
              hideOnSinglePage={false}
              showSizeChanger={true}
              defaultPageSize={10}
              defaultCurrent={1}
              pageSize={pageSize}
              current={page}
              total={count}
              onChange={(pg: number, pgSize: number | undefined) => {
                dispatch(
                  actions.setBudgetsPaginationAction(
                    pageSize === undefined ? { page: pg } : { page: pg, pageSize: pgSize }
                  )
                );
              }}
            />
          </Page.Footer>
        )}
      </Page>
      {!isNil(budgetToEdit) && (
        <EditBudgetModal
          open={true}
          id={budgetToEdit}
          onCancel={() => setBudgetToEdit(null)}
          onSuccess={(budget: Model.Budget) => {
            setBudgetToEdit(null);
            dispatch(actions.updateBudgetInStateAction({ id: budget.id, data: budget }));
          }}
        />
      )}
      {createBudgetModalOpen === true && (
        <CreateBudgetModal
          open={true}
          onCancel={() => setCreateBudgetModalOpen(false)}
          onSuccess={(budget: Model.Budget) => {
            dispatch(actions.addBudgetToStateAction(budget));
            setCreateBudgetModalOpen(false);
            history.push(`/budgets/${budget.id}/accounts`);
          }}
        />
      )}
      {!isNil(budgetToDelete) && (
        <DeleteBudgetModal
          open={true}
          onCancel={() => setBudgetToDelete(null)}
          onOk={(e: React.MouseEvent<HTMLElement>) => {
            setBudgetToDelete(null);
            setDeleting(budgetToDelete.id);
            api
              .deleteBudget(budgetToDelete.id)
              .then(() => {
                dispatch(actions.removeBudgetFromStateAction(budgetToDelete.id));
              })
              .catch((err: Error) => notifications.requestError(err))
              .finally(() => {
                setDeleted(budgetToDelete.id);
              });
          }}
          budget={budgetToDelete}
        />
      )}
    </React.Fragment>
  );
};

export default Budgets;
