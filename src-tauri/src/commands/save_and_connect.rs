use super::test_and_probe;
use crate::helpers::{build_conn_str, save_saved_connection};
use crate::types::{ConnectionConfig, SavedConnection};
use std::collections::HashMap;

use crate::db_client::DbClient;
use crate::state::AppState;

#[tauri::command]
pub async fn save_and_connect(
    connection_name: String,
    config: ConnectionConfig,
    overrides: HashMap<String, String>,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    // --- BƯỚC 1: TEST KẾT NỐI TRƯỚC ---
    let probe = test_and_probe(config.clone()).await;
    if !probe.success {
        return Err(format!(
            "Kết nối thất bại: {}",
            probe.error.unwrap_or_default()
        ));
    }

    // --- BƯỚC 2: LƯU AN TOÀN VÀO STRONGHOLD ---
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let saved = SavedConnection {
        id: id.clone(),
        name: connection_name,
        config: config.clone(),
        setting_overrides: overrides,
        created_at: now,
    };

    save_saved_connection(&app, &saved)?;

    // --- BƯỚC 3: TỰ ĐỘNG MỞ SESSION VÀ NẠP VÀO RAM ---
    let conn_str = build_conn_str(&config)?;
    let client = DbClient::connect(&config.driver, &conn_str).await?;

    let mut connections_map = state.active_connections.lock().await;
    connections_map.insert(id.clone(), client); // Cất súng vào kho
    drop(connections_map);

    let mut manually_disconnected = state.manually_disconnected_connections.lock().await;
    manually_disconnected.remove(&id);

    Ok(id)
}
