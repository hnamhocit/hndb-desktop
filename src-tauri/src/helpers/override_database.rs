use crate::types::{ConnectionConfig, ConnectionMode};

fn replace_database_in_url(connection_string: &str, database: &str) -> Result<String, String> {
    if connection_string.starts_with("sqlite://") {
        return Ok(connection_string.to_string());
    }

    let (base, query_suffix) = match connection_string.split_once('?') {
        Some((base, query)) => (base, format!("?{}", query)),
        None => (connection_string, String::new()),
    };

    let scheme_index = base
        .find("://")
        .ok_or("Connection string không hợp lệ: thiếu scheme")?;

    let scheme = &base[..scheme_index + 3];
    let after_scheme = &base[scheme_index + 3..];

    let slash_index = after_scheme.find('/').unwrap_or(after_scheme.len());
    let authority = &after_scheme[..slash_index];

    Ok(format!(
        "{}{}/{}{}",
        scheme, authority, database, query_suffix
    ))
}

pub fn override_database(
    config: &ConnectionConfig,
    database: Option<&str>,
) -> Result<ConnectionConfig, String> {
    let Some(database) = database.filter(|value| !value.trim().is_empty()) else {
        return Ok(config.clone());
    };

    let mode = match &config.mode {
        ConnectionMode::Fields {
            host,
            port,
            username,
            password,
            ..
        } => ConnectionMode::Fields {
            host: host.clone(),
            port: *port,
            database: database.to_string(),
            username: username.clone(),
            password: password.clone(),
        },
        ConnectionMode::Url { connection_string } => ConnectionMode::Url {
            connection_string: replace_database_in_url(connection_string, database)?,
        },
    };

    Ok(ConnectionConfig {
        driver: config.driver.clone(),
        mode,
    })
}
