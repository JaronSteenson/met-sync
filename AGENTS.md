# Met-sync Agent Notes

## Metlink Stop Predictions Response

Use this response shape when updating parsing or rendering logic for `https://api.opendata.metlink.org.nz/v1/stop-predictions`:

```json
{
  "farezone": "1",
  "closed": false,
  "departures": [
    {
      "stop_id": "5515",
      "service_id": "83",
      "direction": "outbound",
      "operator": "NBM",
      "origin": {
        "stop_id": "5000",
        "name": "CourtenayPl-A"
      },
      "destination": {
        "stop_id": "9858",
        "name": "Eastbourne"
      },
      "delay": "PT2S",
      "vehicle_id": "2474",
      "name": "MannersSt at Cuba-A",
      "arrival": {
        "aimed": "2026-04-15T23:37:00+12:00",
        "expected": "2026-04-15T23:37:02+12:00"
      },
      "departure": {
        "aimed": "2026-04-15T23:37:00+12:00",
        "expected": "2026-04-15T23:37:48+12:00"
      },
      "status": "ontime",
      "monitored": true,
      "wheelchair_accessible": true,
      "trip_id": "83__0__157__NBM__305__4__305__4_20260405",
      "trip_headsign": "Eastbourne"
    }
  ]
}
```

Important fields currently used by the app:

- Stop display name: `departures[n].name`
- Route/service label: `service_id`, `destination.name`, `trip_headsign`
- Times: `arrival.aimed`, `arrival.expected`, `departure.aimed`, `departure.expected`
