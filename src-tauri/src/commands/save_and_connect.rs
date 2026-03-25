use crate::helpers::{build_conn_str, save_saved_connection};
use crate::types::{ConnectionConfig, ConnectionMode, SavedConnection};
use std::collections::HashMap;

use crate::db_client::DbClient;
use crate::state::AppState;

fn config_for_storage(config: &ConnectionConfig, save_password: bool) -> ConnectionConfig {
    if save_password {
        return config.clone();
    }

    let mode = match &config.mode {
        ConnectionMode::Fields {
            host,
            port,
            database,
            username,
            ..
        } => ConnectionMode::Fields {
            host: host.clone(),
            port: *port,
            database: database.clone(),
            username: username.clone(),
            password: None,
        },
        ConnectionMode::Url { connection_string } => ConnectionMode::Url {
            connection_string: connection_string.clone(),
        },
    };

    ConnectionConfig {
        driver: config.driver.clone(),
        mode,
    }
}

fn extract_runtime_password(config: &ConnectionConfig) -> Option<String> {
    match &config.mode {
        ConnectionMode::Fields { password, .. } => password.clone(),
        ConnectionMode::Url { .. } => None,
    }
}

#[tauri::command]
pub async fn save_and_connect(
    connection_name: String,
    config: ConnectionConfig,
    overrides: HashMap<String, String>,
    save_password: bool,
    show_all_databases: bool,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let conn_str = build_conn_str(&config)?;
    let client = DbClient::connect(&config.driver, &conn_str).await?;

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let saved = SavedConnection {
        id: id.clone(),
        name: connection_name,
        config: config_for_storage(&config, save_password),
        setting_overrides: overrides,
        save_password,
        show_all_databases,
        created_at: now,
    };

    if let Err(error) = save_saved_connection(&app, &saved) {
        client.close().await;
        return Err(error);
    }

    let mut connections_map = state.active_connections.lock().await;
    connections_map.insert(id.clone(), client);
    drop(connections_map);

    let mut manually_disconnected = state.manually_disconnected_connections.lock().await;
    manually_disconnected.remove(&id);

    let mut session_passwords = state.session_connection_passwords.lock().await;
    if !save_password {
        if let Some(password) = extract_runtime_password(&config) {
            session_passwords.insert(id.clone(), password);
        } else {
            session_passwords.remove(&id);
        }
    } else {
        session_passwords.remove(&id);
    }

    Ok(id)
}
