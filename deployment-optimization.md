# Deployment Optimization

## Public app search strategy

### Companies
- ship full company list to the frontend
- company count is small enough to keep frontend search cheap
- use client-side autocomplete and fuzzy search

### People
- do not bundle the full people list into the main frontend bundle
- use lazy-loaded static search index files
- shard the people index into smaller files
- run fuzzy search on the frontend after the relevant shard is loaded

## Why this approach
- keeps server cost low
- avoids backend fuzzy search on every keypress
- keeps the main frontend bundle smaller
- works well with Cloudflare edge caching

## Recommended behavior
- start people search only after 2 characters
- debounce requests by about 150-200ms
- cache loaded shards in browser memory for the current session
- show a loading state while a shard is being fetched

## Responsiveness expectations
- first search against a new shard will have a small delay
- repeated searches against an already loaded shard should be fast
- overall responsiveness should be acceptable if shards stay reasonably small

## Recommended shard strategy
- shard people search index by a normalized prefix
- prefer at least 2-character shard keys
- keep shard sizes balanced to avoid both giant files and too many requests

## Important search caveat
- simple prefix sharding mainly supports prefix-oriented search well
- surname-first or arbitrary token fuzzy search may need a more advanced shard/index design later

## Recommended future implementation
- static company search index
- sharded static people search index
- frontend fuzzy search over loaded data
- Cloudflare caching for search index files

## Backend follow-ups
- replace live D1-backed search-index endpoints with prebuilt static JSON assets
- keep archive list responses summary-only; fetch full credits/companies on the single-movie detail endpoint
- add movie indexes for common sort fields: `release_date`, `budget`, `box_office`
- add auth in front of the internal app/API before real multi-user deployment
- consider short cache lifetimes for archive/facet responses only if real usage shows repeated query patterns
