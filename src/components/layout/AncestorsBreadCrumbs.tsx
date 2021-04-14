import React from "react";
import { useHistory } from "react-router-dom";
import { map, isNil, find } from "lodash";
import classNames from "classnames";

import { Select } from "antd";

import { EntityText } from "components/typography";
import "./AncestorsBreadCrumbs.scss";

/* eslint-disable indent */
const getUrl = (entity: Model.Entity, budgetId: number): string => {
  return entity.type === "subaccount"
    ? `/budgets/${budgetId}/subaccounts/${entity.id}`
    : entity.type === "account"
    ? `/budgets/${budgetId}/accounts/${entity.id}`
    : `/budgets/${budgetId}/accounts`;
};

interface AncestorBreadCrumbItemProps extends StandardComponentProps {
  children: JSX.Element;
  url?: string;
}

const AncestorBreadCrumbItem = ({ className, style = {}, children, url }: AncestorBreadCrumbItemProps): JSX.Element => {
  const history = useHistory();

  return (
    <div
      className={classNames("ancestors-bread-crumb-item", className)}
      style={style}
      onClick={() => (!isNil(url) ? history.push(url) : undefined)}
    >
      {children}
    </div>
  );
};

interface AncestorBreadCrumbSelectItemProps extends StandardComponentProps {
  instance: Model.Account | Model.SubAccount;
  budget: Model.Budget;
}

const AncestorBreadCrumbSelectItem = ({
  instance,
  className,
  budget,
  style = {}
}: AncestorBreadCrumbSelectItemProps): JSX.Element => {
  const history = useHistory();

  return (
    <AncestorBreadCrumbItem className={className} style={style}>
      <div className={"select-wrapper"}>
        <Select
          className={"select--ancestor"}
          value={instance.id}
          bordered={false}
          onChange={(value: number) => {
            const sibling = find(instance.siblings, { id: value });
            if (isNil(sibling)) {
              /* eslint-disable no-console */
              console.error(`The select value corresponds to a sibling ${value} that is not in state!`);
            } else if (sibling.id !== instance.id) {
              history.push(getUrl(sibling, budget.id));
            }
          }}
        >
          <Select.Option value={instance.id}>
            <EntityText>{instance}</EntityText>
          </Select.Option>
          {map(instance.siblings, (sibling: Model.Entity) => {
            return (
              <Select.Option value={sibling.id} key={sibling.id}>
                <EntityText>{sibling}</EntityText>
              </Select.Option>
            );
          })}
        </Select>
      </div>
    </AncestorBreadCrumbItem>
  );
};

interface AncestorBreadCrumbEntityItemProps extends StandardComponentProps {
  budget: Model.Budget;
  children: Model.Entity;
}

const AncestorBreadCrumbEntityItem = ({ children, budget }: AncestorBreadCrumbEntityItemProps): JSX.Element => {
  return (
    <AncestorBreadCrumbItem url={getUrl(children, budget.id)}>
      <div className={"entity-text-wrapper"}>
        <EntityText>{children}</EntityText>
      </div>
    </AncestorBreadCrumbItem>
  );
};

interface AncestorBreadCrumbBudgetItemProps {
  budget: Model.Budget;
}

const AncestorBreadCrumbBudgetItem = ({ budget }: AncestorBreadCrumbBudgetItemProps): JSX.Element => {
  return (
    <AncestorBreadCrumbItem url={`/budgets/${budget.id}/accounts`}>
      <div className={"budget-text-wrapper"}>{budget.name}</div>
    </AncestorBreadCrumbItem>
  );
};

interface AncestorsBreadCrumbsProps {
  instance: Model.Account | Model.SubAccount | null;
  budget: Model.Budget;
}

const AncestorsBreadCrumbs = ({ instance, budget }: AncestorsBreadCrumbsProps): JSX.Element => {
  return (
    <div className={"ancestors-bread-crumbs"}>
      <AncestorBreadCrumbBudgetItem budget={budget} />
      {!isNil(instance) && (
        <React.Fragment>
          <span className={"slash"}>{"/"}</span>
          {map(instance.ancestors.slice(1), (entity: Model.Entity, index: number) => {
            return (
              <React.Fragment key={index}>
                <AncestorBreadCrumbEntityItem budget={budget}>{entity}</AncestorBreadCrumbEntityItem>
                {index !== instance.ancestors.length - 1 && <span className={"slash"}>{"/"}</span>}
              </React.Fragment>
            );
          })}
          <AncestorBreadCrumbSelectItem instance={instance} budget={budget} />
        </React.Fragment>
      )}
    </div>
  );
};

export default AncestorsBreadCrumbs;
