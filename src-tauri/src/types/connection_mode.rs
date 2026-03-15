use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ConnectionMode {
    Fields {
        host: String,
        port: u16,
        database: String,
        username: String,
        password: Option<String>,
    },
    Url {
        connection_string: String,
    },
}
