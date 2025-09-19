# Assumptions & Goals for LiveRC Ingestion and Analytics

**Author:** Jayson + The Brainy One  
**Date:** 2025-09-20  
**License:** MIT

## Assumptions

- LiveRC does not present a single on-screen, multi-driver, lap-by-lap comparison table for a race; each driver’s laps open individually.

## Goals

1. **All My Laps at a Track (Ever):** Provide per-driver, cross-event lap history at a venue with flexible filters and summary statistics.
2. **Multi-Driver Lap Comparison:** Offer a unified table organized by lap number, including lap deltas and highlighting the fastest driver per lap.

## Implications

- These two views are first-class experiences; ingestion pipelines and the data model must explicitly support them.
