declare namespace Redux {
  type GenericSelectorFunc<S, T = any> = (state: S) => T;
  type AuthenticatedSelectorFunc<T = any> = GenericSelectorFunc<Application.Authenticated.Store, T>;
  type UnauthenticatedSelectorFunc<T = any> = GenericSelectorFunc<Application.Unauthenticated.Store, T>;

  type SwitchSelectorFunc<AUTH extends boolean = true, T = any> = AUTH extends true
    ? AuthenticatedSelectorFunc<T>
    : UnauthenticatedSelectorFunc<T>;

  type SelectorFunc<T = any> = AuthenticatedSelectorFunc<T> | UnauthenticatedSelectorFunc<T>;

  type AsyncId = `async-${string}`;

  /* eslint-disable-next-line no-unused-vars */
  type AsyncStores<S = any> = { [key in AsyncId]: S };

  type Transformers<S = any, A = any> = {
    /* eslint-disable-next-line no-unused-vars */
    [K in keyof A]-?: Reducer<S>;
  };

  type Task<P = any> = (action: Action<P>) => import("@redux-saga/types").SagaIterator;

  type TableEventTask<
    E extends Table.ChangeEvent<R, M>,
    R extends Table.RowData = any,
    M extends Model.RowHttpModel = any
  > = (event: E) => import("@redux-saga/types").SagaIterator;

  type TableBulkCreateTask<R extends Table.RowData = any, ARGS extends any[] = []> = (
    e: Table.RowAddEvent<R>,
    errorMessage: string,
    ...args: ARGS
  ) => import("redux-saga").SagaIterator;

  interface TableEventTaskMapObject<R extends Table.RowData = any, M extends Model.RowHttpModel = any> {
    readonly dataChange: TableEventTask<Table.DataChangeEvent<R>, R, M>;
    readonly rowAdd: TableEventTask<Table.RowAddEvent<R>, R, M>;
    readonly rowInsert: TableEventTask<Table.RowInsertEvent<R>, R, M>;
    readonly rowPositionChanged: TableEventTask<Table.RowPositionChangedEvent, R, M>;
    readonly rowDelete: TableEventTask<Table.RowDeleteEvent, R, M>;
    readonly rowRemoveFromGroup: TableEventTask<Table.RowRemoveFromGroupEvent, R, M>;
    readonly rowAddToGroup: TableEventTask<Table.RowAddToGroupEvent, R, M>;
    readonly groupAdded: TableEventTask<Table.GroupAddedEvent, R, M>;
    readonly groupUpdated: TableEventTask<Table.GroupUpdatedEvent, R, M>;
    readonly modelUpdated: TableEventTask<Table.ModelUpdatedEvent<M>, R, M>;
    readonly markupAdded: TableEventTask<Table.MarkupAddedEvent, R, M>;
    readonly markupUpdated: TableEventTask<Table.MarkupUpdatedEvent, R, M>;
  }

  type ActionMapObject<M = any> = {
    [K in keyof M]: undefined extends M[K]
      ? import("@reduxjs/toolkit").PayloadActionCreator<Exclude<M[K], undefined>>
      : import("@reduxjs/toolkit").PayloadActionCreator<M[K]>;
  };

  type Reducer<S, A = Action> = import("redux").Reducer<S, A>;
  type ReducersMapObject<S = any> = {
    [K in keyof S]-?: Reducer<S[K]>;
  };

  type ReducersWithAsyncMapObject<S = any> = ReducersMapObject<S> & {
    /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
    [K in AsyncId]: Reducer<any>;
  };

  type SagaManager = {
    readonly injectSaga: (id: Table.AsyncId, saga: import("redux-saga").Saga) => void;
    readonly ejectSaga: (id: Table.AsyncId) => void;
  };

  type ReducerManager<S extends Application.Store> = {
    readonly getReducerMap: () => ReducersWithAsyncMapObject<S>;
    readonly reduce: (state: S | undefined, action: Action) => S;
    readonly injectReducer: (key: Table.AsyncId, reducer: Reducer<any>) => void;
    readonly ejectReducer: (key: Table.AsyncId) => void;
  };

  type StoreObj = Record<string, any> | boolean | number;

  type Store<S extends Application.Store> = import("redux").Store<S, Action> & {
    readonly reducerManager: ReducerManager<S>;
    readonly sagaManager: SagaManager;
  };

  type Dispatch = import("redux").Dispatch<Action>;

  interface Action<P = any, T extends string = string> {
    readonly payload: P;
    readonly type: T;
    readonly isAuthenticated?: boolean | undefined;
  }

  type AuthenticatedAction<P = any> = Action<P> & { readonly isAuthenticated?: true | undefined };

  type UnauthenticatedAction<P = any> = Action<P> & { readonly isAuthenticated: false };

