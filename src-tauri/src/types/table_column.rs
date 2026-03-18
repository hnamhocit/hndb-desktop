use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TableColumn {
    pub column_name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub column_default: Option<String>,
    pub is_primary: bool,
    pub is_foreign_key: bool,
    pub is_unique: bool,
    pub is_indexed: bool,
    pub foreign_key_target: Option<String>,
}
