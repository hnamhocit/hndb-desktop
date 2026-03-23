use serde_json::{json, Map, Value as JsonValue};
use std::collections::HashMap;
use tiberius::{AuthMethod, Client, ColumnData, Config, EncryptionLevel};
use tokio::net::TcpStream;
use tokio_util::compat::{Compat, TokioAsyncWriteCompatExt};
use url::Url;

type MssqlClient = Client<Compat<TcpStream>>;

fn parse_bool(value: &str) -> Option<bool> {
    match value.trim().to_lowercase().as_str() {
        "1" | "true" | "yes" | "on" => Some(true),
        "0" | "false" | "no" | "off" => Some(false),
        _ => None,
    }
}

fn parse_mssql_encryption(value: &str) -> Option<EncryptionLevel> {
    match value.trim().to_lowercase().as_str() {
        "true" | "yes" | "required" | "mandatory" => Some(EncryptionLevel::Required),
        "false" | "no" | "off" => Some(EncryptionLevel::Off),
        "danger_plaintext" | "notsupported" => Some(EncryptionLevel::NotSupported),
        _ => None,
    }
}

fn normalize_connection_string(connection_string: &str) -> String {
    if connection_string.starts_with("sqlserver://") {
        return connection_string.replacen("sqlserver://", "mssql://", 1);
    }

    connection_string.to_string()
}

fn parse_mssql_config(connection_string: &str) -> Result<Config, String> {
    let normalized_connection_string = normalize_connection_string(connection_string);
    let parsed_url =
        Url::parse(&normalized_connection_string).map_err(|error| error.to_string())?;

    if parsed_url.scheme() != "mssql" {
        return Err(format!(
            "MSSQL connection string must start with mssql://, got: {}",
            parsed_url.scheme()
        ));
    }

    let host = parsed_url
        .host_str()
        .ok_or_else(|| "MSSQL connection string is missing host".to_string())?;
    let port = parsed_url.port().unwrap_or(1433);

    let query_pairs = parsed_url
        .query_pairs()
        .map(|(key, value)| (key.to_lowercase(), value.into_owned()))
        .collect::<HashMap<String, String>>();

    let username = if parsed_url.username().is_empty() {
        ["uid", "username", "user", "user id"]
            .iter()
            .find_map(|key| query_pairs.get(*key))
            .cloned()
            .unwrap_or_default()
    } else {
        parsed_url.username().to_string()
    };

    let password = parsed_url.password().map(str::to_string).or_else(|| {
        ["password", "pwd"]
            .iter()
            .find_map(|key| query_pairs.get(*key))
            .cloned()
    });

    let database = parsed_url
        .path_segments()
        .and_then(|segments| {
            segments
                .filter(|segment| !segment.trim().is_empty())
                .next()
                .map(str::to_string)
        })
        .or_else(|| query_pairs.get("database").cloned())
        .or_else(|| query_pairs.get("initial catalog").cloned())
        .or_else(|| query_pairs.get("databasename").cloned())
        .unwrap_or_else(|| "master".to_string());

    let mut config = Config::new();
    config.host(host);
    config.port(port);
    config.database(database);
    config.authentication(AuthMethod::sql_server(
        username,
        password.unwrap_or_default(),
    ));

    if let Some(encryption_level) = query_pairs
        .get("encrypt")
        .and_then(|value| parse_mssql_encryption(value))
    {
        config.encryption(encryption_level);
    }

    let trust_server_certificate = query_pairs
        .get("trustservercertificate")
        .or_else(|| query_pairs.get("trust_server_certificate"))
        .and_then(|value| parse_bool(value))
        .unwrap_or(true);

    if trust_server_certificate {
        config.trust_cert();
    }

    Ok(config)
}

async fn open_client(connection_string: &str) -> Result<MssqlClient, String> {
    let config = parse_mssql_config(connection_string)?;
    let tcp = TcpStream::connect(config.get_addr())
        .await
        .map_err(|error| error.to_string())?;
    tcp.set_nodelay(true).map_err(|error| error.to_string())?;

    Client::connect(config, tcp.compat_write())
        .await
        .map_err(|error| error.to_string())
}

