use crate::helpers::{
    check_and_disconnect_if_fatal, ensure_connection_is_connected, get_or_create_active_connection,
    get_saved_connection,
};
use crate::state::AppState;
use crate::types::{ConnectionConfig, ConnectionMode};
use url::Url;

fn configured_database_name(config: &ConnectionConfig) -> Option<String> {
    match &config.mode {
        ConnectionMode::Fields { database, .. } => {
            let database = database.trim();
            if database.is_empty() {
                None
            } else {
                Some(database.to_string())
            }
        }
        ConnectionMode::Url { connection_string } => {
            let normalized_connection_string = if connection_string.starts_with("postgres://") {
                connection_string.replacen("postgres://", "postgresql://", 1)
            } else if connection_string.starts_with("sqlserver://") {
                connection_string.replacen("sqlserver://", "mssql://", 1)
            } else {
                connection_string.clone()
            };

            let parsed = Url::parse(&normalized_connection_string).ok()?;
            let database = parsed
                .path_segments()?
                .filter(|segment| !segment.is_empty())
                .next_back()?;

            if database.is_empty() {
                None
            } else {
                Some(database.to_string())
            }
        }
    }
}

#[tauri::command]
pub async fn list_databases(
    id: String,
    show_all_databases: Option<bool>,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    let saved_connection = get_saved_connection(&app, id.as_str())?;
    let should_show_all = show_all_databases.unwrap_or(saved_connection.show_all_databases);

    ensure_connection_is_connected(&id, &state).await?;

    let client = match get_or_create_active_connection(id.as_str(), &app, &state).await {
        Ok(c) => c,
        Err(e) => {
            check_and_disconnect_if_fatal(&id, &state, &e).await;
            return Err(e);
        }
    };

    let result = client.list_databases().await.map(|mut databases| {
        if !should_show_all {
            if let Some(configured_database) = configured_database_name(&saved_connection.config) {
                databases.retain(|database| database == &configured_database);

                if databases.is_empty() {
                    databases.push(configured_database);
                }
            }
        }

        databases
    });

    if let Err(ref err) = result {
        check_and_disconnect_if_fatal(&id, &state, err).await;
    }

    result
}
