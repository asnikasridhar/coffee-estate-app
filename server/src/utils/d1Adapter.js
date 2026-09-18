// Run the same finance business logic locally and in Cloudflare D1.
export function d1Adapter(db) {
  return {
    DB: {
      prepare(sql) {
        return {
          args: [],
          bind(...args) {
            return {
              ...this,
              args
            };
          },
          async all() {
            return {
              results: db.prepare(sql).all(...this.args)
            };
          },
          async first() {
            return db.prepare(sql).get(...this.args) || null;
          },
          run() {
            const r = db.prepare(sql).run(...this.args);
            return {
              meta: {
                changes: r.changes,
                last_row_id: Number(r.lastInsertRowid)
              }
            };
          }
        };
      },
      async batch(statements) {
        return db.transaction(() => statements.map(s => s.run()))();
      }
    }
  };
}
