# Learner ID Setup Guide

## Overview

This guide explains how to add support for storing a learner identification number (LRN) in the profiles table. The `learner_id` field collected during registration will be stored in the profiles table alongside other user information like first name, last name, section, and gender.

## Database Architecture

### Current Structure

```
┌─────────────────┐         ┌──────────────────┐
│  auth.users     │         │  profiles        │
│  (Supabase)     │         │                  │
│                 │         │                  │
│  id (UUID)      │◄────────│  id (UUID) PK    │
│  email          │         │  first_name      │
│  ...            │         │  last_name       │
└─────────────────┘         │  section         │
                            │  gender          │
                            │  learner_id ✨   │  ← NEW COLUMN
                            └──────────────────┘
                                      │
                                      │ (foreign key)
                                      ▼
                            ┌──────────────────┐
                            │  assessments     │
                            │                  │
                            │  id (UUID) PK    │
                            │  learner_id FK   │  ← References profiles.id
                            │  task_a_score    │
                            │  task_b_score    │
                            │  ...             │
                            └──────────────────┘
```

### Important Notes

- The `learner_id` column in the **profiles** table stores the student's identification number (e.g., "LRN-12345678")
- The `learner_id` column in the **assessments** table is a UUID foreign key that references `profiles.id`
- These are different fields with the same name but serving different purposes

## Step 1: Update the Profiles Table

### Apply the Migration

Run the migration script to add the `learner_id` column to the profiles table:

```bash
# Navigate to your project directory
cd /Users/mlmejo/develop/rmarpg

# The migration file is located at:
# db/migrations/2026-02-03-0001_add_learner_id_to_profiles.sql
```

**Execute the SQL in Supabase:**

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `db/migrations/2026-02-03-0001_add_learner_id_to_profiles.sql`:

```sql
BEGIN;

-- 1) Add learner_id column to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS learner_id TEXT NULL;

-- 2) Add unique constraint to ensure learner_id is unique
ALTER TABLE public.profiles
  ADD CONSTRAINT unique_learner_id UNIQUE (learner_id);

-- 3) Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_learner_id
  ON public.profiles (learner_id);

-- 4) Add comment to document the column
COMMENT ON COLUMN public.profiles.learner_id IS
  'Student learner identification number (LRN) collected during registration';

COMMIT;
```

6. Click **Run** or press `Ctrl/Cmd + Enter`
7. Verify the migration succeeded (you should see "Success. No rows returned")

### Verify the Migration

Run this query to confirm the column was added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'learner_id';
```

Expected result:

```
column_name | data_type | is_nullable
------------|-----------|-------------
learner_id  | text      | YES
```

## Step 2: Update Supabase Auth Trigger

The `learner_id` value from registration is passed through Supabase Auth's metadata. You need to ensure your database trigger (or edge function) copies this data to the profiles table.

### Check Existing Trigger

First, check if you have an existing trigger that creates profiles:

```sql
-- List triggers on auth.users
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';
```

### Create or Update the Trigger Function

If you don't have a trigger, create one. If you do, update it to include `learner_id`:

```sql
-- Create or replace the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    learner_id,
    section,
    gender,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'learner_id',  -- ✨ Add this line
    COALESCE(NEW.raw_user_meta_data->>'section', 'Rose'),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'male'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Test the Trigger

1. Create a test user through your registration form
2. Verify the data was copied correctly:

```sql
SELECT
  id,
  first_name,
  last_name,
  learner_id,
  section,
  gender
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;
```

## Step 3: Frontend is Already Configured ✅

The `Register.vue` component is already set up correctly! It already includes:

1. **Form field** (lines 85-94):

```vue
<div class="mt-4 grid gap-2">
  <Label for="learner_id">Learner ID</Label>
  <Input
    type="text"
    name="learner_id"
    id="learner_id"
    placeholder="e.g. LRN-12345678"
    required
  />
</div>
```

2. **Payload construction** (lines 32-44):

```typescript
const payload = {
  email: formData.get('email') as string,
  password: formData.get('password') as string,
  options: {
    data: {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      learner_id: formData.get('learner_id') as string, // ✨ Already included
      section: section.value,
      gender: gender.value,
    },
  },
}
```

