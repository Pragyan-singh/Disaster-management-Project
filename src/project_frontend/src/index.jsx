import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as backendIdlFactory } from '../declarations/project_backend/project_backend.did.js';

// Create an agent and actor
const agent = new HttpAgent({
  host: 'http://localhost:4943',
});

// In development, we need to fetch the root key
if (process.env.NODE_ENV !== "production") {
  agent.fetchRootKey().catch(err => {
    console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
    console.error(err);
  });
}

const backend = Actor.createActor(backendIdlFactory, {
  agent,
  canisterId: 'bd3sg-teaaa-aaaaa-qaaba-cai',
});

// Export for use in other files
export { backend as project_backend }; 