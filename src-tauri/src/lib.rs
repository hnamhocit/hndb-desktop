mod commands;
mod db_client;
mod helpers;
mod state;
mod types;

use commands::*;
use state::AppState;
use tauri::Manager;
use tauri::Emitter;
use tauri_plugin_deep_link::DeepLinkExt;
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // 1. Lấy cửa sổ chính
            if let Some(window) = app.get_webview_window("main") {
                // 2. Ép cửa sổ hiện lên trên cùng (Focus)
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();

                // 3. Nếu có URL trong argv, gửi thẳng vào React qua Event
                if let Some(url) = argv.get(1) {
                    // Gửi event tên là "deep-link-received" kèm theo URL
                    let _ = window.emit("deep-link-received", url);
                }
            }
        }));
    }

    builder
        .setup(|app| {
            let salt_path = app.path().app_local_data_dir()
                .expect("Không tìm thấy thư mục lưu trữ cục bộ")
                .join("salt.txt");

            #[cfg(any(windows, target_os = "linux"))]
            app.deep_link().register_all()?;

            app.handle().plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;
            Ok(())
        })
        .manage(AppState {
            active_connections: Mutex::new(std::collections::HashMap::new()),
            active_database_connections: Mutex::new(std::collections::HashMap::new()),
            manually_disconnected_connections: Mutex::new(std::collections::HashSet::new()),
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            test_and_probe, validate_setting_overrides, save_and_connect,
            list_connections, list_connection_statuses, list_databases,
            list_tables, get_table_preview, get_table_schema,
            rename_connection, update_connection, delete_connection,
            reset_connection_sessions, connect_session, execute_query,
            disconnect_connection, invalidate_connection
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi khi chạy tauri application");
}
