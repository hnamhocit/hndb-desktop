use super::{build_conn_str, get_config_by_id, override_database};
use crate::db_client::DbClient;
use crate::state::AppState;

pub async fn ensure_connection_is_connected(
    id: &str,
    state: &tauri::State<'_, AppState>,
) -> Result<(), String> {
    let manually_disconnected = state.manually_disconnected_connections.lock().await;

    if manually_disconnected.contains(id) {
        return Err("Connection is disconnected. Please connect again.".to_string());
    }

    Ok(())
}

pub fn database_connection_key(id: &str, database: &str) -> String {
    format!("{id}::{database}")
}

pub async fn get_or_create_active_connection(
    id: &str,
    app: &tauri::AppHandle,
    state: &tauri::State<'_, AppState>,
) -> Result<DbClient, String> {
    if let Some(client) = {
        let connections_map = state.active_connections.lock().await;
        connections_map.get(id).cloned()
    } {
        return Ok(client);
    }

    let config = get_config_by_id(app, id)?;
    let conn_str = build_conn_str(&config)?;
    let client = DbClient::connect(&config.driver, &conn_str).await?;

    {
        let mut connections_map = state.active_connections.lock().await;
        if let Some(existing_client) = connections_map.get(id).cloned() {
            return Ok(existing_client);
        }
        connections_map.insert(id.to_string(), client.clone());
    }

    Ok(client)
}

pub async fn get_or_create_database_connection(
    id: &str,
    database: &str,
    app: &tauri::AppHandle,
    state: &tauri::State<'_, AppState>,
) -> Result<DbClient, String> {
    let key = database_connection_key(id, database);

    if let Some(client) = {
        let connections_map = state.active_database_connections.lock().await;
        connections_map.get(&key).cloned()
    } {
        return Ok(client);
    }

    let config = get_config_by_id(app, id)?;
    let effective_config = override_database(&config, Some(database))?;
    let conn_str = build_conn_str(&effective_config)?;
    let client = DbClient::connect(&effective_config.driver, &conn_str).await?;

    {
        let mut connections_map = state.active_database_connections.lock().await;
        if let Some(existing_client) = connections_map.get(&key).cloned() {
            return Ok(existing_client);
        }
        connections_map.insert(key, client.clone());
    }

    Ok(client)
}

pub async fn remove_connection_family(
    id: &str,
    state: &tauri::State<'_, AppState>,
) -> Vec<DbClient> {
    let mut removed_clients = Vec::new();

    {
        let mut connections_map = state.active_connections.lock().await;
        if let Some(client) = connections_map.remove(id) {
            removed_clients.push(client);
        }
    }

    {
        let scoped_prefix = format!("{id}::");
        let mut database_connections_map = state.active_database_connections.lock().await;
        let keys_to_remove = database_connections_map
            .keys()
            .filter(|key| key.starts_with(&scoped_prefix))
            .cloned()
            .collect::<Vec<_>>();

        for key in keys_to_remove {
            if let Some(client) = database_connections_map.remove(&key) {
                removed_clients.push(client);
            }
        }
    }

    removed_clients
}

pub async fn disconnect_due_to_error(id: &str, state: &tauri::State<'_, AppState>) {
    let clients = remove_connection_family(id, state).await;

    for client in clients {
        client.close().await;
    }

    let mut manually_disconnected = state.manually_disconnected_connections.lock().await;
    manually_disconnected.insert(id.to_string());
}

pub async fn check_and_disconnect_if_fatal(
    id: &str,
    state: &tauri::State<'_, AppState>,
    error_msg: &str,
) {
    let msg = error_msg.to_lowercase();
    if msg.contains("prepared statement")
        || msg.contains("connection refused")
        || msg.contains("password authentication failed")
        || msg.contains("timeout")
        || msg.contains("server closed the connection")
        || msg.contains("terminating connection")
        || msg.contains("ssl error")
        || msg.contains("broken pipe")
    {
        disconnect_due_to_error(id, state).await;
    }
}
