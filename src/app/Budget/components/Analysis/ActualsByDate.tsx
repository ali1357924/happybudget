import { useMemo } from "react";
import { useSelector } from "react-redux";
import { reduce, filter, groupBy, map, isNil } from "lodash";
import moment from "moment";
import { Moment } from "moment";

import { redux, hooks } from "lib";
import { Colors } from "style/constants";

import { ActualsByDateChart } from "components/charts";
import { Tile } from "components/layout";

const selectActuals = redux.selectors.simpleDeepEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.analysis.actuals.data
);

type ActualWithDate = Omit<Model.Actual, "date"> & { readonly date: string };
type ActualWithMoment = Omit<ActualWithDate, "date"> & { readonly date: Moment };

const getMonthString = (a: ActualWithMoment) => a.date.subtract(1, "month").startOf("month").format("MMMM");

const generateData = (actuals: Model.Actual[]): Charts.Datum[] => {
  const actualsByMonth: { [key: string]: ActualWithMoment[] } = groupBy(
    filter(
      map(filter(actuals, (a: Model.Actual) => !isNil(a.date)) as ActualWithDate[], (a: ActualWithDate) => ({
        ...a,
        date: moment(a.date)
      })) as ActualWithMoment[],
      (a: ActualWithMoment) => a.date.isValid()
    ),
    getMonthString
  );
  return map(Object.keys(actualsByMonth), (key: string, index: number) => {
    return {
      color: Colors.GREEN,
      label: key,
      id: key,
      value: reduce(
        actualsByMonth[key],
        (curr: number, a: ActualWithMoment) => {
          if (!isNil(a.value)) {
            return curr + a.value;
          }
          return curr;
        },
        0.0
      )
    };
  });
};

interface ActualsByDateProps extends StandardComponentProps {}

const ActualsByDate = (props: ActualsByDateProps): JSX.Element => {
  const actuals = useSelector(selectActuals);

  const data = useMemo(() => generateData(actuals), [hooks.useDeepEqualMemo(actuals)]);

  return (
    <Tile title={"Actuals by Month"} {...props} contentProps={{ style: { height: 250 } }} style={props.style}>
      <ActualsByDateChart data={data} />
    </Tile>
  );
};

export default ActualsByDate;
