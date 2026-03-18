use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TablePreviewResult {
    pub rows: Vec<HashMap<String, Value>>,
    pub duration_ms: u128,
    pub is_limited: bool,
    pub affected_rows: Option<u64>,
    pub command: Option<String>,
    pub size_bytes: usize,
}
