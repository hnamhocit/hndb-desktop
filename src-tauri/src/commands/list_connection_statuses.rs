use std::collections::{HashMap, HashSet};

use crate::helpers::list_saved_connections;
use crate::state::AppState;

#[tauri::command]
pub async fn list_connection_statuses(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<HashMap<String, bool>, String> {
    let connections = list_saved_connections(&app)?;
    let active_connection_ids = {
        let active_connections = state.active_connections.lock().await;
        active_connections.keys().cloned().collect::<HashSet<_>>()
    };
    let manually_disconnected_ids = {
        let manually_disconnected = state.manually_disconnected_connections.lock().await;
        manually_disconnected
            .iter()
            .cloned()
            .collect::<HashSet<_>>()
    };

    let mut statuses = HashMap::new();

    for connection in connections {
        if manually_disconnected_ids.contains(&connection.id) {
            statuses.insert(connection.id, false);
            continue;
        }

        statuses.insert(
            connection.id.clone(),
            active_connection_ids.contains(&connection.id),
        );
    }

    Ok(statuses)
}
