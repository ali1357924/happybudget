import { forwardRef } from "react";
import { useSelector } from "react-redux";
import { simpleDeepEqualSelector } from "store/selectors";
import FringesCellEditor, { FringesCellEditorProps } from "./Generic";

const selectFringes = simpleDeepEqualSelector(
  (state: Modules.ApplicationStore) => state.budget.template.subaccount.fringes.data
);

const TemplateSubAccountFringesCellEditor = (
  props: Omit<FringesCellEditorProps<BudgetTable.SubAccountRow>, "fringes">,
  ref: any
) => {
  const fringes = useSelector(selectFringes);
  return <FringesCellEditor fringes={fringes} ref={ref} {...props} />;
};

export default forwardRef(TemplateSubAccountFringesCellEditor);
