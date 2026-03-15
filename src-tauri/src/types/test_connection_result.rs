use serde::{Deserialize, Serialize};

use crate::types::DbSetting;

#[derive(Debug, Serialize, Deserialize)]
pub struct TestConnectionResult {
    pub success: bool,
    pub error: Option<String>,
    pub server_version: String,
    pub advanced_settings: Vec<DbSetting>,
}
