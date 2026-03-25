use crate::helpers::saved_connections_store::get_config_by_id as get_config_from_secure_store;
use crate::state::AppState;
use crate::types::{ConnectionConfig, ConnectionMode};

pub fn get_config_by_id(app: &tauri::AppHandle, id: &str) -> Result<ConnectionConfig, String> {
    get_config_from_secure_store(app, id)
}

pub async fn get_runtime_config_by_id(
    app: &tauri::AppHandle,
    id: &str,
    state: &tauri::State<'_, AppState>,
) -> Result<ConnectionConfig, String> {
    let mut config = get_config_from_secure_store(app, id)?;

    if let ConnectionMode::Fields { password, .. } = &mut config.mode {
        let needs_runtime_password = match password {
            Some(value) => value.trim().is_empty(),
            None => true,
        };

        if needs_runtime_password {
            let session_passwords = state.session_connection_passwords.lock().await;
            if let Some(runtime_password) = session_passwords.get(id).cloned() {
                *password = Some(runtime_password);
            }
        }
    }

    Ok(config)
}
