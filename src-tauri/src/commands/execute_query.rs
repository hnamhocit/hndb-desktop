use crate::db_client::DbClient;
use crate::helpers::{
    build_conn_str, check_and_disconnect_if_fatal, ensure_connection_is_connected, get_config_by_id, override_database,
};
use crate::state::AppState;

const DANGEROUS_QUERY_ERROR_CODE: &str = "DANGEROUS_QUERY";

fn strip_sql_comments(query: &str) -> String {
    let mut without_block_comments = String::with_capacity(query.len());
    let mut chars = query.chars().peekable();
    let mut in_block_comment = false;

    while let Some(current) = chars.next() {
        if in_block_comment {
            if current == '*' && chars.peek() == Some(&'/') {
                chars.next();
                in_block_comment = false;
            }
            continue;
        }

        if current == '/' && chars.peek() == Some(&'*') {
            chars.next();
            in_block_comment = true;
            continue;
        }

        without_block_comments.push(current);
    }

    let mut cleaned = String::with_capacity(without_block_comments.len());
    for line in without_block_comments.lines() {
        let line_without_comment = line.split("--").next().unwrap_or_default();
        cleaned.push_str(line_without_comment);
        cleaned.push('\n');
    }

    cleaned.trim().to_string()
}

fn is_dangerous_statement(statement: &str) -> bool {
    let normalized_tokens = statement
        .to_uppercase()
        .split_whitespace()
        .map(str::to_string)
        .collect::<Vec<String>>();

    let first = normalized_tokens.first().map(String::as_str);
    if first.is_none() {
        return false;
    }

    let has_where = normalized_tokens.iter().any(|token| token == "WHERE");

    match first.unwrap_or_default() {
        "UPDATE" => !has_where,
        "DELETE" => !has_where,
        "DROP" => normalized_tokens.get(1).map(String::as_str) == Some("TABLE"),
        _ => false,
    }
}

fn is_dangerous_query(query: &str) -> bool {
    let normalized = strip_sql_comments(query);
    if normalized.is_empty() {
        return false;
    }

    normalized
        .split(';')
        .map(str::trim)
        .filter(|statement| !statement.is_empty())
        .any(is_dangerous_statement)
}

#[tauri::command]
pub async fn execute_query(
    id: String,
    database: Option<String>,
    query: String,
    forced: Option<bool>,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    ensure_connection_is_connected(&id, &state).await?;
    let is_forced = forced.unwrap_or(false);

    if !is_forced && is_dangerous_query(&query) {
        return Err(format!(
            "{DANGEROUS_QUERY_ERROR_CODE}: UPDATE/DELETE without WHERE or DROP TABLE is blocked by default."
        ));
    }

    if let Some(target_database) = database.as_deref() {
        let config = get_config_by_id(&app, id.as_str())?;
        let effective_config = override_database(&config, Some(target_database))?;
        let conn_str = build_conn_str(&effective_config)?;
        let client = match DbClient::connect(&effective_config.driver, &conn_str).await {
            Ok(c) => c,
            Err(e) => {
                check_and_disconnect_if_fatal(&id, &state, &e).await;
                return Err(e);
            }
        };

        let result = client.run_sql(&query).await;
        client.close().await;

        if let Err(ref err) = result {
            check_and_disconnect_if_fatal(&id, &state, err).await;
        }

        return result;
    }

    let connections_map = state.active_connections.lock().await;

    if let Some(client) = connections_map.get(&id) {
        let result = client.run_sql(&query).await;
        if let Err(ref err) = result {
            // Drop explicitly
            drop(connections_map);
            check_and_disconnect_if_fatal(&id, &state, err).await;
            return result;
        }

        result
    } else {
        drop(connections_map);
        let config = get_config_by_id(&app, id.as_str())?;
        let conn_str = build_conn_str(&config)?;
        let client = match DbClient::connect(&config.driver, &conn_str).await {
            Ok(c) => c,
            Err(e) => {
                check_and_disconnect_if_fatal(&id, &state, &e).await;
                return Err(e);
            }
        };

        let result = client.run_sql(&query).await;
        client.close().await;

        if let Err(ref err) = result {
            check_and_disconnect_if_fatal(&id, &state, err).await;
        }

        result
    }
}
