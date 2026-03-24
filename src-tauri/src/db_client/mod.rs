#[derive(Clone)]
pub enum DbClient {
    Postgres(sqlx::PgPool),
    Mysql(sqlx::MySqlPool),
    Sqlite(sqlx::SqlitePool),
    Mssql(String),
}

mod connection;
mod fetch_advanced_settings;
mod fetch_server_version;
mod list_databases;
mod list_tables;
mod mssql;
mod run_sql;
