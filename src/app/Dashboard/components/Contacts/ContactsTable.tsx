import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import { forEach, includes, isNil, map } from "lodash";
import { createSelector } from "reselect";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

import { DeleteContactsModal } from "components/modals";
import { Table, ActionsTableCell, ModelSelectController } from "components/tables";
import { formatAsPhoneNumber } from "lib/util/formatters";
import {
  requestContactsAction,
  setContactsPageAction,
  setContactsPageSizeAction,
  setContactsPageAndSizeAction,
  selectContactsAction,
  deleteContactsAction
} from "store/actions";
import { useContacts } from "store/hooks";
import { selectContactsStore } from "store/selectors";
import EditContactModal from "./EditContactModal";
import "./ContactsTable.scss";

interface Row {
  key: number;
  name: string;
  company: string | null;
  role: Model.ContactRoleName | null;
  phone_number: string | null;
  email: string | null;
  contact: Model.Contact;
}

const selectContactsLoading = createSelector(
  selectContactsStore,
  (data: Redux.ModelListResponseStore<Model.Contact>) => data.loading
);

const selectSelectedContacts = createSelector(
  selectContactsStore,
  (data: Redux.ModelListResponseStore<Model.Contact>) => data.selected
);

const selectContactsPageSize = createSelector(
  selectContactsStore,
  (data: Redux.ModelListResponseStore<Model.Contact>) => data.pageSize
);

const selectContactsPage = createSelector(
  selectContactsStore,
  (data: Redux.ModelListResponseStore<Model.Contact>) => data.page
);

const selectContactsCount = createSelector(
  selectContactsStore,
  (data: Redux.ModelListResponseStore<Model.Contact>) => data.count
);

const selectContactsUpdating = createSelector(
  selectContactsStore,
  (data: Redux.ModelListResponseStore<Model.Contact>) => data.updating
);

const selectContactsDeleting = createSelector(
  selectContactsStore,
  (data: Redux.ModelListResponseStore<Model.Contact>) => data.deleting
);

const ContactsTable = (): JSX.Element => {
  const [contactToEdit, setContactToEdit] = useState<Model.Contact | undefined>(undefined);
  const [contactsToDelete, setContactsToDelete] = useState<Model.Contact[] | undefined>(undefined);
  const [data, setData] = useState<any[]>([]);
  const contacts = useContacts();
  const count = useSelector(selectContactsCount);
  const deleting = useSelector(selectContactsDeleting);
  const updating = useSelector(selectContactsUpdating);
  const pageSize = useSelector(selectContactsPageSize);
  const page = useSelector(selectContactsPage);
  const contactsLoading = useSelector(selectContactsLoading);
  const selectedContacts = useSelector(selectSelectedContacts);
  const dispatch: Dispatch = useDispatch();

  useEffect(() => {
    dispatch(requestContactsAction(null));
  }, []);

  useEffect(() => {
    const tableData: Row[] = [];
    forEach(contacts, (contact: Model.Contact) => {
      tableData.push({
        key: contact.id,
        name: contact.full_name,
        company: contact.company,
        role: !isNil(contact.role) ? contact.role.name : null,
        email: contact.email,
        phone_number: contact.phone_number,
        contact
      });
    });
    setData(tableData);
  }, [contacts]);

  return (
    <React.Fragment>
      <ModelSelectController<Model.Contact>
        selected={selectedContacts}
        data={contacts}
        entityName={"contact"}
        items={[
          {
            actionName: "Delete",
            icon: <FontAwesomeIcon icon={faTrashAlt} />,
            onClick: (ctcts: Model.Contact[]) => setContactsToDelete(ctcts)
          }
        ]}
      />
      <Table
        className={"admin-table"}
        tableLayout={"fixed"}
        dataSource={data}
        loading={contactsLoading}
        rowClassName={(record: Row, index: number) => {
          if (
            includes(
              map(deleting, (instance: Redux.ModelListActionInstance) => instance.id),
              record.key
            ) ||
            includes(
              map(updating, (instance: Redux.ModelListActionInstance) => instance.id),
              record.key
            )
          ) {
            return "loading";
          }
        }}
        rowSelection={{
          selectedRowKeys: selectedContacts,
          onChange: (selectedKeys: React.ReactText[]) => {
            const selectedCs = map(selectedKeys, (key: React.ReactText) => String(key));
            if (selectedCs.length === selectedContacts.length) {
              dispatch(selectContactsAction([]));
            } else {
              const selectedContactIds = map(selectedCs, (c: string) => parseInt(c));
              dispatch(selectContactsAction(selectedContactIds));
            }
          }
        }}
        pagination={{
          hideOnSinglePage: true,
          defaultPageSize: 10,
          pageSize: pageSize,
          current: page,
          showSizeChanger: true,
          total: count,
          onChange: (pg: number, size: number | undefined) => {
            dispatch(setContactsPageAction(pg));
            if (!isNil(size)) {
              dispatch(setContactsPageSizeAction(size));
            }
          },
          onShowSizeChange: (pg: number, size: number) => {
            dispatch(setContactsPageAndSizeAction({ page: pg, pageSize: size }));
          }
        }}
        columns={[
          {
            title: "Name",
            key: "name",
            dataIndex: "name"
          },
          {
            title: "Company",
            key: "company",
            dataIndex: "company"
          },
          {
            title: "Job Title",
            key: "role",
            dataIndex: "role"
          },
          {
            // TODO: abstract just city and state from location
            title: "Address",
            key: "location",
            dataIndex: "contact",
            render: (contact: Model.Contact) => {
              return (
                <div>
                  <span>{contact.city}</span>
                </div>
              );
            }
          },
          {
            title: "Phone",
            key: "phone_number",
            dataIndex: "phone_number",
            render: (value: number | null) => {
              if (!isNil(value)) {
                return <a href={`tel:${formatAsPhoneNumber(value)}`}>{formatAsPhoneNumber(value)}</a>;
              }
              return <span></span>;
            }
          },
          {
            title: "Email",
            key: "email",
            dataIndex: "email",
            render: (value: string | null) => {
              if (!isNil(value)) {
                return (
                  <div className={"truncate link"} style={{ width: "200px" }}>
                    <a href={`mailto:${value}`} target={"_blank"} rel={"noreferrer"}>
                      {value}
                    </a>
                  </div>
                );
              }
              return <span></span>;
            }
          },
          {
            key: "action",
            dataIndex: "contact",
            render: (contact: Model.Contact) => (
              <ActionsTableCell
                actions={[
                  {
                    tooltip: `Edit ${contact.full_name}`,
                    onClick: () => setContactToEdit(contact),
                    icon: <FontAwesomeIcon icon={faEdit} />
                  }
                ]}
              />
            )
          }
        ]}
      />
      {!isNil(contactsToDelete) && (
        <DeleteContactsModal
          visible={true}
          contacts={contactsToDelete}
          onCancel={() => setContactsToDelete(undefined)}
          onOk={(cs: Model.Contact[]) => {
            setContactsToDelete(undefined);
            if (cs.length !== 0) {
              dispatch(deleteContactsAction(map(cs, (c: Model.Contact) => c.id)));
            }
          }}
        />
      )}
      {!isNil(contactToEdit) && (
        <EditContactModal
          contact={contactToEdit}
          onCancel={() => setContactToEdit(undefined)}
          onSuccess={() => setContactToEdit(undefined)}
          visible={true}
        />
      )}
    </React.Fragment>
  );
};

export default ContactsTable;
