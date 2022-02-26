declare namespace Table {
  /* Control events are table events that are dispatched from the code in
     response to other actions, but they are not derived solely from a user's
     interaction with the table. */
  type ControlEventIds = {
    readonly MODELS_UPDATED: "modelsUpdated";
    readonly UPDATE_ROWS: "updateRows";
    readonly MODELS_ADDED: "modelsAdded";
    readonly PLACEHOLDERS_ACTIVATED: "placeholdersActivated";
    readonly GROUP_UPDATED: "groupUpdated";
    readonly GROUP_ADDED: "groupAdded";
    readonly MARKUP_ADDED: "markupAdded";
    readonly MARKUP_UPDATED: "markupUpdated";
  };

  type ControlEventId = ControlEventIds[keyof ControlEventIds];

  /* Change events are table events that are derived solely from a user's
     interaction with a table.  Unlike control events, change events are
     reversible. */
  type ChangeEventIds = {
    readonly DATA_CHANGE: "dataChange";
    readonly ROW_ADD: "rowAdd";
    readonly ROW_INSERT: "rowInsert";
    readonly ROW_POSITION_CHANGED: "rowPositionChanged";
    readonly ROW_DELETE: "rowDelete";
    readonly ROW_REMOVE_FROM_GROUP: "rowRemoveFromGroup";
    readonly ROW_ADD_TO_GROUP: "rowAddToGroup";
  };

  type ChangeEventId = ChangeEventIds[keyof ChangeEventIds];

  type EventIds = ChangeEventIds & ControlEventIds;
  type EventId = ControlEventId | ChangeEventId;

  type EventPayload = Record<string, unknown> | Record<string, unknown>[];

  type BaseEvent<T extends EventId = EventId, P extends EventPayload = EventPayload> = {
    readonly type: T;
    readonly payload: P;
  };

  type BaseChangeEvent<T extends ChangeEventId = ChangeEventId, P extends EventPayload = EventPayload> = BaseEvent<
    T,
    P
  >;

  type BaseControlEvent<T extends ControlEventId = ControlEventId, P extends EventPayload = EventPayload> = BaseEvent<
    T,
    P
  >;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  type CellChange<V extends RawRowValue = any> = {
    readonly oldValue: V;
    readonly newValue: V;
  };

  type SoloCellChange<
    R extends RowData,
    RW extends EditableRow<R> = EditableRow<R>,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    V extends RawRowValue = any
  > = CellChange<V> & {
    readonly field: keyof RW["data"];
    readonly id: RW["id"];
  };

  type RowChangeData<R extends RowData, RW extends EditableRow<R> = EditableRow<R>> = {
    [Property in keyof RW["data"]]?: CellChange;
  };

  type RowChange<R extends RowData, RW extends EditableRow<R> = EditableRow<R>> = {
    readonly id: RW["id"];
    readonly data: RowChangeData<R, RW>;
  };

  type DataChangePayload<R extends RowData, RW extends EditableRow<R> = EditableRow<R>> = SingleOrArray<
    RowChange<R, RW>
  >;

  type ConsolidatedChange<R extends RowData, RW extends EditableRow<R> = EditableRow<R>> = RowChange<R, RW>[];

  type DataChangeEvent<R extends RowData, RW extends EditableRow<R> = EditableRow<R>> = BaseChangeEvent<
    "dataChange",
    DataChangePayload<R, RW>
  >;

  type RowInsertPayload<R extends RowData> = {
    readonly previous: number;
    readonly data: Partial<R>;
    readonly group: GroupRowId | null;
  };

  /* RowInsertEvent differs from RowAddEvent because RowInsertEvent needs to
	   insert the row in the middle of the table, whereas RowAddEvent inserts the
		 row at the bottom of the table.  The difference is important, because with
		 the RowInsertEvent, we cannot add placeholders until there is an API
		 response - as we need the order of the inserted row from the API response
		 before it is inserted into the table. */
  type RowInsertEvent<R extends RowData> = BaseChangeEvent<"rowInsert", RowInsertPayload<R>>;

  type RowAddCountPayload = { readonly count: number };
  type RowAddIndexPayload = { readonly newIndex: number; readonly count?: number };
  type RowAddDataPayload<R extends RowData> = Partial<R>[];
  type RowAddPayload<R extends RowData> = RowAddCountPayload | RowAddIndexPayload | RowAddDataPayload<R>;

  type RowAddEvent<R extends RowData, P extends RowAddPayload<R> = RowAddPayload<R>> = BaseChangeEvent<"rowAdd", P> & {
    /* Placeholder IDs must be provided ahead of time so that the IDs are
			 consistent between the sagas and the reducer. */
    readonly placeholderIds: PlaceholderRowId[];
  };

  type RowAddDataEvent<R extends RowData> = RowAddEvent<R, RowAddDataPayload<R>>;

  type RowPositionChangedPayload = {
    readonly previous: number | null;
    readonly newGroup: GroupRowId | null;
    readonly id: ModelRowId;
  };

  type RowPositionChangedEvent = BaseChangeEvent<"rowPositionChanged", RowPositionChangedPayload>;

  type RowDeletePayload = {
    readonly rows: SingleOrArray<ModelRowId | MarkupRowId | GroupRowId | PlaceholderRowId>;
  };
  type RowDeleteEvent = BaseChangeEvent<"rowDelete", RowDeletePayload>;

  type RowRemoveFromGroupPayload = {
    readonly rows: SingleOrArray<ModelRowId>;
    readonly group: GroupRowId;
  };
  type RowRemoveFromGroupEvent = BaseChangeEvent<"rowRemoveFromGroup", RowRemoveFromGroupPayload>;

  type RowAddToGroupPayload = {
    readonly group: GroupRowId;
    readonly rows: SingleOrArray<ModelRowId>;
  };
  type RowAddToGroupEvent = BaseChangeEvent<"rowAddToGroup", RowAddToGroupPayload>;

  type GroupAddedPayload = Model.Group;
  type GroupAddedEvent = BaseControlEvent<"groupAdded", GroupAddedPayload>;
  type GroupUpdatedEvent = BaseControlEvent<"groupUpdated", Model.Group>;

  type MarkupAddedPayload = Model.Markup;
  type MarkupAddedEvent = BaseControlEvent<"markupAdded", MarkupAddedPayload>;
  type MarkupUpdatedEvent = BaseControlEvent<"markupUpdated", Model.Markup>;

  /* The Group is not attributed to a model in a detail response so we sometimes
     have to use the value from the original event. */
  type ModelTableEventPayload<M extends Model.RowHttpModel = Model.RowHttpModel> = {
    readonly model: M;
    readonly group?: number | null;
  };
  type ModelsAddedEvent<M extends Model.RowHttpModel = Model.RowHttpModel> = BaseControlEvent<
    "modelsAdded",
    SingleOrArray<ModelTableEventPayload<M>>
  >;

  type ModelsUpdatedEvent<M extends Model.RowHttpModel = Model.RowHttpModel> = BaseControlEvent<
    "modelsUpdated",
    SingleOrArray<ModelTableEventPayload<M>>
  >;

  type PlaceholdersActivatedPayload<M extends Model.RowHttpModel> = {
    readonly placeholderIds: PlaceholderRowId[];
    readonly models: M[];
  };

  type PlaceholdersActivatedEvent<M extends Model.RowHttpModel = Model.RowHttpModel> = BaseControlEvent<
    "placeholdersActivated",
    PlaceholdersActivatedPayload<M>
  >;

  type UpdateRowPayload<R extends RowData = RowData> = {
    readonly data: Partial<R>;
    readonly id: ModelRowId;
  };

  type UpdateRowsEventPayload<R extends RowData = RowData> = SingleOrArray<UpdateRowPayload<R>>;

  type UpdateRowsEvent<R extends RowData = RowData> = BaseControlEvent<"updateRows", UpdateRowsEventPayload<R>>;

  type FullRowEvent = RowDeleteEvent | RowRemoveFromGroupEvent | RowAddToGroupEvent;
  type GroupChangeEvent = RowRemoveFromGroupEvent | RowAddToGroupEvent;

  type ControlEvents<R extends RowData = RowData, M extends Model.RowHttpModel = Model.RowHttpModel> = {
    readonly modelsUpdated: ModelsUpdatedEvent<M>;
    readonly updateRows: UpdateRowsEvent<R>;
    readonly modelsAdded: ModelsAddedEvent<M>;
    readonly placeholdersActivated: PlaceholdersActivatedEvent<M>;
    readonly groupUpdated: GroupUpdatedEvent;
    readonly groupAdded: GroupAddedEvent;
    readonly markupAdded: MarkupAddedEvent;
    readonly markupUpdated: MarkupUpdatedEvent;
  };

  type ChangeEvents<R extends RowData = RowData, RW extends EditableRow<R> = EditableRow<R>> = {
    readonly dataChange: DataChangeEvent<R, RW>;
    readonly rowAdd: RowAddEvent<R>;
    readonly rowInsert: RowInsertEvent<R>;
    readonly rowPositionChanged: RowPositionChangedEvent;
    readonly rowDelete: RowDeleteEvent;
    readonly rowRemoveFromGroup: RowRemoveFromGroupEvent;
    readonly rowAddToGroup: RowAddToGroupEvent;
  };

  type Events<
    R extends RowData = RowData,
    M extends Model.RowHttpModel = Model.RowHttpModel,
    RW extends EditableRow<R> = EditableRow<R>
  > = ControlEvents<R, M> & ChangeEvents<R, RW>;

  type ControlEvent<R extends RowData = RowData, M extends Model.RowHttpModel = Model.RowHttpModel> =
    | UpdateRowsEvent<R>
    | PlaceholdersActivatedEvent<M>
    | ModelsAddedEvent<M>
    | ModelsUpdatedEvent<M>
    | GroupAddedEvent
    | GroupUpdatedEvent
    | MarkupAddedEvent
    | MarkupUpdatedEvent;

  type ChangeEvent<R extends RowData = RowData, RW extends EditableRow<R> = EditableRow<R>> =
    | DataChangeEvent<R, RW>
    | RowAddEvent<R>
    | RowInsertEvent<R>
    | RowDeleteEvent
    | RowPositionChangedEvent
    | RowRemoveFromGroupEvent
    | RowAddToGroupEvent;

  type Event<
    R extends RowData = RowData,
    M extends Model.RowHttpModel = Model.RowHttpModel,
    RW extends EditableRow<R> = EditableRow<R>
  > = ControlEvent<R, M> | ChangeEvent<R, RW>;

  type ChangeEventLookup<
    K extends ChangeEventId,
    R extends RowData = RowData,
    RW extends EditableRow<R> = EditableRow<R>
  > = ChangeEvents<R, RW>[K];

  type EventLookup<
    K extends EventId,
    R extends RowData = RowData,
    M extends Model.RowHttpModel = Model.RowHttpModel,
    RW extends EditableRow<R> = EditableRow<R>
  > = Events<R, M, RW>[K];

  type CellDoneEditingEvent = import("react").SyntheticEvent | KeyboardEvent;
}