fn column_data_to_json(value: &ColumnData<'static>) -> JsonValue {
    match value {
        ColumnData::U8(inner) => inner.map_or(JsonValue::Null, |value| json!(value)),
        ColumnData::I16(inner) => inner.map_or(JsonValue::Null, |value| json!(value)),
        ColumnData::I32(inner) => inner.map_or(JsonValue::Null, |value| json!(value)),
        ColumnData::I64(inner) => inner.map_or(JsonValue::Null, |value| json!(value)),
        ColumnData::F32(inner) => inner.map_or(JsonValue::Null, |value| json!(value)),
        ColumnData::F64(inner) => inner.map_or(JsonValue::Null, |value| json!(value)),
        ColumnData::Bit(inner) => inner.map_or(JsonValue::Null, |value| json!(value)),
        ColumnData::String(inner) => inner
            .as_ref()
            .map(|value| json!(value.as_ref()))
            .unwrap_or(JsonValue::Null),
        ColumnData::Guid(inner) => inner
            .as_ref()
            .map(|value| json!(value.to_string()))
            .unwrap_or(JsonValue::Null),
        ColumnData::Binary(inner) => inner
            .as_ref()
            .map(|bytes| match std::str::from_utf8(bytes.as_ref()) {
                Ok(text) => json!(text),
                Err(_) => json!(format!("<{} bytes>", bytes.len())),
            })
            .unwrap_or(JsonValue::Null),
        ColumnData::Numeric(inner) => inner
            .as_ref()
            .map(|value| json!(value.to_string()))
            .unwrap_or(JsonValue::Null),
        ColumnData::Xml(inner) => inner
            .as_ref()
            .map(|value| json!(value.to_string()))
            .unwrap_or(JsonValue::Null),
        ColumnData::DateTime(inner) => inner
            .as_ref()
            .map(|value| json!(format!("{:?}", value)))
            .unwrap_or(JsonValue::Null),
        ColumnData::SmallDateTime(inner) => inner
            .as_ref()
            .map(|value| json!(format!("{:?}", value)))
            .unwrap_or(JsonValue::Null),
        ColumnData::Time(inner) => inner
            .as_ref()
            .map(|value| json!(format!("{:?}", value)))
            .unwrap_or(JsonValue::Null),
        ColumnData::Date(inner) => inner
            .as_ref()
            .map(|value| json!(format!("{:?}", value)))
            .unwrap_or(JsonValue::Null),
        ColumnData::DateTime2(inner) => inner
            .as_ref()
            .map(|value| json!(format!("{:?}", value)))
            .unwrap_or(JsonValue::Null),
        ColumnData::DateTimeOffset(inner) => inner
            .as_ref()
            .map(|value| json!(format!("{:?}", value)))
            .unwrap_or(JsonValue::Null),
    }
}

pub(crate) fn get_case_insensitive<'a>(
    row: &'a Map<String, JsonValue>,
    key: &str,
) -> Option<&'a JsonValue> {
    row.get(key).or_else(|| {
        row.iter()
            .find(|(candidate, _)| candidate.eq_ignore_ascii_case(key))
            .map(|(_, value)| value)
    })
}

pub(crate) fn json_value_to_string(value: &JsonValue) -> Option<String> {
    match value {
        JsonValue::String(text) => Some(text.clone()),
        JsonValue::Number(number) => Some(number.to_string()),
        JsonValue::Bool(boolean) => Some(boolean.to_string()),
        JsonValue::Null => None,
        other => Some(other.to_string()),
    }
}

pub(crate) fn extract_string_column(
    rows: Vec<Map<String, JsonValue>>,
    column_name: &str,
) -> Vec<String> {
    rows.into_iter()
        .filter_map(|row| {
            get_case_insensitive(&row, column_name)
                .and_then(json_value_to_string)
                .filter(|value| !value.is_empty())
        })
        .collect()
}

pub(crate) async fn validate_connection(connection_string: &str) -> Result<(), String> {
    let client = open_client(connection_string).await?;
    client.close().await.map_err(|error| error.to_string())
}

pub(crate) async fn query_json_rows(
    connection_string: &str,
    sql: &str,
) -> Result<Vec<Map<String, JsonValue>>, String> {
    let mut client = open_client(connection_string).await?;

    let query_result = async {
        let rows = client
            .simple_query(sql)
            .await
            .map_err(|error| error.to_string())?
            .into_first_result()
            .await
            .map_err(|error| error.to_string())?;

        let mut parsed_rows = Vec::with_capacity(rows.len());
        for row in rows {
            let mut row_map = Map::new();
            for (column, value) in row.cells() {
                row_map.insert(column.name().to_string(), column_data_to_json(value));
            }
            parsed_rows.push(row_map);
        }

        Ok(parsed_rows)
    }
    .await;

    let _ = client.close().await;

    query_result
}
