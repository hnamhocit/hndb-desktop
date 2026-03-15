mod commands;
mod db_client;
mod helpers;
mod state;
mod types;

use commands::{
    connect_session, delete_connection, disconnect_connection, execute_query,
    invalidate_connection, list_connections, save_and_connect, test_and_probe,
    validate_setting_overrides,
};
use state::AppState;
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            active_connections: Mutex::new(std::collections::HashMap::new()),
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            test_and_probe,
            validate_setting_overrides,
            save_and_connect,
            list_connections,
            delete_connection,
            connect_session,
            execute_query,
            disconnect_connection,
            invalidate_connection
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi khi chạy tauri application");
}
