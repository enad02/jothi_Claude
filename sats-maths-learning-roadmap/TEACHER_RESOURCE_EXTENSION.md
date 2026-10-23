# Future Teacher-Resource Extension

The public roadmap is intentionally limited to public curriculum content. It contains no resource URLs, private notes, credentials, or delivery rules.

## Stable topic key

Every topic is assigned a stable identifier in the client-side topic model:

`SAT-MATH-S##-T##`

The Place Value pilot is `SAT-MATH-S01-T01`.

Its former prototype key, `numbers-1`, is retained in memory as a legacy identifier only so existing local prototype references do not break. New teacher-resource mappings must use the stable identifier.

## Future resource boundary

A separately controlled, authorised teacher-access route may later map the topic ID to:

- Classkick lesson
- Instructional video
- BBC Bitesize resource
- Worksheet
- Teaching notes
- Assessment activity
- Extension activity

Those mappings must remain outside public HTML, JavaScript and JSON. The future protected route should retrieve authorised resources after access control, then render an optional Teaching resources area only for authorised teachers.

The public learning card needs no redesign: its stable topic ID is the sole link to the future controlled mapping.
