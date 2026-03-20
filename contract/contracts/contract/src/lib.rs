#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Vec};

#[contracttype]
#[derive(Clone)]
pub struct Property {
    pub id: String,
    pub location: String,
    pub description: String,
    pub owner: Address,
    pub registered_at: u64,
}

#[contracttype]
pub enum DataKey {
    Properties,      // Map<String, Property>
    OwnerProperties, // Map<Address, Vec<String>>
    AllPropertyIds,  // Vec<String>
    TotalCount,      // u32
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    // ── Permissionless: anyone can register any property ─────────────────

    pub fn register_property(
        env: Env,
        owner: Address,
        id: String,
        location: String,
        description: String,
    ) {
        let mut properties: Map<String, Property> = env
            .storage()
            .instance()
            .get(&DataKey::Properties)
            .unwrap_or_else(|| Map::new(&env));

        if properties.contains_key(id.clone()) {
            panic!("property already registered");
        }

        let property = Property {
            id: id.clone(),
            location,
            description,
            owner: owner.clone(),
            registered_at: env.ledger().timestamp(),
        };

        properties.set(id.clone(), property);

        // Track per-owner list
        let mut owner_props: Map<Address, Vec<String>> = env
            .storage()
            .instance()
            .get(&DataKey::OwnerProperties)
            .unwrap_or_else(|| Map::new(&env));
        let mut props_list = owner_props
            .get(owner.clone())
            .unwrap_or_else(|| Vec::new(&env));
        props_list.push_back(id.clone());
        owner_props.set(owner, props_list);

        // Track globally for public registry listing
        let mut all_ids: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::AllPropertyIds)
            .unwrap_or_else(|| Vec::new(&env));
        all_ids.push_back(id.clone());

        let total: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TotalCount)
            .unwrap_or(0);

        env.storage()
            .instance()
            .set(&DataKey::Properties, &properties);
        env.storage()
            .instance()
            .set(&DataKey::OwnerProperties, &owner_props);
        env.storage()
            .instance()
            .set(&DataKey::AllPropertyIds, &all_ids);
        env.storage()
            .instance()
            .set(&DataKey::TotalCount, &(total + 1));
    }

    // ── Permissionless: anyone can read any property ──────────────────────

    pub fn get_property(env: Env, id: String) -> Property {
        let properties: Map<String, Property> = env
            .storage()
            .instance()
            .get(&DataKey::Properties)
            .unwrap_or_else(|| Map::new(&env));
        properties.get(id).expect("property not found")
    }

    pub fn property_exists(env: Env, id: String) -> bool {
        let properties: Map<String, Property> = env
            .storage()
            .instance()
            .get(&DataKey::Properties)
            .unwrap_or_else(|| Map::new(&env));
        properties.contains_key(id)
    }

    // ── Permissionless: anyone can browse ALL properties (public registry) ─

    pub fn list_all_properties(env: Env) -> Vec<Property> {
        let all_ids: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::AllPropertyIds)
            .unwrap_or_else(|| Vec::new(&env));
        let properties: Map<String, Property> = env
            .storage()
            .instance()
            .get(&DataKey::Properties)
            .unwrap_or_else(|| Map::new(&env));
        let mut result = Vec::new(&env);
        for i in 0..all_ids.len() {
            if let Some(id) = all_ids.get(i) {
                if let Some(prop) = properties.get(id) {
                    result.push_back(prop);
                }
            }
        }
        result
    }

    // ── Permissionless: anyone can view properties by owner ────────────────

    pub fn get_properties_by_owner(env: Env, owner: Address) -> Vec<Property> {
        let owner_props: Map<Address, Vec<String>> = env
            .storage()
            .instance()
            .get(&DataKey::OwnerProperties)
            .unwrap_or_else(|| Map::new(&env));
        let properties: Map<String, Property> = env
            .storage()
            .instance()
            .get(&DataKey::Properties)
            .unwrap_or_else(|| Map::new(&env));
        let prop_ids = owner_props.get(owner).unwrap_or_else(|| Vec::new(&env));
        let mut result = Vec::new(&env);
        for i in 0..prop_ids.len() {
            if let Some(id) = prop_ids.get(i) {
                if let Some(prop) = properties.get(id) {
                    result.push_back(prop);
                }
            }
        }
        result
    }

    // ── Owner-only: only the property owner can transfer ─────────────────

    pub fn transfer_property(env: Env, from: Address, id: String, to: Address) {
        from.require_auth();

        let mut properties: Map<String, Property> = env
            .storage()
            .instance()
            .get(&DataKey::Properties)
            .unwrap_or_else(|| Map::new(&env));

        let mut property = match properties.get(id.clone()) {
            Some(p) => p,
            None => panic!("property not found"),
        };
        assert_eq!(property.owner, from, "not the owner");

        let mut owner_props: Map<Address, Vec<String>> = env
            .storage()
            .instance()
            .get(&DataKey::OwnerProperties)
            .unwrap_or_else(|| Map::new(&env));

        // Remove from sender's list
        let from_list: Vec<String> = owner_props
            .get(from.clone())
            .unwrap_or_else(|| Vec::new(&env));
        let mut new_from_list = Vec::new(&env);
        for i in 0..from_list.len() {
            if let Some(pid) = from_list.get(i) {
                if pid != id {
                    new_from_list.push_back(pid);
                }
            }
        }
        owner_props.set(from.clone(), new_from_list);

        // Add to receiver's list
        let mut to_list = owner_props
            .get(to.clone())
            .unwrap_or_else(|| Vec::new(&env));
        to_list.push_back(id.clone());
        owner_props.set(to.clone(), to_list);

        // Update owner in property
        property.owner = to;
        properties.set(id.clone(), property);

        env.storage()
            .instance()
            .set(&DataKey::Properties, &properties);
        env.storage()
            .instance()
            .set(&DataKey::OwnerProperties, &owner_props);
    }

    pub fn get_total_properties(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::TotalCount)
            .unwrap_or(0)
    }
}

mod test;
