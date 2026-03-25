use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::types::ConnectionConfig;

fn default_true() -> bool {
    true
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SavedConnection {
    pub id: String,
    pub name: String,
    pub config: ConnectionConfig,
    pub setting_overrides: HashMap<String, String>,
    #[serde(default = "default_true")]
    pub save_password: bool,
    #[serde(default = "default_true")]
    pub show_all_databases: bool,
    pub created_at: String,
}
