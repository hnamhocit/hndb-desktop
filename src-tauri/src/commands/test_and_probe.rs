use crate::helpers::build_conn_str;
use crate::types::{ConnectionConfig, TestConnectionResult};

use crate::db_client::DbClient;

#[tauri::command]
pub async fn test_and_probe(config: ConnectionConfig) -> TestConnectionResult {
    let conn_str = match build_conn_str(&config) {
        Ok(s) => s,
        Err(e) => {
            return TestConnectionResult {
                success: false,
                error: Some(e),
                server_version: String::new(),
                advanced_settings: vec![],
            }
        }
    };

    let client = match DbClient::connect(&config.driver, &conn_str).await {
        Ok(c) => c,
        Err(e) => {
            return TestConnectionResult {
                success: false,
                error: Some(e),
                server_version: String::new(),
                advanced_settings: vec![],
            }
        }
    };

    let version = client.fetch_server_version().await;
    let settings = client.fetch_advanced_settings().await;

    client.close().await;

    TestConnectionResult {
        success: true,
        error: None,
        server_version: version,
        advanced_settings: settings,
    }
}