  type ModelLookup<M extends Model.Model> = ID | ((m: M) => boolean);

  type FindModelOptions = {
    readonly warnIfMissing?: boolean;
    readonly name?: string;
  };

  type TaskConfig<A> = {
    readonly actions: ActionMapObject<A>;
  };

  type ReducerConfig<S, A> = TaskConfig<A> & {
    readonly initialState: S;
  };

  type SagaConfig<T, A> = TaskConfig<A> & {
    readonly tasks: T;
  };

  type ListStore<T> = T[];

  type ModelListActionPayload = { id: ID; value: boolean };
  type ModelListActionInstance = { id: ID; count: number };

  type ModelListActionStore = ModelListActionInstance[];

  interface UpdateActionPayload<T extends object, Id extends ID = number> {
    id: Id;
    data: Partial<T>;
  }

  type TableRequestPayload = { ids: number[] } | null;

  type ActionCreator<T> = import("@reduxjs/toolkit").PayloadActionCreator<T>;

  type ActionCreatorPayload<T> = T extends Redux.ActionCreator<infer P> ? P : unknown;

  type ClearOnDetail<T> = {
    readonly action: ActionCreator<T>;
    readonly payload: (payload: T) => boolean;
  };

  type ClearOn<T> = ActionCreator<T> | ClearOnDetail<T>;

  interface ModelDetailResponseStore<T extends Model.HttpModel> {
    readonly data: T | null;
    readonly loading: boolean;
  }

  interface ModelDetailResponseActionMap<M extends Model.HttpModel> {
    readonly loading: boolean;
    readonly response: M | null;
    readonly updateInState: UpdateActionPayload<M>;
  }

  interface ListResponseStore<T> {
    readonly data: T[];
    readonly count: number;
    readonly loading: boolean;
    readonly responseWasReceived: boolean;
  }

  type ListResponseActionMap<T> = {
    readonly request: null;
    readonly loading: boolean;
    readonly response: Http.ListResponse<T>;
  };

  interface ListResponseTaskMap {
    readonly request: Task<null>;
  }

  interface ModelListResponseStore<T extends Model.HttpModel> extends ListResponseStore<T> {}

  interface AuthenticatedModelListResponseStore<T extends Model.HttpModel> extends ModelListResponseStore<T> {
    readonly search: string;
    readonly page: number;
    readonly pageSize: number;
    readonly deleting: ModelListActionStore;
    readonly updating: ModelListActionStore;
    readonly creating: boolean;
    readonly selected: number[];
  }

  type ModelListResponseActionMap<M extends Model.HttpModel> = ListResponseActionMap<M>;

  type AuthenticatedModelListResponseActionMap<M extends Model.HttpModel> = ModelListResponseActionMap<M> & {
    readonly updating?: ModelListActionPayload;
    readonly creating?: boolean;
    readonly removeFromState: number;
    readonly deleting?: ModelListActionPayload;
    readonly addToState: M;
    readonly updateInState: UpdateActionPayload<M>;
    readonly setSearch?: string;
    readonly setPagination: Pagination;
  };

  interface ModelListResponseTaskMap {
    readonly request: Task<null>;
  }

  type TableTaskMap<R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel> = {
    readonly request: Task<null>;
    readonly handleChangeEvent: TableEventTask<Table.ChangeEvent<R, M>>;
  };

  type TableActionMap<M extends Model.RowHttpModel = Model.RowHttpModel> = {
    readonly loading: boolean;
    readonly response: Http.TableResponse<M>;
    readonly setSearch: string;
  };

  type AuthenticatedTableActionMap<
    R extends Table.RowData = object,
    M extends Model.RowHttpModel = Model.RowHttpModel
  > = TableActionMap<M> & {
    readonly tableChanged: Table.ChangeEvent<R, M>;
    readonly saving: boolean;
    readonly addModelsToState: AddModelsToTablePayload<M>;
    readonly updateRowsInState?: UpdateRowsInTablePayload<R>;
  };

  type TableStore<D extends Table.RowData = object> = {
    readonly data: Table.BodyRow<D>[];
    readonly search: string;
    readonly loading: boolean;
    readonly saving: boolean;
  };

  type AddModelsToTablePayload<M extends Model.RowHttpModel> = {
    readonly placeholderIds: Table.PlaceholderRowId[];
    readonly models: M[];
  };

  type UpdateRowPayload<R extends Table.RowData> = {
    readonly data: Partial<R>;
    readonly id: Table.ModelRowId;
  };

  type UpdateRowsInTablePayload<R extends Table.RowData> = SingleOrArray<UpdateRowPayload<R>>;

  type BudgetTableStore<R extends Tables.BudgetRowData> = TableStore<R>;
}
