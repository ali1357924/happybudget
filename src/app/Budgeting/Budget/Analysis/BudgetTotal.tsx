import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { find, reduce, filter, includes, map, isNil } from "lodash";

import { redux, model, hooks, util, ui, formatters } from "lib";
import { DEFAULT_COLOR_SCHEME, Colors } from "style/constants";

import { NoData } from "components";
import { BudgetTotalChart } from "components/charts";
import { Tile } from "components/containers";
import { BudgetTotalChartForm, BudgetTotalChartFormValues } from "components/forms";

const selectGroups = redux.simpleDeepEqualSelector((state: Application.Store) => state.budget.analysis.groups.data);
const selectAccounts = redux.simpleDeepEqualSelector((state: Application.Store) => state.budget.analysis.accounts.data);

const selectResponseWasReceived = (state: Application.Store) => state.budget.analysis.responseWasReceived;

type M = Model.Group | Model.Account;
type Datum = Charts.Datum & { readonly type: "account" | "group" };

const getColor = (obj: M, index: number) =>
  model.budgeting.isGroup(obj)
    ? obj.color || Colors.COLOR_NO_COLOR
    : util.colors.getLoopedColorInScheme(DEFAULT_COLOR_SCHEME, index);
const getLabel = (obj: M) => (model.budgeting.isGroup(obj) ? obj.name : obj.description || obj.identifier || "");
const getId = (obj: M) => `${obj.type}-${obj.id}`;

const Metrics: Charts.BudgetTotal.Metric<M>[] = [
  {
    label: "Estimated",
    id: "estimated",
    getValue: (obj: M, objs: Model.Account[]) => model.budgeting.estimatedValue(obj, objs)
  },
  {
    label: "Actual",
    id: "actual",
    getValue: (obj: M, objs: Model.Account[]) => model.budgeting.actualValue(obj, objs)
  },
  {
    label: "Variance",
    id: "variance",
    getValue: (obj: M, objs: Model.Account[]) => model.budgeting.varianceValue(obj, objs)
  }
];

const getMetricValue = (id: Charts.BudgetTotal.MetricId, obj: M, objs: Model.Account[]): number => {
  const metric = find(Metrics, { id }) as Charts.BudgetTotal.Metric<M>;
  return metric.getValue(obj, objs);
};

const getMetricDatum = (id: Charts.BudgetTotal.MetricId, obj: M, objs: Model.Account[], index: number): Datum => {
  return {
    label: getLabel(obj),
    id: getId(obj),
    color: getColor(obj, index),
    value: getMetricValue(id, obj, objs),
    type: obj.type
  };
};

const generateData = (
  metric: Charts.BudgetTotal.MetricId,
  groups: Model.Group[],
  accounts: Model.Account[],
  grouped: boolean
): Datum[] => {
  let accountsWithoutGroup: Model.Account[] = [...accounts];
  let groupDatums: Datum[] = [];
  if (grouped === true) {
    groupDatums = reduce(
      groups,
      (curr: Datum[], g: Model.Group, i: number) => {
        /* Remove the accounts from `accountsWithoutGroup` that are already
					 accounted for via their parent Group. */
        accountsWithoutGroup = filter(accountsWithoutGroup, (a: Model.Account) => !includes(g.children, a.id));
        return [...curr, getMetricDatum(metric, g, accounts, i)];
      },
      []
    );
    if (accountsWithoutGroup.length !== 0) {
      const fakeGroup: Model.Group = {
        color: Colors.COLOR_NO_COLOR,
        name: "Other",
        id: 10000,
        type: "group",
        children: map(accountsWithoutGroup, (a: Model.Account) => a.id)
      };
      groupDatums = [...groupDatums, getMetricDatum(metric, fakeGroup, accounts, groupDatums.length)];
    }
    return groupDatums;
  }
  return map(accountsWithoutGroup, (a: Model.Account, i: number) => getMetricDatum(metric, a, accounts, i));
};

interface BudgetTotalProps extends StandardComponentProps {
  readonly budget: Model.Budget | null;
  readonly budgetId: number;
}

const BudgetTotal = ({ budget, budgetId, ...props }: BudgetTotalProps): JSX.Element => {
  const history = useHistory();
  const [metric, setMetric] = useState<Charts.BudgetTotal.MetricId>("estimated");
  const [grouped, setGrouped] = useState(true);

  const form = ui.form.useForm<BudgetTotalChartFormValues>();

  const groups = useSelector(selectGroups);
  const accounts = useSelector(selectAccounts);
  const responseWasReceived = useSelector(selectResponseWasReceived);

  const data = useMemo(
    () => generateData(metric, groups, accounts, grouped),
    [hooks.useDeepEqualMemo(groups), hooks.useDeepEqualMemo(accounts), metric, grouped]
  );

  const budgetTotal = useMemo(() => {
    if (!isNil(budget)) {
      switch (metric) {
        case "actual":
          return formatters.currencyFormatter((v: string | number) =>
            console.error(`Could not parse currency from value ${v} for budget actual.`)
          )(model.budgeting.actualValue(budget));
        case "variance":
          return formatters.currencyFormatter((v: string | number) =>
            console.error(`Could not parse currency from value ${v} for budget variance.`)
          )(model.budgeting.varianceValue(budget));
        default:
          return formatters.currencyFormatter((v: string | number) =>
            console.error(`Could not parse currency from value ${v} for budget estimated.`)
          )(model.budgeting.estimatedValue(budget));
      }
    }
    return formatters.currencyFormatter(0);
  }, [budget, metric]);

  return (
    <Tile
      {...props}
      title={"Budget Total"}
      subTitle={budgetTotal}
      contentProps={{ style: { height: 250 } }}
      style={props.style}
    >
      {accounts.length !== 0 && responseWasReceived ? (
        <>
          <BudgetTotalChartForm
            initialValues={{ grouped: true, metric: "estimated" }}
            form={form}
            style={{ position: "absolute", top: 10, right: 10, maxWidth: 150 }}
            metrics={Metrics}
            onValuesChange={(changedValues: Partial<BudgetTotalChartFormValues>) => {
              if (changedValues.grouped !== undefined) {
                setGrouped(changedValues.grouped);
              }
              if (changedValues.metric !== undefined) {
                setMetric(changedValues.metric);
              }
            }}
          />
          <BudgetTotalChart<Datum> data={data} />
        </>
      ) : (
        <NoData
          subTitle={"Your budget does not have any data. Add data to see analysis."}
          button={{
            onClick: () => history.push(`/budgets/${budgetId}/accounts`),
            text: "Go to Budget"
          }}
        />
      )}
    </Tile>
  );
};

export default BudgetTotal;
