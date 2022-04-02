import React, { useState, useMemo } from "react";
import { Switch, Route, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { isNil } from "lodash";

import * as store from "store";
import { model } from "lib";
import { CreateBudgetModal } from "components/modals";

import { actions } from "../../store";

import Discover from "./Discover";
import MyTemplates from "./MyTemplates";

type TemplatesProps = {
  readonly onCreateBudget: () => void;
};

const Templates = (props: TemplatesProps): JSX.Element => {
  const [templateToDerive, _setTemplateToDerive] = useState<number | undefined>(undefined);
  const user = store.hooks.useLoggedInUser();
  const dispatch = useDispatch();
  const history = useHistory();

  const setTemplateToDerive = useMemo(
    () => (id: number | undefined) => {
      if (
        id !== undefined &&
        user.num_budgets !== 0 &&
        !model.user.userHasPermission(user, model.user.Permissions.MULTIPLE_BUDGETS)
      ) {
        dispatch(store.actions.setProductPermissionModalOpenAction(true));
      } else {
        _setTemplateToDerive(id);
      }
    },
    [user]
  );

  return (
    <React.Fragment>
      <Switch>
        <Route path={"/templates"} render={() => <MyTemplates {...props} onDeriveBudget={setTemplateToDerive} />} />
        <Route path={"/discover"} render={() => <Discover {...props} onDeriveBudget={setTemplateToDerive} />} />
      </Switch>
      {!isNil(templateToDerive) && (
        <CreateBudgetModal
          open={true}
          templateId={templateToDerive}
          onCancel={() => setTemplateToDerive(undefined)}
          title={"Create Budget from Template"}
          onSuccess={(budget: Model.UserBudget) => {
            setTemplateToDerive(undefined);
            dispatch(actions.addBudgetToStateAction(budget));
            dispatch(store.actions.updateLoggedInUserAction({ ...user, num_budgets: user.num_budgets + 1 }));
            history.push(`/budgets/${budget.id}/accounts`);
          }}
        />
      )}
    </React.Fragment>
  );
};

export default Templates;
