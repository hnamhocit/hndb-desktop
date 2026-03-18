use crate::db_client::DbClient;
use crate::helpers::{build_conn_str, get_config_by_id};
use crate::state::AppState;

#[tauri::command]
pub async fn invalidate_connection(
    id: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    {
        // Nó giúp Mutex tự động nhả khóa (unlock) ngay khi thoát ra khỏi ngoặc,
        // để xíu nữa ở Bước 3 mình có thể khóa lại được mà không bị Deadlock.
        let mut connections_map = state.active_connections.lock().await;
        if let Some(client) = connections_map.remove(&id) {
            client.close().await;
        }
    }

    let config = get_config_by_id(&app, id.as_str())?;
    let conn_str = build_conn_str(&config)?;

    let new_client = DbClient::connect(&config.driver, &conn_str).await?;

    let mut connections_map = state.active_connections.lock().await;
    connections_map.insert(id.clone(), new_client);
    drop(connections_map);

    let mut manually_disconnected = state.manually_disconnected_connections.lock().await;
    manually_disconnected.remove(&id);

    Ok(())
}
