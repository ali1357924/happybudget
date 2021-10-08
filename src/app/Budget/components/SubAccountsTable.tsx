import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { isNil } from "lodash";

import { model, tabling } from "lib";
import { actions, selectors } from "store";
import { EditContactModal, CreateContactModal } from "components/modals";
import { SubAccountsTable as GenericSubAccountsTable } from "components/tabling";

import PreviewModal from "./PreviewModal";

type R = Tables.SubAccountRowData;
type M = Model.SubAccount;

type OmitTableProps = "contacts" | "onEditContact" | "onNewContact" | "menuPortalId" | "columns" | "onExportPdf";

export interface BudgetSubAccountsTableProps
  extends Omit<GenericSubAccountsTable.AuthenticatedBudgetProps, OmitTableProps> {
  readonly budgetId: number;
  readonly budget: Model.Budget | null;
}

const SubAccountsTable = ({ budget, budgetId, ...props }: BudgetSubAccountsTableProps): JSX.Element => {
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [preContactCreate, setPreContactCreate] = useState<{ name?: string; id: Table.EditableRowId } | null>(null);
  const [initialContactFormValues, setInitialContactFormValues] = useState<any>(null);
  const [contactToEdit, setContactToEdit] = useState<number | null>(null);
  const [createContactModalVisible, setCreateContactModalVisible] = useState(false);

  const dispatch = useDispatch();
  const contacts = useSelector(selectors.selectContacts);
  const table = tabling.hooks.useTableIfNotDefined<R, M>(props.table);

  return (
    <React.Fragment>
      <GenericSubAccountsTable.AuthenticatedBudget
        {...props}
        table={table}
        contacts={contacts}
        menuPortalId={"supplementary-header"}
        savingChangesPortalId={"saving-changes"}
        onEditContact={(contact: number) => setContactToEdit(contact)}
        onExportPdf={() => setPreviewModalVisible(true)}
        onNewContact={(params: { name?: string; id: Table.EditableRowId }) => {
          setPreContactCreate(params);
          setInitialContactFormValues(null);
          if (!isNil(params.name)) {
            const [firstName, lastName] = model.util.parseFirstAndLastName(params.name);
            setInitialContactFormValues({
              first_name: firstName,
              last_name: lastName
            });
          }
          setCreateContactModalVisible(true);
        }}
      />
      {!isNil(contactToEdit) && (
        <EditContactModal
          open={true}
          id={contactToEdit}
          onSuccess={(m: Model.Contact) => {
            dispatch(actions.authenticated.updateContactInStateAction({ id: m.id, data: m }));
            setContactToEdit(null);
          }}
          onCancel={() => setContactToEdit(null)}
        />
      )}
      {createContactModalVisible && (
        <CreateContactModal
          visible={true}
          initialValues={initialContactFormValues}
          onSuccess={(contact: Model.Contact) => {
            setPreContactCreate(null);
            setInitialContactFormValues(null);
            setCreateContactModalVisible(false);
            // If we have enough information from before the contact was created in the specific
            // cell, combine that information with the new value to perform a table update, showing
            // the created contact in the new cell.
            if (!isNil(preContactCreate)) {
              const row: Table.BodyRow<R> | null = table.current.getRow(preContactCreate.id);
              if (!isNil(row) && tabling.typeguards.isModelRow(row)) {
                let rowChange: Table.RowChange<R> = {
                  id: row.id,
                  data: { contact: { oldValue: row.data.contact || null, newValue: contact.id } }
                };
                // If the Row does not already specify a rate and the Contact does specify a rate,
                // use the rate that is specified for the Contact.
                if (contact.rate !== null && row.data.rate === null) {
                  rowChange = {
                    ...rowChange,
                    data: { ...rowChange.data, rate: { oldValue: row.data.rate, newValue: contact.rate } }
                  };
                }
                table.current.applyTableChange({
                  type: "dataChange",
                  payload: rowChange
                });
              }
            }
          }}
          onCancel={() => setCreateContactModalVisible(false)}
        />
      )}
      <PreviewModal
        autoRenderPdf={false}
        visible={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        budgetId={budgetId}
        budgetName={!isNil(budget) ? `${budget.name}` : `Sample Budget ${new Date().getFullYear()}`}
        filename={!isNil(budget) ? `${budget.name}.pdf` : "budget.pdf"}
      />
    </React.Fragment>
  );
};

export default SubAccountsTable;
