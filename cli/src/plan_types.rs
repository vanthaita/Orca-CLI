use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UserPlanInfo {
    pub plan: String,
    pub name: String,
    pub daily_ai_limit: Option<i32>,
    pub features: Vec<String>,
    pub is_active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UserFeaturesResponse {
    pub features: Vec<String>,
}

#[derive(Debug)]
pub enum FeaturePermission {
    AutoPublish,
    AiConflictResolution,
    AiReleaseNotes,
}

impl FeaturePermission {
    pub fn as_str(&self) -> &'static str {
        match self {
            FeaturePermission::AutoPublish => "auto_publish",
            FeaturePermission::AiConflictResolution => "ai_conflict_resolution",
            FeaturePermission::AiReleaseNotes => "ai_release_notes",
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            FeaturePermission::AutoPublish => "Auto-PR Workflow",
            FeaturePermission::AiConflictResolution => "AI Conflict Resolution",
            FeaturePermission::AiReleaseNotes => "AI Release Notes",
        }
    }
}
