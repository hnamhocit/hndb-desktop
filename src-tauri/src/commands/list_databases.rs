use crate::helpers::{
    check_and_disconnect_if_fatal, ensure_connection_is_connected,
    get_or_create_active_connection,
};
use crate::state::AppState;

#[tauri::command]
pub async fn list_databases(
    id: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, String> {
    ensure_connection_is_connected(&id, &state).await?;

    let client = match get_or_create_active_connection(id.as_str(), &app, &state).await {
        Ok(c) => c,
        Err(e) => {
            check_and_disconnect_if_fatal(&id, &state, &e).await;
            return Err(e);
        }
    };

    let result = client.list_databases().await;

    if let Err(ref err) = result {
        check_and_disconnect_if_fatal(&id, &state, err).await;
    }

    result
}
