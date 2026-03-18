use crate::db_client::DbClient;
use std::collections::{HashMap, HashSet};
use tokio::sync::Mutex;

pub struct AppState {
    // Dùng tokio::sync::Mutex để khóa kho lại khi có nhiều tác vụ truy cập cùng lúc (Thread-safe)
    pub active_connections: Mutex<HashMap<String, DbClient>>,
    pub manually_disconnected_connections: Mutex<HashSet<String>>,
}
