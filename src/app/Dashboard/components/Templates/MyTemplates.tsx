import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { map, isNil } from "lodash";

import * as api from "api";
import { redux } from "lib";

import { WrapInApplicationSpinner } from "components";
import { TemplateCard, EmptyCard } from "components/cards";
import { EditTemplateModal, CreateTemplateModal } from "components/modals";

import { actions } from "../../store";

const selectTemplates = (state: Modules.Authenticated.Store) => state.dashboard.templates.data;
const selectLoadingTemplates = (state: Modules.Authenticated.Store) => state.dashboard.templates.loading;

interface MyTemplatesProps {
  setTemplateToDerive: (template: number) => void;
}

const MyTemplates: React.FC<MyTemplatesProps> = ({ setTemplateToDerive }): JSX.Element => {
  const [templateToEdit, setTemplateToEdit] = useState<Model.Template | undefined>(undefined);
  const [createTemplateModalOpen, setCreateTempateModalOpen] = useState(false);
  const [isDeleting, setDeleting, setDeleted] = redux.hooks.useTrackModelActions([]);
  const [isMoving, setMoving, setMoved] = redux.hooks.useTrackModelActions([]);
  const [isDuplicating, setDuplicating, setDuplicated] = redux.hooks.useTrackModelActions([]);

  const dispatch: Dispatch = useDispatch();
  const templates = useSelector(selectTemplates);
  const loading = useSelector(selectLoadingTemplates);

  const history = useHistory();

  useEffect(() => {
    dispatch(actions.requestTemplatesAction(null));
  }, []);

  return (
    <div className={"my-templates"}>
      <WrapInApplicationSpinner loading={loading}>
        <div className={"dashboard-card-grid"}>
          {map(templates, (template: Model.Template, index: number) => {
            return (
              <TemplateCard
                key={index}
                template={template}
                duplicating={isDuplicating(template.id)}
                moving={isMoving(template.id)}
                deleting={isDeleting(template.id)}
                onEdit={() => history.push(`/templates/${template.id}/accounts`)}
                onEditNameImage={() => setTemplateToEdit(template)}
                onDelete={(e: MenuItemClickEvent<MenuItemModel>) => {
                  setDeleting(template.id);
                  api
                    .deleteTemplate(template.id)
                    .then(() => {
                      e.closeParentDropdown?.();
                      dispatch(actions.removeTemplateFromStateAction(template.id));
                    })
                    .catch((err: Error) => api.handleRequestError(err))
                    .finally(() => setDeleted(template.id));
                }}
                onClick={() => setTemplateToDerive(template.id)}
                onMoveToCommunity={(e: MenuItemClickEvent<MenuItemModel>) => {
                  setMoving(template.id);
                  api
                    .updateTemplate(template.id, { community: true })
                    .then((response: Model.Template) => {
                      e.closeParentDropdown?.();
                      dispatch(actions.removeTemplateFromStateAction(template.id));
                      dispatch(actions.addCommunityTemplateToStateAction(response));
                    })
                    .catch((err: Error) => api.handleRequestError(err))
                    .finally(() => setMoved(template.id));
                }}
                onDuplicate={(e: MenuItemClickEvent<MenuItemModel>) => {
                  setDuplicating(template.id);
                  api
                    .duplicateTemplate(template.id)
                    .then((response: Model.Template) => {
                      e.closeParentDropdown?.();
                      dispatch(actions.addTemplateToStateAction(response));
                    })
                    .catch((err: Error) => api.handleRequestError(err))
                    .finally(() => setDuplicated(template.id));
                }}
              />
            );
          })}
          <EmptyCard title={"New Template"} icon={"plus"} onClick={() => setCreateTempateModalOpen(true)} />
        </div>
      </WrapInApplicationSpinner>
      {!isNil(templateToEdit) && (
        <EditTemplateModal
          open={true}
          template={templateToEdit}
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
    </div>
  );
};

export default MyTemplates;
