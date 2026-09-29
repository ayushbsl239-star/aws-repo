# AI Evaluation Benchmarking Framework

## Objective
Rather than making unsubstantiated claims like *"95% accurate"*, the AI Adaptive Interview Coach provides a transparent, scientifically grounded evaluation benchmarking harness.

This framework allows developers, QA engineers, and hackathon judges to benchmark Amazon Bedrock answer evaluations against human expert ground truth across 5 critical metrics:

1. **Mean Absolute Error (MAE):** Average difference between human rubric score and Bedrock server-weighted score.
2. **Score Agreement Rate (%):** Percentage of evaluations where model score is within $\pm 1.0$ point of human consensus.
3. **Skill Identification Agreement (%):** Overlap between detected skills and human-annotated skills.
4. **Difficulty Decision Agreement (%):** Agreement on whether difficulty should increase, maintain, or decrease.
5. **Follow-Up Appropriateness Precision (%):** Accuracy in triggering follow-up questions when unverified assertions or logical gaps occur.

---

## Dataset Structure (`sample_dataset.json`)
The benchmarking suite evaluates realistic candidate answers across technical and behavioral domains:
- Junior, Mid-level, and Senior candidate answers
- Incomplete answers with gaps (testing follow-up detection)
- Technically incorrect answers with plausible-sounding buzzwords (testing hallucination resistance)
- Highly nuanced answers with system architecture trade-offs

---

## Running Benchmarks
Execute the benchmark harness locally:
```bash
python backend/tests/evaluation/benchmark.py
```
Or via pytest:
```bash
pytest backend/tests/evaluation/benchmark.py
```
