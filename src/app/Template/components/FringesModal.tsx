import { isNil } from "lodash";

import { FringesTable, connectTableToStore } from "tabling";
import GenericFringesModal from "components/modals/FringesModal";

import { actions, selectors, sagas } from "../store";

const ConnectedFringesTable = connectTableToStore<
  FringesTable.Props,
  Tables.FringeRowData,
  Model.Fringe,
  Tables.FringeTableStore,
  Tables.FringeTableContext
>({
  actions: {
    tableChanged: actions.handleFringesTableChangeEventAction,
    loading: actions.loadingFringesAction,
    response: actions.responseFringesAction,
    addModelsToState: actions.addFringeModelsToStateAction,
    setSearch: actions.setFringesSearchAction
  },
  createSaga: (table: Table.TableInstance<Tables.FringeRowData, Model.Fringe>) => sagas.createFringesTableSaga(table),
  selector: selectors.selectFringesStore
})(FringesTable.Table);

interface FringesModalProps extends Pick<ModalProps, "open" | "onCancel"> {
  readonly budget: Model.Template | null;
  readonly budgetId: number;
  readonly id: number;
  readonly table: NonNullRef<Table.TableInstance<Tables.FringeRowData, Model.Fringe>>;
}

const FringesModal: React.FC<FringesModalProps> = ({ id, budget, budgetId, table, open, onCancel }) => (
  <GenericFringesModal open={open} onCancel={onCancel}>
    <ConnectedFringesTable
      table={table}
      actionContext={{ budgetId, id }}
      tableId={"template-fringes"}
      exportFileName={!isNil(budget) ? `${budget.name}_fringes` : "fringes"}
    />
  </GenericFringesModal>
);

export default FringesModal;
