declare namespace Redux {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  type GenericSelectorFunc<S, T = any> = (state: S) => T;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  type SelectorFunc<T = any> = GenericSelectorFunc<Application.Store, T>;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  type ActionMap<C extends Table.Context = any> = Record<string, ActionCreator<any> | TableActionCreator<any, C>>;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  type InferActionPayload<A> = A extends Action<infer P, any>
    ? P
    : /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    A extends TableAction<infer P, any>
    ? P
    : never;

  type InferAction<CREATOR> = CREATOR extends TableActionCreator<infer P, infer C>
    ? TableAction<P, C>
    : CREATOR extends ActionCreator<infer P>
    ? Action<P>
    : never;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  type Transformers<S, A extends ActionMap<any>> = {
    [K in keyof A]-?: Reducer<S, InferAction<A[K]>>;
  };

  type _ActionPayload = string | number | boolean | Record<string, unknown>;
  type ActionPayload = _ActionPayload | null | _ActionPayload[];

  type Task<P extends ActionPayload = ActionPayload> = (action: Action<P>) => import("@redux-saga/types").SagaIterator;
  type ContextTask<P extends ActionPayload = ActionPayload, C extends Table.Context = Table.Context> = (
    action: TableAction<P, C>
  ) => import("@redux-saga/types").SagaIterator;

  type ActionContext = {
    readonly publicTokenId?: string;
    readonly errorMessage?: string;
  };

  type WithActionContext<C extends Record<string, unknown>> = C & ActionContext;

  type TableEventTask<
    E extends Table.ChangeEvent<R, M>,
    R extends Table.RowData,
    M extends Model.RowHttpModel,
    C extends Table.Context = Table.Context
  > = (e: E, context: WithActionContext<C>) => import("@redux-saga/types").SagaIterator;

  type TableEventTaskMapObject<
    R extends Table.RowData,
    M extends Model.RowHttpModel = Model.RowHttpModel,
    C extends Table.Context = Table.Context
  > = {
    readonly dataChange: TableEventTask<Table.DataChangeEvent<R>, R, M, C>;
    readonly rowAdd: TableEventTask<Table.RowAddEvent<R>, R, M, C>;
    readonly rowInsert: TableEventTask<Table.RowInsertEvent<R>, R, M, C>;
    readonly rowPositionChanged: TableEventTask<Table.RowPositionChangedEvent, R, M, C>;
    readonly rowDelete: TableEventTask<Table.RowDeleteEvent, R, M, C>;
    readonly rowRemoveFromGroup: TableEventTask<Table.RowRemoveFromGroupEvent, R, M, C>;
    readonly rowAddToGroup: TableEventTask<Table.RowAddToGroupEvent, R, M, C>;
    readonly groupAdded: TableEventTask<Table.GroupAddedEvent, R, M, C>;
    readonly groupUpdated: TableEventTask<Table.GroupUpdatedEvent, R, M, C>;
    readonly markupAdded: TableEventTask<Table.MarkupAddedEvent, R, M, C>;
    readonly markupUpdated: TableEventTask<Table.MarkupUpdatedEvent, R, M, C>;
  };

  type Reducer<S, A = Action> = import("redux").Reducer<S, A>;
  type ReducersMapObject<S> = {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    [K in keyof S]-?: Reducer<S[K], Action<any>>;
  };

  type StoreObj = Record<string, unknown> | boolean | number;

  type Store<S extends Application.Store> = import("redux").Store<S, Action> & {
    readonly injectSaga: (key: string, saga: import("redux-saga").Saga) => boolean;
    readonly ejectSaga: (key: string) => boolean;
    readonly hasSaga: (key: string) => boolean;
  };

  type Dispatch = import("redux").Dispatch<Action>;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  type BasicAction<P extends ActionPayload = any> = {
    readonly payload: P;
    readonly type: string;
  };

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  type Action<P extends ActionPayload = any, C extends ActionContext = ActionContext> = BasicAction<P> & {
    readonly context: C;
  };

  type TableActionContext<C extends Table.Context = Table.Context> = WithActionContext<C>;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  type TableAction<P extends ActionPayload = any, C extends Table.Context = Table.Context> = Action<
    P,
    WithActionContext<C>
  >;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  type ActionCreator<P extends ActionPayload = any> = {
    type: string;
    toString: () => string;
    (p: P, ctx?: Pick<ActionContext, "errorMessage">): Action<P>;
  };

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  type TableActionCreator<P extends ActionPayload = any, C extends Table.Context = Table.Context> = {
    type: string;
    toString: () => string;
    (p: P, ctx: Omit<WithActionContext<C>, "publicTokenId">): Action<P, WithActionContext<C>>;
  };

  type TaskConfig<A extends ActionMap> = {
    readonly actions: Omit<A, "request">;
  };

  type ReducerConfig<S, A extends ActionMap> = {
    readonly initialState: S;
    readonly actions: Partial<A>;
  };

  type SagaConfig<T, A extends ActionMap> = {
    readonly tasks: T;
    readonly actions: A;
  };

  type ListStore<T> = T[];

  type ModelListActionPayload = { id: ID; value: boolean };
  type ModelListActionInstance = { id: ID; count: number };

  type ModelListActionStore = ModelListActionInstance[];

  type UpdateActionPayload<T extends Record<string, unknown>, Id extends ID = number> = {
    id: Id;
    data: Partial<T>;
  };

