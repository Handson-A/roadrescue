/**
 * Supabase Migration: Enable Required Extensions
 * Timestamp: 2026-05-21 00:00:01
 */

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enable HTTP extension for webhooks
CREATE EXTENSION IF NOT EXISTS "http";
