Prerequisites (one-time setup)
                                                                                                                                                                                                                     
  1. Start Supabase (requires Docker Desktop running):      
  cd /path/to/vipsOS                                                                                                                                                                                                 
  supabase start                                            
  Copy the output values — you'll need API URL, anon key, service_role key, and JWT secret.                                                                                                                          
                                                                                           
  2. Fill in environment files:                                                                                                                                                                                      
                                                                                                                                                                                                                     
  # Repo root — copy and fill values from supabase start                                                                                                                                                             
  cp .env.example .env                                                                                                                                                                                               
                                                            
  Edit .env:                                                                                                                                                                                                         
  SUPABASE_URL=http://127.0.0.1:54321                       
  SUPABASE_ANON_KEY=<anon key>       
  SUPABASE_SERVICE_ROLE_KEY=<service_role key>                                                                                                                                                                       
  SUPABASE_JWT_SECRET=<JWT secret>            
  SECRETS_ENCRYPTION_KEY=<run: openssl rand -hex 32>                                                                                                                                                                 
  CONTROL_PLANE_PORT=3001                                   
  ALLOWED_ORIGINS=http://localhost:5173                                                                                                                                                                              
                                                            
  Edit apps/web/.env.local:                                                                                                                                                                                          
  VITE_SUPABASE_URL=http://127.0.0.1:54321                                                                                                                                                                           
  VITE_SUPABASE_ANON_KEY=<anon key>       
  VITE_API_URL=http://localhost:3001                                                                                                                                                                                 
                                                                                                                                                                                                                     
  3. Apply database migrations:
  supabase db push                                                                                                                                                                                                   
                                                            
  ---
  Start the stack (3 terminals)
                                                                                                                                                                                                                     
  # Terminal 1 — Supabase (already running from setup)
  supabase status                                                                                                                                                                                                    
                                                            
  # Terminal 2 — Control plane                                                                                                                                                                                       
  cd services/control-plane && bun run dev                  

  # Terminal 3 — Frontend                                                                                                                                                                                            
  cd apps/web && npm run dev
                                                                                                                                                                                                                     
  Open http://localhost:5173                                

  ---
  End-to-end test flows
                       
  Sign up:
  1. Go to /auth/signup                                                                                                                                                                                              
  2. Fill in name, email, password → Create account
  3. You should land on /dashboard with a real session                                                                                                                                                               
  4. Topbar should show your workspace name                 
                                                                                                                                                                                                                     
  Persist a workflow:                                                                                                                                                                                                
  1. Go to /workflows → New Workflow → save with a name                                                                                                                                                              
  2. Reload the page → workflow still appears (real Postgres)                                                                                                                                                        
  3. Open Supabase Studio at http://localhost:54323 → Table Editor → workflows → confirm the row exists
                                                                                                                                                                                                                     
  Secrets (encryption test):                                                                                                                                                                                         
  1. Go to /secrets                                                                                                                                                                                                  
  2. Add a secret (name + value)                                                                                                                                                                                     
  3. Only the name appears in the list — value is never returned
  4. In Studio → secrets table → encrypted_value column shows ciphertext, not plaintext                                                                                                                              
                                                                                                                                                                                                                     
  API health check:                                                                                                                                                                                                  
  curl http://localhost:3001/health                                                                                                                                                                                  
  # Expected: {"ok":true}                                                                                                                                                                                            
                                                            
  ---                                                                                                                                                                                                                
  Unit tests
                                                                                                                                                                                                                     
  cd apps/web && npm test -- --run                          
  # Expected: 46 tests, 12 files, all pass
                                                                                                                                                                                                                     
  ---
  Known limitations in Phase 3A                                                                                                                                                                                      
                                                                                                                                                                                                                     
  These are deferred to Phase 3B and won't work end-to-end yet:
  - Dashboard KPI tiles (total workflows, success rate) show stub numbers                                                                                                                                            
  - Workflow builder canvas loads empty if you navigate directly to /workflows/:id/builder without visiting the list first                                                                                           
  - "New Secret" button has no form yet                                                                                                                                                                              
  - WorkflowsView duplicate/archive actions don't persist (local state only) 


  ==========


   Here's the complete end-to-end testing guide for Phase 3B:                                                                                                                                                         
                                                 
  ---                                                                                                                                                                                                                
  Prerequisites
                                                                                                                                                                                                                     
  Make sure your .env has WORKER_KEY set (from Task 6):     
  grep WORKER_KEY /Users/leandroarruda/projects/vipsOS/.env                                                                                                                                                          
  If missing: echo "WORKER_KEY=$(openssl rand -hex 16)" >> .env
                                                                                                                                                                                                                     
  ---                                                                                                                                                                                                                
  Start the full stack (4 terminals)                                                                                                                                                                                 
                                                                                                                                                                                                                     
  # T1 — Supabase                                           
  supabase start                                                                                                                                                                                                     
                                                            
  # T2 — Control plane
  cd services/control-plane && bun --env-file=../../.env run dev
                                                                                                                                                                                                                     
  # T3 — Runtime worker
  cd services/runtime && bun --env-file=../../.env run dev                                                                                                                                                           
  # Expected: "[worker] Runtime started — polling every 2s" 
                                                                                                                                                                                                                     
  # T4 — Frontend
  cd apps/web && npm run dev                                                                                                                                                                                         
                                                                                                                                                                                                                     
  ---
  Test 1 — HTTP/REST node (happy path)                                                                                                                                                                               
                                                            
  1. Sign in at http://localhost:5173
  2. Go to Workflows → create a new workflow                                                                                                                                                                         
  3. Open it in the builder → add a node with this config in the inspector:                                                                                                                                          
  {                                                                                                                                                                                                                  
    "connectorType": "http-rest",                                                                                                                                                                                    
    "method": "GET",                                                                                                                                                                                                 
    "url": "https://httpbin.org/json"                       
  }                                                                                                                                                                                                                  
  4. Click Run
                                                                                                                                                                                                                     
  Expected: Redirected to RunDetailView. Watch the status badge cycle:                                                                                                                                               
  - queued (amber) → after ≤2s → running (blue) → success (green)
                                                                                                                                                                                                                     
  Expected logs:                                            
  Run <id> started                                                                                                                                                                                                   
  Starting node: <label>                                    
  GET https://httpbin.org/json → 200
  Node completed successfully                                                                                                                                                                                        
  Run <id> completed successfully
                                                                                                                                                                                                                     
  ---                                                       
  Test 2 — StatCan node (real public data)                                                                                                                                                                           
                                                                                                                                                                                                                     
  1. Create a new workflow with a node:
  {                                                                                                                                                                                                                  
    "connectorType": "statcan",                             
    "table_code": "14-10-0287-01"                                                                                                                                                                                    
  }
  2. Run it                                                                                                                                                                                                          
                                                            
  Expected logs:
  Fetched table 14-10-0287-01 from Statistics Canada
  Normalized N data point(s)                        
                                                                                                                                                                                                                     
  ---                                                                                                                                                                                                                
  Test 3 — Failure state (missing connectorType)                                                                                                                                                                     
                                                                                                                                                                                                                     
  1. Create a workflow with a node that has no connectorType in config
  2. Run it

  Expected: Status → failed, log says:                                                                                                                                                                               
  Node "..." has no config.connectorType — set it to "http-rest", "postgres", or "statcan"
                                                                                                                                                                                                                     
  ---                                                                                                                                                                                                                
  Test 4 — Postgres node (queries local Supabase)
                                                                                                                                                                                                                     
  1. Create a node with:                                    
  {                                                                                                                                                                                                                  
    "connectorType": "postgres",                            
    "query": "SELECT id, name FROM public.workflows LIMIT 5"
  }                                                                                                                                                                                                                  
  2. Make sure POSTGRES_CONNECTION_STRING is in your .env:
  POSTGRES_CONNECTION_STRING=postgresql://postgres:postgres@127.0.0.1:54322/postgres                                                                                                                                 
  3. Run it                                                                                                                                                                                                          
                                                                                                                                                                                                                     
  Expected logs:                                                                                                                                                                                                     
  Query returned N row(s)                                   

  ---                                                                                                                                                                                                                
  Verify in Supabase Studio
                                                                                                                                                                                                                     
  Open http://localhost:54323 → Table Editor:               
  - runs table — confirm status success                                                                                                                                                                              
  - run_logs table — confirm log rows with run_id, level, message                                                                                                                                                    
                                                                                                                                                                                                                     
  ---                                                                                                                                                                                                                
  Automated tests                                           
                                                                                                                                                                                                                     
  # Runtime (15 tests)                                      
  cd services/runtime && bun test

  # Frontend (46 tests)                                                                                                                                                                                              
  cd apps/web && npm test -- --run