import { AsyncLocalStorage } from "async_hooks";
import mongoose from "mongoose";

type DbQueryMetric = {
  model: string;
  operation: string;
  ms: number;
  rows: number;
};

type RequestPerfStore = {
  dbMs: number;
  dbRows: number;
  dbQueries: DbQueryMetric[];
};

const requestPerfStorage = new AsyncLocalStorage<RequestPerfStore>();

const getRowCountFromResult = (result: unknown): number => {
  if (Array.isArray(result)) return result.length;
  if (result && typeof result === "object") return 1;
  return 0;
};

export const runWithRequestPerfContext = (cb: () => void) => {
  requestPerfStorage.run(
    {
      dbMs: 0,
      dbRows: 0,
      dbQueries: [],
    },
    cb
  );
};

export const recordDbQueryMetric = (metric: DbQueryMetric) => {
  const store = requestPerfStorage.getStore();
  if (!store) return;

  store.dbMs += metric.ms;
  store.dbRows += metric.rows;
  store.dbQueries.push(metric);
};

export const getRequestPerfSnapshot = () => {
  const store = requestPerfStorage.getStore();
  if (!store) return null;

  return {
    dbMs: Number(store.dbMs.toFixed(2)),
    dbRows: store.dbRows,
    dbQueries: [...store.dbQueries],
  };
};

let mongooseQueryProfilerEnabled = false;

export const enableMongooseQueryProfiler = () => {
  if (mongooseQueryProfilerEnabled) return;
  mongooseQueryProfilerEnabled = true;

  const queryPrototype = mongoose.Query.prototype as mongoose.Query<any, any> & {
    op?: string;
    model?: { modelName?: string };
    exec: (...args: any[]) => Promise<any>;
  };
  const originalQueryExec = queryPrototype.exec;

  queryPrototype.exec = async function (...args: any[]) {
    const startedAt = Date.now();
    try {
      const result = await originalQueryExec.apply(this, args);
      const ms = Date.now() - startedAt;
      recordDbQueryMetric({
        model: this.model?.modelName ?? "UnknownModel",
        operation: this.op ?? "query",
        ms,
        rows: getRowCountFromResult(result),
      });
      return result;
    } catch (error) {
      const ms = Date.now() - startedAt;
      recordDbQueryMetric({
        model: this.model?.modelName ?? "UnknownModel",
        operation: this.op ?? "query",
        ms,
        rows: 0,
      });
      throw error;
    }
  };

  const aggregatePrototype = mongoose.Aggregate.prototype as mongoose.Aggregate<any> & {
    _model?: { modelName?: string };
    exec: (...args: any[]) => Promise<any>;
  };
  const originalAggregateExec = aggregatePrototype.exec;

  aggregatePrototype.exec = async function (...args: any[]) {
    const startedAt = Date.now();
    try {
      const result = await originalAggregateExec.apply(this, args);
      const ms = Date.now() - startedAt;
      recordDbQueryMetric({
        model: this._model?.modelName ?? "UnknownModel",
        operation: "aggregate",
        ms,
        rows: getRowCountFromResult(result),
      });
      return result;
    } catch (error) {
      const ms = Date.now() - startedAt;
      recordDbQueryMetric({
        model: this._model?.modelName ?? "UnknownModel",
        operation: "aggregate",
        ms,
        rows: 0,
      });
      throw error;
    }
  };
};
