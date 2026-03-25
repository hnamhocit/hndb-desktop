use std::collections::HashMap;

use crate::db_client::DbClient;
use crate::helpers::{
    build_conn_str, get_saved_connection, remove_connection_family, save_saved_connection,
};
use crate::state::AppState;
use crate::types::{ConnectionConfig, ConnectionMode};

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
pub async fn update_connection(
    connection_id: String,
    connection_name: String,
    config: ConnectionConfig,
    overrides: HashMap<String, String>,
    save_password: bool,
    show_all_databases: bool,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut connection = get_saved_connection(&app, &connection_id)?;
    let conn_str = build_conn_str(&config)?;
    let new_client = DbClient::connect(&config.driver, &conn_str).await?;

    connection.name = connection_name;
    connection.config = config_for_storage(&config, save_password);
    connection.setting_overrides = overrides;
    connection.save_password = save_password;
    connection.show_all_databases = show_all_databases;

    if let Err(error) = save_saved_connection(&app, &connection) {
        new_client.close().await;
        return Err(error);
    }

    let stale_clients = remove_connection_family(&connection_id, &state).await;
    for client in stale_clients {
        client.close().await;
    }

    let mut connections_map = state.active_connections.lock().await;
    connections_map.insert(connection_id.clone(), new_client);
    drop(connections_map);

    let mut manually_disconnected = state.manually_disconnected_connections.lock().await;
    manually_disconnected.remove(&connection_id);

    let mut session_passwords = state.session_connection_passwords.lock().await;
    if !save_password {
        if let Some(password) = extract_runtime_password(&config) {
            session_passwords.insert(connection_id.clone(), password);
        } else {
            session_passwords.remove(&connection_id);
        }
    } else {
        session_passwords.remove(&connection_id);
    }

    Ok(())
}
