import Dexie, { type Table } from "dexie";

import type { AppState } from "@/lib/types";

type AppStateRecord = {
  id: string;
  data: AppState;
  updatedAt: string;
};

export const APP_STATE_RECORD_ID = "app-state";

class ClassicSpanishDatabase extends Dexie {
  state!: Table<AppStateRecord, string>;

  public constructor() {
    super("classic-spanish-speaking");
    this.version(1).stores({
      state: "id, updatedAt"
    });
  }
}

let database: ClassicSpanishDatabase | null = null;

export function getDatabase(): ClassicSpanishDatabase {
  if (!database) {
    database = new ClassicSpanishDatabase();
  }
  return database;
}
