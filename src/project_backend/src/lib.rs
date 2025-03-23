use candid::CandidType;
use ic_cdk_macros::{init, query, update, post_upgrade, pre_upgrade};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{BoundedStorable, DefaultMemoryImpl, StableBTreeMap, Storable};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::borrow::Cow;
use std::cmp::Ordering;
use std::collections::HashMap;

const MAX_VALUE_SIZE: u32 = 100;

type MemoryType = VirtualMemory<DefaultMemoryImpl>;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct User {
    pub email: String,
    pub password: String,
    pub name: String,
    pub user_type: String,
    pub phone: String,
    pub address: String,
    pub is_admin: bool,
}

impl Storable for User {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for User {
    const MAX_SIZE: u32 = 512;
    const IS_FIXED_SIZE: bool = false;
}

#[derive(Default, Clone, Eq, PartialEq, Ord, PartialOrd)]
struct StableString(String);

impl Storable for StableString {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(self.0.as_bytes().to_vec())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        StableString(String::from_utf8(bytes.to_vec()).unwrap())
    }
}

impl BoundedStorable for StableString {
    const MAX_SIZE: u32 = 512;
    const IS_FIXED_SIZE: bool = false;
}

impl From<String> for StableString {
    fn from(s: String) -> Self {
        StableString(s)
    }
}

impl AsRef<str> for StableString {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

// Memory IDs for different data types
const USERS_MEM_ID: MemoryId = MemoryId::new(0);
const HELP_REQUESTS_MEM_ID: MemoryId = MemoryId::new(1);
const SUPPLY_BUNDLES_MEM_ID: MemoryId = MemoryId::new(2);
const DONATIONS_MEM_ID: MemoryId = MemoryId::new(3);
const VOLUNTEER_LOCATIONS_MEM_ID: MemoryId = MemoryId::new(4);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    static USERS: RefCell<StableBTreeMap<StableString, User, MemoryType>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static HELP_REQUESTS: RefCell<StableBTreeMap<StableString, HelpRequest, MemoryType>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );

    static SUPPLY_BUNDLES: RefCell<StableBTreeMap<StableString, SupplyBundle, MemoryType>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );

    static DONATIONS: RefCell<StableBTreeMap<StableString, Donation, MemoryType>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
        )
    );

    static VOLUNTEER_LOCATIONS: RefCell<StableBTreeMap<StableString, VolunteerLocation, MemoryType>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4)))
        )
    );
}

#[init]
fn init() {
    // Initialize memory manager and pre-allocate ALL memory regions
    MEMORY_MANAGER.with(|m| {
        let mut memory_manager = m.borrow_mut();
        // Pre-allocate memory regions with specific sizes
        memory_manager.get(MemoryId::new(0)); // Users - 1MB
        memory_manager.get(MemoryId::new(1)); // Help Requests - 1MB
        memory_manager.get(MemoryId::new(2)); // Supply Bundles - 1MB
        memory_manager.get(MemoryId::new(3)); // Donations - 1MB
        memory_manager.get(MemoryId::new(4)); // Volunteer Locations - 1MB
    });

    // Initialize all stable maps
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        if users.is_empty() {
            // Only add default users if the map is empty
            let admin_user = User {
                email: "admin@disasterrelief.com".to_string(),
                password: "admin123".to_string(),
                name: "Admin".to_string(),
                user_type: "admin".to_string(),
                phone: "1234567890".to_string(),
                address: "Admin Office".to_string(),
                is_admin: true,
            };

            let org_user = User {
                email: "organization@disasterrelief.com".to_string(),
                password: "1234".to_string(),
                name: "Organization".to_string(),
                user_type: "organization".to_string(),
                phone: "0987654321".to_string(),
                address: "Organization HQ".to_string(),
                is_admin: false,
            };

            let donor_user = User {
                email: "donor@disasterrelief.com".to_string(),
                password: "donor123".to_string(),
                name: "Default Donor".to_string(),
                user_type: "donor".to_string(),
                phone: "5555555555".to_string(),
                address: "123 Donor Street".to_string(),
                is_admin: false,
            };

            users.insert(StableString::from(admin_user.email.clone()), admin_user);
            users.insert(StableString::from(org_user.email.clone()), org_user);
            users.insert(StableString::from(donor_user.email.clone()), donor_user);
        }
    });

    // Initialize other maps only if they haven't been initialized
    HELP_REQUESTS.with(|requests| {
        let _ = requests.borrow_mut();
    });

    SUPPLY_BUNDLES.with(|bundles| {
        let _ = bundles.borrow_mut();
    });

    DONATIONS.with(|donations| {
        let _ = donations.borrow_mut();
    });

    VOLUNTEER_LOCATIONS.with(|locations| {
        let _ = locations.borrow_mut();
    });
}

