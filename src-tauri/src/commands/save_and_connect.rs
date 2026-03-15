use super::test_and_probe;
use crate::types::{ConnectionConfig, SavedConnection};
use std::collections::HashMap;
use tauri_plugin_store::StoreExt;

use crate::db_client::DbClient;
use crate::helpers::build_conn_str;
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

    // --- BƯỚC 2: LƯU XUỐNG Ổ CỨNG (connections.json) ---
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let saved = SavedConnection {
        id: id.clone(),
        name: connection_name,
        config: config.clone(),
        setting_overrides: overrides,
        created_at: now,
    };

    let store = app
        .store("connections.json")
        .map_err(|e| format!("Không mở được store: {}", e))?;
    store.set(
        id.clone(),
        serde_json::to_value(&saved).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| format!("Không lưu được: {}", e))?;

    // --- BƯỚC 3: TỰ ĐỘNG MỞ SESSION VÀ NẠP VÀO RAM ---
    let conn_str = build_conn_str(&config)?;
    let client = DbClient::connect(&config.driver, &conn_str).await?;

    let mut connections_map = state.active_connections.lock().await;
    connections_map.insert(id.clone(), client); // Cất súng vào kho

    Ok(id)
}
