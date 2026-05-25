# Encoding Acceptance Samples

This note records manual acceptance samples for the Chinese encoding cleanup.

## Role Type Normalization

These Chinese role inputs must be readable UTF-8 and classify as follows:

- 老板 -> authority
- 领导 -> authority
- 上级 -> authority
- 资源 -> resource
- 利益 -> resource
- 竞争 -> conflict
- 冲突 -> conflict
- 支持 -> support
- 机会 -> opportunity
- 情感 -> emotional
- 伴侣 -> emotional
- 家人 -> emotional

## Forbidden Mind-Reading Detection

LLM output text containing these Chinese phrases must be rejected as forbidden
third-party mind-reading or deterministic private-intent inference:

- 真实想法
- 背叛
- 欺骗
- 爱你
- 不爱你
- 真正意图
- 看穿