No frontend changes are needed!

## Step 4: Update Row Level Security (RLS) Policies

Ensure users can read and update their own learner_id:

```sql
-- Allow users to read their own profile including learner_id
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles (adjust role check to your needs)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND first_name = 'Administrator'
    )
  );
```

## Step 5: Display Learner ID in UI

To display the learner ID in your application (e.g., leaderboards, scoresheets), update your queries to include it:

### Example: Update Leaderboard Component

In `src/components/Leaderboard.vue`, update the query to include `learner_id`:

```typescript
const { data: grouped, error } = await supabase.from('assessments').select(`
    id,
    total_score,
    grade_level,
    created_at,
    profiles!learner_id (
      first_name,
      last_name,
      learner_id,        # ✨ Add this line
      section
    )
  `)
// ... rest of query
```

### Example: Update Scoresheet View

In `src/views/Scoresheet.vue`, include `learner_id` in the select:

```typescript
const { data: grouped, error } = await supabase.from('assessments').select(`
    *,
    profiles!learner_id (
      first_name,
      last_name,
      learner_id,        # ✨ Add this line
      section
    )
  `)
// ... rest of query
```

Then display it in your template:

```vue
<td>{{ assessment.profiles?.learner_id || 'N/A' }}</td>
```

## Testing Checklist

- [ ] Migration applied successfully in Supabase
- [ ] `learner_id` column exists in profiles table
- [ ] Unique constraint is active (try inserting duplicate learner IDs)
- [ ] Trigger function updated to copy learner_id from auth metadata
- [ ] Register a new test user with a learner ID
- [ ] Verify learner_id appears in profiles table
- [ ] RLS policies allow users to see their own learner_id
- [ ] Leaderboard/Scoresheet displays learner ID correctly
- [ ] Try registering with duplicate learner ID (should fail)

## Rollback

If you need to revert this change:

```sql
BEGIN;

-- Remove the index
DROP INDEX IF EXISTS public.idx_profiles_learner_id;

-- Remove the unique constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS unique_learner_id;

-- Remove the column
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS learner_id;

COMMIT;
```

Also update the trigger function to remove the learner_id line.

## Troubleshooting

### Issue: Learner ID not saving during registration

**Check:**

1. Verify the trigger function includes `learner_id` in the INSERT statement
2. Check browser console for any JavaScript errors
3. Verify Supabase response in Network tab (DevTools)
4. Run this query to see what metadata was saved:

```sql
SELECT id, email, raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;
```

### Issue: Duplicate learner ID error

**This is expected behavior!** The unique constraint prevents duplicate student IDs. If you need to:

- Update an existing learner_id: Use an UPDATE query
- Allow duplicates: Remove the unique constraint (not recommended)

### Issue: NULL values in learner_id column

**Possible causes:**

1. User registered before the column was added (backfill existing users)
2. Trigger function not running (check trigger exists)
3. Form validation not enforcing required field

**Solution for existing users:**

```sql
-- Check which users have NULL learner_id
SELECT id, email, first_name, last_name, learner_id
FROM public.profiles
WHERE learner_id IS NULL;

-- Manually update if needed
UPDATE public.profiles
SET learner_id = 'LRN-XXXXXXXX'
WHERE id = 'user-uuid-here';
```

## Benefits

✅ Unique student identification across the system  
✅ Better tracking and reporting capabilities  
✅ Supports school-wide learner numbering systems  
✅ Prevents duplicate student registrations  
✅ Enables integration with external student information systems

## Next Steps

Consider these enhancements:

1. **Validation**: Add format validation for learner IDs (e.g., must match "LRN-XXXXXXXX")
2. **Search**: Add search functionality to find students by learner ID
3. **Reports**: Generate reports grouped by learner ID
4. **Import**: Create bulk import tool for existing students with learner IDs
5. **Export**: Add learner ID to CSV/Excel exports

---

**Last Updated:** February 3, 2026  
**Migration File:** `db/migrations/2026-02-03-0001_add_learner_id_to_profiles.sql`