  type TableRequestPayload = { ids: number[] } | null;

  type UpdateOrderingPayload<F extends string = string> = { field: F; order: Http.Order };

  type ClearOnDetail<T extends ActionPayload, C extends Table.Context = Table.Context> = {
    readonly action: ActionCreator<T> | TableActionCreator<T, C>;
    readonly payload: (payload: T) => boolean;
  };

  type ClearOn<T extends ActionPayload, C extends Table.Context = Table.Context> =
    | ActionCreator<T>
    | TableActionCreator<T, C>
    | ClearOnDetail<T, C>;

  type ModelDetailResponseStore<T extends Model.HttpModel> = {
    readonly data: T | null;
    readonly loading: boolean;
  };

  type ModelDetailResponseActionMap<M extends Model.HttpModel> = {
    readonly loading: ActionCreator<boolean>;
    readonly response: ActionCreator<M | null>;
    readonly updateInState: ActionCreator<UpdateActionPayload<M>>;
  };

  type ListResponseStore<T> = {
    readonly data: T[];
    readonly count: number;
    readonly loading: boolean;
    readonly responseWasReceived: boolean;
  };

  type ListResponseActionMap<T, P extends ActionPayload = ActionPayload> = {
    readonly request: ActionCreator<P>;
    readonly loading: ActionCreator<boolean>;
    readonly response: ActionCreator<Http.ListResponse<T>>;
  };

  type ListResponseTaskMap<P extends ActionPayload = ActionPayload> = {
    readonly request: Task<P>;
  };

  type ModelListResponseStore<T extends Model.HttpModel> = ListResponseStore<T>;

  type AuthenticatedModelListResponseStore<T extends Model.HttpModel> = ModelListResponseStore<T> & {
    readonly search: string;
    readonly page: number;
    readonly pageSize: number;
    readonly deleting: ModelListActionStore;
    readonly updating: ModelListActionStore;
    readonly creating: boolean;
    readonly selected: number[];
    readonly ordering: Http.Ordering<string>;
  };

  type ModelListResponseActionMap<M extends Model.HttpModel, P extends ActionPayload = null> = ListResponseActionMap<
    M,
    P
  >;

  type AuthenticatedModelListResponseActionMap<
    M extends Model.HttpModel,
    P extends ActionPayload = null,
    C extends Table.Context = Table.Context
  > = ModelListResponseActionMap<M, P> & {
    readonly updating?: ActionCreator<ModelListActionPayload>;
    readonly creating?: ActionCreator<boolean>;
    readonly removeFromState: ActionCreator<number>;
    readonly deleting?: ActionCreator<ModelListActionPayload>;
    readonly addToState: ActionCreator<M>;
    readonly updateInState: ActionCreator<UpdateActionPayload<M>>;
    readonly setSearch?: TableActionCreator<string, C>;
    readonly setPagination: ActionCreator<Pagination>;
    readonly updateOrdering?: ActionCreator<UpdateOrderingPayload<string>>;
  };

  type ModelListResponseTaskMap<P extends ActionPayload = null> = {
    readonly request: Task<P>;
  };

  type TableTaskMap<C extends Table.Context = Table.Context> = {
    readonly request: ContextTask<TableRequestPayload, C>;
  };

  type AuthenticatedTableTaskMap<
    R extends Table.RowData,
    M extends Model.RowHttpModel = Model.RowHttpModel,
    C extends Table.Context = Table.Context
  > = TableTaskMap<C> & {
    readonly handleChangeEvent: TableEventTask<Table.ChangeEvent<R, M>, R, M, C>;
  };

  type TableTaskMapWithRequest<C extends Table.Context = Table.Context> = {
    readonly request: ContextTask<TableRequestPayload, C>;
  };

  type TableTaskMapWithRequestOptional<
    T extends TableTaskMapWithRequest<C>,
    C extends Table.Context = Table.Context
  > = Omit<T, "request"> & { readonly request?: T["request"] };

  type TableActionMap<M extends Model.RowHttpModel = Model.RowHttpModel, C extends Table.Context = Table.Context> = {
    readonly request: TableActionCreator<TableRequestPayload, C>;
    readonly loading: ActionCreator<boolean>;
    readonly response: ActionCreator<Http.TableResponse<M>>;
    readonly setSearch: TableActionCreator<string, C>;
  };

  type AuthenticatedTableActionMap<
    R extends Table.RowData,
    M extends Model.RowHttpModel = Model.RowHttpModel,
    C extends Table.Context = Table.Context
  > = TableActionMap<M, C> & {
    readonly tableChanged: TableActionCreator<Table.ChangeEvent<R, M>, C>;
  };

  type TableActionMapWithRequest<C extends Table.Context = Table.Context> = {
    readonly request: TableActionCreator<TableRequestPayload, C>;
  };

  type TableActionMapWithRequestOptional<
    T extends TableActionMapWithRequest<C>,
    C extends Table.Context = Table.Context
  > = Omit<T, "request"> & { readonly request?: T["request"] };

  type TableStore<D extends Table.RowData> = {
    readonly data: Table.BodyRow<D>[];
    readonly search: string;
    readonly loading: boolean;
  };

  type BudgetTableStore<R extends Tables.BudgetRowData> = TableStore<R>;
}
