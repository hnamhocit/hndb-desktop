use iota_stronghold::Client;
use tauri::Manager;
use tauri_plugin_stronghold::stronghold::Stronghold;

use crate::helpers::vault_password::get_or_init_vault_password;
use crate::types::{ConnectionConfig, SavedConnection};

const VAULT_PATH: &str = "connections.vault";
const CONNECTIONS_CLIENT_PATH: &[u8] = b"connections";
const LEGACY_CONNECTIONS_CLIENT_PATH: &[u8] = b"session_info";

fn should_reset_vault(error: &str) -> bool {
    error.contains("BadFileKey") || error.contains("failed to decode/decrypt age content")
}

fn open_stronghold(snapshot_path: &std::path::Path, password: &str) -> Result<Stronghold, String> {
    match Stronghold::new(snapshot_path, password.as_bytes().to_vec()) {
        Ok(stronghold) => Ok(stronghold),
        Err(error) => {
            let error_message = error.to_string();
            if !should_reset_vault(&error_message) {
                return Err(error_message);
            }

            let backup_path = snapshot_path.with_extension(format!(
                "bad-{}.vault",
                chrono::Utc::now().timestamp_millis()
            ));

            std::fs::rename(snapshot_path, &backup_path)
                .map_err(|rename_error| format!("Không thể backup vault lỗi: {}", rename_error))?;

            Stronghold::new(snapshot_path, password.as_bytes().to_vec())
                .map_err(|retry_error| retry_error.to_string())
        }
    }
}

fn open_connections_client(app: &tauri::AppHandle) -> Result<(Stronghold, Client), String> {
    let snapshot_path = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Không tìm thấy thư mục lưu trữ cục bộ: {}", e))?
        .join(VAULT_PATH);
    let password = get_or_init_vault_password()?;
    let stronghold = open_stronghold(&snapshot_path, &password)?;

    let client = match stronghold.load_client(CONNECTIONS_CLIENT_PATH) {
        Ok(client) => client,
        Err(_) => match stronghold.load_client(LEGACY_CONNECTIONS_CLIENT_PATH) {
            Ok(client) => client,
            Err(_) => stronghold
                .create_client(CONNECTIONS_CLIENT_PATH)
                .map_err(|e| format!("Không mở được client lưu kết nối: {}", e))?,
        },
    };

    Ok((stronghold, client))
}

pub fn list_saved_connections(app: &tauri::AppHandle) -> Result<Vec<SavedConnection>, String> {
    let (_, client) = open_connections_client(app)?;
    let store = client.store();
    let mut connections = Vec::new();

    for key in store.keys().map_err(|e| e.to_string())? {
        if let Some(value) = store.get(&key).map_err(|e| e.to_string())? {
            if let Ok(connection) = serde_json::from_slice::<SavedConnection>(&value) {
                connections.push(connection);
            }
        }
    }

    connections.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(connections)
}

pub fn get_saved_connection(app: &tauri::AppHandle, id: &str) -> Result<SavedConnection, String> {
    let (_, client) = open_connections_client(app)?;
    let store = client.store();
    let raw = store
        .get(id.as_bytes())
        .map_err(|e| e.to_string())?
        .ok_or("Không tìm thấy kết nối.")?;

    serde_json::from_slice::<SavedConnection>(&raw)
        .map_err(|e| format!("Dữ liệu kết nối không hợp lệ: {}", e))
}

pub fn save_saved_connection(
    app: &tauri::AppHandle,
    connection: &SavedConnection,
) -> Result<(), String> {
    let (stronghold, client) = open_connections_client(app)?;
    let store = client.store();
    let payload =
        serde_json::to_vec(connection).map_err(|e| format!("Không mã hóa được dữ liệu: {}", e))?;

    store
        .insert(connection.id.as_bytes().to_vec(), payload, None)
        .map_err(|e| format!("Không ghi được kết nối: {}", e))?;
    stronghold
        .save()
        .map_err(|e| format!("Không lưu được Stronghold: {}", e))?;

    Ok(())
}

pub fn delete_saved_connection(app: &tauri::AppHandle, id: &str) -> Result<(), String> {
    let (stronghold, client) = open_connections_client(app)?;
    let store = client.store();

    store
        .delete(id.as_bytes())
        .map_err(|e| format!("Không xóa được kết nối: {}", e))?;
    stronghold
        .save()
        .map_err(|e| format!("Không lưu được Stronghold: {}", e))?;

    Ok(())
}

pub fn get_config_by_id(app: &tauri::AppHandle, id: &str) -> Result<ConnectionConfig, String> {
    Ok(get_saved_connection(app, id)?.config)
}
