use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbSetting {
    pub name: String,
    pub value: String,
    pub category: Option<String>,
    pub description: Option<String>,
    pub setting_type: String,
    pub enum_values: Option<Vec<String>>,
    pub min_val: Option<String>,
    pub max_val: Option<String>,
    pub is_editable: bool,
}
