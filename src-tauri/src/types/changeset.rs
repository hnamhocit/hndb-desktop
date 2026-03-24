use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct RecordUpdate {
    pub id: JsonValue,
    pub changes: HashMap<String, JsonValue>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecordChangeset {
    pub inserts: Vec<HashMap<String, JsonValue>>,
    pub updates: Vec<RecordUpdate>,
    pub deletes: Vec<JsonValue>,
}
