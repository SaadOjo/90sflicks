# Schema

## Database
- Cloudflare D1 database
- SQLite dialect

## Drizzle tables
- `movie`
- `genre`
- `movie_genre`
- `person`
- `movie_person`
- `company`
- `movie_company`

## Enums stored as text

### movie_person.role_type
- `director`
- `writer`
- `producer`
- `cast`

### movie_company.role_type
- `production`
- `distribution`

## Tables

### movie
Columns:
- `id` integer primary key
- `title` text not null
- `release_year` integer not null
- `release_date` text null
- `film_type` text null
- `budget` integer null
- `box_office` integer null
- `created_at` text not null
- `updated_at` text not null

Indexes:
- index on `release_year`
- index on `film_type`

### genre
Columns:
- `id` integer primary key
- `name` text not null unique

### movie_genre
Columns:
- `movie_id` integer not null
- `genre_id` integer not null

Constraints:
- primary key (`movie_id`, `genre_id`)
- foreign key `movie_id` -> `movie.id`
- foreign key `genre_id` -> `genre.id`

Indexes:
- index on `genre_id`

### person
Columns:
- `id` integer primary key
- `name` text not null
- `created_at` text not null
- `updated_at` text not null

Indexes:
- index on `name`

### movie_person
Columns:
- `movie_id` integer not null
- `person_id` integer not null
- `role_type` text not null
- `credit_order` integer null

Constraints:
- primary key (`movie_id`, `person_id`, `role_type`)
- foreign key `movie_id` -> `movie.id`
- foreign key `person_id` -> `person.id`

Indexes:
- index on (`person_id`, `role_type`)
- index on (`movie_id`, `role_type`)

### company
Columns:
- `id` integer primary key
- `name` text not null unique
- `created_at` text not null
- `updated_at` text not null

Indexes:
- index on `name`

### movie_company
Columns:
- `movie_id` integer not null
- `company_id` integer not null
- `role_type` text not null

Constraints:
- primary key (`movie_id`, `company_id`, `role_type`)
- foreign key `movie_id` -> `movie.id`
- foreign key `company_id` -> `company.id`

Indexes:
- index on (`company_id`, `role_type`)
