import { useState } from "react";
import { isNil } from "lodash";

import { ClientError, NetworkError, renderFieldErrorsInForm, parseGlobalError } from "api";
import { createAccountSubAccountGroup, createSubAccountSubAccountGroup } from "api/services";
import { Form } from "components";
import { GroupForm } from "components/forms";
import { GroupFormValues } from "components/forms/GroupForm";

import Modal from "./Modal";

interface CreateSubAccountGroupModalProps {
  onSuccess: (group: IGroup<ISimpleSubAccount>) => void;
  onCancel: () => void;
  accountId?: number;
  subaccountId?: number;
  subaccounts: number[];
  open: boolean;
}

const CreateSubAccountGroupModal = ({
  accountId,
  subaccountId,
  open,
  subaccounts,
  onSuccess,
  onCancel
}: CreateSubAccountGroupModalProps): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  return (
    <Modal
      title={"Create Sub-Total"}
      visible={open}
      loading={loading}
      onCancel={() => onCancel()}
      okText={"Create"}
      cancelText={"Cancel"}
      onOk={() => {
        form
          .validateFields()
          .then((values: GroupFormValues) => {
            setLoading(true);

            const handleError = (e: Error) => {
              if (e instanceof ClientError) {
                const global = parseGlobalError(e);
                if (!isNil(global)) {
                  setGlobalError(global.message);
                }
                // Render the errors for each field next to the form field.
                renderFieldErrorsInForm(form, e);
              } else if (e instanceof NetworkError) {
                setGlobalError("There was a problem communicating with the server.");
              } else {
                throw e;
              }
            };
            if (!isNil(accountId)) {
              createAccountSubAccountGroup(accountId, {
                name: values.name,
                children: subaccounts,
                color: values.color
              })
                .then((group: IGroup<ISimpleSubAccount>) => {
                  form.resetFields();
                  onSuccess(group);
                })
                .catch((e: Error) => handleError(e))
                .finally(() => setLoading(false));
            } else if (!isNil(subaccountId)) {
              createSubAccountSubAccountGroup(subaccountId, {
                name: values.name,
                children: subaccounts,
                color: values.color
              })
                .then((group: IGroup<ISimpleSubAccount>) => {
                  form.resetFields();
                  onSuccess(group);
                })
                .catch((e: Error) => handleError(e))
                .finally(() => setLoading(false));
            }
          })
          .catch(() => {
            return;
          });
      }}
    >
      <GroupForm form={form} name={"form_in_modal"} globalError={globalError} initialValues={{}} />
    </Modal>
  );
};

export default CreateSubAccountGroupModal;