#[update]
fn register_user(user: User) -> bool {
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        
        // Check if user already exists
        if users.get(&StableString::from(user.email.clone())).is_some() {
            ic_cdk::println!("User already exists");
            return false;
        }

        // Insert new user
        match users.insert(StableString::from(user.email.clone()), user) {
            Some(_) => {
                ic_cdk::println!("Failed to register user");
                false
            }
            None => {
                ic_cdk::println!("Successfully registered user");
                true
            }
        }
    })
}

#[ic_cdk_macros::query]
fn get_user(email: String) -> Option<User> {
    ic_cdk::println!("Attempting to get user with email: {}", email);
    USERS.with(|users| {
        let users = users.borrow();
        let email_key = StableString::from(email);
        let result = users.get(&email_key).map(|u| {
            ic_cdk::println!("Found user: {:?}", u);
            u.clone()
        });
        if result.is_none() {
            ic_cdk::println!("No user found with this email");
        }
        result
    })
}

#[ic_cdk_macros::query]
fn get_all_users() -> Vec<User> {
    USERS.with(|users| {
        let users = users.borrow();
        users.iter().map(|(_, user)| user.clone()).collect()
    })
}

#[ic_cdk_macros::update]
fn update_user(email: String, user: User) -> bool {
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        let email_key = StableString::from(email);
        if !users.contains_key(&email_key) {
            return false;
        }
        users.insert(email_key, user);
        true
    })
}

#[ic_cdk_macros::update]
fn delete_user(email: String) -> bool {
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        let email_key = StableString::from(email);
        if !users.contains_key(&email_key) {
            return false;
        }
        users.remove(&email_key);
        true
    })
}

#[ic_cdk_macros::query]
fn is_admin(email: String) -> bool {
    ic_cdk::println!("Checking admin status for email: {}", email);
    USERS.with(|users| {
        let users = users.borrow();
        let email_key = StableString::from(email);
        let result = users.get(&email_key).map(|user| {
            ic_cdk::println!("Found user: {:?}, is_admin: {}", user.email, user.is_admin);
            user.is_admin
        }).unwrap_or_else(|| {
            ic_cdk::println!("User not found");
            false
        });
        ic_cdk::println!("Returning admin status: {}", result);
        result
    })
}

#[ic_cdk_macros::query]
fn verify_password(email: String, password: String) -> bool {
    ic_cdk::println!("Verifying password for email: {}", email);
    USERS.with(|users| {
        let users = users.borrow();
        let email_key = StableString::from(email);
        match users.get(&email_key) {
            Some(user) => {
                let result = user.password == password;
                ic_cdk::println!("Password verification result: {}", result);
                result
            }
            None => {
                ic_cdk::println!("User not found");
                false
            }
        }
    })
}

#[ic_cdk_macros::query]
fn get_all_volunteers() -> Vec<User> {
    ic_cdk::println!("Getting all volunteers");
    let volunteers = USERS.with(|users| {
        users.borrow()
            .iter()
            .filter(|(_, user)| user.user_type == "volunteer")
            .map(|(_, user)| user.clone())
            .collect::<Vec<User>>()
    });
    ic_cdk::println!("Found {} volunteers", volunteers.len());
    volunteers
}

