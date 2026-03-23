use crate::types::{ConnectionConfig, ConnectionMode};

pub fn build_conn_str(config: &ConnectionConfig) -> Result<String, String> {
    match &config.mode {
        ConnectionMode::Url { connection_string } => {
            let normalized_connection_string = match config.driver.as_str() {
                "postgres" if connection_string.starts_with("postgres://") => {
                    connection_string.replacen("postgres://", "postgresql://", 1)
                }
                "mariadb" if connection_string.starts_with("mariadb://") => {
                    connection_string.replacen("mariadb://", "mysql://", 1)
                }
                "mssql" if connection_string.starts_with("sqlserver://") => {
                    connection_string.replacen("sqlserver://", "mssql://", 1)
                }
                _ => connection_string.clone(),
            };

            let has_valid_prefix = match config.driver.as_str() {
                "postgres" => {
                    normalized_connection_string.starts_with("postgresql://")
                        || normalized_connection_string.starts_with("postgres://")
                }
                "mysql" => normalized_connection_string.starts_with("mysql://"),
                "mariadb" => {
                    normalized_connection_string.starts_with("mysql://")
                        || normalized_connection_string.starts_with("mariadb://")
                }
                "sqlite" => normalized_connection_string.starts_with("sqlite://"),
                "mssql" => {
                    normalized_connection_string.starts_with("mssql://")
                        || normalized_connection_string.starts_with("sqlserver://")
                }
                _ => return Err(format!("Driver không hỗ trợ: {}", config.driver)),
            };

            if !has_valid_prefix {
                let expected_prefix = match config.driver.as_str() {
                    "postgres" => "postgresql://",
                    "mysql" => "mysql://",
                    "mariadb" => "mysql:// hoặc mariadb://",
                    "sqlite" => "sqlite://",
                    "mssql" => "mssql:// hoặc sqlserver://",
                    _ => "unknown://",
                };
                return Err(format!(
                    "Connection string phải bắt đầu bằng '{}' cho driver '{}'",
                    expected_prefix, config.driver
                ));
            }

            Ok(normalized_connection_string)
        }
        ConnectionMode::Fields {
            host,
            port,
            database,
            username,
            password,
        } => {
            let pass = password.as_deref().unwrap_or("");
            match config.driver.as_str() {
                "postgres" => Ok(format!(
                    "postgresql://{}:{}@{}:{}/{}",
                    username, pass, host, port, database
                )),
                "mysql" | "mariadb" => Ok(format!(
                    "mysql://{}:{}@{}:{}/{}",
                    username, pass, host, port, database
                )),
                "sqlite" => Ok(format!("sqlite://{}", database)),
                "mssql" => Ok(format!(
                    "mssql://{}:{}@{}:{}/{}",
                    username, pass, host, port, database
                )),
                _ => Err(format!("Driver không hỗ trợ: {}", config.driver)),
            }
        }
    }
}
