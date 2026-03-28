## ADDED Requirements

### Requirement: List activities command
The CLI SHALL provide an `activities list` command that retrieves and displays the authenticated user's Strava activities in the terminal.

#### Scenario: Successful activity listing
- **WHEN** the user runs `strava activities list` with a valid stored OAuth token
- **THEN** the system SHALL fetch activities from `GET /athlete/activities` and print them as a formatted table with columns: name, date, distance (km), moving time (min), and sport type

#### Scenario: Empty activity list
- **WHEN** the Strava API returns an empty array of activities
- **THEN** the system SHALL display a message indicating no activities were found

### Requirement: Pagination flags
The `activities list` command SHALL accept `--page` and `--per-page` flags to control which page of results is returned.

#### Scenario: Custom page size
- **WHEN** the user runs `strava activities list --per-page 10`
- **THEN** the system SHALL pass `per_page=10` as a query parameter to the Strava API and display at most 10 activities

#### Scenario: Specific page
- **WHEN** the user runs `strava activities list --page 2`
- **THEN** the system SHALL pass `page=2` as a query parameter to the Strava API

#### Scenario: Default values
- **WHEN** the user runs `strava activities list` without pagination flags
- **THEN** the system SHALL use `page=1` and `per_page=30` as defaults

### Requirement: Auth error handling
The `activities list` command SHALL detect missing or invalid OAuth tokens and provide actionable feedback.

#### Scenario: No stored token
- **WHEN** the user runs `strava activities list` and no access token is stored
- **THEN** the system SHALL display an error message instructing the user to run `strava login` first and exit with a non-zero code

#### Scenario: Expired or invalid token
- **WHEN** the Strava API responds with HTTP 401
- **THEN** the system SHALL display an error message indicating the session has expired and prompt the user to run `strava login` again

### Requirement: API response validation
The system SHALL validate the Strava API response against a Zod schema before processing.

#### Scenario: Valid response shape
- **WHEN** the API returns a JSON array of activity objects with expected fields
- **THEN** the system SHALL parse and display the data without errors

#### Scenario: Unexpected response shape
- **WHEN** the API returns data that does not match the expected schema
- **THEN** the system SHALL display a descriptive validation error and exit with a non-zero code
