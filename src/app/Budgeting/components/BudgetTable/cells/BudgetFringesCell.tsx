import { useEffect } from "react";
import { useSelector } from "react-redux";
import { filter, includes, map } from "lodash";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/pro-light-svg-icons";

import { ModelTagsDropdown } from "components/dropdowns";
import { selectBudgetFringes } from "../../../store/selectors";
import Cell, { StandardCellProps } from "./Cell";

interface BudgetFringesCellProps extends StandardCellProps<Table.BudgetSubAccountRow> {
  value: number[];
  onAddFringes: () => void;
}

const BudgetFringesCell = ({ value, onAddFringes, ...props }: BudgetFringesCellProps): JSX.Element => {
  // I am not 100% sure that this will properly update the AG Grid component when
  // the fringes in the state change.
  const fringes = useSelector(selectBudgetFringes);
  const row: Table.BudgetSubAccountRow = props.node.data;

  useEffect(() => {
    props.setValue(
      filter(value, (id: number) =>
        includes(
          map(fringes, (f: Model.Fringe) => f.id),
          id
        )
      )
    );
  }, [fringes]);

  return (
    <Cell {...props} onClear={() => props.setValue([])} hideClear={value.length === 0}>
      <ModelTagsDropdown<Model.Fringe>
        overlayClassName={"cell-dropdown"}
        value={value}
        models={fringes}
        labelField={"name"}
        multiple={true}
        selected={row.fringes}
        onChange={(fs: Model.Fringe[]) => props.setValue(map(fs, (f: Model.Fringe) => f.id))}
        emptyItem={{
          onClick: () => onAddFringes(),
          text: "Add Fringes",
          icon: <FontAwesomeIcon className={"icon"} icon={faPlus} />
        }}
      />
    </Cell>
  );
};

export default BudgetFringesCell;
