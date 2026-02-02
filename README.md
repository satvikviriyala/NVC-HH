# NVC-HH: Nonviolent Communication Aligned HH-RLHF Dataset

A multi-pass LLM pipeline for annotating the Anthropic HH-RLHF dataset with **Nonviolent Communication (NVC)** aligned OFNR (Observation, Feeling, Need, Request) annotations.

## Overview

NVC-HH transforms the original HH-RLHF preference pairs into a richly annotated dataset suitable for training empathetic, de-escalating AI systems. Each conversation is processed through a 4-pass pipeline using specialized LLMs to extract and validate NVC-aligned annotations.

## Dataset Generation Pipeline

### Multi-Pass Architecture

The dataset is generated through **4 sequential passes**, each handled by a specialized model:

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  OBSERVER   │ → │ EMPATHIZER  │ → │ STRATEGIST  │ → │   CRITIC    │
│ GLM 4.7     │   │ DeepSeek    │   │ Qwen 3      │   │ LLAMA 4     │
│ Thinking    │   │ V3.2        │   │ A235B       │   │ Maverick    │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

### Pass 1: Observer (GLM 4.7 Thinking)

**Purpose:** Extract neutral, camera-test compliant observations.

- Reads the conversation context and prompt
- Generates non-judgmental observations (what a camera would record)
- Flags any judgmental language found in the text
- Outputs observations that pass the "camera test"

**Key Rule:** *Could a video camera record this without knowing anyone's feelings or intentions?*

### Pass 2: Empathizer (DeepSeek V3.2)

**Purpose:** Identify feelings and needs, translate pseudo-feelings.

- Extracts genuine feelings from `feelings_ontology.json`
- Identifies universal human needs from `needs_ontology.json`
- Detects and translates pseudo-feelings (e.g., "ignored" → "lonely")
- Adds emotional metadata (arousal, valence, somatic markers)

**Key Rule:** Feelings must be internal emotional states, not judgments about others' behavior.

### Pass 3: Strategist (Qwen 3 A235B)

**Purpose:** Generate explicit/implicit needs and NVC-aligned requests.

- Distinguishes explicit needs (stated directly) from implicit needs (inferred)
- Generates NVC-aligned requests that are specific, positive, and doable
- Identifies the implicit intent behind the communication
- Ensures requests are not demands or criticisms

**Key Rule:** Requests must be something someone could realistically say yes or no to.

### Pass 4: Critic (LLAMA 4 Maverick)

**Purpose:** Validate outputs, assign quality scores, flag errors.

- Cross-validates all OFNR components for consistency
- Assigns Likert scores (1-5) for observation quality, needs matching, confidence
- Flags errors and warnings
- Classifies safety level (allowed/ambiguous/disallowed)

**Key Rule:** Ensure all feelings and needs come from approved ontologies.

---

## Output Schema

Each annotated row follows the `schema_ofnr.json` structure:

```json
{
  "id": "unique_identifier",
  "prompt": "user message",
  "context": "conversation history",
  "human_chosen_response": "preferred response",
  "human_rejected_response": "rejected response",
  "ofnr": {
    "observation": "non-judgmental observation",
    "feeling": ["frustrated", "anxious"],
    "need": ["clarity", "respect"],
    "explicit_need": ["surface wants"],
    "implicit_need": ["underlying needs"],
    "explicit_request": ["direct asks"],
    "implicit_request": ["NVC-aligned requests"],
    "implicit_intent": "underlying goal",
    "pseudo_feelings_detected": ["ignored → lonely"]
  },
  "metadata": {
    "emotion_arousal_hint": "medium",
    "emotion_valence_hint": "negative",
    "somatic_markers": [...]
  },
  "safety": {
    "label": "allowed",
    "reason": "normal conversational request"
  },
  "quality": {
    "observation_is_nonjudgmental": 4,
    "needs_list_match": 5,
    "overall_confidence": 4
  }
}
```

---

## Validation Web Application

A **Next.js web application** is provided for human validation of the generated annotations.

### Features

