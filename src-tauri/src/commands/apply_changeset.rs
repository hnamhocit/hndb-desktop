use crate::helpers::{
    check_and_disconnect_if_fatal, ensure_connection_is_connected,
    get_or_create_database_connection,
};
use crate::state::AppState;
use crate::types::changeset::RecordChangeset;
use tauri::State;

fn normalize_table_name(table_name: &str) -> &str {
    table_name
        .split("/tables/")
        .nth(1)
        .and_then(|value| value.split('/').next())
        .filter(|value| !value.trim().is_empty())
        .unwrap_or(table_name)
}

#[tauri::command]
pub async fn apply_changeset(
    connection_id: String,
    database: String,
    table_name: String,
    primary_key: String,
    changeset: RecordChangeset,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    ensure_connection_is_connected(&connection_id, &state).await?;

    let client = match get_or_create_database_connection(
        connection_id.as_str(),
        database.as_str(),
        &app,
        &state,
    )
    .await
    {
        Ok(client) => client,
        Err(error) => {
            check_and_disconnect_if_fatal(&connection_id, &state, &error).await;
            return Err(format!("Failed to apply changeset: {}", error));
        }
    };

    let normalized_table_name = normalize_table_name(&table_name);
    let result = client
        .apply_changeset(normalized_table_name, &primary_key, changeset)
        .await;

    match result {
        Ok(value) => Ok(value),
        Err(error) => {
            check_and_disconnect_if_fatal(&connection_id, &state, &error).await;
            Err(format!("Failed to apply changeset: {}", error))
        }
    }
}
