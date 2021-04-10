import { useState } from "react";
import { isNil } from "lodash";

import { ClientError, NetworkError, renderFieldErrorsInForm, parseGlobalError } from "api";
import { Form } from "components";
import { GroupForm } from "components/forms";
import { GroupFormValues } from "components/forms/GroupForm";
import { updateSubAccountGroup } from "api/services";

import Modal from "./Modal";

interface EditSubAccountGroupModalProps {
  onSuccess: (group: IGroup<ISimpleSubAccount>) => void;
  onCancel: () => void;
  group: IGroup<ISimpleSubAccount>;
  open: boolean;
}

const EditSubAccountGroupModal = ({ group, open, onSuccess, onCancel }: EditSubAccountGroupModalProps): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  return (
    <Modal
      title={"Edit Sub-Total"}
      visible={open}
      loading={loading}
      onCancel={() => onCancel()}
      okText={"Save"}
      cancelText={"Cancel"}
      onOk={() => {
        form
          .validateFields()
          .then((values: GroupFormValues) => {
            setLoading(true);
            updateSubAccountGroup(group.id, values)
              .then((response: IGroup<ISimpleSubAccount>) => {
                form.resetFields();
                onSuccess(response);
              })
              .catch((e: Error) => {
                if (e instanceof ClientError) {
                  const global = parseGlobalError(e);
                  if (!isNil(global)) {
                    /* eslint-disable no-console */
                    console.error(e.errors);
                    setGlobalError(global.message);
                  }
                  // Render the errors for each field next to the form field.
                  renderFieldErrorsInForm(form, e);
                } else if (e instanceof NetworkError) {
                  setGlobalError("There was a problem communicating with the server.");
                } else {
                  throw e;
                }
              })
              .finally(() => {
                setLoading(false);
              });
          })
          .catch(() => {
            return;
          });
      }}
    >
      <GroupForm
        form={form}
        name={"form_in_modal"}
        globalError={globalError}
        initialValues={{ name: group.name, color: group.color }}
      />
    </Modal>
  );
};

export default EditSubAccountGroupModal;
