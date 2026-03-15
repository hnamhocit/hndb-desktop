use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::types::ConnectionConfig;

#[derive(Debug, Serialize, Deserialize)]
pub struct SavedConnection {
    pub id: String,
    pub name: String,
    pub config: ConnectionConfig,
    pub setting_overrides: HashMap<String, String>,
    pub created_at: String,
}
