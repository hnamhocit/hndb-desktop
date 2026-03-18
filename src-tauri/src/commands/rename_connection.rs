use crate::helpers::{get_saved_connection, save_saved_connection};

#[tauri::command]
pub async fn rename_connection(
    connection_id: String,
    new_name: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let mut connection = get_saved_connection(&app, &connection_id)?;

    connection.name = new_name;

    save_saved_connection(&app, &connection)?;

    Ok(())
}
