# RoadRescue - AI Diagnostic Module

## Overview

The AI Diagnostic module uses OpenAI GPT-4 to analyze vehicle issues described by drivers and provide professional mechanical insights.

## Architecture

```
┌──────────────────────────────────────────┐
│  Driver Describes Issue (RequestForm)    │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  Frontend: DiagnosticChat Component      │
│  - Multi-step diagnostic Q&A             │
│  - Context gathering                     │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  API: /api/ai/diagnose (Route Handler)   │
│  - Validates input                       │
│  - Calls OpenAI API                      │
│  - Returns diagnosis                     │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  OpenAI GPT-4 Service                    │
│  - Analyzes symptoms                     │
│  - Suggests likely issues                │
│  - Provides priority level               │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  Frontend: DiagnosticResult Component    │
│  - Displays diagnosis                    │
│  - Shows priority                        │
│  - Guides next steps                     │
└──────────────────────────────────────────┘
```

---

## Diagnostic Flow

### Step 1: Vehicle Information Collection
```
Driver enters:
- Vehicle make/model/year
- Mileage
- Current symptoms (visual/audio)
- Recent maintenance history
```

### Step 2: Symptom Details
```
Driver describes:
- When symptoms started
- Severity level
- Any sounds/smells/error messages
- Affects performance? (yes/no)
```

### Step 3: AI Analysis
```
OpenAI processes:
- Vehicle details + symptoms
- Generates likely diagnoses
- Rates urgency (LOW/MEDIUM/HIGH/CRITICAL)
- Provides repair recommendations
```

### Step 4: Presentation to Driver
```
Display:
- Diagnosis summary
- Priority level (color-coded)
- Recommended actions
- Button to request rescue service (if needed)
```

---

## Prompt Engineering

### System Prompt
```
You are an expert automotive mechanic with 20+ years of experience.
Your role is to analyze vehicle problems described by drivers and provide:
1. Assessment of likely mechanical issues
2. Severity/urgency level
3. General repair recommendations
4. Whether professional repair is needed immediately

Be professional, accurate, and avoid speculation.
Suggest professional inspection when in doubt.
Keep response concise (under 300 words).
```

### User Prompt Template
```
Vehicle: {year} {make} {model}, {mileage} miles
Recent maintenance: {maintenance_history}

Symptoms:
- {symptom_1}
- {symptom_2}
- {symptom_3}

When did symptoms start: {time_started}
Severity (1-10): {severity}
Error codes/warning lights: {error_codes}

Provide diagnosis, likely issues, priority level (HIGH/MEDIUM/LOW), 
and recommended next steps.
```

---

## API Integration

### Backend Implementation
```javascript
// /src/lib/openai.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function diagnoseVehicleIssue(
  vehicleDescription,
  symptoms
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert automotive mechanic...'
      },
      {
        role: 'user',
        content: buildPrompt(vehicleDescription, symptoms)
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  return response.choices[0].message.content;
}
```

### Route Handler
```javascript
// /src/app/api/ai/diagnose/route.js
export async function POST(request) {
  const { vehicleDescription, symptoms } = await request.json();

  try {
    const diagnosis = await diagnoseVehicleIssue(
      vehicleDescription,
      symptoms
    );

    return Response.json({
      diagnosis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json(
      { error: 'Diagnosis failed' },
      { status: 500 }
    );
  }
}
```

---

## Frontend Implementation

### DiagnosticChat Component
```javascript
// Conversational interface collecting symptoms
- Question 1: "What's your vehicle?"
- Question 2: "What symptoms are you experiencing?"
- Question 3: "When did this start?"
- Question 4: "How severe is it?"
- Send for diagnosis
```

### DiagnosticResult Component
```javascript
// Displays AI analysis
{
  diagnosis: "Likely thermostat failure based on overheating...",
  priority: "HIGH",
  nextSteps: [
    "Stop driving vehicle",
    "Request emergency roadside assistance",
    "Allow engine to cool completely"
  ]
}
```

---

## Use Cases

### Case 1: Engine Overheating
```
Input:
- Vehicle: 2020 Toyota Camry
- Symptoms: "Engine temperature gauge maxes out, steam from hood"
- Started: 1 hour ago
- Severity: 9/10

Output:
- Issue: Likely thermostat failure or coolant leak
- Priority: CRITICAL
- Action: Stop driving immediately. Request emergency assistance.
```

### Case 2: Unusual Noise
```
Input:
- Vehicle: 2019 Honda Civic
- Symptoms: "Clicking noise when starting on cold mornings"
- Started: Last week
- Severity: 3/10

Output:
- Issue: Possibly low oil pressure or worn bearings
- Priority: MEDIUM
- Action: Check oil level. Request inspection in next 2-3 days.
```

### Case 3: Warning Light
```
Input:
- Vehicle: 2022 Ford F-150
- Symptoms: "Check engine light, no performance issues"
- Started: Yesterday
- Severity: 5/10

Output:
- Issue: Could be sensor malfunction or emissions issue
- Priority: MEDIUM
- Action: Request diagnostic scan to read fault codes.
```

---

## Error Handling

### OpenAI API Errors
```javascript
try {
  // Call OpenAI
} catch (error) {
  if (error.status === 429) {
    // Rate limited
    return errorResponse('Too many requests. Try again later.');
  } else if (error.status === 401) {
    // Auth failed
    return errorResponse('API configuration error');
  } else {
    return errorResponse('Failed to generate diagnosis');
  }
}
```

### Input Validation
```javascript
const validateInput = (vehicleDesc, symptoms) => {
  if (!vehicleDesc || vehicleDesc.length < 5) {
    throw new Error('Vehicle description too short');
  }
  if (!symptoms || symptoms.length < 10) {
    throw new Error('Symptoms description too short');
  }
  return true;
};
```

---

## Performance Optimization

1. **Caching**: Cache diagnoses for identical inputs (24hr TTL)
2. **Queuing**: Queue requests during peak times
3. **Timeout**: 30-second timeout on OpenAI calls
4. **Cost Control**: Track API usage, alert on overage

---

## Privacy & Safety

1. **No PII Storage**: Don't store vehicle owner details with diagnosis
2. **Generalized Results**: Generic diagnosis (not predicting specific parts)
3. **Disclaimer**: Always recommend professional inspection
4. **Liability**: Clear terms that AI cannot replace professional mechanic

---

## Metrics

Track per diagnosis:
- Input quality score
- Response generation time
- User acceptance rate
- Follow-up request rate

---

## Future Enhancements

1. **Image Recognition**: Analyze photos of under-hood or error codes
2. **Voice Input**: Describe symptoms via voice (audio processing)
3. **Repair Estimates**: Integrate with shop APIs for price quotes
4. **Parts Lookup**: Link to spare parts vendors
5. **Multi-language**: Support non-English diagnostic sessions
6. **ML Model**: Train custom model on historical diagnostics

---

## Related Documentation

- See `architecture.md` for system context
- See `api-reference.md` for API endpoint details