#[ic_cdk_macros::update]
pub fn create_supply_bundle(bundle: SupplyBundle) -> bool {
    ic_cdk::println!("Creating supply bundle: {:?}", bundle);
    SUPPLY_BUNDLES.with(|bundles| {
        let mut bundles = bundles.borrow_mut();
        let bundle_key = StableString::from(bundle.id.clone());
        bundles.insert(bundle_key, bundle.clone());
        ic_cdk::println!("Successfully created supply bundle");
        true
    })
}

#[ic_cdk_macros::query]
pub fn get_organization_supply_bundles() -> Vec<SupplyBundle> {
    ic_cdk::println!("Getting all supply bundles");
    let bundles = SUPPLY_BUNDLES.with(|bundles| {
        bundles.borrow().iter().map(|(_, bundle)| bundle.clone()).collect::<Vec<SupplyBundle>>()
    });
    ic_cdk::println!("Found {} supply bundles", bundles.len());
    bundles
}

#[ic_cdk_macros::update]
pub fn distribute_supply_bundle(bundle_id: String, volunteer_id: String) -> bool {
    ic_cdk::println!("Attempting to distribute bundle {} to volunteer {}", bundle_id, volunteer_id);
    SUPPLY_BUNDLES.with(|bundles| {
        let mut bundles = bundles.borrow_mut();
        let bundle_id_clone = bundle_id.clone();
        let bundle_key = StableString::from(bundle_id);
        
        if let Some(bundle) = bundles.get(&bundle_key) {
            ic_cdk::println!("Found bundle: {:?}", bundle);
            let mut updated_bundle = bundle.clone();
            updated_bundle.status = "distributed".to_string();
            updated_bundle.assigned_to = Some(volunteer_id);
            bundles.insert(bundle_key, updated_bundle.clone());
            ic_cdk::println!("Successfully distributed bundle");
            true
        } else {
            ic_cdk::println!("Bundle not found with ID: {}", bundle_id_clone);
            false
        }
    })
}

#[ic_cdk_macros::query]
pub fn get_organization_donations() -> Vec<Donation> {
    ic_cdk::println!("Getting all donations");
    let donations = DONATIONS.with(|donations| {
        let donations = donations.borrow();
        ic_cdk::println!("Found {} donations in storage", donations.len());
        let result = donations.iter().map(|(_, donation)| {
            ic_cdk::println!("Donation details: {:?}", donation);
            donation.clone()
        }).collect::<Vec<Donation>>();
        ic_cdk::println!("Returning {} donations", result.len());
        result
    });
    donations
}

#[ic_cdk_macros::update]
pub fn assign_volunteer_to_request(request_id: String, volunteer_id: String) -> bool {
    ic_cdk::println!("Attempting to assign volunteer {} to request {}", volunteer_id, request_id);
    HELP_REQUESTS.with(|requests| {
        let mut requests = requests.borrow_mut();
        let request_id_clone = request_id.clone();
        let request_key = StableString::from(request_id);
        
        if let Some(request) = requests.get(&request_key) {
            ic_cdk::println!("Found request: {:?}", request);
            let mut updated_request = request.clone();
            updated_request.assigned_volunteer = Some(volunteer_id.clone());
            updated_request.status = "assigned".to_string();
            requests.insert(request_key, updated_request.clone());
            ic_cdk::println!("Successfully assigned volunteer to request");
            true
        } else {
            ic_cdk::println!("Request not found with ID: {}", request_id_clone);
            false
        }
    })
}

#[pre_upgrade]
fn pre_upgrade() {
    ic_cdk::println!("Starting pre_upgrade");
    // The stable storage will be automatically preserved
    // Make sure all memory regions are properly synced
    MEMORY_MANAGER.with(|m| {
        let _ = m.borrow_mut();
    });
}

