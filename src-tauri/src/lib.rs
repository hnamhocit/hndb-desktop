mod commands;
mod db_client;
mod helpers;
mod state;
mod types;

use commands::{
    connect_session, delete_connection, disconnect_connection, execute_query, get_table_preview,
    get_table_schema, invalidate_connection, list_connection_statuses, list_connections,
    list_databases, list_tables, rename_connection, reset_connection_sessions, save_and_connect,
    test_and_probe, update_connection, validate_setting_overrides,
};
use state::AppState;
use tauri::Manager;
use tauri_plugin_deep_link::DeepLinkExt;
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default().plugin(tauri_plugin_deep_link::init());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            use tauri_plugin_deep_link::DeepLinkExt;
            if let Some(url) = argv.get(1) {
                let _ = app.deep_link().get_current();
            }
        }));
    }

    builder
        .setup(|app| {
            let salt_path = app
                .path()
                .app_local_data_dir()
                .expect("Không tìm thấy thư mục lưu trữ cục bộ")
                .join("salt.txt");

            #[cfg(any(windows, target_os = "linux"))]
            app.deep_link().register_all()?;

            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

            Ok(())
        })
        .manage(AppState {
            active_connections: Mutex::new(std::collections::HashMap::new()),
            manually_disconnected_connections: Mutex::new(std::collections::HashSet::new()),
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            test_and_probe,
            validate_setting_overrides,
            save_and_connect,
            list_connections,
            list_connection_statuses,
            list_databases,
            list_tables,
            get_table_preview,
            get_table_schema,
            rename_connection,
            update_connection,
            delete_connection,
            reset_connection_sessions,
            connect_session,
            execute_query,
            disconnect_connection,
            invalidate_connection
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi khi chạy tauri application");
}
