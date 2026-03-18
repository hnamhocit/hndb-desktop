use crate::helpers::saved_connections_store::get_config_by_id as get_config_from_secure_store;
use crate::types::ConnectionConfig;

pub fn get_config_by_id(app: &tauri::AppHandle, id: &str) -> Result<ConnectionConfig, String> {
    get_config_from_secure_store(app, id)
}