#[post_upgrade]
fn post_upgrade() {
    ic_cdk::println!("Starting post_upgrade");
    // Re-initialize everything but preserve existing data
    MEMORY_MANAGER.with(|m| {
        let mut memory_manager = m.borrow_mut();
        // Re-allocate all memory regions
        for i in 0..5 {
            memory_manager.get(MemoryId::new(i));
        }
    });

    // Re-initialize maps but don't clear existing data
    USERS.with(|users| {
        let _ = users.borrow_mut();
    });

    HELP_REQUESTS.with(|requests| {
        let _ = requests.borrow_mut();
    });

    SUPPLY_BUNDLES.with(|bundles| {
        let _ = bundles.borrow_mut();
    });

    DONATIONS.with(|donations| {
        let _ = donations.borrow_mut();
    });

    VOLUNTEER_LOCATIONS.with(|locations| {
        let _ = locations.borrow_mut();
    });
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct HelpRequest {
    pub victim_id: String,
    pub request_type: String,
    pub description: String,
    pub urgency: String,
    pub location: String,
    pub status: String,
    pub timestamp: String,
    pub latitude: String,
    pub longitude: String,
    pub verification_note: Option<String>,
    pub verified_by: Option<String>,
    pub organization_id: Option<String>,
    pub assigned_volunteer: Option<String>
}

impl Storable for HelpRequest {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for HelpRequest {
    const MAX_SIZE: u32 = 1024;
    const IS_FIXED_SIZE: bool = false;
}

#[ic_cdk_macros::update]
fn create_help_request(request: HelpRequest) -> bool {
    ic_cdk::println!("Creating help request: {:?}", request);
    HELP_REQUESTS.with(|requests| {
        let mut requests = requests.borrow_mut();
        let request_id = format!("{}_{}", request.victim_id, request.timestamp);
        let request_key = StableString::from(request_id.clone());
        
        // Set organization_id to the default organization if not set
        let mut request_with_org = request.clone();
        if request_with_org.organization_id.is_none() {
            request_with_org.organization_id = Some("organization@disasterrelief.com".to_string());
        }
        
        requests.insert(request_key, request_with_org.clone());
        ic_cdk::println!("Help request created successfully with ID: {}", request_id);
        true
    })
}

#[ic_cdk_macros::query]
fn get_user_requests(victim_id: String) -> Vec<HelpRequest> {
    HELP_REQUESTS.with(|requests| {
        let requests = requests.borrow();
        requests
            .iter()
            .filter(|(_, request)| request.victim_id == victim_id)
            .map(|(_, request)| request.clone())
            .collect()
    })
}

#[ic_cdk_macros::query]
pub fn get_all_requests() -> Vec<HelpRequest> {
    ic_cdk::println!("Getting all help requests");
    HELP_REQUESTS.with(|requests| {
        let requests = requests.borrow();
        let all_requests: Vec<HelpRequest> = requests.iter().map(|(_, request)| request.clone()).collect();
        ic_cdk::println!("Found {} help requests", all_requests.len());
        all_requests
    })
}

#[ic_cdk_macros::update]
fn update_request_status(victim_id: String, timestamp: String, new_status: String) -> bool {
    HELP_REQUESTS.with(|requests| {
        let mut requests = requests.borrow_mut();
        let request_id = StableString::from(format!("{}_{}", victim_id, timestamp));
        
        if let Some(request) = requests.get(&request_id) {
            let mut updated_request = request.clone();
            updated_request.status = new_status;
            requests.insert(request_id, updated_request);
            true
        } else {
            false
        }
    })
}

#[ic_cdk_macros::update]
fn cancel_help_request(victim_id: String, timestamp: String) -> bool {
    ic_cdk::println!("Attempting to cancel request for victim: {} with timestamp: {}", victim_id, timestamp);
    HELP_REQUESTS.with(|requests| {
        let mut requests = requests.borrow_mut();
        let request_id = StableString::from(format!("{}_{}", victim_id, timestamp));
        
        if let Some(request) = requests.get(&request_id) {
            if request.status.to_lowercase() == "pending" {
                let mut updated_request = request.clone();
                updated_request.status = "cancelled".to_string();
                requests.insert(request_id, updated_request);
                ic_cdk::println!("Request cancelled successfully");
                true
            } else {
                ic_cdk::println!("Request cannot be cancelled: not in pending status");
                false
            }
        } else {
            ic_cdk::println!("Request not found");
            false
        }
    })
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct VolunteerLocation {
    pub email: String,
    pub latitude: String,
    pub longitude: String,
    pub address: String,
    pub last_updated: String,
}

impl Storable for VolunteerLocation {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for VolunteerLocation {
    const MAX_SIZE: u32 = 512;
    const IS_FIXED_SIZE: bool = false;
}

#[ic_cdk_macros::update]
fn update_volunteer_location(email: String, latitude: String, longitude: String, address: String) -> bool {
    VOLUNTEER_LOCATIONS.with(|locations| {
        let mut locations = locations.borrow_mut();
        let location = VolunteerLocation {
            email: email.clone(),
            latitude,
            longitude,
            address,
            last_updated: ic_cdk::api::time().to_string(),
        };
        locations.insert(StableString::from(email), location);
        true
    })
}

#[ic_cdk_macros::query]
fn get_nearby_requests(latitude: String, longitude: String) -> Vec<HelpRequest> {
    // Convert input coordinates to f64
    let vol_lat: f64 = latitude.parse().unwrap_or(0.0);
    let vol_lon: f64 = longitude.parse().unwrap_or(0.0);
    
    HELP_REQUESTS.with(|requests| {
        let requests = requests.borrow();
        let mut nearby_requests: Vec<HelpRequest> = requests
            .iter()
            .filter(|(_, request)| {
                // Only include pending requests
                request.status.to_lowercase() == "pending"
            })
            .map(|(_, request)| request.clone())
            .collect();

        // Sort by distance
        nearby_requests.sort_by(|a, b| {
            let a_lat: f64 = a.latitude.parse().unwrap_or(0.0);
            let a_lon: f64 = a.longitude.parse().unwrap_or(0.0);
            let b_lat: f64 = b.latitude.parse().unwrap_or(0.0);
            let b_lon: f64 = b.longitude.parse().unwrap_or(0.0);

            let dist_a = calculate_distance(vol_lat, vol_lon, a_lat, a_lon);
            let dist_b = calculate_distance(vol_lat, vol_lon, b_lat, b_lon);

            dist_a.partial_cmp(&dist_b).unwrap_or(std::cmp::Ordering::Equal)
        });

        nearby_requests
    })
}

fn calculate_distance(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let r = 6371.0; // Earth's radius in kilometers
    let dlat = (lat2 - lat1).to_radians();
    let dlon = (lon2 - lon1).to_radians();
    let a = (dlat/2.0).sin() * (dlat/2.0).sin() +
        lat1.to_radians().cos() * lat2.to_radians().cos() *
        (dlon/2.0).sin() * (dlon/2.0).sin();
    let c = 2.0 * a.sqrt().atan2((1.0-a).sqrt());
    r * c
}

#[ic_cdk_macros::update]
pub async fn verify_help_request(victim_id: String, timestamp: String, verification_note: String, verifier_type: String) -> bool {
    ic_cdk::println!("Attempting to verify request for victim: {} at timestamp: {}", victim_id, timestamp);
    HELP_REQUESTS.with(|requests| {
        let mut requests = requests.borrow_mut();
        
        let request_id = format!("{}_{}", victim_id, timestamp);
        let request_key = StableString::from(request_id.clone());
        
        if let Some(request) = requests.get(&request_key) {
            ic_cdk::println!("Found request: {:?}", request);
            if request.status.to_lowercase() == "pending" {
                let mut updated_request = request.clone();
                updated_request.status = "verified".to_string();
                updated_request.verification_note = Some(verification_note);
                updated_request.verified_by = Some(verifier_type);
                requests.insert(request_key, updated_request.clone());
                ic_cdk::println!("Successfully verified request");
                true
            } else {
                ic_cdk::println!("Request is not in pending status");
                false
            }
        } else {
            ic_cdk::println!("Request not found with ID: {}", request_id);
            false
        }
    })
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SupplyBundle {
    id: String,
    name: String,
    description: String,
    items: Vec<SupplyItem>,
    status: String,
    assigned_to: Option<String>,
    created_at: String,
}

impl Storable for SupplyBundle {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for SupplyBundle {
    const MAX_SIZE: u32 = 1024;
    const IS_FIXED_SIZE: bool = false;
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SupplyItem {
    name: String,
    quantity: u32,
    unit: String,
}

impl Storable for SupplyItem {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for SupplyItem {
    const MAX_SIZE: u32 = 128;
    const IS_FIXED_SIZE: bool = false;
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Donation {
    id: String,
    amount: f64,
    donor_name: String,
    donor_email: String,
    date: String,
    distribution_details: Vec<DistributionDetail>,
}

impl Storable for Donation {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for Donation {
    const MAX_SIZE: u32 = 1024;
    const IS_FIXED_SIZE: bool = false;
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct DistributionDetail {
    amount: f64,
    purpose: String,
    date: String,
}

impl Storable for DistributionDetail {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for DistributionDetail {
    const MAX_SIZE: u32 = 256;
    const IS_FIXED_SIZE: bool = false;
}

// Organization functions
#[ic_cdk_macros::update]
pub async fn organization_login(email: String, password: String) -> bool {
    ic_cdk::println!("Attempting organization login for email: {}", email);
    USERS.with(|users| {
        let users = users.borrow();
        let email_key = StableString::from(email.clone());
        
        if let Some(user) = users.get(&email_key) {
            ic_cdk::println!("Found user: {:?}", user);
            if user.user_type == "organization" && user.password == password {
                ic_cdk::println!("Login successful for organization: {}", email);
                true
            } else {
                ic_cdk::println!("Login failed: Invalid credentials or user type for: {}", email);
                false
            }
        } else {
            ic_cdk::println!("No user found with email: {}", email);
            false
        }
    })
}

#[update]
pub async fn admin_login(email: String, password: String) -> bool {
    ic_cdk::println!("Admin login attempt for email: {}", email);
    
    // First verify the password
    let password_valid = USERS.with(|users| {
        let users = users.borrow();
        let email_key = StableString::from(email.clone());
        match users.get(&email_key) {
            Some(user) => {
                let result = user.password == password;
                ic_cdk::println!("Password verification result: {}", result);
                result
            }
            None => {
                ic_cdk::println!("User not found");
                false
            }
        }
    });

    if !password_valid {
        ic_cdk::println!("Password verification failed for admin login");
        return false;
    }

    // Then check if the user is an admin
    let is_admin_user = USERS.with(|users| {
        let users = users.borrow();
        let email_key = StableString::from(email.clone());
        users.get(&email_key)
            .map(|user| {
                ic_cdk::println!("Found user: {:?}, is_admin: {}", user.email, user.is_admin);
                user.is_admin
            })
            .unwrap_or_else(|| {
                ic_cdk::println!("User not found");
                false
            })
    });

    if !is_admin_user {
        ic_cdk::println!("User is not an admin");
        return false;
    }

    ic_cdk::println!("Admin login successful for: {}", email);
    true
}

#[update]
pub fn approve_volunteer_request(victim_id: String, timestamp: String) -> bool {
    let request_id = format!("{}_{}", victim_id, timestamp);
    ic_cdk::println!("Attempting to approve request: {}", request_id);
    
    HELP_REQUESTS.with(|requests| {
        let mut requests = requests.borrow_mut();
        let request_key = StableString::from(request_id.clone());
        
        if let Some(mut request) = requests.get(&request_key) {
            // Check if the request has a volunteer assigned
            if request.assigned_volunteer.is_some() {
                let mut updated_request = request.clone();
                updated_request.status = "completed".to_string();
                requests.insert(request_key, updated_request);
                ic_cdk::println!("Successfully approved request");
                true
            } else {
                ic_cdk::println!("Request has no assigned volunteer");
                false
            }
        } else {
            ic_cdk::println!("Request not found: {}", request_id);
            false
        }
    })
}

#[update]
pub fn clear_database() -> bool {
    ic_cdk::println!("Attempting to clear database");
    
    // Clear users
    USERS.with(|users| {
        let mut users = users.borrow_mut();
        let keys: Vec<_> = users.iter().map(|(k, _)| k.clone()).collect();
        for key in keys {
            users.remove(&key);
        }
    });

    // Clear help requests
    HELP_REQUESTS.with(|requests| {
        let mut requests = requests.borrow_mut();
        let keys: Vec<_> = requests.iter().map(|(k, _)| k.clone()).collect();
        for key in keys {
            requests.remove(&key);
        }
    });

    // Clear supply bundles
    SUPPLY_BUNDLES.with(|bundles| {
        let mut bundles = bundles.borrow_mut();
        let keys: Vec<_> = bundles.iter().map(|(k, _)| k.clone()).collect();
        for key in keys {
            bundles.remove(&key);
        }
    });

    // Clear donations
    DONATIONS.with(|donations| {
        let mut donations = donations.borrow_mut();
        let keys: Vec<_> = donations.iter().map(|(k, _)| k.clone()).collect();
        for key in keys {
            donations.remove(&key);
        }
    });

    // Clear volunteer locations
    VOLUNTEER_LOCATIONS.with(|locations| {
        let mut locations = locations.borrow_mut();
        let keys: Vec<_> = locations.iter().map(|(k, _)| k.clone()).collect();
        for key in keys {
            locations.remove(&key);
        }
    });

    ic_cdk::println!("Database cleared successfully");
    true
}

#[update]
pub fn clear_help_requests() -> bool {
    HELP_REQUESTS.with(|requests| {
        let mut requests = requests.borrow_mut();
        let keys: Vec<StableString> = requests.iter().map(|(k, _)| k.clone()).collect();
        for key in keys {
            requests.remove(&key);
        }
        true
    })
}

#[update]
pub fn clear_volunteer_locations() -> bool {
    VOLUNTEER_LOCATIONS.with(|locations| {
        let mut locations = locations.borrow_mut();
        let keys: Vec<StableString> = locations.iter().map(|(k, _)| k.clone()).collect();
        for key in keys {
            locations.remove(&key);
        }
        true
    })
}

#[update]
pub fn clear_supply_bundles() -> bool {
    SUPPLY_BUNDLES.with(|bundles| {
        let mut bundles = bundles.borrow_mut();
        let keys: Vec<StableString> = bundles.iter().map(|(k, _)| k.clone()).collect();
        for key in keys {
            bundles.remove(&key);
        }
        true
    })
}

#[update]
pub fn clear_donations() -> bool {
    DONATIONS.with(|donations| {
        let mut donations = donations.borrow_mut();
        let keys: Vec<StableString> = donations.iter().map(|(k, _)| k.clone()).collect();
        for key in keys {
            donations.remove(&key);
        }
        true
    })
}

#[update]
pub fn make_donation(donation: Donation) -> bool {
    DONATIONS.with(|donations| {
        let mut donations = donations.borrow_mut();
        let donation_key = StableString::from(donation.id.clone());
        donations.insert(donation_key, donation);
        true
    })
}

#[query]
pub fn get_donor_donations(donor_email: String) -> Vec<Donation> {
    DONATIONS.with(|donations| {
        let donations = donations.borrow();
        donations
            .iter()
            .filter(|(_, donation)| donation.donor_email == donor_email)
            .map(|(_, donation)| donation.clone())
            .collect()
    })
}
