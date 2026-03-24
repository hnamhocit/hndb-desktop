use super::DbClient;
use crate::types::changeset::RecordChangeset;
use serde_json::Value;

impl DbClient {
    fn quote_ident(&self, ident: &str) -> String {
        // Split by dots if table includes schema (e.g. "public.users").
        // This is a naive implementation, ideally we'd have a stronger parsing if needed.
        if ident.contains(".") {
            let parts: Vec<&str> = ident.split('.').collect();
            return parts
                .into_iter()
                .map(|p| self.quote_ident(p))
                .collect::<Vec<_>>()
                .join(".");
        }

        match self {
            DbClient::Mysql(_) | DbClient::Sqlite(_) => {
                format!("`{}`", ident.replace('`', "``"))
            }
            DbClient::Postgres(_) => format!("\"{}\"", ident.replace('"', "\"\"")),
            DbClient::Mssql(_) => format!("[{}]", ident.replace(']', "]]")),
        }
    }

    pub async fn apply_changeset(
        &self,
        table: &str,
        primary_key: &str,
        changeset: RecordChangeset,
    ) -> Result<String, String> {
        let mut sql_statements = Vec::new();
        let quoted_table = self.quote_ident(table);

        // 1. Handle Inserts
        for insert in changeset.inserts {
            if insert.is_empty() {
                continue;
            }
            let mut cols = Vec::new();
            let mut vals = Vec::new();
            for (k, v) in insert {
                cols.push(self.quote_ident(&k));
                vals.push(json_to_sql_literal(&v));
            }
            sql_statements.push(format!(
                "INSERT INTO {} ({}) VALUES ({});",
                quoted_table,
                cols.join(", "),
                vals.join(", ")
            ));
        }

        // 2. Handle Updates
        for update in changeset.updates {
            if update.changes.is_empty() {
                continue;
            }
            let mut set_clauses = Vec::new();
            for (k, v) in update.changes {
                set_clauses.push(format!(
                    "{} = {}",
                    self.quote_ident(&k),
                    json_to_sql_literal(&v)
                ));
            }
            let pk_val = json_to_sql_literal(&update.id);
            sql_statements.push(format!(
                "UPDATE {} SET {} WHERE {} = {};",
                quoted_table,
                set_clauses.join(", "),
                self.quote_ident(primary_key),
                pk_val
            ));
        }

        // 3. Handle Deletes
        if !changeset.deletes.is_empty() {
            let ids: Vec<String> = changeset.deletes.iter().map(json_to_sql_literal).collect();
            sql_statements.push(format!(
                "DELETE FROM {} WHERE {} IN ({});",
                quoted_table,
                self.quote_ident(primary_key),
                ids.join(", ")
            ));
        }

        if sql_statements.is_empty() {
            return Ok("[]".to_string());
        }

        let final_sql = sql_statements.join("\n");

        self.run_sql(&final_sql).await
    }
}

/// Helper function to format JSON value to basic SQL literal format
fn json_to_sql_literal(val: &Value) -> String {
    match val {
        Value::Null => "NULL".to_string(),
        Value::Bool(b) => {
            if *b {
                "TRUE".to_string()
            } else {
                "FALSE".to_string()
            }
        }
        Value::Number(n) => n.to_string(),
        Value::String(s) => {
            // Basic escaping: replace single quotes with two single quotes
            let escaped = s.replace("'", "''");
            format!("'{}'", escaped)
        }
        Value::Array(arr) => {
            // For Postgres JSONB arrays we might want to cast, but keeping it simple as string
            let s = serde_json::to_string(arr).unwrap_or_default();
            format!("'{}'", s.replace("'", "''"))
        }
        Value::Object(obj) => {
            let s = serde_json::to_string(obj).unwrap_or_default();
            format!("'{}'", s.replace("'", "''"))
        }
    }
}
