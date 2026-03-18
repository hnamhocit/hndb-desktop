use std::sync::OnceLock;

use keyring::{Entry, Error};
use rand::distr::{Alphanumeric, SampleString};

const KEYRING_SERVICE: &str = "space.hndb.app";
const KEYRING_ACCOUNT: &str = "connections_vault";
const LEGACY_KEYRING_SERVICE: &str = "space.hndb.vault";
const LEGACY_KEYRING_ACCOUNT: &str = "master_key";

static VAULT_PASSWORD: OnceLock<String> = OnceLock::new();

fn cache_password(password: String) -> String {
    let _ = VAULT_PASSWORD.set(password.clone());
    password
}

fn read_password(entry: &Entry) -> Result<Option<String>, String> {
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(Error::NoEntry) => Ok(None),
        Err(error) => Err(format!("Read keyring error: {}", error)),
    }
}

pub fn get_or_init_vault_password() -> Result<String, String> {
    if let Some(password) = VAULT_PASSWORD.get() {
        return Ok(password.clone());
    }

    let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
        .map_err(|e| format!("Keyring error: {}", e))?;

    if let Some(password) = read_password(&entry)? {
        return Ok(cache_password(password));
    }

    let legacy_entry = Entry::new(LEGACY_KEYRING_SERVICE, LEGACY_KEYRING_ACCOUNT)
        .map_err(|e| format!("Legacy keyring error: {}", e))?;

    if let Some(password) = read_password(&legacy_entry)? {
        entry
            .set_password(&password)
            .map_err(|e| format!("Save migrated password error: {}", e))?;

        return Ok(cache_password(password));
    }

    let new_password = Alphanumeric.sample_string(&mut rand::rng(), 32);

    entry
        .set_password(&new_password)
        .map_err(|e| format!("Save error: {}", e))?;

    let stored_password = entry
        .get_password()
        .map_err(|e| format!("Saved password but failed to verify keyring entry: {}", e))?;

    Ok(cache_password(stored_password))
}
