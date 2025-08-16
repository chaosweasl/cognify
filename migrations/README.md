# Database Migrations

This directory contains SQL migration scripts for the Cognify database.

## Current Status

The database schema is in sync with the application as of the fixes applied in this PR. The constraints are properly defined as:

### Daily Study Stats Constraints

1. **Project-specific stats**: `daily_study_stats_user_project_date_unique` 
   - Columns: `(user_id, project_id, study_date)`
   - Used when `project_id` is NOT NULL

2. **Global stats**: `daily_study_stats_user_global_date_unique`
   - Columns: `(user_id, study_date)` 
   - Used when `project_id` IS NULL
   - This is a partial unique index: `WHERE (project_id IS NULL)`

## Fixed Issues

- ✅ **Daily Study Stats ON CONFLICT**: Fixed application code to use correct constraint specifications
- ✅ **Project vs Global Stats**: Properly separate per-project and global statistics

## How to Apply Migrations

If you need to apply any future migrations:

1. Connect to your Supabase database
2. Run the SQL files in order
3. Update this README with the migration details

## Schema Reference

Current schema is documented in `/schema-dump.sql` at the project root.