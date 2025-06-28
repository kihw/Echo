# Plan TODO - backend

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|-------|------|------|---------|-----------|--------------|-------------|----------------|
| TODO | COMPLETE | routes/sync/import.js | Route | CRITICAL | Medium | Tokens hardcoded | Retrieve user tokens from database | tests/integration/sync.test.js |
| TODO | COMPLETE | routes/sync/import.js | Route | HIGH | Medium | Sync history placeholder | Fetch sync history from DB | tests/integration/sync.test.js |
| TODO | COMPLETE | routes/playlist/generate.js | Route | CRITICAL | Medium | Playlist not saved | Persist generated playlist in DB | tests/integration/playlist.test.js |
| TODO | COMPLETE | routes/playlist/generate.js | Route | HIGH | Medium | Playlists array empty | Load user playlists from DB | tests/integration/playlist.test.js |
| TODO | COMPLETE | routes/playlist/generate.js | Route | HIGH | Medium | Playlist variable null | Load playlist details from DB | tests/integration/playlist.test.js |
| TODO | COMPLETE | routes/playlist/generate.js | Route | HIGH | Medium | Update logic missing | Update playlist fields in DB | tests/integration/playlist.test.js |
| TODO | COMPLETE | routes/playlist/generate.js | Route | HIGH | Medium | Delete logic missing | Remove playlist from DB | tests/integration/playlist.test.js |
| TODO | COMPLETE | routes/playlist/generate.js | Route | HIGH | Medium | Add tracks TODO | Insert tracks in playlist DB table | tests/integration/playlist.test.js |
| TODO | COMPLETE | routes/playlist/generate.js | Route | HIGH | Medium | Remove track TODO | Delete track from playlist in DB | tests/integration/playlist.test.js |
| TODO | COMPLETE | routes/playlist/generate.js | Route | MEDIUM | Medium | Reorder tracks TODO | Update track positions in DB | tests/integration/playlist.test.js |
| TODO | COMPLETE | routes/playlist/generate.js | Route | MEDIUM | Medium | Import playlist TODO | Import playlist via services & save | tests/integration/playlist.test.js |
| TODO | COMPLETE | logic/playlistBuilder.js | Logic | HIGH | High | getUserMusicProfile returns empty | Load profile from DB | tests/logic/playlistBuilder.test.js |
| TODO | COMPLETE | logic/playlistBuilder.js | Logic | HIGH | High | getAvailableTracks returns empty | Retrieve tracks from DB/services | tests/logic/playlistBuilder.test.js |
| TODO | COMPLETE | services/dataSyncOld.js | Service | MEDIUM | High | Save functions not implemented | Persist service data and results | tests/services/dataSyncOld.test.js |
| TODO | COMPLETE | services/dataSyncOld.js | Service | MEDIUM | High | incrementalSync not implemented | Implement incremental synchronization | tests/services/dataSyncOld.test.js |

