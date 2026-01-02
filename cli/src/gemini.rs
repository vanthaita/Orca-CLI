use crate::plan::{CommitPlan, PlannedCommit};
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

pub(crate) async fn generate_plan_with_gemini(
    model: &str,
    status: &str,
    diff: &str,
    log: &str,
) -> Result<CommitPlan> {
    let api_key = std::env::var("GEMINI_API_KEY").context("Missing GEMINI_API_KEY env var")?;

    let prompt = build_prompt(status, diff, log);
    let resp_text = call_gemini_generate_content(model, &api_key, &prompt).await?;

    let json_text = extract_json(&resp_text).unwrap_or_else(|| resp_text.clone());

    if let Ok(plan) = serde_json::from_str::<CommitPlan>(&json_text) {
        return Ok(plan);
    }

    if let Ok(commits) = serde_json::from_str::<Vec<PlannedCommit>>(&json_text) {
        return Ok(CommitPlan { commits });
    }

    anyhow::bail!(
        "Failed to parse Gemini response as JSON. Raw response: {}",
        resp_text
    );
}

fn extract_json(input: &str) -> Option<String> {
    let mut s = input.trim();

    if s.starts_with("```") {
        if let Some(idx) = s.find('\n') {
            s = &s[idx + 1..];
        } else {
            return None;
        }

        if let Some(end) = s.rfind("```") {
            s = &s[..end];
        }
        s = s.trim();
    }

    let start_obj = s.find('{');
    let start_arr = s.find('[');
    let start = match (start_obj, start_arr) {
        (Some(o), Some(a)) => Some(o.min(a)),
        (Some(o), None) => Some(o),
        (None, Some(a)) => Some(a),
        (None, None) => None,
    }?;

    let end_obj = s.rfind('}');
    let end_arr = s.rfind(']');
    let end = match (end_obj, end_arr) {
        (Some(o), Some(a)) => Some(o.max(a)),
        (Some(o), None) => Some(o),
        (None, Some(a)) => Some(a),
        (None, None) => None,
    }?;

    if end <= start {
        return None;
    }

    Some(s[start..=end].trim().to_string())
}

fn build_prompt(status: &str, diff: &str, log: &str) -> String {
    format!(
        "You are a senior software engineer.\n\n\
    Task: Propose a commit plan for the current git working tree.\n\
    Rules:\n\
    - Output ONLY valid JSON. No markdown. No commentary.\n\
    - JSON schema: {{\"commits\":[{{\"message\":string,\"files\":[string],\"commands\":[string]}}]}}\n\
    - Group files into logical commits by feature/responsibility.\n\
    - Commit messages should be concise, imperative, and conventional (e.g. feat:, fix:, refactor:, chore:).\n\
    - Each file path must exist in git status output.\n\
    - For each commit, commands must contain EXACTLY 2 commands in this order:\n\
      1) git add -- <files...>\n\
      2) git commit -m \"<message>\"\n\n\
    Context:\n\
    GIT_STATUS_PORCELAIN:\n{status}\n\n\
    GIT_DIFF:\n{diff}\n\n\
    RECENT_GIT_LOG (for style):\n{log}\n"
    )
}

#[derive(Debug, Serialize)]
struct GeminiGenerateContentRequest {
    contents: Vec<GeminiContent>,
}

#[derive(Debug, Serialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GeminiPart {
    text: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiGenerateContentResponse {
    candidates: Option<Vec<GeminiCandidate>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiCandidate {
    content: Option<GeminiCandidateContent>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiCandidateContent {
    parts: Option<Vec<GeminiCandidatePart>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiCandidatePart {
    text: Option<String>,
}

async fn call_gemini_generate_content(model: &str, api_key: &str, prompt: &str) -> Result<String> {
    let model_path = if model.starts_with("models/") {
        model.to_string()
    } else {
        format!("models/{model}")
    };
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/{model_path}:generateContent"
    );

    let body = GeminiGenerateContentRequest {
        contents: vec![GeminiContent {
            parts: vec![GeminiPart {
                text: prompt.to_string(),
            }],
        }],
    };

    let client = reqwest::Client::new();
    let resp = client
        .post(url)
        .header("x-goog-api-key", api_key)
        .json(&body)
        .send()
        .await
        .context("Gemini request failed")?;

    let status = resp.status();
    let text = resp
        .text()
        .await
        .context("Failed to read Gemini response")?;
    if !status.is_success() {
        anyhow::bail!("Gemini API returned {}: {}", status, text);
    }

    let parsed: GeminiGenerateContentResponse = serde_json::from_str(&text)
        .with_context(|| format!("Failed to parse Gemini response envelope: {}", text))?;

    let model_text = parsed
        .candidates
        .and_then(|mut c| c.pop())
        .and_then(|c| c.content)
        .and_then(|c| c.parts)
        .and_then(|mut p| p.pop())
        .and_then(|p| p.text)
        .unwrap_or_default();

    let trimmed = model_text.trim();
    if trimmed.is_empty() {
        anyhow::bail!("Gemini returned empty text. Raw envelope: {}", text);
    }
    Ok(trimmed.to_string())
}
