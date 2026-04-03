## ADDED Requirements

### Requirement: Compute heart rate metrics
The system SHALL compute min, max, and average heart rate from a heartrate stream array.

#### Scenario: Valid heartrate stream
- **WHEN** a heartrate stream with values `[120, 145, 160, 155, 130]` is provided
- **THEN** the system SHALL return min=120, max=160, avg=142

#### Scenario: Stream with null values
- **WHEN** a heartrate stream contains null entries like `[120, null, 160, null, 130]`
- **THEN** the system SHALL ignore null values and compute metrics from valid values only (min=120, max=160, avg=136.7)

#### Scenario: Empty or all-null stream
- **WHEN** a heartrate stream is empty or contains only null values
- **THEN** the system SHALL return null for all metrics

### Requirement: Compute altitude metrics
The system SHALL compute min, max, and elevation gain from an altitude stream array.

#### Scenario: Valid altitude stream with climbs and descents
- **WHEN** an altitude stream with values `[100, 120, 115, 140, 130]` is provided
- **THEN** the system SHALL return min=100, max=140, and elevation gain=45 (sum of positive deltas: 20 + 25 = 45)

#### Scenario: Flat altitude stream
- **WHEN** an altitude stream with constant values `[100, 100, 100]` is provided
- **THEN** the system SHALL return elevation gain=0

#### Scenario: Empty or all-null altitude stream
- **WHEN** an altitude stream is empty or contains only null values
- **THEN** the system SHALL return null for all metrics

### Requirement: Compute cadence metrics
The system SHALL compute average cadence from a cadence stream array.

#### Scenario: Valid cadence stream
- **WHEN** a cadence stream with values `[80, 82, 78, 85, 80]` is provided
- **THEN** the system SHALL return avg=81

#### Scenario: Stream with null values
- **WHEN** a cadence stream contains null entries
- **THEN** the system SHALL ignore null values and compute the average from valid values only

#### Scenario: Empty or all-null cadence stream
- **WHEN** a cadence stream is empty or contains only null values
- **THEN** the system SHALL return null for the average

### Requirement: Compute power metrics
The system SHALL compute min, max, and average power from a watts stream array.

#### Scenario: Valid watts stream
- **WHEN** a watts stream with values `[200, 250, 180, 300, 220]` is provided
- **THEN** the system SHALL return min=180, max=300, avg=230

#### Scenario: Stream with null values
- **WHEN** a watts stream contains null entries
- **THEN** the system SHALL ignore null values and compute metrics from valid values only

#### Scenario: Empty or all-null watts stream
- **WHEN** a watts stream is empty or contains only null values
- **THEN** the system SHALL return null for all metrics

### Requirement: Compute pace metrics
The system SHALL compute average pace in min/km from distance and time streams.

#### Scenario: Valid distance and time streams
- **WHEN** a distance stream ending at 5000 (meters) and a time stream ending at 1500 (seconds) are provided
- **THEN** the system SHALL return average pace of 5:00 min/km (1500s / 5km = 300 s/km = 5:00)

#### Scenario: Zero distance
- **WHEN** the distance stream is absent or the final distance value is 0
- **THEN** the system SHALL return null for pace

### Requirement: Aggregate metrics result
The system SHALL return all computed metrics as a single structured object per activity, with null for any metric whose source stream is unavailable.

#### Scenario: Activity with all streams
- **WHEN** an activity has heartrate, altitude, cadence, watts, distance, and time streams
- **THEN** the system SHALL return a complete metrics object with all fields populated

#### Scenario: Activity with partial streams
- **WHEN** an activity has only heartrate and altitude streams (no cadence, watts)
- **THEN** the system SHALL return metrics with heartrate and altitude populated, and null for cadence, power, and pace fields
