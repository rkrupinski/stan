---
sidebar_position: 1
description: Minimal, type-safe state management
slug: /
---

# Introduction

Stan (Polish for "state") builds on ideas from [Recoil](https://recoiljs.org) and [Jotai](https://jotai.org), without getting bogged down by questionable extras. Rather than chasing edge cases, it focuses on proven, battle-tested patterns. Despite its minimal footprint, it's fully capable of handling everything from your TODO lists to the Large Hadron Collider at CERN.

![](/img/graph.svg)

Key Features:

- **Type-safe**. Stan harnesses the power of generics and type inference to deliver a great developer experience.
- **Simple**. A minimal yet sufficient API.
- **Composable**. Stan lets you build both flat and deeply nested state graphs. These update efficiently thanks to caching and subscription tracking.
- **Framework-agnostic**. While Stan can theoretically work with any framework, it depends on none.
