import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { isNil } from "lodash";

import * as api from "api";
import { redux, notifications } from "lib";

import { ShowHide } from "components";
import { TemplateCard, EmptyCard } from "components/containers";
import { EditTemplateModal, CreateTemplateModal } from "components/modals";
import { TemplateEmptyIcon } from "components/svgs";

import GenericOwnedTemplate, { RenderGenericOwnedTemplateCardParams } from "./GenericOwnedTemplate";

import { actions } from "../../store";

interface MyTemplatesProps {
  readonly onDeriveBudget: (template: number) => void;
  readonly onCreateBudget: () => void;
}

const MyTemplates: React.FC<MyTemplatesProps> = ({ onCreateBudget, onDeriveBudget }): JSX.Element => {
  const [templateToEdit, setTemplateToEdit] = useState<number | undefined>(undefined);
  const [createTemplateModalOpen, setCreateTempateModalOpen] = useState(false);

  const {
    isActive: isDuplicating,
    removeFromState: setDuplicated,
    addToState: setDuplicating
  } = redux.useTrackModelActions([]);
  const { isActive: isMoving, removeFromState: setMoved, addToState: setMoving } = redux.useTrackModelActions([]);

  const dispatch: Redux.Dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    dispatch(actions.requestTemplatesAction(null));
  }, []);

  return (
    <React.Fragment>
      <GenericOwnedTemplate
        title={"My Templates"}
        selector={(s: Application.Store) => s.dashboard.templates}
        onSearch={(v: string) => dispatch(actions.setTemplatesSearchAction(v, {}))}
        noDataProps={{
          title: "You don't have any templates yet!",
          subTitle: "Create your own templates or choose one we curated in Discover.",
          button: {
            onClick: () => setCreateTempateModalOpen(true),
            text: "Create a Template"
          },
          child: <TemplateEmptyIcon />
        }}
        onUpdatePagination={(p: Pagination) => dispatch(actions.setTemplatesPaginationAction(p))}
        onUpdateOrdering={(o: Redux.UpdateOrderingPayload) => dispatch(actions.updateTemplatesOrderingAction(o))}
        onCreate={onCreateBudget}
        onDeleted={(b: Model.SimpleTemplate) => dispatch(actions.removeTemplateFromStateAction(b.id))}
        lastCard={(budgets: Model.SimpleTemplate[]) => (
          <ShowHide show={budgets.length !== 0}>
            <EmptyCard
              className={"template-empty-card"}
              icon={"plus"}
              onClick={() => setCreateTempateModalOpen(true)}
            />
          </ShowHide>
        )}
        renderCard={(params: RenderGenericOwnedTemplateCardParams) => (
          <TemplateCard
            {...params}
            duplicating={isDuplicating(params.budget.id)}
            moving={isMoving(params.budget.id)}
            loading={params.deleting}
            disabled={params.deleting || isMoving(params.budget.id) || isDuplicating(params.budget.id)}
            onEdit={() => history.push(`/templates/${params.budget.id}/accounts`)}
            onEditNameImage={() => setTemplateToEdit(params.budget.id)}
            onClick={() => onDeriveBudget(params.budget.id)}
            onMoveToCommunity={(e: MenuItemModelClickEvent) => {
              setMoving(params.budget.id);
              api
                .updateBudget<Model.Template>(params.budget.id, { community: true })
                .then((response: Model.Template) => {
                  e.item.closeParentDropdown?.();
                  dispatch(actions.removeTemplateFromStateAction(params.budget.id));
                  dispatch(actions.addTemplateToStateAction(response));
                })
                .catch((err: Error) => notifications.internal.handleRequestError(err))
                .finally(() => setMoved(params.budget.id));
            }}
            onDuplicate={(e: MenuItemModelClickEvent) => {
              setDuplicating(params.budget.id);
              api
                /* We have to use a large timeout because this is a request that
								   sometimes takes a very long time. */
                .duplicateBudget<Model.Template>(params.budget.id, { timeout: 120 * 1000 })
                .then((response: Model.Template) => {
                  e.item.closeParentDropdown?.();
                  dispatch(actions.addTemplateToStateAction(response));
                })
                .catch((err: Error) => notifications.internal.handleRequestError(err))
                .finally(() => setDuplicated(params.budget.id));
            }}
          />
        )}
      />
      {!isNil(templateToEdit) && (
        <EditTemplateModal
          open={true}
          id={templateToEdit}
          onCancel={() => setTemplateToEdit(undefined)}
          onSuccess={(template: Model.Template) => {
            setTemplateToEdit(undefined);
            dispatch(actions.updateTemplateInStateAction({ id: template.id, data: template }));
          }}
        />
      )}
      <CreateTemplateModal
        open={createTemplateModalOpen}
        onCancel={() => setCreateTempateModalOpen(false)}
        onSuccess={(template: Model.Template) => {
          setCreateTempateModalOpen(false);
          dispatch(actions.addTemplateToStateAction(template));
          history.push(`/templates/${template.id}/accounts`);
        }}
      />
    </React.Fragment>
  );
};

export default MyTemplates;
