# Graph Report - c:\Users\Regondi Calidad\Desktop\QM\NefroTrack  (2026-11-17)

## Corpus Check
- Corpus is ~16,989 words - fits in a single context window. You may not need a graph.

## Summary
- 166 nodes · 376 edges · 10 communities (6 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7

## God Nodes (most connected - your core abstractions)
1. `runAllTests()` - 37 edges
2. `NefroTrackApp` - 35 edges
3. `NefroTrackCacheService` - 24 edges
4. `Formatters` - 12 edges
5. `keywords` - 10 edges
6. `CryptoSeal` - 9 edges
7. `Sanitizer` - 9 edges
8. `MemoryStorageFallback` - 6 edges
9. `scripts` - 5 edges
10. `DialyzerReuseSafetyEngine` - 5 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (10 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (19): INITIAL_DEMO_DATA, DIALYZER_STATUS, DialyzerReuseSafetyEngine, REUSE_NORMATIVE_LIMITS, OsmosisWaterQualityGateEngine, WATER_GATE_STATUS, WATER_QUALITY_THRESHOLDS, ROOM_SECTORS (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (6): NefroTrackCacheService, assert(), assertCloseTo(), assertEqual(), runAllTests(), test()

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (21): author, description, keywords, license, name, scripts, security:full, test (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, lang, name, scope, short_name (+2 more)

## Knowledge Gaps
- **36 isolated node(s):** `name`, `short_name`, `description`, `start_url`, `scope` (+31 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NefroTrackApp` connect `Community 1` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Why does `runAllTests()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `NefroTrackCacheService` connect `Community 2` to `Community 0`, `Community 6`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **What connects `name`, `short_name`, `description` to the rest of the system?**
  _36 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1402116402116402 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1282051282051282 - nodes in this community are weakly interconnected._