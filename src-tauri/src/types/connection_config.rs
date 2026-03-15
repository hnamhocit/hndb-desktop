use serde::{Deserialize, Serialize};

use crate::types::ConnectionMode;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConnectionConfig {
    pub driver: String,
    pub mode: ConnectionMode,
}