- **Comprehensive Validation Guide:** The landing page includes a full NVC-HH validation guide with OFNR definitions, examples, and validation rules.
- **Accept/Reject Interface:** Each OFNR field can be individually accepted or rejected with visual feedback.
- **Add Missing Items:** Validators can add missing feelings, needs, or requests.
- **Safety Classification:** Three-tier safety labeling (allowed/ambiguous/disallowed) with required reasoning.
- **Real-time Validation:** All fields must be reviewed before submission.

### Concurrent User Handling

The validation app handles multiple concurrent validators through **folder shuffling**:

1. **General Validation Route (`/general`):**
   - Serves rows from: `harmless-base`, `helpful-base`, `helpful-online`, `helpful-rejection-sampled`
   - Each request shuffles folders and returns an unprocessed row
   - Prevents validators from getting the same rows

2. **Legal Review Route (`/lawyers`):**
   - Exclusively serves rows from: `red-team-attempts`
   - Designed for legal experts to validate potentially harmful content
   - Shows only context and prompt (no chosen/rejected responses)

### Duplicate Prevention

The app maintains processed IDs to prevent validating the same row twice:

```
data_refined_validated/
├── processed_ids/
│   ├── general.json    # IDs processed by general validators
│   └── lawyers.json    # IDs processed by legal reviewers
```

Each submitted validation:
1. Appends the row ID to the appropriate tracker
2. Writes the validated output to the corresponding folder
3. Returns the next unprocessed row immediately

### Running the Validation App

```bash
cd validation-app
npm install
npm run dev
```

Access at `http://localhost:3000`

For public deployment:
```bash
npm run dev -- --hostname 0.0.0.0
# Then use ngrok for public URL
npx ngrok http 3000
```

---

## Project Structure

```
NVC-HH/
├── config.yaml              # Pipeline configuration
├── ontologies/              # Controlled vocabularies
│   ├── feelings_ontology.json
│   ├── needs_ontology.json
│   ├── pseudo_feelings_lexicon.json
│   ├── judgment_markers_ontology.json
│   ├── somatic_markers_ontology.json
│   ├── request_quality_ontology.json
│   └── schema_ofnr.json
├── prompts/                 # Pass-specific prompts
│   ├── Folder_Prompts/      # Per-folder generation prompts
│   └── system_ofnr_teacher_final.txt
├── validation-app/          # Next.js validation interface
│   ├── src/
│   │   ├── app/            # Routes (general, lawyers)
│   │   ├── components/     # UI components
│   │   └── lib/            # Utilities
│   └── package.json
└── README.md
```

---

## Ontologies

| Ontology | Purpose |
|----------|---------|
| `feelings_ontology.json` | Canonical emotions allowed in annotations |
| `needs_ontology.json` | Universal human needs taxonomy |
| `pseudo_feelings_lexicon.json` | Pseudo-feelings to translate |
| `judgment_markers_ontology.json` | Words indicating judgments |
| `somatic_markers_ontology.json` | Body-based emotional cues |
| `request_quality_ontology.json` | Criteria for valid NVC requests |

---

## Source Data

Original data from Anthropic's HH-RLHF dataset:
- `harmless-base` (42,537 rows)
- `helpful-base` (43,835 rows)  
- `helpful-online` (22,007 rows)
- `helpful-rejection-sampled` (52,421 rows)
- `red-team-attempts` (38,961 rows)

**Total: 199,761 conversation pairs**

---

## Models Used

| Pass | Model | Role |
|------|-------|------|
| Observer | GLM 4.7 Thinking | Neutral observation extraction |
| Empathizer | DeepSeek V3.2 | Feeling/need identification |
| Strategist | Qwen 3 A235B | Request generation |
| Critic | LLAMA 4 Maverick | Quality validation |

---

## License

Research use only. Original HH-RLHF data is subject to Anthropic's license.

---

## Citation

If you use NVC-HH in your research, please cite:

```bibtex
@misc{nvc-hh,
  title={NVC-HH: Nonviolent Communication Aligned HH-RLHF Dataset},
  author={Satvik Viriyala},
  year={2026},
  howpublished={\url{https://github.com/satvikviriyala/NVC-HH}}
}
```
