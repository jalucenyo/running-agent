## MODIFIED Requirements

### Requirement: List activities command
The CLI SHALL provide an `activities list` command that retrieves and displays the authenticated user's Strava activities in the terminal. The system SHALL always display metric columns from the SummaryActivity response using **adaptive columns**: columns where ALL activities on the page have no data (`—`) are hidden automatically.

#### Scenario: Successful activity listing
- **WHEN** the user runs `strava activities list` with a valid stored OAuth token
- **THEN** the system SHALL fetch activities from `GET /athlete/activities` and print them as a formatted table with base columns (name, date, distance, time, type) plus metric columns (HR avg, HR max, Elev gain, Cadence, Power avg, Pace avg) where at least one activity has data

#### Scenario: Adaptive columns hiding
- **WHEN** the user runs `strava activities list` and no activity on the page has heart rate data
- **THEN** the system SHALL hide the HR avg and HR max columns from the table

#### Scenario: Listing with missing metrics on some activities
- **WHEN** the user runs `strava activities list` and some activities lack certain metrics (e.g., no heart rate sensor, no power meter) but at least one activity has the metric
- **THEN** the system SHALL display the column and show `—` for activities where data is not available

#### Scenario: Empty activity list
- **WHEN** the Strava API returns an empty array of activities
- **THEN** the system SHALL display a message indicating no activities were found

## ADDED Requirements

### Requirement: Extended activity schema
The `stravaActivitySchema` SHALL parse optional metric fields from the SummaryActivity response: `average_heartrate`, `max_heartrate`, `has_heartrate`, `total_elevation_gain`, `elev_high`, `elev_low`, `average_cadence`, `average_watts`, `max_watts`, `weighted_average_watts`, `average_speed`, `max_speed`, `calories`, `suffer_score`.

#### Scenario: Activity with all metrics
- **WHEN** the API returns an activity with heartrate, elevation, cadence, watts, and speed fields
- **THEN** the schema SHALL parse all fields successfully

#### Scenario: Activity without optional metrics
- **WHEN** the API returns a manual activity without heartrate, watts, or cadence fields
- **THEN** the schema SHALL parse successfully with missing fields as undefined

### Requirement: Logger-based output
The `activities list` command SHALL use the project's `createLogger(flags)` system for all output, supporting interactive (TTY with spinners), JSON (`--json`), and raw (`--raw`) output modes consistently with other CLI commands.

#### Scenario: Basic listing with JSON output
- **WHEN** the user runs `strava activities list --json`
- **THEN** the system SHALL output a JSON array of activity objects including all parsed fields from the extended schema

#### Scenario: Basic listing with raw output
- **WHEN** the user runs `strava activities list --raw`
- **THEN** the system SHALL output the plain text table without interactive decorations (no spinner, no intro/outro)

#### Scenario: Interactive listing with spinner
- **WHEN** the user runs `strava activities list` in a TTY terminal
- **THEN** the system SHALL display a spinner while fetching activities from the API

### Requirement: Detailed flag

_(Eliminado — las métricas se muestran siempre con columnas adaptativas. No existe flag `--detailed`.)_

### Requirement: Pace calculation
The system SHALL compute average pace (min/km) from `distance` and `moving_time` fields already present in the activity, without requiring streams.

#### Scenario: Activity with distance and moving time
- **WHEN** an activity has distance=5000 (meters) and moving_time=1500 (seconds)
- **THEN** the system SHALL display pace as `5:00` (min/km)

#### Scenario: Activity with zero distance
- **WHEN** an activity has distance=0
- **THEN** the system SHALL display `—` for pace
