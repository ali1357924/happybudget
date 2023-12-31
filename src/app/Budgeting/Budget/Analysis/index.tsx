import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { AnalysisPage } from "app/Budgeting/Pages";

import { actions } from "../../store";

import BudgetTotal from "./BudgetTotal";
import ActualsByDate from "./ActualsByDate";

type AnalysisProps = {
  readonly budget: Model.Budget | null;
  readonly budgetId: number;
};

const Analysis = ({ budget, budgetId }: AnalysisProps): JSX.Element => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(actions.budget.analysis.requestAction(null, { budgetId }));
  }, [budgetId]);

  return (
    <AnalysisPage budget={budget}>
      <div style={{ overflowY: "scroll" }}>
        <div className={"analysis-charts"}>
          <BudgetTotal className={"analysis-chart"} budget={budget} budgetId={budgetId} />
          <ActualsByDate className={"analysis-chart"} budgetId={budgetId} />
        </div>
      </div>
    </AnalysisPage>
  );
};

export default Analysis;
