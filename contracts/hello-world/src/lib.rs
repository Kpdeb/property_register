#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Vec,
};

// ─── Data Types ───────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Property {
    pub id: u64,
    pub owner: Address,
    pub title: String,
    pub location: String,
    pub area_sqft: u64,
    pub price_xlm: u64,
    pub is_for_sale: bool,
    pub registered_at: u64,
}

#[contracttype]
pub enum DataKey {
    Property(u64),       // property_id -> Property
    OwnerProps(Address), // owner       -> Vec<u64> (property ids)
    Counter,             // global property counter
    Admin,               // contract administrator
}

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct PropertyRegistry;

#[contractimpl]
impl PropertyRegistry {

    // ── Initialise ────────────────────────────────────────────────────────────

    /// Deploy the contract and set the administrator.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Counter, &0u64);
    }

    // ── Register ──────────────────────────────────────────────────────────────

    /// Register a new property on-chain.
    /// The caller becomes the owner and must sign the transaction.
    pub fn register_property(
        env: Env,
        owner: Address,
        title: String,
        location: String,
        area_sqft: u64,
        price_xlm: u64,
    ) -> u64 {
        owner.require_auth();

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::Counter)
            .unwrap_or(0) + 1;
        env.storage().instance().set(&DataKey::Counter, &id);

        let property = Property {
            id,
            owner: owner.clone(),
            title,
            location,
            area_sqft,
            price_xlm,
            is_for_sale: false,
            registered_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::Property(id), &property);

        let mut ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerProps(owner.clone()))
            .unwrap_or(Vec::new(&env));
        ids.push_back(id);
        env.storage()
            .persistent()
            .set(&DataKey::OwnerProps(owner.clone()), &ids);

        env.events().publish((symbol_short!("reg_prop"), owner), id);

        id
    }

    // ── Transfer ──────────────────────────────────────────────────────────────

    /// Transfer ownership of a property to a new owner.
    /// Only the current owner may call this.
    pub fn transfer_property(env: Env, property_id: u64, new_owner: Address) {
        let mut property: Property = Self::get_or_panic(&env, property_id);
        property.owner.require_auth();

        let old_owner = property.owner.clone();

        let mut old_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerProps(old_owner.clone()))
            .unwrap_or(Vec::new(&env));
        if let Some(pos) = old_ids.iter().position(|x| x == property_id) {
            old_ids.remove(pos as u32);
        }
        env.storage()
            .persistent()
            .set(&DataKey::OwnerProps(old_owner.clone()), &old_ids);

        let mut new_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerProps(new_owner.clone()))
            .unwrap_or(Vec::new(&env));
        new_ids.push_back(property_id);
        env.storage()
            .persistent()
            .set(&DataKey::OwnerProps(new_owner.clone()), &new_ids);

        property.owner = new_owner.clone();
        property.is_for_sale = false;
        env.storage()
            .persistent()
            .set(&DataKey::Property(property_id), &property);

        env.events().publish(
            (symbol_short!("transfer"), old_owner),
            (property_id, new_owner),
        );
    }

    // ── Listing ───────────────────────────────────────────────────────────────

    /// Mark a property as for sale and update the asking price.
    pub fn list_for_sale(env: Env, property_id: u64, price_xlm: u64) {
        let mut property: Property = Self::get_or_panic(&env, property_id);
        property.owner.require_auth();

        property.is_for_sale = true;
        property.price_xlm = price_xlm;
        env.storage()
            .persistent()
            .set(&DataKey::Property(property_id), &property);

        env.events().publish(
            (symbol_short!("listed"), property.owner.clone()),
            (property_id, price_xlm),
        );
    }

    /// Remove a property from the sale listing.
    pub fn delist(env: Env, property_id: u64) {
        let mut property: Property = Self::get_or_panic(&env, property_id);
        property.owner.require_auth();

        property.is_for_sale = false;
        env.storage()
            .persistent()
            .set(&DataKey::Property(property_id), &property);

        env.events().publish(
            (symbol_short!("delisted"), property.owner.clone()),
            property_id,
        );
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    pub fn get_property(env: Env, property_id: u64) -> Property {
        Self::get_or_panic(&env, property_id)
    }

    pub fn get_properties_by_owner(env: Env, owner: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::OwnerProps(owner))
            .unwrap_or(Vec::new(&env))
    }

    pub fn total_properties(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::Counter).unwrap_or(0)
    }

    pub fn verify_ownership(env: Env, property_id: u64, claimant: Address) -> bool {
        match env
            .storage()
            .persistent()
            .get::<DataKey, Property>(&DataKey::Property(property_id))
        {
            Some(p) => p.owner == claimant,
            None => false,
        }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    pub fn admin_update(
        env: Env,
        property_id: u64,
        title: String,
        location: String,
        area_sqft: u64,
    ) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        admin.require_auth();

        let mut property: Property = Self::get_or_panic(&env, property_id);
        property.title = title;
        property.location = location;
        property.area_sqft = area_sqft;
        env.storage()
            .persistent()
            .set(&DataKey::Property(property_id), &property);
    }

    fn get_or_panic(env: &Env, property_id: u64) -> Property {
        env.storage()
            .persistent()
            .get(&DataKey::Property(property_id))
            .expect("property not found")
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    fn setup() -> (Env, PropertyRegistryClient<'static>, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let cid = env.register_contract(None, PropertyRegistry);
        let client = PropertyRegistryClient::new(&env, &cid);
        let admin = Address::generate(&env);
        client.initialize(&admin);
        (env, client, admin)
    }

    #[test]
    fn test_register_and_query() {
        let (env, client, _) = setup();
        let owner = Address::generate(&env);
        let id = client.register_property(
            &owner,
            &String::from_str(&env, "Sunrise Villa"),
            &String::from_str(&env, "123 Main St, Bengaluru"),
            &2400,
            &50_000,
        );
        assert_eq!(id, 1);
        let prop = client.get_property(&id);
        assert_eq!(prop.title, String::from_str(&env, "Sunrise Villa"));
        assert_eq!(prop.owner, owner);
        assert!(!prop.is_for_sale);
    }

    #[test]
    fn test_list_and_transfer() {
        let (env, client, _) = setup();
        let alice = Address::generate(&env);
        let bob   = Address::generate(&env);
        let id = client.register_property(
            &alice,
            &String::from_str(&env, "Ocean View"),
            &String::from_str(&env, "456 Beach Rd"),
            &1800,
            &80_000,
        );
        client.list_for_sale(&id, &90_000);
        assert!(client.get_property(&id).is_for_sale);
        client.transfer_property(&id, &bob);
        assert!(client.verify_ownership(&id, &bob));
        assert!(!client.verify_ownership(&id, &alice));
        assert_eq!(client.get_properties_by_owner(&bob).len(), 1);
    }

    #[test]
    fn test_total_properties() {
        let (env, client, _) = setup();
        let owner = Address::generate(&env);
        for i in 1u64..=3 {
            client.register_property(
                &owner,
                &String::from_str(&env, "Prop"),
                &String::from_str(&env, "Loc"),
                &(i * 500),
                &(i * 10_000),
            );
        }
        assert_eq!(client.total_properties(), 3);
    }

    #[test]
    fn test_delist() {
        let (env, client, _) = setup();
        let owner = Address::generate(&env);
        let id = client.register_property(
            &owner,
            &String::from_str(&env, "Garden House"),
            &String::from_str(&env, "789 Hill Ave"),
            &3200, &120_000,
        );
        client.list_for_sale(&id, &130_000);
        assert!(client.get_property(&id).is_for_sale);
        client.delist(&id);
        assert!(!client.get_property(&id).is_for_sale);
    }
}