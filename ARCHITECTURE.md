# Handball Analytics - System Architecture

**Version:** 3.2 (Merged)
**Dato:** 2026-01-20
**Status:** Production

---

## 📋 Innholdsfortegnelse

### Del 1: Visual Architecture
1. [System Overview](#1-system-overview)
2. [Fil-avhengigheter](#2-fil-avhengigheter)
3. [Dataflyt: Skuddregistrering](#3-dataflyt-skuddregistrering)
4. [Lagringsstrategi](#4-lagringsstrategi)
5. [State Management](#5-state-management)
6. [Firebase Arkitektur](#6-firebase-arkitektur)
7. [UI Rendering Flow](#7-ui-rendering-flow)
8. [Event Handling Strategy](#8-event-handling-strategy)

### Del 2: Implementation Details
9. [Filstruktur](#9-filstruktur)
10. [Moduler og Ansvar](#10-moduler-og-ansvar)
11. [Arkitekturprinsipper](#11-arkitekturprinsipper)
12. [Skuddregistreringsflyt (Detailed)](#12-skuddregistreringsflyt-detailed)
13. [Autentiseringsflyt](#13-autentiseringsflyt)
14. [Lagringsarkitektur (Details)](#14-lagringsarkitektur-details)
15. [Sikkerhetsarkitektur](#15-sikkerhetsarkitektur)
16. [Ytelsesoptimalisering](#16-ytelsesoptimalisering)
17. [Fremtidig Arkitektur](#17-fremtidig-arkitektur)
18. [Arkitektur-Insights](#18-arkitektur-insights)

---

# DEL 1: VISUAL ARCHITECTURE

## 1. SYSTEM OVERVIEW

### High-Level Architecture

```mermaid
graph TB
    subgraph "Browser"
        subgraph "Presentation Layer"
            UI[UI Components<br/>8 files]
            Router[Router<br/>render.js]
            Modals[Modal Management<br/>modals.js]
        end

        subgraph "Business Logic Layer"
            Shots[Shot Registration<br/>shots.js]
            Players[Player Management<br/>players.js]
            Stats[Statistics<br/>statistics.js]
            Timer[Timer<br/>timer.js]
            Events[Event Delegation<br/>events.js]
        end

        subgraph "State Management"
            State[Global State<br/>APP object<br/>state.js]
            Cache[Performance Cache<br/>PERFORMANCE object]
        end

        subgraph "Persistence Layer"
            LocalStorage[localStorage<br/>storage.js]
            FirestoreClient[Firestore Client<br/>firestore-storage.js]
        end
    end

    subgraph "Firebase Cloud"
        Auth[Firebase Auth]
        Firestore[Cloud Firestore]
        DebugLogs[Debug Logs Collection]
    end

    User((User)) -->|Interacts| UI
    UI -->|render| Router
    Router -->|delegates| Events
    Events -->|modifies| State
    State -->|persists| LocalStorage
    State -->|syncs| FirestoreClient

    Shots -->|updates| State
    Players -->|updates| State
    Stats -->|reads| Cache
    Cache -->|backed by| State

    LocalStorage -->|300ms debounce| LocalStorage
    FirestoreClient -->|1000ms debounce| Firestore
    FirestoreClient -->|authenticates| Auth

    State -->|logs events| DebugLogs

    style User fill:#4a90e2
    style State fill:#f39c12
    style Firestore fill:#27ae60
    style LocalStorage fill:#e74c3c
```

### Technology Stack

```mermaid
graph LR
    subgraph "Frontend"
        VanillaJS[Vanilla JavaScript<br/>ES6 Modules]
        HTML5[HTML5]
        CSS3[CSS3<br/>Responsive]
    end

    subgraph "Firebase Services"
        FirebaseAuth[Firebase Auth<br/>Email/Password]
        CloudFirestore[Cloud Firestore<br/>NoSQL Database]
        FirebaseHosting[Firebase Hosting<br/>Static Site]
    end

    subgraph "Development"
        Git[Git<br/>Version Control]
        VSCode[Development<br/>Environment]
    end

    VanillaJS --> FirebaseAuth
    VanillaJS --> CloudFirestore
    HTML5 --> FirebaseHosting

    style VanillaJS fill:#f1c40f
    style FirebaseAuth fill:#3498db
    style CloudFirestore fill:#2ecc71
```

---

## 2. FIL-AVHENGIGHETER

### Complete Dependency Graph

```mermaid
graph TB
    subgraph "Entry Point"
        app[app.js<br/>22 lines]
    end

    subgraph "Core Services"
        state[state.js<br/>Global State + Cache<br/>127 lines]
        storage[storage.js<br/>localStorage Wrapper<br/>64 lines]
        auth[auth.js<br/>Firebase Auth<br/>327 lines]
        firebaseConfig[firebase-config.js<br/>Firebase Setup<br/>48 lines]
        firestoreStorage[firestore-storage.js<br/>Firestore CRUD<br/>277 lines]
    end

    subgraph "Business Logic"
        events[events.js<br/>Event Delegation<br/>562 lines]
        shots[shots.js<br/>Shot Registration<br/>368 lines]
        statistics[statistics.js<br/>Stats Calculation<br/>48 lines]
        players[players.js<br/>Player Management<br/>229 lines]
        timer[timer.js<br/>Match Timer<br/>204 lines]
        teamRoster[team-roster.js<br/>Roster Persistence<br/>307 lines]
        utils[utils.js<br/>Utilities<br/>264 lines]
        debugLogger[debug-logger.js<br/>Event Logging<br/>245 lines]
    end

    subgraph "UI Layer"
        render[ui/render.js<br/>Router<br/>354 lines]
        match[ui/match.js<br/>Match Page<br/>427 lines]
        setup[ui/setup.js<br/>Setup Page<br/>259 lines]
        home[ui/home.js<br/>Home Page<br/>101 lines]
        history[ui/history.js<br/>History Page<br/>168 lines]
        modals[ui/modals.js<br/>Modal Management<br/>255 lines]
        eventFeed[ui/event-feed.js<br/>Live Feed<br/>189 lines]
        teamRosterUI[ui/team-roster.js<br/>Roster UI<br/>220 lines]
    end

    %% Entry point dependencies
    app -->|loads state| storage
    app -->|setup listeners| events
    app -->|init auth| auth
    app -->|first render| render

    %% Core service dependencies
    storage -->|saves to| state
    storage -->|syncs to| firestoreStorage
    auth -->|uses| firebaseConfig
    auth -->|updates| state
    firestoreStorage -->|uses| firebaseConfig
    firestoreStorage -->|reads/writes| state
    firestoreStorage -->|logs| debugLogger

    %% Business logic dependencies
    events -->|delegates to| shots
    events -->|delegates to| players
    events -->|delegates to| auth
    events -->|delegates to| utils
    events -->|delegates to| timer

    shots -->|updates| state
    shots -->|uses| statistics
    shots -->|logs| debugLogger
    shots -->|uses| timer
    shots -->|renders| eventFeed
    shots -->|saves| storage

    statistics -->|reads| state
    players -->|updates| state
    players -->|saves| storage
    timer -->|updates| state
    teamRoster -->|saves| firestoreStorage
    utils -->|saves| firestoreStorage
    utils -->|updates| state

    %% UI dependencies
    render -->|routes to| match
    render -->|routes to| setup
    render -->|routes to| home
    render -->|routes to| history
    render -->|routes to| teamRosterUI

    match -->|uses| modals
    match -->|uses| eventFeed
    match -->|reads| state

    modals -->|reads| state
    eventFeed -->|reads| state

    style app fill:#e74c3c,color:#fff
    style state fill:#f39c12,color:#fff
    style shots fill:#e74c3c,color:#fff
    style events fill:#e67e22,color:#fff
    style render fill:#3498db,color:#fff
```

### Critical Path for Shot Registration

```mermaid
graph LR
    A[app.js] --> B[events.js]
    B --> C[shots.js]
    C --> D[state.js]
    C --> E[statistics.js]
    C --> F[storage.js]
    F --> G[firestore-storage.js]
    G --> H[Firebase]

    style C fill:#e74c3c,color:#fff
    style D fill:#f39c12,color:#fff
    style H fill:#27ae60,color:#fff
```

---

## 3. DATAFLYT: SKUDDREGISTRERING

### Complete Shot Registration Flow

```mermaid
sequenceDiagram
    actor User
    participant GoalArea as Goal Area<br/>(DOM)
    participant Shots as shots.js
    participant State as state.js<br/>(APP)
    participant Cache as PERFORMANCE<br/>(Cache)
    participant Storage as storage.js
    participant Firestore as Firestore
    participant UI as UI Update

    User->>GoalArea: Klikk på målområde
    GoalArea->>Shots: handleGoalClick(event)

    Note over Shots: Beregner x, y koordinater<br/>relativ til målområde
    Shots->>State: APP.tempShot = {x, y, zone}
    Shots->>State: APP.selectedResult = null
    Shots->>UI: render() → Vis shot popup

    User->>UI: Velg resultat (mål/redning)
    UI->>Shots: selectShotResult(result)
    Shots->>State: APP.selectedResult = result
    Shots->>UI: Partial update (kun knapper)

    User->>UI: Velg spiller
    UI->>Shots: registerShot(playerId)

    Note over Shots: Henter player/opponent/keeper
    Note over Shots: Lager event object med<br/>timestamp, koordinater, etc.

    Shots->>State: APP.events.push(event)

    rect rgb(255, 200, 200)
        Note over Cache: KRITISK: Cache invalideres
        Shots->>Cache: invalidateStatsCache()
        Cache->>Cache: cacheVersion++
        Cache->>Cache: statsCache.clear()
    end

    rect rgb(200, 255, 200)
        Note over Storage: Debounced save (300ms)
        Shots->>Storage: saveToLocalStorage()
        Storage-->>Storage: setTimeout(300ms)
        Storage->>State: JSON.stringify(APP)
        Storage->>localStorage: setItem('handballApp')

        Note over Firestore: Debounced sync (1000ms)
        Storage->>Firestore: saveMatchToFirestoreDebounced()
        Firestore-->>Firestore: setTimeout(1000ms)
        Firestore->>Firestore: Save to 'active' document
    end

    Shots->>UI: updateGoalVisualization()<br/>(Partial update)
    Shots->>UI: updateStatisticsOnly()<br/>(Partial update)

    UI-->>User: Oppdatert visning<br/>med nytt skudd

    Note over User,UI: Total tid: ~1-2 sekunder<br/>300ms localStorage<br/>1000ms Firestore
```

### Shot Event Object Structure

```mermaid
classDiagram
    class ShotEvent {
        +number id
        +number half
        +string mode
        +Player player
        +Opponent opponent
        +Keeper keeper
        +number x
        +number y
        +string result
        +string zone
        +string timestamp
        +TimerTimestamp timerTimestamp
    }

    class Player {
        +number id
        +number number
        +string name
        +boolean isKeeper
    }

    class Opponent {
        +number id
        +number number
        +string name
    }

    class Keeper {
        +number id
        +number number
        +string name
        +boolean isKeeper
    }

    class TimerTimestamp {
        +number minutes
        +number seconds
    }

    ShotEvent --> Player
    ShotEvent --> Opponent
    ShotEvent --> Keeper
    ShotEvent --> TimerTimestamp

    note for ShotEvent "id: Date.now() (unique)\nhalf: 1 or 2\nmode: 'attack' | 'defense'\nresult: 'mål' | 'redning' | 'utenfor'\nzone: 'goal' | 'outside'\nx, y: 0-100 (percentage)"
```

### Coordinate System

```mermaid
graph TB
    subgraph "Goal Area Coordinate System"
        direction TB

        TopLeft["(0, 0)<br/>Top Left"]
        TopRight["(100, 0)<br/>Top Right"]
        BottomLeft["(0, 100)<br/>Bottom Left"]
        BottomRight["(100, 100)<br/>Bottom Right"]
        Center["(50, 50)<br/>Center"]

        TopLeft -.->|X axis| TopRight
        TopLeft -.->|Y axis| BottomLeft
    end

    note1[X: 0-100% horizontal<br/>Y: 0-100% vertical<br/>Origin: Top-left corner]

    style Center fill:#f39c12
    style note1 fill:#ecf0f1
```

---

## 4. LAGRINGSSTRATEGI

### Dual Storage Architecture

```mermaid
graph TB
    subgraph "Application State"
        APP[APP Object<br/>In-Memory State]
    end

    subgraph "Local Storage Strategy"
        LocalSave[saveToLocalStorage<br/>Debounce: 300ms]
        LocalData[(localStorage<br/>'handballApp')]
        LocalLoad[loadFromLocalStorage<br/>On App Start]
    end

    subgraph "Cloud Storage Strategy"
        FirestoreSave[saveMatchToFirestore<br/>Debounce: 1000ms]
        FirestoreData[(Firestore<br/>users/{uid}/matches)]
        FirestoreLoad[syncFromFirestore<br/>On Auth]
    end

    subgraph "Sync Events"
        Event1[New Shot]
        Event2[Player Added]
        Event3[Match Finished]
        Event4[Setup Reset]
    end

    Event1 --> APP
    Event2 --> APP
    Event3 --> APP
    Event4 --> APP

    APP -->|Triggers| LocalSave
    LocalSave -->|After 300ms| LocalData

    APP -->|Triggers| FirestoreSave
    FirestoreSave -->|After 1000ms| FirestoreData

    LocalData -->|On Reload| LocalLoad
    LocalLoad -->|Restores| APP

    FirestoreData -->|On Login| FirestoreLoad
    FirestoreLoad -->|Overwrites| APP

    style APP fill:#f39c12,color:#fff
    style LocalData fill:#e74c3c,color:#fff
    style FirestoreData fill:#27ae60,color:#fff
```

### Storage Comparison

```mermaid
graph LR
    subgraph "localStorage"
        L1[Fast Access<br/>~1ms]
        L2[Size Limit<br/>5-10 MB]
        L3[Synchronous<br/>Blocking]
        L4[No Auth<br/>Required]
        L5[Device-specific<br/>No sync]
    end

    subgraph "Firestore"
        F1[Network Dependent<br/>100-500ms]
        F2[Large Storage<br/>1 GB free]
        F3[Asynchronous<br/>Non-blocking]
        F4[Auth Required<br/>Secure]
        F5[Cross-device<br/>Real-time sync]
    end

    style localStorage fill:#e74c3c,color:#fff
    style Firestore fill:#27ae60,color:#fff
```

### Data Flow Priority

```mermaid
flowchart TD
    Start([App Starts])

    Start --> LoadLocal{localStorage<br/>exists?}
    LoadLocal -->|Yes| UseLocal[Use localStorage data<br/>Show UI immediately]
    LoadLocal -->|No| EmptyState[Start with empty state]

    UseLocal --> CheckAuth{User<br/>authenticated?}
    EmptyState --> CheckAuth

    CheckAuth -->|No| ShowLogin[Show Login Page]
    CheckAuth -->|Yes| SyncFirestore[Sync from Firestore]

    SyncFirestore --> CompareData{Firestore data<br/>exists?}

    CompareData -->|Yes| Overwrite[Overwrite local with<br/>Firestore data]
    CompareData -->|No| UseLocal2[Keep localStorage data<br/>Migrate to Firestore]

    Overwrite --> Ready[App Ready]
    UseLocal2 --> Migrate[migrateLocalStorageToFirestore]
    Migrate --> Ready
    ShowLogin --> Ready

    style LoadLocal fill:#f39c12
    style SyncFirestore fill:#27ae60
    style Ready fill:#3498db,color:#fff
```

### Save Debouncing Strategy

```mermaid
sequenceDiagram
    participant User
    participant App
    participant DebounceTimer
    participant localStorage
    participant Firestore

    User->>App: Action 1 (t=0ms)
    App->>DebounceTimer: Schedule save in 300ms

    User->>App: Action 2 (t=100ms)
    App->>DebounceTimer: Cancel previous, schedule 300ms

    User->>App: Action 3 (t=200ms)
    App->>DebounceTimer: Cancel previous, schedule 300ms

    Note over DebounceTimer: Timer runs (t=500ms)

    DebounceTimer->>localStorage: Save (300ms after last action)
    localStorage-->>App: Saved locally

    DebounceTimer->>Firestore: Schedule Firestore save (1000ms)

    Note over Firestore: Longer debounce (t=1200ms)

    Firestore-->>App: Saved to cloud

    Note over User,Firestore: Only 1 save executed<br/>despite 3 actions
```

---

## 5. STATE MANAGEMENT

### Global APP Object Structure

```mermaid
graph TB
    subgraph "APP Object (state.js)"
        subgraph "User State"
            currentUser[currentUser<br/>Firebase User]
        end

        subgraph "Navigation State"
            page[page: string<br/>'home'|'match'|'setup'|etc]
        end

        subgraph "Match Configuration"
            homeTeam[homeTeam: string]
            awayTeam[awayTeam: string]
            matchDate[matchDate: string]
            currentHalf[currentHalf: 1|2]
            matchMode[matchMode: 'simple'|'advanced']
        end

        subgraph "Teams"
            players[players: Array~Player~]
            opponents[opponents: Array~Opponent~]
            activeKeeper[activeKeeper: Keeper]
        end

        subgraph "Match Events"
            events[events: Array~ShotEvent~]
            mode[mode: 'attack'|'defense']
        end

        subgraph "Timer State (Advanced)"
            timerState[timerState: Object<br/>currentTime, isRunning,<br/>duration, intervalId]
        end

        subgraph "Temporary UI State"
            tempShot[tempShot: {x, y, zone}]
            selectedResult[selectedResult: string]
            tempPlayersList[tempPlayersList: Array]
            editingPlayerId[editingPlayerId: number]
        end

        subgraph "History"
            completedMatches[completedMatches: Array~Match~]
            viewingMatch[viewingMatch: Match]
        end

        subgraph "Saved Rosters"
            savedTeams[savedTeams: Array~TeamRoster~]
        end
    end

    style APP fill:#f39c12,color:#fff
    style events fill:#e74c3c,color:#fff
    style tempShot fill:#3498db,color:#fff
```

### Performance Cache Structure

```mermaid
graph TB
    subgraph "PERFORMANCE Object"
        statsCache[statsCache: Map<br/>In-memory cache]
        cacheVersion[cacheVersion: number<br/>Global version counter]
        saveTimeout[saveTimeout: number<br/>Debounce timer ID]

        invalidate[invalidateStatsCache<br/>cacheVersion++<br/>statsCache.clear]
        getCached[getCachedStats<br/>key, calculator<br/>Lazy evaluation]
    end

    subgraph "Cache Keys"
        key1[player-123-1-v5]
        key2[player-123-2-v5]
        key3[opponent-456-1-v5]
    end

    subgraph "Cache Values"
        val1[goals: 5<br/>saved: 2<br/>outside: 1]
        val2[goals: 3<br/>saved: 4<br/>outside: 0]
        val3[goals: 2<br/>saved: 5<br/>shots: Array]
    end

    getCached -->|Lookup| statsCache
    statsCache --> key1
    statsCache --> key2
    statsCache --> key3

    key1 --> val1
    key2 --> val2
    key3 --> val3

    invalidate -->|Increments| cacheVersion
    invalidate -->|Clears| statsCache

    style PERFORMANCE fill:#9b59b6,color:#fff
    style cacheVersion fill:#e74c3c,color:#fff
```

### Cache Invalidation Flow

```mermaid
flowchart TD
    Event([User Action:<br/>New shot, Reset, etc])

    Event --> Update[Update APP.events]
    Update --> Invalidate[PERFORMANCE.invalidateStatsCache]

    Invalidate --> Increment[cacheVersion++]
    Invalidate --> Clear[statsCache.clear]

    Increment --> NewVersion[New version: v6]

    subgraph "Old Cache (Invalid)"
        old1[player-123-1-v5]
        old2[player-456-2-v5]
    end

    Clear -.->|Deletes| old1
    Clear -.->|Deletes| old2

    NewVersion --> Render[UI Render]

    Render --> Request[Request stats:<br/>player-123-1-v6]
    Request --> Miss{Cache<br/>Hit?}

    Miss -->|No| Calculate[Calculate fresh stats]
    Calculate --> Store[Store in cache:<br/>player-123-1-v6]

    Miss -->|Yes| Return[Return cached value]
    Store --> Return

    Return --> Display[Display to user]

    style Event fill:#e74c3c,color:#fff
    style Invalidate fill:#f39c12,color:#fff
    style Calculate fill:#27ae60,color:#fff
```

---

## 6. FIREBASE ARKITEKTUR

### Firestore Database Schema

```mermaid
graph TB
    subgraph "Firestore Database"
        root[(Cloud Firestore)]

        subgraph "Users Collection"
            users[users/]
            user1[{uid1}]
            user2[{uid2}]

            users --> user1
            users --> user2
        end

        root --> users

        subgraph "User Document Fields"
            userFields["email: string<br/>name: string<br/>homeTeam: string<br/>migrated: boolean<br/>migratedAt: timestamp"]
        end

        user1 --> userFields

        subgraph "Matches Subcollection"
            matches[matches/]
            activeDoc['active']
            match1[{matchId1}]
            match2[{matchId2}]

            matches --> activeDoc
            matches --> match1
            matches --> match2
        end

        user1 --> matches

        subgraph "Match Document Fields"
            matchFields["homeTeam: string<br/>awayTeam: string<br/>matchDate: string<br/>currentHalf: 1|2<br/>players: Array<br/>opponents: Array<br/>events: Array<br/>activeKeeper: Object<br/>mode: string<br/>status: 'active'|'completed'<br/>updatedAt: timestamp<br/>completedAt: timestamp"]
        end

        activeDoc --> matchFields
        match1 --> matchFields

        subgraph "Debug Logs Collection"
            debugLogs[debug-logs/]
            log1[{logId1}]
            log2[{logId2}]

            debugLogs --> log1
            debugLogs --> log2
        end

        root --> debugLogs

        subgraph "Debug Log Fields"
            logFields["userId: string<br/>userEmail: string<br/>eventType: string<br/>data: Object<br/>timestamp: string<br/>appVersion: string<br/>browser: string"]
        end

        log1 --> logFields
    end

    style root fill:#27ae60,color:#fff
    style users fill:#3498db,color:#fff
    style debugLogs fill:#e67e22,color:#fff
```

### Firebase Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant UI
    participant Auth as auth.js
    participant Firebase as Firebase Auth
    participant Firestore as Cloud Firestore
    participant State as APP State

    Note over User,State: Registration Flow

    User->>UI: Enter email, password, name
    UI->>Auth: handleRegister(email, password, name)
    Auth->>Firebase: createUserWithEmailAndPassword()
    Firebase-->>Auth: userCredential
    Auth->>Firebase: updateProfile(displayName: name)
    Auth->>Firestore: createUserProfile(uid, email, name)
    Firestore-->>Auth: Profile created
    Auth->>State: Update APP.currentUser
    Auth-->>UI: Registration success
    UI-->>User: Redirect to home

    Note over User,State: Login Flow

    User->>UI: Enter email, password
    UI->>Auth: handleLogin(email, password)
    Auth->>Firebase: signInWithEmailAndPassword()
    Firebase-->>Auth: userCredential
    Auth->>Firestore: fetchUserProfile(uid)
    Firestore-->>Auth: User profile data
    Auth->>State: Update APP.currentUser

    rect rgb(200, 255, 200)
        Note over Auth,Firestore: One-time Migration
        Auth->>Firestore: migrateLocalStorageToFirestore()
        Firestore-->>Auth: Migration complete
    end

    Auth->>Firestore: syncFromFirestore()
    Firestore-->>Auth: Active match + history
    Auth->>State: Update APP data
    Auth-->>UI: Login success
    UI-->>User: Redirect to home

    Note over User,State: Logout Flow

    User->>UI: Click logout
    UI->>Auth: handleLogout()
    Auth->>State: Clear APP.currentUser
    Auth->>Firebase: signOut()
    Firebase-->>Auth: Signed out
    Auth-->>UI: Logout success
    UI-->>User: Redirect to login
```

### Firestore Operations

```mermaid
graph TB
    subgraph "Read Operations"
        R1[loadActiveMatchFromFirestore<br/>Load current match]
        R2[loadCompletedMatchesFromFirestore<br/>Load history]
        R3[fetchUserProfile<br/>Load user data]
        R4[fetchSavedTeams<br/>Load rosters]
    end

    subgraph "Write Operations"
        W1[saveMatchToFirestore<br/>Save active match<br/>debounced 1000ms]
        W2[saveCompletedMatchToFirestore<br/>Archive finished match]
        W3[createUserProfile<br/>Create user document]
        W4[saveTeamRoster<br/>Save team list]
    end

    subgraph "Delete Operations"
        D1[deleteCompletedMatchFromFirestore<br/>Remove match from history]
        D2[deleteTeamRoster<br/>Remove saved team]
    end

    subgraph "Special Operations"
        S1[migrateLocalStorageToFirestore<br/>One-time data migration]
        S2[syncFromFirestore<br/>Full sync on login]
    end

    subgraph "Firestore Collections"
        C1[(users/{uid})]
        C2[(users/{uid}/matches)]
        C3[(debug-logs)]
    end

    R1 --> C2
    R2 --> C2
    R3 --> C1
    R4 --> C1

    W1 --> C2
    W2 --> C2
    W3 --> C1
    W4 --> C1

    D1 --> C2
    D2 --> C1

    S1 --> C1
    S1 --> C2
    S2 --> C1
    S2 --> C2

    style C1 fill:#3498db,color:#fff
    style C2 fill:#27ae60,color:#fff
    style C3 fill:#e67e22,color:#fff
```

---

## 7. UI RENDERING FLOW

### Page Routing System

```mermaid
flowchart TD
    Start([User Action or<br/>App Start])

    Start --> Trigger[APP.page = 'newPage']
    Trigger --> CallRender[render function called]

    CallRender --> Router{Route based on<br/>APP.page}

    Router -->|'login'| Login[renderLoginPage]
    Router -->|'register'| Register[renderRegisterPage]
    Router -->|'home'| Home[renderHomePage]
    Router -->|'setup'| Setup[renderSetupPage]
    Router -->|'match'| Match[renderMatchPage]
    Router -->|'history'| History[renderHistoryPage]
    Router -->|'viewMatch'| ViewMatch[renderViewMatchPage]
    Router -->|'teamRoster'| TeamRoster[renderTeamRosterPage]

    Login --> Inject[Inject HTML into #app]
    Register --> Inject
    Home --> Inject
    Setup --> Inject
    Match --> Inject
    History --> Inject
    ViewMatch --> Inject
    TeamRoster --> Inject

    Inject --> AttachListeners[attachEventListeners]
    AttachListeners --> Complete([Render Complete])

    Complete -.->|User interacts| Start

    style Router fill:#3498db,color:#fff
    style Inject fill:#27ae60,color:#fff
    style AttachListeners fill:#e67e22,color:#fff
```

### Rendering Strategy

```mermaid
graph TB
    subgraph "Full Re-render (Heavy)"
        F1[User navigates to new page]
        F2[APP.page changes]
        F3[render called]
        F4[Entire #app innerHTML replaced]
        F5[All event listeners re-attached]
    end

    subgraph "Partial Update (Optimized)"
        P1[User registers shot]
        P2[Event data added to APP.events]
        P3[updateGoalVisualization]
        P4[Only shot markers updated]
        P5[updateStatisticsOnly]
        P6[Only stats section updated]
    end

    subgraph "Modal Update (Lazy)"
        M1[User selects shot result]
        M2[APP.selectedResult updated]
        M3[selectShotResult]
        M4[Only result buttons updated]
        M5[No full re-render]
    end

    F1 --> F2 --> F3 --> F4 --> F5
    P1 --> P2 --> P3 --> P4
    P2 --> P5 --> P6
    M1 --> M2 --> M3 --> M4 --> M5

    style F4 fill:#e74c3c,color:#fff
    style P4 fill:#27ae60,color:#fff
    style P6 fill:#27ae60,color:#fff
    style M4 fill:#f39c12,color:#fff
```

---

## 8. EVENT HANDLING STRATEGY

### Global Event Delegation

```mermaid
graph TB
    subgraph "Event Delegation Pattern"
        Document[document]
        GlobalListener[Global Click Listener<br/>Attached ONCE in events.js]

        Document -->|addEventListener| GlobalListener
    end

    subgraph "Event Routing"
        GlobalListener -->|Check data-action| Router{Action<br/>Attribute?}

        Router -->|data-action=| Actions[50+ Actions]
    end

    subgraph "Action Handlers"
        A1[registerShot]
        A2[selectShotResult]
        A3[handleGoalClick]
        A4[logout]
        A5[finishMatch]
        A6[resetMatch]
        A7[switchHalf]
        A8[toggleMode]
        A9[...]

        Actions --> A1
        Actions --> A2
        Actions --> A3
        Actions --> A4
        Actions --> A5
        Actions --> A6
        Actions --> A7
        Actions --> A8
        Actions --> A9
    end

    subgraph "Direct Listeners (Re-attached)"
        Forms[Form Submit<br/>Login, Register, Setup]
        FileInputs[File Inputs<br/>Player imports]
        Modals[Modal Close Buttons]
    end

    style GlobalListener fill:#27ae60,color:#fff
    style Router fill:#3498db,color:#fff
    style Forms fill:#e67e22,color:#fff
```

### Event Flow Example

```mermaid
sequenceDiagram
    actor User
    participant DOM
    participant GlobalListener
    participant EventsJS as events.js
    participant ShotsJS as shots.js
    participant State as APP State
    participant UI

    User->>DOM: Click button<br/>data-action="registerShot"<br/>data-player-id="123"
    DOM->>GlobalListener: click event bubbles up
    GlobalListener->>EventsJS: Check e.target.dataset.action

    EventsJS->>EventsJS: action === 'registerShot'
    EventsJS->>ShotsJS: registerShot(playerId=123)

    ShotsJS->>State: APP.events.push(event)
    ShotsJS->>State: PERFORMANCE.invalidateStatsCache()
    ShotsJS->>UI: updateGoalVisualization()
    ShotsJS->>UI: updateStatisticsOnly()

    UI-->>User: Updated display

    Note over GlobalListener,EventsJS: Single listener handles<br/>all actions via delegation
```

---

# DEL 2: IMPLEMENTATION DETAILS

## 9. FILSTRUKTUR

```
handballstats/
├── index.html                      # Inngangspunkt
├── styles.css                      # Global styling
├── firebase.json                   # Firebase hosting config
├── firestore.rules                 # Firestore security rules
├── ARCHITECTURE.md                 # Dette dokumentet
├── DEVELOPMENT_RULES.md            # Utviklingsregler (RED/YELLOW/GREEN zones)
├── SECURITY_RULES.md               # Sikkerhetsregler (auth, validation, XSS)
├── TEST_GUIDE.md                   # Testing guide
├── STORAGE-ANALYSIS-REPORT.md      # Storage architecture analysis
├── js/
│   ├── app.js                      # Main entry point (22 lines)
│   ├── state.js                    # Global state management (127 lines)
│   ├── storage.js                  # localStorage operations (64 lines)
│   ├── firebase-config.js          # Firebase initialization (48 lines)
│   ├── firestore-storage.js        # Firestore operations (277 lines)
│   ├── auth.js                     # Authentication logic (327 lines)
│   ├── events.js                   # Global event handling (562 lines)
│   ├── shots.js                    # Shot registration logic (368 lines)
│   ├── players.js                  # Player management (229 lines)
│   ├── team-roster.js              # Team roster management (307 lines)
│   ├── match.js                    # Match state management
│   ├── history.js                  # Match history
│   ├── timer.js                    # Match timer (204 lines)
│   ├── statistics.js               # Stats calculation (48 lines)
│   ├── utils.js                    # Utilities (264 lines)
│   ├── debug-logger.js             # Debug logging system (245 lines)
│   └── ui/
│       ├── render.js               # Main rendering orchestrator (354 lines)
│       ├── login.js                # Login page
│       ├── register.js             # Registration page
│       ├── reset-password.js       # Password reset page
│       ├── home.js                 # Home page (101 lines)
│       ├── setup.js                # Match setup page (259 lines)
│       ├── match.js                # Match page (427 lines)
│       ├── history.js              # Match history page (168 lines)
│       ├── view-match.js           # View completed match
│       ├── team-roster.js          # Team roster page (220 lines)
│       ├── modals.js               # Modal management (255 lines)
│       ├── event-feed.js           # Live feed (189 lines)
│       └── help.js                 # Help page
└── tests/                          # Test files (Vitest)
    ├── shots.test.js
    ├── state.test.js
    ├── storage.test.js
    └── ...
```

---

## 10. MODULER OG ANSVAR

### Core Modules

#### `app.js`
- **Ansvar:** Application bootstrap
- **Funksjoner:**
  - Initialiserer app ved DOMContentLoaded
  - Loader state fra localStorage
  - Setup global event listeners
  - Initialiserer Firebase auth observer
  - Trigger initial rendering

#### `state.js`
- **Ansvar:** Global state management
- **Exports:**
  - `APP` - Global state object
  - `PERFORMANCE` - Performance optimization utilities
  - Helper functions for accessing current match data
  - `generateUniqueId()` - Unique ID generator for players

**APP State Structure:**
```javascript
{
  // Auth
  currentUser: {uid, email, displayName, homeTeam} | null,

  // Navigation
  page: 'login' | 'register' | 'reset-password' | 'home' | 'setup' |
        'match' | 'history' | 'viewMatch' | 'teamRoster' | 'help',

  // Match Configuration
  matchMode: 'simple' | 'advanced',
  shotRegistrationMode: 'simple' | 'detailed',
  timerConfig: { halfLength: 20 | 25 | 30 },

  // Match Data
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  currentHalf: number,
  players: Player[],
  opponents: Player[],
  activeKeeper: Player | null,
  mode: 'attack' | 'defense',
  events: Event[],

  // Shot Registration State
  tempShot: Shot | null,
  selectedResult: 'mål' | 'redning' | null,
  selectedShooter: playerId | null,
  selectedAttackType: 'etablert' | 'kontring' | null,
  selectedShotPosition: '9m' | '6m' | '7m' | 'ka' | null,
  selectedAssist: playerId | null,
  showShotDetails: boolean,
  shotDetailsData: object | null,

  // Match History
  completedMatches: Match[],
  viewingMatch: Match | null,

  // Team Roster
  savedTeams: SavedTeam[],
  editingTeamId: number | null,
  importingTeamId: number | null,

  // Player Management
  managingTeam: 'players' | 'opponents' | null,
  tempPlayersList: Player[],
  editingPlayerId: number | null,

  // Timer (Advanced Mode)
  timerState: {
    isRunning: boolean,
    currentTime: number,
    intervalId: number | null
  },

  // Internal
  _idCounter: number,
  isImportingFile: boolean
}
```

#### `storage.js`
- **Ansvar:** localStorage operations
- **Funksjoner:**
  - `saveToLocalStorage()` - Debounced save (300ms)
  - `saveToLocalStorageImmediate()` - Immediate save
  - `loadFromLocalStorage()` - Load state on app start

#### `firebase-config.js`
- **Ansvar:** Firebase initialization
- **Exports:** `auth`, `db`, `firebase`

#### `firestore-storage.js`
- **Ansvar:** Cloud storage operations
- **Funksjoner:**
  - `saveMatchToFirestore()` - Save active match
  - `saveMatchToFirestoreDebounced()` - Debounced (1000ms)
  - `loadMatchFromFirestore()` - Load active match
  - `saveCompletedMatchToFirestore()` - Save completed match
  - `loadCompletedMatchesFromFirestore()` - Load all completed
  - `deleteCompletedMatchFromFirestore()` - Delete match
  - `migrateLocalStorageToFirestore()` - First-time migration
  - `syncFromFirestore()` - Sync data on login

**Firestore Structure:**
```
/users/{userId}/
  ├── settings (document)          [FUTURE]
  │   └── preferences
  ├── teamRosters/ (collection)    [FUTURE]
  │   └── {rosterId} (document)
  └── matches/ (collection)
      ├── active (document)        [CURRENT]
      └── {matchId} (document)     [CURRENT]
```

#### `auth.js`
- **Ansvar:** Authentication and user management
- **Funksjoner:**
  - `validateEmail()`, `validatePassword()`
  - `handleRegister()`, `handleLogin()`, `handleLogout()`
  - `handlePasswordReset()`
  - `startNewMatch()` - Reset all match data
  - `continueMatchSetup()` - Continue existing setup
  - `initAuthStateObserver()` - Firebase auth state listener

---

### Business Logic Modules

#### `shots.js` (RED ZONE)
- **Ansvar:** Shot registration logic
- **Funksjoner:**
  - `handleGoalClick()` - Click on goal visualization
  - `selectResult()` - Select mål/redning
  - `selectShooter()` - Select shooter (detailed mode)
  - `selectAttackType()` - Select etablert/kontring
  - `selectShotPosition()` - Select 9m/6m/7m/ka
  - `selectAssist()` - Select assist player
  - `skipAssist()` - Skip assist selection
  - `registerShot()` - Final shot registration
  - `registerTechnicalError()` - Register technical error
  - `deleteEvent()` - Delete event

**Shot Registration Flow (Detailed Mode):**
```
1. User clicks goal → tempShot created
2. User selects result → selectedResult set
3. User selects shooter → selectedShooter set
4. User selects attack type → selectedAttackType set
5. User selects shot position → selectedShotPosition set
6. If goal: User selects assist or skips
7. registerShot() called → event created → state reset
```

#### `players.js` (YELLOW ZONE)
- **Ansvar:** Player management
- **Funksjoner:**
  - `addPlayer()`, `editPlayer()`, `deletePlayer()`
  - `setActiveKeeper()`, `removeActiveKeeper()`
  - `loadPlayersFromFile()` - Import from JSON/CSV/TXT

#### `team-roster.js`
- **Ansvar:** Team roster management
- **Funksjoner:**
  - `saveTeamRoster()` - Save current players as roster
  - `importTeamRoster()` - Import roster to match setup
  - `editTeamRoster()` - Edit saved roster
  - `deleteTeamRoster()` - Delete saved roster
  - `loadTeamRosterFromFile()` - Import roster from file

#### `match.js`
- **Ansvar:** Match state management
- **Funksjoner:**
  - `finishMatch()` - Complete and save match
  - `exportMatchData()` - Export to JSON
  - Statistics calculation helpers

#### `history.js`
- **Ansvar:** Match history management
- **Funksjoner:**
  - `viewMatch()` - View completed match details
  - `deleteMatch()` - Delete from history
  - `backToHistory()` - Navigate back

#### `timer.js` (YELLOW ZONE)
- **Ansvar:** Match timer (advanced mode only)
- **Funksjoner:**
  - `startTimer()`, `pauseTimer()`, `resetTimer()`
  - `setHalfLength()` - Configure half duration
  - `formatTime()` - Format seconds to MM:SS

#### `statistics.js` (RED ZONE)
- **Ansvar:** Calculate statistics from events
- **Funksjoner:**
  - Aggregate shot statistics per player/team
  - Used by shots.js and UI components

---

### UI Modules

All UI modules export a single render function that returns HTML string.

#### `ui/render.js`
- **Ansvar:** Main rendering orchestrator
- **Funksjoner:**
  - `render()` - Routes to correct page renderer
  - Attaches event listeners after rendering

#### `ui/login.js`, `ui/register.js`, `ui/reset-password.js`
- **Ansvar:** Authentication pages
- **Funksjoner:** `renderLoginPage()`, `renderRegisterPage()`, `renderResetPasswordPage()`

#### `ui/home.js`
- **Ansvar:** Home page
- **Funksjoner:**
  - `renderHomePage()` - Shows two buttons:
    - "Start ny kamp" - Calls `startNewMatch()`
    - "Fortsett kamp" - Calls `continueMatchSetup()` (only if data exists)

#### `ui/setup.js`
- **Ansvar:** Match setup page
- **Funksjoner:**
  - `renderSetupPage()` - Full setup interface
  - Match mode toggle (simple/advanced)
  - Shot registration mode toggle (simple/detailed) - only in advanced
  - Timer configuration - only in advanced
  - Player/opponent management
  - File import

#### `ui/match.js`
- **Ansvar:** Live match page
- **Funksjoner:**
  - `renderMatchPage()` - Full match interface
  - Goal visualization
  - Statistics tables
  - Shot popup (modal)
  - Timer display (advanced mode)

#### `ui/history.js`
- **Ansvar:** Match history list
- **Funksjoner:**
  - `renderHistoryPage()` - List all completed matches
  - View/delete actions

#### `ui/view-match.js`
- **Ansvar:** View completed match details
- **Funksjoner:**
  - `renderViewMatchPage()` - Read-only match view
  - Statistics and events from completed match

#### `ui/team-roster.js`
- **Ansvar:** Team roster management page
- **Funksjoner:**
  - `renderTeamRosterPage()` - List all saved rosters
  - Save/edit/delete/import actions

#### `ui/help.js`
- **Ansvar:** Help and documentation page
- **Funksjoner:**
  - `renderHelpPage()` - Comprehensive guide
  - Covers simple and advanced mode
  - Step-by-step instructions

---

## 11. ARKITEKTURPRINSIPPER

### 1. Separation of Concerns
Hver modul har et spesifikt ansvar:
- **UI-moduler:** Rendering av HTML
- **Business logic:** State management og databehandling
- **Storage:** Persistering av data
- **Events:** Håndtering av brukerinteraksjoner

### 2. Immutable State Updates
State oppdateres aldri direkte. Alle endringer går gjennom dedikerte funksjoner som:
1. Oppdaterer APP-objektet
2. Invaliderer cache
3. Trigger re-rendering
4. Lagrer til storage

### 3. Progressive Disclosure
UI viser kun relevant informasjon basert på:
- Valgt modus (simple/advanced)
- Valgt skuddregistreringsmodus (simple/detailed)
- Kampstatus (setup/active/completed)

### 4. Offline-First med Cloud Sync
- **Primær lagring:** localStorage (rask, offline)
- **Backup lagring:** Firestore (persistent, cross-device)
- **Hybrid modell:** Les lokalt, skriv til begge

---

## 12. SKUDDREGISTRERINGSFLYT (DETAILED)

### Simple Mode

1. User clicks goal/outside → `handleGoalClick()`
2. Modal shows: Mål/Redning buttons
3. User selects result → `selectResult()`
4. Modal shows: Player list
5. User selects player → `registerShot()`
6. Event created, stats updated, modal closed

### Detailed Mode (Advanced)

1. User clicks goal/outside → `handleGoalClick()`
2. Modal shows: **Mål/Redning** buttons
3. User selects result → `selectResult()`
4. Modal shows: **Velg skytter** (player list)
5. User selects shooter → `selectShooter()`
6. Modal shows: **Velg type angrep** (Etablert/Kontring)
7. User selects attack type → `selectAttackType()`
8. Modal shows: **Velg skuddposisjon** (9m/6m/7m/KA)
9. User selects position → `selectShotPosition()`
10. If goal: Modal shows **Velg assist** (player list + skip)
11. User selects assist or skips → `selectAssist()` or `skipAssist()`
12. `registerShot()` called automatically
13. Event created with full details, stats updated, modal closed

**Progressive Disclosure:**
- Only one step visible at a time
- Previous selections shown at top
- No scrolling needed on mobile

**Event Data Structure:**
```javascript
{
  id: uniqueId,
  type: 'shot' | 'technicalError',
  team: 'own' | 'opponent',
  player: {id, name, number},
  result: 'mål' | 'redning' | 'utenfor',
  x: number,
  y: number,
  half: number,
  timestamp: ISO string,
  // Detailed mode only:
  attackType: 'etablert' | 'kontring',
  shotPosition: '9m' | '6m' | '7m' | 'ka',
  assist: {id, name, number} | null
}
```

---

## 13. AUTENTISERINGSFLYT

### Registration Flow

```
User fills form
    ↓
validateEmail(), validatePassword()
    ↓
auth.createUserWithEmailAndPassword()
    ↓
Create user profile in Firestore
    ↓
Update displayName
    ↓
Set APP.currentUser
    ↓
Navigate to home
```

### Login Flow

```
User enters credentials
    ↓
auth.signInWithEmailAndPassword()
    ↓
Fetch user profile from Firestore
    ↓
Set APP.currentUser
    ↓
migrateLocalStorageToFirestore() [first time]
    ↓
syncFromFirestore()
    ↓
Navigate to home
```

### Auth State Persistence

```
App starts
    ↓
initAuthStateObserver() registered
    ↓
Firebase checks persisted auth state
    ↓
If authenticated: auto-login
    ↓
If not: show login page
```

---

## 14. LAGRINGSARKITEKTUR (DETAILS)

### Hybrid Storage Model

Systemet bruker en **hybrid lagringsmodell** med localStorage som primær lagring og Firestore som cloud backup.

#### localStorage (Primær)

**Hva lagres:**
- Hele `APP`-objektet serialiseres til JSON
- Inkluderer ALL state data (se STORAGE-ANALYSIS-REPORT.md)

**Strategi:**
- Debounced save (300ms) for normal bruk
- Immediate save for kritiske operasjoner (login, logout, match finish)

**Fordeler:**
- ⚡ Rask tilgang (synkron)
- 📴 Offline-støtte
- 🆓 Gratis

**Ulemper:**
- 📱 Kun én enhet
- 🗑️ Kan slettes av bruker
- 💾 Begrenset størrelse (~5-10MB)

#### Firestore (Cloud Backup)

**Hva lagres:**
- Aktiv kamp (`/users/{userId}/matches/active`)
- Avsluttede kamper (`/users/{userId}/matches/{matchId}`)
- ✅ Lagrede spillerstall (`/users/{userId}/teamRosters/{rosterId}`) - **IMPLEMENTERT 2026-01-21**
- ✅ Brukerpreferanser (`/users/{userId}.preferences`) - **IMPLEMENTERT 2026-01-22**
  - `matchMode` (simple/advanced)
  - `shotRegistrationMode` (simple/detailed)
  - `timerConfig.halfLength` (20/25/30 min)

**Resultat:** ALL brukerdata synkroniseres nå sømløst på tvers av enheter ✅

**Strategi:**
- Debounced save (1000ms) for aktiv kamp
- Immediate save ved kamp ferdig
- Load ved login/auth state change

**Fordeler:**
- ☁️ Cloud backup
- 📱 Cross-device (potensielt)
- 👥 Deling (potensielt)
- ♾️ Ubegrenset størrelse

**Ulemper:**
- 💰 Kostnader (read/write operations)
- 🌐 Krever internett
- ⏱️ Asynkron (latency)

### Synkroniseringsflyt

**Save Flow:**
```
User Action
    ↓
saveToLocalStorage() [300ms debounce]
    ↓
localStorage.setItem('handballApp', JSON.stringify(APP))
    ↓
saveMatchToFirestoreDebounced() [1000ms debounce]
    ↓
Firestore: /users/{userId}/matches/active
```

**Load Flow:**
```
Firebase Auth
    ↓
initAuthStateObserver()
    ↓
migrateLocalStorageToFirestore() [første gang]
    ↓
syncFromFirestore()
    ↓
Merge: Local + Firestore data
    ↓
render()
```

**Merge Strategy:**
- Events: Merge by ID (Map-based deduplication)
- Players/Opponents: Prefer local if exists
- Match info: Prefer local if modified recently
- Conflicts resolved by newest timestamp

### Kjente Problemer

Se **STORAGE-ANALYSIS-REPORT.md** for historisk kontekst.

**Alle kjente lagringsproblemer er nå løst:**
- ✅ Lagrede spillerstall synkroniseres (Fixed 2026-01-21)
- ✅ Brukerpreferanser synkroniseres (Fixed 2026-01-22)
- ✅ Full cross-device sync implementert (Fase 2 fullført)

---

## 15. SIKKERHETSARKITEKTUR

### Firebase Security Rules

**Firestore Rules (firestore.rules):**
```
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;

  match /matches/{matchId} {
    allow read, write: if request.auth.uid == userId;
  }

  match /teamRosters/{rosterId} {
    allow read, write: if request.auth.uid == userId;
  }
}
```

**Prinsipper:**
- Brukere kan kun lese/skrive egne data
- Match data isolert per bruker
- Ingen public data

### Input Validation

**Email Validation:**
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Required field check

**Password Validation:**
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number

**Player Input:**
- Number: 1-99
- Name: Required, trimmed
- Duplicate number check

### XSS Protection

All user input is escaped when rendering:
- HTML special characters escaped
- No `innerHTML` with user data unless sanitized
- Use textContent for user-provided strings

### Data Sanitization

**File Import:**
- JSON: `JSON.parse()` with try-catch
- CSV/TXT: Line-by-line parsing with validation
- Race condition lock: `APP.isImportingFile`

**Se SECURITY_RULES.md for fullstendige detaljer.**

---

## 16. YTELSESOPTIMALISERING

### 1. Statistics Caching

**Problem:** Recalculating stats on every render is expensive

**Solution:** Cache calculations with versioned keys

```javascript
PERFORMANCE.getCachedStats(key, calculator);
```

**Cache Invalidation:**
- When events change
- When players change
- When cache size exceeds limit (500 entries)

### 2. Debounced Storage

**Problem:** Writing to localStorage/Firestore on every state change is slow

**Solution:** Debounced writes

- **localStorage:** 300ms debounce
- **Firestore:** 1000ms debounce

**Exceptions:** Immediate save for critical operations

### 3. Selective DOM Updates

**Problem:** Full page re-render is expensive

**Solution:** Update only affected parts

- Modal content updates without full re-render
- Statistics table updates without full re-render
- Goal visualization updates without full re-render

### 4. Event Delegation

**Problem:** Attaching individual listeners to many buttons is slow

**Solution:** Single listener on document body

### 5. ID Generation Optimization

**Problem:** Generating unique IDs with collision detection is slow

**Solution:** Timestamp + counter approach

```javascript
generateUniqueId() {
  return Date.now() + APP._idCounter++;
}
```

---

## 17. FREMTIDIG ARKITEKTUR

### Fase 2: Full Cloud Sync

**Mål:** Synkroniser ALL data til Firestore

**Status:** ✅ **FULLFØRT 2026-01-22** (100%)

**1. Team Rosters Collection:** ✅ **FULLFØRT 2026-01-21**
```
/users/{userId}/teamRosters/{rosterId}
{
  id, name, players[], updatedAt, ownerId
}
```

**Implementerte funksjoner:**
- ✅ `saveTeamRosterToFirestore(team)` - Lagre enkelt spillerstall
- ✅ `saveAllTeamRostersToFirestore()` - Lagre alle spillerstall
- ✅ `loadTeamRostersFromFirestore()` - Laste spillerstall fra cloud
- ✅ `deleteTeamRosterFromFirestore(teamId)` - Slette spillerstall
- ✅ Integrert i `syncFromFirestore()` - Automatisk merge ved innlogging
- ✅ Integrert i `migrateLocalStorageToFirestore()` - Migrering av eksisterende data
- ✅ Security rules implementert i `firestore.rules`

**2. User Preferences:** ✅ **FULLFØRT 2026-01-22**
```
/users/{userId} (Document)
{
  preferences: {
    matchMode: 'simple' | 'advanced',
    shotRegistrationMode: 'simple' | 'detailed',
    timerConfig: { halfLength: 20 | 25 | 30 }
  },
  updatedAt: timestamp,
  ownerId: string
}
```

**Implementerte funksjoner:**
- ✅ `saveUserPreferencesToFirestore()` - Lagre preferanser
- ✅ `loadUserPreferencesFromFirestore()` - Laste preferanser
- ✅ Integrert i `syncFromFirestore()` - Laste ved innlogging
- ✅ Automatisk save ved endring av preferanser (events.js)
- ✅ Integrert i `migrateLocalStorageToFirestore()` - Migrering av preferanser
- ✅ Security rules oppdatert med dokumentasjon

**Benefits (Oppnådd):**
- ✅ Full cross-device sync for ALL data
- ✅ No data loss on device switch
- ✅ Consistent user experience på tvers av enheter

### Fase 3: Advanced Analytics

**Mål:** Advanced statistics and insights

**Features:**
- Sesongstatistikk
- Spillersammenligning
- Trendanalyse
- Varmekart (heatmaps)
- Shot efficiency by position/type
- Defensive patterns

### Fase 4: Team Collaboration

**Mål:** Multi-user access and collaboration

**Features:**
- Dele kamper med trenerteam
- Forskjellige roller (admin, coach, analyst)
- Real-time collaboration
- Kommentarer og notater

---

## 18. ARKITEKTUR-INSIGHTS

### Styrker

1. **Enkel State Management**
   - Ett globalt objekt, lett å debugge
   - Ingen kompleks state-synkronisering

2. **Dual Persistence**
   - localStorage for rask tilgang
   - Firestore for backup og sync
   - Debouncing reduserer database-writes

3. **Event Delegation**
   - Ett event listener for alle knapper
   - Ingen listener leaks fra knapper
   - Fungerer med dynamisk DOM

4. **Partial Updates**
   - Ikke full re-render ved hver endring
   - Bedre ytelse på store kamper

5. **Versioned Caching**
   - Enkel invalidering (increment version)
   - Lazy evaluation av stats

6. **Modular Structure**
   - Clear separation of concerns
   - Easy to locate functionality
   - Testable units

7. **Progressive Disclosure**
   - Adaptive UI based on mode
   - Mobile-optimized flows
   - Reduced cognitive load

### Svakheter

1. **Global State**
   - Ingen innkapsling
   - Lett å mutere feil fra hvor som helst
   - Vanskelig å skalere

2. **Modal Event Listeners**
   - Re-attached ved hver render
   - Potensielle memory leaks

3. **Ingen TypeScript**
   - Ingen compile-time validering
   - Vanskelig å refaktorere trygt

4. **Stor events.js**
   - 562 linjer, vanskelig å vedlikeholde
   - Bør splittes i moduler

5. **Race Conditions**
   - Debounced saves kan miste data
   - Timing issues ved rask input

6. **Complete Cloud Sync** ✅
   - ✅ Team rosters synced (Fixed 2026-01-21)
   - ✅ User preferences synced (Fixed 2026-01-22)
   - ✅ No data loss on device switch
   - Full cross-device synchronization achieved

### Forbedringspotensial

1. Introduser state setter-funksjoner med validering
2. Implementer modal state machine
3. Split events.js i feature-moduler
4. Legg til TypeScript (gradvis migrasjon)
5. Implementer konfliktløsning for Firestore sync
6. Legg til comprehensive error handling
7. ✅ Complete cloud sync implementation (Fase 2 - FULLFØRT 2026-01-22)
8. Add comprehensive test coverage
9. Implement optimistic updates for better UX
10. Add offline queue for Firestore writes

---

## Konklusjon

Handball Analytics følger en moderne, modular arkitektur med klar separasjon av ansvar. Hybrid storage-modellen gir både offline-støtte og cloud backup. Systemet er bygget for skalerbarhet med god ytelse selv ved mange registreringer.

**Styrker:**
- ✅ Modular struktur
- ✅ Clear separation of concerns
- ✅ Offline-first med cloud backup
- ✅ Progressive disclosure for bedre UX
- ✅ Performance optimizations
- ✅ Comprehensive security rules
- ✅ Visuell dokumentasjon (Mermaid)
- ✅ Detaljerte implementasjonsdetaljer

**Kjente Begrensninger:**
- ✅ Lagrede spillerstall nå synkronisert (Fixed 2026-01-21)
- ✅ Brukerpreferanser nå synkronisert (Fixed 2026-01-22)
- ❌ Global state med begrenset innkapsling
- ❌ Ingen TypeScript

**Neste Steg:**
1. ✅ Fase 2 fullført - Full cloud sync implementert
2. Implementer advanced analytics (Fase 3 - se PHASE_IMPLEMENTATION_PLAN.md)
3. Legg til comprehensive test coverage
4. Vurder team collaboration features (Fase 4)
5. Gradvis TypeScript migrasjon
6. Refaktorer events.js til moduler

**Se også:**
- **DEVELOPMENT_RULES.md** - Regler for kodeendringer (RED/YELLOW/GREEN zones)
- **SECURITY_RULES.md** - Sikkerhet, autentisering, og validering
- **TEST_GUIDE.md** - Testing guide og best practices
- **STORAGE-ANALYSIS-REPORT.md** - Detaljert analyse av lagringsarkitektur

---

**Dokument versjon:** 3.4 (Fase 2 Fullført - Full Cloud Sync)
**Sist oppdatert:** 2026-01-22
**Laget av:** Claude Code Agent
**Endringer:**
- v3.4 (2026-01-22): Fase 2 fullført - Brukerpreferanser synkronisering implementert
- v3.3 (2026-01-21): Implementert Firebase-synkronisering for team rosters (Fase 2 50% fullført)
- v3.2 (2026-01-20): Merged v3.0 (main) + v3.1 (feature branch)
