#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Env, String};

#[test]
fn test_register_property() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let prop_id = String::from_str(&env, "PROP-001");
    let location = String::from_str(&env, "123 Main St, City");
    let description = String::from_str(&env, "2 bedroom apartment");

    client.register_property(&owner, &prop_id, &location, &description);

    let prop = client.get_property(&prop_id);
    assert_eq!(prop.owner, owner);
    assert_eq!(prop.location, location);
    assert_eq!(prop.description, description);
}

#[test]
fn test_transfer_property() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner1 = Address::generate(&env);
    let owner2 = Address::generate(&env);
    let prop_id = String::from_str(&env, "PROP-002");
    let location = String::from_str(&env, "456 Oak Ave");
    let description = String::from_str(&env, "3 bedroom house");

    client.register_property(&owner1, &prop_id, &location, &description);
    assert_eq!(client.get_property(&prop_id).owner, owner1);

    client.transfer_property(&owner1, &prop_id, &owner2);
    assert_eq!(client.get_property(&prop_id).owner, owner2);
}

#[test]
fn test_get_properties_by_owner() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);

    client.register_property(
        &owner,
        &String::from_str(&env, "PROP-A"),
        &String::from_str(&env, "Location A"),
        &String::from_str(&env, "Desc A"),
    );
    client.register_property(
        &owner,
        &String::from_str(&env, "PROP-B"),
        &String::from_str(&env, "Location B"),
        &String::from_str(&env, "Desc B"),
    );
    client.register_property(
        &owner,
        &String::from_str(&env, "PROP-C"),
        &String::from_str(&env, "Location C"),
        &String::from_str(&env, "Desc C"),
    );

    let properties = client.get_properties_by_owner(&owner);
    assert_eq!(properties.len(), 3);
}

#[test]
fn test_register_by_anyone() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    // Multiple different users can register properties without any permission
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);

    client.register_property(
        &user1,
        &String::from_str(&env, "PROP-1"),
        &String::from_str(&env, "Street 1"),
        &String::from_str(&env, "Home 1"),
    );
    client.register_property(
        &user2,
        &String::from_str(&env, "PROP-2"),
        &String::from_str(&env, "Street 2"),
        &String::from_str(&env, "Home 2"),
    );
    client.register_property(
        &user3,
        &String::from_str(&env, "PROP-3"),
        &String::from_str(&env, "Street 3"),
        &String::from_str(&env, "Home 3"),
    );

    assert_eq!(
        client.get_property(&String::from_str(&env, "PROP-1")).owner,
        user1
    );
    assert_eq!(
        client.get_property(&String::from_str(&env, "PROP-2")).owner,
        user2
    );
    assert_eq!(
        client.get_property(&String::from_str(&env, "PROP-3")).owner,
        user3
    );
}

#[test]
fn test_get_total_properties() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);

    client.register_property(
        &owner,
        &String::from_str(&env, "P1"),
        &String::from_str(&env, "L1"),
        &String::from_str(&env, "D1"),
    );
    client.register_property(
        &owner,
        &String::from_str(&env, "P2"),
        &String::from_str(&env, "L2"),
        &String::from_str(&env, "D2"),
    );

    assert_eq!(client.get_total_properties(), 2);
}

#[test]
fn test_list_all_properties_permissionless() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    // Anyone can register properties
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let charlie = Address::generate(&env);

    client.register_property(
        &alice,
        &String::from_str(&env, "PROP-001"),
        &String::from_str(&env, "123 Main St"),
        &String::from_str(&env, "Apartment 1B"),
    );
    client.register_property(
        &bob,
        &String::from_str(&env, "PROP-002"),
        &String::from_str(&env, "456 Oak Ave"),
        &String::from_str(&env, "3BR House"),
    );
    client.register_property(
        &charlie,
        &String::from_str(&env, "PROP-003"),
        &String::from_str(&env, "789 Pine Rd"),
        &String::from_str(&env, "Studio Loft"),
    );

    // Anyone can list ALL properties in the registry (public browsing)
    let _rando = Address::generate(&env);
    let all_props = client.list_all_properties();

    assert_eq!(all_props.len(), 3);
    // Verify we can see properties from all owners by checking each one
    let mut found = 0u32;
    for i in 0..all_props.len() {
        let p = all_props.get(i).unwrap();
        if p.id == String::from_str(&env, "PROP-001")
            || p.id == String::from_str(&env, "PROP-002")
            || p.id == String::from_str(&env, "PROP-003")
        {
            found += 1;
        }
    }
    assert_eq!(found, 3);
}

#[test]
fn test_property_exists() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let prop_id = String::from_str(&env, "PROP-001");

    client.register_property(
        &owner,
        &prop_id,
        &String::from_str(&env, "123 Main St"),
        &String::from_str(&env, "desc"),
    );

    assert!(client.property_exists(&prop_id));
    assert!(!client.property_exists(&String::from_str(&env, "NONEXISTENT")));
}
