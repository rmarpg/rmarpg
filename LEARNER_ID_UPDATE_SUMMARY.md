# Learner ID Implementation Summary

## Changes Made

### 1. Database Migration Created

**File**: `db/migrations/2026-02-03-0001_add_learner_id_to_profiles.sql`

Added `learner_id` column to the `profiles` table to store student identification numbers (e.g., "LRN-12345678").

### 2. Frontend Components Updated

#### Summary.vue (`src/views/Summary.vue`)

- **Line 508**: Added `learner_id` to the profiles join query
  ```typescript
  .select(`*, profiles!learner_id ( first_name, last_name, section, learner_id )`)
  ```
- **Line 84**: Changed display from UUID to actual learner ID
  ```vue
  <td class="px-3 py-2">{{ r.assessment?.profiles?.learner_id || 'N/A' }}</td>
  ```

#### Scoresheet.vue (`src/views/Scoresheet.vue`)

- **Lines 29-35**: Added `learner_id` to the profiles join query
  ```typescript
  profiles!learner_id (
    first_name,
    last_name,
    section,
    learner_id
  )
  ```
- **Line 451**: Changed display from UUID slice to actual learner ID
  ```vue
  <td class="border border-gray-300 px-2 py-3 font-mono text-xs lg:px-3">
    {{ assessment.profiles?.learner_id || 'N/A' }}
  </td>
  ```

### 3. Register Component (Already Configured ✅)

**File**: `src/views/Register.vue`

No changes needed - already includes learner_id field and sends it in the registration payload.

## Database Architecture

### Key Understanding

The system has TWO different fields named `learner_id`:

1. **`profiles.learner_id`** (TEXT)
   - Stores the student's identification number (e.g., "LRN-12345678")
   - NEW column added by this update
   - Displayed in Scoresheet and Summary views

2. **`assessments.learner_id`** (UUID)
   - Foreign key referencing `profiles.id`
   - Used for database relationships
   - NOT changed by this update

### Data Flow

```
Registration Form
    ↓ (learner_id: "LRN-12345678")
Supabase Auth Metadata
    ↓ (raw_user_meta_data)
Database Trigger
    ↓
profiles.learner_id = "LRN-12345678"
    ↑
    │ (JOIN on assessments.learner_id → profiles.id)
    │
assessments.learner_id (UUID foreign key)
```

## What Was NOT Changed

### useAssessment Composable

**File**: `src/composables/useAssessment.ts`

The composable continues to use `user.id` (UUID) for the `assessments.learner_id` field. This is **CORRECT** because:

- `assessments.learner_id` is a UUID foreign key to `profiles.id`
- It should reference the profile's internal ID, not the student's identification number
- Changing this would break the database relationships

## Next Steps

### Required: Database Setup

1. **Run the migration** in Supabase SQL Editor:

   ```bash
   # File: db/migrations/2026-02-03-0001_add_learner_id_to_profiles.sql
   ```

2. **Create/update the auth trigger** to copy learner_id from registration:

   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (
       id,
       first_name,
       last_name,
       learner_id,  -- ✨ Add this
       section,
       gender,
       created_at,
       updated_at
     )
     VALUES (
       NEW.id,
       COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
       COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
       NEW.raw_user_meta_data->>'learner_id',  -- ✨ Add this
       COALESCE(NEW.raw_user_meta_data->>'section', 'Rose'),
       COALESCE(NEW.raw_user_meta_data->>'gender', 'male'),
       NOW(),
       NOW()
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

3. **Test with a new user registration**

### Optional: Backfill Existing Users

If you have existing users without learner IDs:

```sql
-- View users missing learner_id
SELECT id, email, first_name, last_name, learner_id
FROM public.profiles
WHERE learner_id IS NULL;

-- Manual update example
UPDATE public.profiles
SET learner_id = 'LRN-XXXXXXXX'
WHERE id = 'user-uuid-here';
```

## Testing Checklist

- [ ] Migration applied successfully in Supabase
- [ ] Auth trigger updated to handle learner_id
- [ ] Register new test user with learner ID
- [ ] Verify learner_id saved in profiles table
- [ ] Check Summary.vue displays learner ID correctly
- [ ] Check Scoresheet.vue displays learner ID correctly
- [ ] Verify "N/A" shows for users without learner IDs
- [ ] Test unique constraint (duplicate learner IDs should fail)

## Display Behavior

### Before This Update

- Summary.vue: Displayed first 8 characters of UUID (e.g., "a3b4c5d6")
- Scoresheet.vue: Displayed first 8 characters of UUID (e.g., "a3b4c5d6")

### After This Update

- Summary.vue: Displays actual learner ID (e.g., "LRN-12345678") or "N/A"
- Scoresheet.vue: Displays actual learner ID (e.g., "LRN-12345678") or "N/A"

## Files Modified

1. ✅ `src/views/Summary.vue` - Updated query and display
2. ✅ `src/views/Scoresheet.vue` - Updated query and display
3. ✅ `db/migrations/2026-02-03-0001_add_learner_id_to_profiles.sql` - Created migration
4. ✅ `LEARNER_ID_SETUP_GUIDE.md` - Created comprehensive guide
5. ✅ `LEARNER_ID_UPDATE_SUMMARY.md` - This file

## Files NOT Modified (and why)

1. ❌ `src/views/Register.vue` - Already configured correctly
2. ❌ `src/composables/useAssessment.ts` - Uses correct UUID reference
3. ❌ `src/components/Leaderboard.vue` - Doesn't display learner IDs in UI

---

**Date**: February 3, 2026  
**Status**: Frontend complete, database setup required  
**Breaking Changes**: None (backward compatible - shows "N/A" for missing learner IDs)
