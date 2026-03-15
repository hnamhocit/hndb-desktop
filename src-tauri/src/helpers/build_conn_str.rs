use crate::types::{ConnectionConfig, ConnectionMode};

pub fn build_conn_str(config: &ConnectionConfig) -> Result<String, String> {
    match &config.mode {
        ConnectionMode::Url { connection_string } => {
            let expected_prefix = match config.driver.as_str() {
                "postgres" => "postgresql://",
                "mysql" => "mysql://",
                "mariadb" => "mysql://",
                "sqlite" => "sqlite://",
                "mssql" => "mssql://",
                _ => return Err(format!("Driver không hỗ trợ: {}", config.driver)),
            };

            if !connection_string.starts_with(expected_prefix) {
                return Err(format!(
                    "Connection string phải bắt đầu bằng '{}' cho driver '{}'",
                    expected_prefix, config.driver
                ));
            }

            Ok(connection_string.clone())
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
