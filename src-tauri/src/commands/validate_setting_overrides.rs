use crate::types::ConnectionConfig;
use std::collections::HashMap;

#[tauri::command]
pub async fn validate_setting_overrides(
    config: ConnectionConfig,
    overrides: HashMap<String, String>,
) -> Result<Vec<String>, String> {
    let mut warnings = Vec::new();

    for (key, value) in &overrides {
        match config.driver.as_str() {
            "sqlite" => {
                if key == "journal_mode" && value == "OFF" {
                    warnings.push("journal_mode=OFF có thể gây mất dữ liệu khi crash".to_string());
                }
                if key == "synchronous" && value == "OFF" {
                    warnings.push("synchronous=OFF tăng tốc nhưng rủi ro mất dữ liệu".to_string());
                }
            }
            "postgres" => {
                if key == "log_min_duration_statement" {
                    if let Ok(ms) = value.parse::<i64>() {
                        if ms == 0 {
                            warnings.push("log_min_duration_statement=0 log TẤT CẢ queries, có thể ảnh hưởng performance".to_string());
                        }
                    }
                }
            }
            _ => {}
        }
    }

    Ok(warnings)
}
