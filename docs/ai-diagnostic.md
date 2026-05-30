# RoadRescue - AI Diagnostic Module

## Overview

The AI Diagnostic module uses OpenAI GPT-4 to analyze vehicle issues described by drivers and provide professional mechanical insights. This helps drivers understand their problem severity before requesting rescue assistance.

## Architecture

```
┌──────────────────────────────────────────┐
│  Driver Describes Issue (RequestForm)    │
│  - Vehicle make/model/year               │
│  - Issue symptoms and description        │
│  - Mileage and recent work               │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  Frontend: DiagnosticChat Component      │
│  - Detailed symptom collection           │
│  - Visual presentation of diagnosis      │
│  - Priority level color-coding           │
│  - Multi-step diagnostic flow            │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  API: /api/ai/diagnose (Route Handler)   │
│  - Validates input (max 2000 chars)      │
│  - Calls OpenAI GPT-4                    │
│  - Caches results in rescue_requests     │
│  - Error handling and fallbacks          │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  OpenAI GPT-4 Service                    │
│  - Analyzes vehicle symptoms             │
│  - Suggests likely issues with reasoning │
│  - Provides urgency/priority level       │
│  - Recommends professional inspection    │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  Frontend: DiagnosticResult Component    │
│  - Displays diagnosis summary            │
│  - Shows priority level (color-coded)    │
│  - Suggests next actions                 │
│  - Button to create rescue request       │
│  - Mechanic recommendations              │
└──────────────────────────────────────────┘
```

---

## Diagnostic Flow

### Step 1: Issue Description (Driver Input)
```
Driver provides:
- Vehicle make/model/year
- Current mileage
- Issue symptoms (sounds, smells, performance)
- When symptoms started
- Recent maintenance or work
```

Example:
```
"2020 Toyota Camry (85,000 miles). Engine makes 
a clicking noise on cold start, only for first 30 seconds. 
No dash lights. Runs fine otherwise. Started 2 weeks ago."
```

### Step 2: API Processing
```javascript
// POST /api/ai/diagnose
{
  "vehicle_description": "2020 Toyota Camry, 85k miles",
  "symptoms": "Engine clicking on cold start for 30 seconds, no dash lights, runs fine otherwise"
}
```

### Step 3: GPT-4 Analysis
The API sends a carefully crafted prompt to OpenAI with:
- Vehicle details
- Symptom description
- Request for structured response (likely causes, priority, recommendation)

### Step 4: Response Format
```json
{
  "diagnosis": "Based on clicking noise limited to cold start...",
  "likely_causes": [
    {
      "cause": "Worn timing chain",
      "probability": "HIGH"
    },
    {
      "cause": "Spark knock sensor failure",
      "probability": "MEDIUM"
    }
  ],
  "priority": "MEDIUM",
  "recommendation": "Schedule inspection with a mechanic within 2 weeks",
  "immediate_danger": false
}
```

### Step 5: Frontend Display
```
PRIORITY LEVEL: MEDIUM (yellow background)

Diagnosis:
"Based on the clicking noise limited to cold start for 30 seconds
on a 2020 Camry, this is likely a timing-related issue..."

Likely Causes:
1. Worn timing chain (HIGH probability)
2. Spark knock sensor failure (MEDIUM probability)

Recommended Action:
Schedule inspection with a mechanic within 2 weeks.
This is not an urgent safety issue but worth having checked.

[Create Rescue Request]  [Save Diagnosis]
```

---

## System Prompt (OpenAI)

```
You are an expert automotive mechanic with 25+ years of experience.

Your task is to analyze vehicle problems described by drivers and provide:
1. Likely mechanical causes (2-3 possibilities)
2. Probability assessment for each cause (HIGH/MEDIUM/LOW)
3. Urgency level (CRITICAL/HIGH/MEDIUM/LOW)
4. Specific repair recommendations
5. Whether professional inspection is needed
6. Whether it's safe to drive

Guidelines:
- Be accurate and professional, not alarmist
- Consider vehicle age and mileage in assessment
- Suggest professional inspection when uncertain
- Never diagnose unknown symptoms as safe to ignore
- If symptoms could indicate danger, mark as CRITICAL or HIGH
- Acknowledge limitations of remote diagnosis
- Ask clarifying questions if description is vague

Respond in JSON format with keys: diagnosis, likely_causes, priority, recommendation, immediate_danger
```

---

## Priority Levels

| Level | Color | Meaning | Action |
|-------|-------|---------|--------|
| **CRITICAL** | Red | Immediate danger/safety issue | Cancel trip, call service immediately |
| **HIGH** | Orange | Serious issue affecting vehicle | Request rescue service, seek mechanic same day |
| **MEDIUM** | Yellow | Important but not urgent | Schedule mechanic within 1-2 weeks |
| **LOW** | Blue | Minor issue or maintenance | Can wait or handle during regular service |

---

## API Endpoint Details

### Endpoint
```
POST /api/ai/diagnose
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "vehicle_description": "2020 Toyota Camry, 85000 miles",
  "symptoms": "Engine makes clicking noise on cold start..."
}
```

### Response (200 OK)
```json
{
  "diagnosis": "...",
  "likely_causes": [...],
  "priority": "MEDIUM",
  "recommendation": "...",
  "immediate_danger": false
}
```

### Error Responses

**400 Bad Request** - Missing or invalid parameters
```json
{
  "error": "Invalid input",
  "message": "Both vehicle_description and symptoms are required"
}
```

**429 Too Many Requests** - Rate limited
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many diagnostic requests. Please try again later."
}
```

**500 Server Error** - OpenAI API issue
```json
{
  "error": "Diagnostic service unavailable",
  "message": "Unable to process diagnosis. Please try again later."
}
```

---

## Implementation Details

### Input Validation
- `vehicle_description`: Required, max 500 characters
- `symptoms`: Required, min 10 chars, max 2000 characters
- No special characters or injection attempts allowed

### Rate Limiting
- Maximum 5 diagnoses per user per hour
- IP-based rate limiting on API route
- Protects OpenAI API costs

### Caching
- Diagnosis results stored in `rescue_requests.ai_diagnosis`
- Prevents duplicate API calls for same request
- Improves response time for repeated symptoms

### Error Handling
- Graceful fallback if OpenAI is unavailable
- Generic response: "Unable to process diagnosis at this time"
- No partial responses returned to frontend
- Errors logged for monitoring

### Cost Optimization
- Uses GPT-4 for accuracy
- Input/output tokens tracked
- Approximately $0.02-0.05 per diagnosis
- Budgeted in monthly operating costs

---

## Frontend Components

### DiagnosticChat
- Multi-step form for symptom detail collection
- Vehicle information prefilled from profile
- Character count limits with warnings
- Real-time form validation
- Loading state during API call

### DiagnosticResult
- Display diagnosis with priority color
- Expandable "Likely Causes" section
- "Safe to Drive?" indicator
- Strong CTA for rescue request creation
- Share/print options for documentation

### Integration Point
- Called after driver provides initial issue description
- Results appended to rescue request record
- Visible to assigned mechanic
- Used for mechanic matching algorithm (future)

---

## Future Enhancements

1. **Machine Learning**: Train model on completed requests to predict mechanic requirements
2. **Image Recognition**: Accept photos of error codes or symptoms
3. **Repair Cost Estimation**: Integrate with parts pricing APIs
4. **Mechanic Matching**: Use diagnosis priority to filter mechanics
5. **Historical Analysis**: Track diagnosis accuracy over time
6. **Multi-language Support**: Translate prompts and responses
7. **Offline Mode**: Cache common diagnoses locally
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
